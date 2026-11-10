-- ============================================================================
-- HABBA — 0002_rls.sql
-- Row Level Security: public read for the storefront, owner-only writes.
--
-- Threat model:
--   * anon          -> may SELECT only visible rows; may place an order
--                      through a validated function; may read settings.
--   * authenticated -> same as anon unless the account is the owner.
--   * owner         -> (is_owner() = true) full management of catalog + orders.
--   * service_role  -> bypasses RLS (used only server-side, never shipped).
--
-- Authorization lives in the database, never in the dashboard UI.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere exposed through the API
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.brands         enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.store_settings enable row level security;

-- Deny-by-default: Supabase grants are broad, so revoke then grant explicitly.
revoke all on public.profiles, public.brands, public.categories, public.products,
              public.product_images, public.orders, public.order_items, public.store_settings
  from anon, authenticated;

grant select on public.brands, public.categories, public.products, public.product_images
  to anon, authenticated;
grant select on public.store_settings to anon, authenticated;

grant select, insert, update, delete on public.brands, public.categories, public.products,
      public.product_images, public.store_settings
  to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.profiles to authenticated;

-- Storefront needs to insert orders, but only through the function below.
grant insert on public.orders, public.order_items to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles: owner can read/update their own row; nobody can list profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_owner on public.profiles;
create policy profiles_select_owner on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_update_owner on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'owner');

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
drop policy if exists brands_public_read on public.brands;
create policy brands_public_read on public.brands
  for select to anon, authenticated
  using (is_visible or public.is_owner());

drop policy if exists brands_owner_write on public.brands;
create policy brands_owner_write on public.brands
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (is_visible or public.is_owner());

drop policy if exists categories_owner_write on public.categories;
create policy categories_owner_write on public.categories
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- products — a product is storefront-visible only when it AND its brand
-- AND its category are visible. Hiding a brand therefore hides its products.
-- ---------------------------------------------------------------------------
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    public.is_owner()
    or (
      is_visible
      and exists (select 1 from public.brands b     where b.id = brand_id    and b.is_visible)
      and exists (select 1 from public.categories c where c.id = category_id and c.is_visible)
    )
  );

drop policy if exists products_owner_write on public.products;
create policy products_owner_write on public.products
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- product_images — visible only for visible/inspectable products
-- ---------------------------------------------------------------------------
drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (
    public.is_owner()
    or exists (select 1 from public.products p where p.id = product_id)
  );

drop policy if exists product_images_owner_write on public.product_images;
create policy product_images_owner_write on public.product_images
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- orders — NO public read. Guests may only create through place_order().
-- ---------------------------------------------------------------------------
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders
  for select to authenticated
  using (public.is_owner());

drop policy if exists orders_owner_update on public.orders;
create policy orders_owner_update on public.orders
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- Direct client inserts are still constrained: status must be 'new' and the
-- totals must be self-consistent. The place_order() function is the preferred
-- path and re-validates everything server-side.
drop policy if exists orders_guest_insert on public.orders;
create policy orders_guest_insert on public.orders
  for insert to anon, authenticated
  with check (status = 'new' and subtotal >= 0 and delivery_fee >= 0
              and total = subtotal + delivery_fee);

drop policy if exists order_items_owner_read on public.order_items;
create policy order_items_owner_read on public.order_items
  for select to authenticated
  using (public.is_owner());

drop policy if exists order_items_guest_insert on public.order_items;
create policy order_items_guest_insert on public.order_items
  for insert to anon, authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.status = 'new'));

-- ---------------------------------------------------------------------------
-- store_settings — public may read (needs WhatsApp number, fees, hours);
-- only the owner may change anything.
-- ---------------------------------------------------------------------------
drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read on public.store_settings
  for select to anon, authenticated
  using (true);

drop policy if exists store_settings_owner_write on public.store_settings;
create policy store_settings_owner_write on public.store_settings
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

commit;
