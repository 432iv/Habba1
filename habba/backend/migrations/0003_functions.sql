-- ============================================================================
-- HABBA — 0003_functions.sql
-- Server-side business logic. All prices and fees are computed here — never
-- trusted from the browser.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- catalog_feed() — one call that powers the whole storefront listing.
-- Returns only storefront-visible products (RLS is still applied on top).
-- ---------------------------------------------------------------------------
create or replace function public.catalog_feed(
  p_limit  integer default 100,
  p_offset integer default 0
)
returns table (
  id                uuid,
  slug              text,
  name_ar           text,
  name_en           text,
  brand_id          uuid,
  brand_name_ar     text,
  brand_name_en     text,
  category_id       uuid,
  category_name_ar  text,
  size_label        text,
  price             numeric,
  discount_price    numeric,
  effective_price   numeric,
  discount_percent  integer,
  concentration     text,
  fragrance_family  text,
  notes_top         text[],
  notes_heart       text[],
  notes_base        text[],
  description_ar    text,
  is_best_seller    boolean,
  is_new_arrival    boolean,
  image_path        text,
  created_at        timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.name_ar,
    p.name_en,
    p.brand_id,
    b.name_ar,
    b.name_en,
    p.category_id,
    c.name_ar,
    p.size_label,
    p.price,
    p.discount_price,
    p.effective_price,
    p.discount_percent,
    p.concentration,
    p.fragrance_family,
    p.notes_top,
    p.notes_heart,
    p.notes_base,
    p.description_ar,
    p.is_best_seller,
    (p.created_at >= now() - interval '3 days') as is_new_arrival,
    (
      select i.storage_path
      from public.product_images i
      where i.product_id = p.id
      order by i.is_primary desc, i.sort_order asc
      limit 1
    ) as image_path,
    p.created_at
  from public.products p
  join public.brands b     on b.id = p.brand_id
  join public.categories c on c.id = p.category_id
  where p.is_visible and b.is_visible and c.is_visible
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- ---------------------------------------------------------------------------
-- place_order() — the only supported way for a customer to create an order.
--  * Validates items, resolves prices/names server-side (never from client).
--  * Applies store settings: order reception switch, delivery fee,
--    free-delivery threshold, pickup => no fee.
--  * Writes order + items in a single transaction (atomic).
--  * Returns the created order number and totals.
--
-- p_items shape: [{"product_id":"<uuid>","quantity":1}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items        jsonb,
  p_customer_name text,
  p_phone        text,
  p_method       public.fulfillment_method,
  p_address      text default null,
  p_note         text default null
)
returns table (order_id uuid, order_number text, subtotal numeric, delivery_fee numeric, total numeric)
language plpgsql
security definer
set search_path = public
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
  v_lines         jsonb := '[]'::jsonb;   -- priced lines, inserted after the order
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
  if length(v_phone_digits) < 9 then
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

    select p.id, p.slug, p.name_ar, p.name_en, p.size_label, p.price,
           p.discount_price, p.effective_price, b.name_ar as brand_name_ar
      into v_product
    from public.products p
    join public.brands b on b.id = p.brand_id
    where p.id = (v_item ->> 'product_id')::uuid
      and p.is_visible;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001';
    end if;

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
  from public;
grant execute on function public.place_order(jsonb, text, text, public.fulfillment_method, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- order_stats() — dashboard counters, owner only (enforced by RLS on orders
-- for regular selects; this helper is SECURITY INVOKER so RLS still applies).
-- ---------------------------------------------------------------------------
create or replace function public.order_stats()
returns table (
  total_sales        numeric,
  new_orders         bigint,
  awaiting_prep      bigint,
  completed_orders   bigint,
  cancelled_orders   bigint,
  orders_today       bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(total) filter (where status = 'delivered'), 0) as total_sales,
    count(*)             filter (where status = 'new')                         as new_orders,
    count(*)             filter (where status in ('confirmed','preparing','ready')) as awaiting_prep,
    count(*)             filter (where status = 'delivered')                   as completed_orders,
    count(*)             filter (where status = 'cancelled')                   as cancelled_orders,
    count(*)             filter (where created_at >= date_trunc('day', now()))  as orders_today
  from public.orders;
$$;

grant execute on function public.order_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_dashboard() — everything the dashboard main page needs, one round trip.
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'stats', (select to_jsonb(s) from public.order_stats() s),
    'subtotal_sales', coalesce((select sum(total) from public.orders where status <> 'cancelled'), 0),
    'best_sellers', coalesce((
      select jsonb_agg(x) from (
        select oi.product_id,
               max(oi.product_name_ar) as name_ar,
               max(oi.brand_name_ar)   as brand_ar,
               sum(oi.quantity)        as units,
               max(oi.product_slug)    as slug
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.status <> 'cancelled'
        group by oi.product_id
        order by sum(oi.quantity) desc
        limit 5
      ) x), '[]'::jsonb),
    'low_stock_note', 'inventory tracking is intentionally not implemented'
  );
$$;

grant execute on function public.admin_dashboard() to authenticated;

-- ---------------------------------------------------------------------------
-- public settings for the storefront (nothing sensitive lives here)
-- ---------------------------------------------------------------------------
create or replace function public.public_settings()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'whatsapp_number',         whatsapp_number,
    'contact_phone',           contact_phone,
    'delivery_fee',            delivery_fee,
    'free_delivery_threshold', free_delivery_threshold,
    'store_address',           store_address,
    'working_hours',           working_hours,
    'orders_enabled',          orders_enabled
  )
  from public.store_settings where id = true;
$$;

grant execute on function public.public_settings() to anon, authenticated;

commit;
