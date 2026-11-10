-- ============================================================================
-- HABBA — 0007_close_direct_order_writes.sql
--
-- CORRECTIVE MIGRATION (forward-only).
-- Do not edit 0002_rls.sql / 0003_functions.sql in place: they may already be
-- applied on an existing database. This file converges both fresh and existing
-- databases onto the intended architecture.
--
-- Fixes:
--   1. Removes the direct INSERT path into orders / order_items.
--      place_order() becomes the only customer-facing write mechanism.
--   2. Re-creates place_order() so it also enforces BRAND and CATEGORY
--      visibility (previously only products.is_visible was checked, so a
--      product from a hidden brand/category could still be purchased).
--   3. Pins search_path and re-asserts least-privilege EXECUTE grants.
--
-- Safe to run more than once (idempotent).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Revoke the direct write path
-- ---------------------------------------------------------------------------
revoke insert, update, delete on public.orders      from anon, authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;

-- The owner still needs the table privileges that RLS then narrows:
--   orders      -> SELECT (read the list) + UPDATE (advance the status)
--   order_items -> SELECT (read historical lines only)
grant select, update on public.orders      to authenticated;
grant select            on public.order_items to authenticated;

-- A guest never touches either table at all -- not even SELECT.
-- (Belt and braces: no policy grants anon SELECT, but the privilege itself
--  must not exist either, so a future policy mistake cannot expose orders.)
revoke all on public.orders      from anon;
revoke all on public.order_items from anon;

-- No sequence access: order numbers are only ever produced inside
-- place_order(), which is SECURITY DEFINER and therefore runs as the owner.
revoke all on sequence public.order_number_seq from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Drop the guest INSERT policies
-- ---------------------------------------------------------------------------
drop policy if exists orders_guest_insert      on public.orders;
drop policy if exists order_items_guest_insert on public.order_items;

-- Defensive: make sure nothing else grants INSERT to a guest. Any policy that
-- would allow an anonymous write shows up in the list below and must be gone.
do $$
declare
  v_bad text;
begin
  -- Any INSERT policy on orders/order_items that is reachable by a guest role
  -- (anon, authenticated, or PUBLIC) is a defect: order creation must go
  -- through place_order() only.
  select string_agg(c.relname || '.' || p.polname, ', ')
    into v_bad
  from pg_policy p
  join pg_class c      on c.oid = p.polrelid
  join pg_namespace n  on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('orders', 'order_items')
    and p.polcmd = 'a'                       -- INSERT
    and exists (
      select 1
      from unnest(p.polroles) as role_oid
      where role_oid = 0::oid                                       -- PUBLIC
         or role_oid = (select oid from pg_roles where rolname = 'anon')
         or role_oid = (select oid from pg_roles where rolname = 'authenticated')
    );

  if v_bad is not null then
    raise exception 'refusing to continue: guest INSERT policy present on %', v_bad;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. place_order(): the single validated write path
--    Changes vs 0003:
--      * joins brands AND categories and requires both to be visible
--      * rejects duplicate product ids (prevents inflated quantities)
--      * same server-side pricing, snapshots, fees and atomicity as before
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items         jsonb,
  p_customer_name text,
  p_phone         text,
  p_method        public.fulfillment_method,
  p_address       text default null,
  p_note          text default null
)
returns table (order_id uuid, order_number text, subtotal numeric, delivery_fee numeric, total numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_settings      public.store_settings%rowtype;
  v_item          jsonb;
  v_product       record;
  v_qty           integer;
  v_count         integer := 0;
  v_subtotal      numeric(10,2) := 0;
  v_fee           numeric(10,2) := 0;
  v_order_id      uuid := gen_random_uuid();
  v_number        text;
  v_phone_digits  text;
  v_address       text;
  v_lines         jsonb := '[]'::jsonb;
  v_seen          uuid[] := '{}';
begin
  -- Store switch -------------------------------------------------------------
  select * into v_settings from public.store_settings where id = true;
  if not found then
    raise exception 'STORE_NOT_CONFIGURED' using errcode = 'P0001';
  end if;
  if not v_settings.orders_enabled then
    raise exception 'ORDERS_DISABLED' using errcode = 'P0001';
  end if;

  -- Customer data -----------------------------------------------------------
  if p_customer_name is null or length(trim(p_customer_name)) < 3 then
    raise exception 'INVALID_NAME' using errcode = 'P0001';
  end if;

  v_phone_digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(v_phone_digits) < 9 or length(v_phone_digits) > 15 then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;

  v_address := nullif(trim(coalesce(p_address, '')), '');
  if p_method = 'delivery' and (v_address is null or length(v_address) < 6) then
    raise exception 'ADDRESS_REQUIRED' using errcode = 'P0001';
  end if;
  if p_method = 'pickup' then
    v_address := null;
  end if;

  -- Items: validate + price BEFORE writing anything --------------------------
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    -- A product is purchasable only when the product, its brand AND its
    -- category are all visible. This mirrors products_public_read.
    select p.id, p.slug, p.name_ar, p.name_en, p.size_label, p.price,
           p.discount_price, p.effective_price, b.name_ar as brand_name_ar
      into v_product
    from public.products p
    join public.brands     b on b.id = p.brand_id
    join public.categories c on c.id = p.category_id
    where p.id = (v_item ->> 'product_id')::uuid
      and p.is_visible
      and b.is_visible
      and c.is_visible;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001';
    end if;

    -- One line per product: reject duplicate ids instead of silently
    -- stacking quantities beyond the per-line limit.
    if v_product.id = any (v_seen) then
      raise exception 'DUPLICATE_ITEM' using errcode = 'P0001';
    end if;
    v_seen := array_append(v_seen, v_product.id);

    v_lines := v_lines || jsonb_build_object(
      'product_id',      v_product.id,
      'product_slug',    v_product.slug,
      'product_name_ar', v_product.name_ar,
      'product_name_en', v_product.name_en,
      'brand_name_ar',   v_product.brand_name_ar,
      'size_label',      v_product.size_label,
      'unit_price',      v_product.effective_price,
      'list_price',      case when v_product.discount_price is not null then v_product.price end,
      'quantity',        v_qty
    );

    v_subtotal := v_subtotal + (v_product.effective_price * v_qty);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  -- Delivery fee: pickup is always free; delivery honours the free threshold.
  if p_method = 'delivery' then
    v_fee := coalesce(v_settings.delivery_fee, 0);
    if v_settings.free_delivery_threshold is not null
       and v_subtotal >= v_settings.free_delivery_threshold then
      v_fee := 0;
    end if;
  end if;

  -- Write order (final totals, single insert) then its immutable lines ------
  insert into public.orders (
    id, customer_name, customer_phone, fulfillment_method,
    delivery_address, customer_note, subtotal, delivery_fee, total, status
  ) values (
    v_order_id, trim(p_customer_name), v_phone_digits, p_method,
    v_address, nullif(trim(coalesce(p_note, '')), ''),
    v_subtotal, v_fee, v_subtotal + v_fee, 'new'
  );

  insert into public.order_items (
    order_id, product_id, product_slug, product_name_ar, product_name_en,
    brand_name_ar, size_label, unit_price, list_price, quantity
  )
  select v_order_id, l.product_id, l.product_slug, l.product_name_ar, l.product_name_en,
         l.brand_name_ar, l.size_label, l.unit_price, l.list_price, l.quantity
  from jsonb_to_recordset(v_lines) as l(
    product_id uuid, product_slug text, product_name_ar text, product_name_en text,
    brand_name_ar text, size_label text, unit_price numeric, list_price numeric, quantity integer
  );

  -- Separate SELECT: RETURNING would collide with the RETURNS TABLE columns.
  select o.order_number into v_number from public.orders o where o.id = v_order_id;

  return query select v_order_id, v_number, v_subtotal, v_fee, v_subtotal + v_fee;
end;
$$;

revoke all on function public.place_order(jsonb, text, text, public.fulfillment_method, text, text)
  from public, anon, authenticated;
grant execute on function public.place_order(jsonb, text, text, public.fulfillment_method, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Keep the internal helpers owner-only / non-executable by guests
--    (functions are EXECUTE-able by PUBLIC by default, so revoke that too)
-- ---------------------------------------------------------------------------
revoke all on function public.order_stats()     from public, anon;
revoke all on function public.admin_dashboard() from public, anon;
grant execute on function public.order_stats()     to authenticated;
grant execute on function public.admin_dashboard() to authenticated;

commit;
