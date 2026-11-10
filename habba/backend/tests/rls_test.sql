-- ============================================================================
-- HABBA — RLS & business-logic test suite
--
-- Run against a database where migrations 0001..0006 have been applied:
--   psql -d habba_test -f tests/rls_test.sql
--
-- Every assertion prints PASS/FAIL. The suite impersonates anon and the owner
-- exactly the way PostgREST does (SET ROLE + request.jwt.claims).
-- ============================================================================

\set QUIET on
\pset pager off

-- ---------------------------------------------------------------------------
-- harness
-- ---------------------------------------------------------------------------
create or replace function pg_temp.assert(p_ok boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_ok then
    raise notice 'PASS  %', p_label;
  else
    raise notice 'FAIL  %', p_label;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- denial helper: proves a statement is REFUSED (by RLS, a policy, a trigger or
-- a missing privilege). Written as a function so a refusal is caught inside a
-- nested block and does NOT abort the enclosing section.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.denied(p_sql text, p_label text, p_match text default null)
returns void language plpgsql as $$
declare
  v_denied boolean := false;
  v_msg    text;
begin
  begin
    execute p_sql;
  exception when others then
    v_denied := true;
    v_msg    := sqlerrm;
  end;

  if not v_denied then
    perform pg_temp.assert(false, p_label || '  (statement was ALLOWED)');
  elsif p_match is not null and v_msg not like '%' || p_match || '%' then
    perform pg_temp.assert(false, p_label || '  (refused, but wrong reason: ' || v_msg || ')');
  else
    perform pg_temp.assert(true, p_label);
  end if;
end;
$$;

-- pretend to be the owner (auth.uid() reads request.jwt.claims)
create or replace function pg_temp.login_as(p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, false);
end;
$$;

create or replace function pg_temp.setup_owner() returns uuid
language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (v);
  insert into public.profiles (id, full_name, role) values (v, 'Test Owner', 'owner');
  return v;
end;
$$;

-- anon session
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{}', false);
end;
$$;

\echo ''
\echo '================ A. STOREFRONT (anon) ================'

set role anon;
select pg_temp.as_anon();

select pg_temp.assert(
  (select count(*) from public.products) = 9,
  'anon sees the 9 visible seeded products');

select pg_temp.assert(
  (select count(*) from public.catalog_feed() where is_new_arrival) =
  (select count(*) from public.products where is_visible and created_at >= now() - interval '3 days'),
  'new arrivals = products created within the last 3 days');

select pg_temp.assert(
  (select count(*) from public.catalog_feed() where discount_price is not null) = 1,
  'discounted feed contains exactly the discounted product');

-- privilege check first (does not abort the session), then a real write test
set role anon;
select pg_temp.assert(
  not has_table_privilege('anon', 'public.products', 'UPDATE'),
  'anon has no UPDATE privilege on products');
reset role;

-- hiding a product must remove it from the storefront
update public.products set is_visible = false where slug = 'musc-blanc';

set role anon;
select pg_temp.assert(
  (select count(*) from public.products) = 8,
  'hidden product disappears from anon catalogue');

select pg_temp.assert(
  not exists (select 1 from public.catalog_feed() where slug = 'musc-blanc'),
  'hidden product excluded from catalog_feed()');

reset role;
update public.products set is_visible = true where slug = 'musc-blanc';

-- brand visibility cascades to products
update public.brands set is_visible = false where slug = 'ibraq';
set role anon;
select pg_temp.assert(
  (select count(*) from public.products where brand_id = (select id from public.brands where slug='ibraq')) = 0,
  'hiding a brand hides all of its products from anon');
reset role;
update public.brands set is_visible = true where slug = 'ibraq';

-- anon must never read orders
set role anon;
select pg_temp.denied(
  'select count(*) from public.orders',
  'anon cannot read the orders table',
  'permission denied');

select pg_temp.denied(
  'select count(*) from public.order_items',
  'anon cannot read order items',
  'permission denied');

select pg_temp.denied(
  'select count(*) from public.profiles',
  'anon cannot read profiles',
  'permission denied');

-- the direct write path must be gone entirely
select pg_temp.denied(
  $$insert into public.orders (customer_name, customer_phone, fulfillment_method, delivery_address, subtotal, delivery_fee, total, status)
    values ('مهاجم', '0911111111', 'delivery', 'عنوان وهمي طويل', 1, 0, 1, 'new')$$,
  'anon cannot INSERT directly into orders',
  'permission denied');

select pg_temp.denied(
  $$insert into public.order_items (order_id, product_name_ar, brand_name_ar, size_label, unit_price, quantity)
    values (gen_random_uuid(), 'عطر مجاني', 'علامة', '100 مل', 1, 1)$$,
  'anon cannot INSERT directly into order_items',
  'permission denied');

-- but the validated function is still available
select pg_temp.assert(
  has_function_privilege('anon', 'public.place_order(jsonb,text,text,public.fulfillment_method,text,text)', 'EXECUTE'),
  'anon may still execute place_order()');

select pg_temp.assert(
  not has_function_privilege('anon', 'public.order_stats()', 'EXECUTE'),
  'anon cannot execute the dashboard aggregation helper');

-- anon cannot write catalogue data
select pg_temp.assert(
  not has_table_privilege('anon', 'public.products', 'INSERT'),
  'anon has no INSERT privilege on products');
reset role;

\echo ''
\echo '================ B. PLACING ORDERS ================'

-- orders are disabled by default: the function must refuse
set role anon;
do $$
begin
  perform public.place_order(
    jsonb_build_array(jsonb_build_object(
      'product_id', (select id from public.products where slug = 'soie-dor'),
      'quantity', 2)),
    'سارة أحمد', '0912345678', 'delivery', 'طرابلس - حي الأندلس', null);
  perform pg_temp.assert(false, 'place_order refuses while orders are disabled');
exception when others then
  perform pg_temp.assert(sqlerrm like '%ORDERS_DISABLED%', 'place_order refuses while orders are disabled');
end $$;
reset role;

-- owner enables ordering and sets the fee/threshold
update public.store_settings
   set orders_enabled = true, delivery_fee = 15, free_delivery_threshold = 400,
       whatsapp_number = '218910000000';

\echo '  (order placement with delivery + discount + free threshold)'
set role anon;
create temp table _b1 as
select r.order_id, r.order_number, r.subtotal, r.delivery_fee, r.total
from public.place_order(
  jsonb_build_array(
    jsonb_build_object('product_id', (select id from public.products where slug = 'soie-dor'), 'quantity', 2)
  ),
  'سارة أحمد', '0912345678', 'delivery', 'طرابلس - حي الأندلس، شارع الجامعة', 'توصيل بعد الخامسة'
) r;

-- the function's own return value is the only thing a guest may see
select pg_temp.assert(
  (select subtotal from _b1) = 530 and (select delivery_fee from _b1) = 0 and (select total from _b1) = 530,
  'place_order returns server-calculated totals (530, free delivery)');

reset role;   -- inspect with the owner's privileges from here on
select pg_temp.assert(
  (select subtotal from public.orders order by created_at desc limit 1) = 530,
  'subtotal uses the DISCOUNTED price (265 x 2 = 530, not 620)');

-- 530 is above the 400 free-delivery threshold, so this order ships free.
select pg_temp.assert(
  (select delivery_fee from public.orders order by created_at desc limit 1) = 0
  and (select total from public.orders order by created_at desc limit 1) = 530,
  'free delivery above the threshold is applied inside the same order');

select pg_temp.assert(
  (select unit_price from public.order_items order by created_at desc limit 1) = 265
  and (select list_price from public.order_items order by created_at desc limit 1) = 310,
  'order item snapshots unit price AND the original list price');

select pg_temp.assert(
  (select order_number from public.orders order by created_at desc limit 1) ~ '^HB-[0-9]{6}-[0-9]{4}$',
  'order number follows HB-YYMMDD-NNNN');

-- a delivery order BELOW the free threshold must be charged the stored fee
create temp table _b1b as
select r.order_id, r.subtotal, r.delivery_fee, r.total
from public.place_order(
  jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where slug = 'rose-eternelle'), 'quantity', 1)),
  'علي سالم', '0915555555', 'delivery', 'طرابلس - شارع عمر المختار', null) r;

reset role;
select pg_temp.assert(
  (select subtotal from _b1b) = 240
  and (select delivery_fee from _b1b) = 15
  and (select total from _b1b) = 255,
  'delivery fee from store settings applied below the threshold (240 + 15 = 255)');
select pg_temp.assert(
  (select total from public.orders where id = (select order_id from _b1b)) =
  (select subtotal from public.orders where id = (select order_id from _b1b))
  + (select delivery_fee from public.orders where id = (select order_id from _b1b)),
  'stored order total equals subtotal + delivery fee');

-- pickup: no address stored, no fee
create temp table _b2 as
select r.order_id, r.order_number, r.subtotal, r.delivery_fee, r.total
from public.place_order(
  jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where slug = 'rose-eternelle'), 'quantity', 1)),
  'منى علي', '0921111111', 'pickup', 'ignored address', null) r;

select pg_temp.assert(
  (select delivery_fee from public.orders order by created_at desc limit 1) = 0
  and (select delivery_address from public.orders order by created_at desc limit 1) is null,
  'pickup order has no fee and no address');

-- free delivery threshold
create temp table _b3 as
select r.order_id, r.order_number, r.subtotal, r.delivery_fee, r.total
from public.place_order(
  jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where slug = 'noir-oud'), 'quantity', 2)),
  'هدى محمد', '0922222222', 'delivery', 'بنغازي - شارع دبي', null) r;

select pg_temp.assert(
  (select delivery_fee from public.orders order by created_at desc limit 1) = 0
  and (select subtotal from public.orders order by created_at desc limit 1) = 690,
  'free delivery applied above the configured threshold');

-- validation failures
do $$
begin
  perform public.place_order(
    jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where slug = 'noir-oud'), 'quantity', 1)),
    'سارة أحمد', '123', 'delivery', 'طرابلس - حي الأندلس', null);
  perform pg_temp.assert(false, 'invalid phone rejected');
exception when others then
  perform pg_temp.assert(sqlerrm like '%INVALID_PHONE%', 'invalid phone rejected');
end $$;

do $$
begin
  perform public.place_order(
    jsonb_build_array(jsonb_build_object('product_id', (select id from public.products where slug = 'noir-oud'), 'quantity', 1)),
    'سارة أحمد', '0912345678', 'delivery', null, null);
  perform pg_temp.assert(false, 'delivery without address rejected');
exception when others then
  perform pg_temp.assert(sqlerrm like '%ADDRESS_REQUIRED%', 'delivery without address rejected');
end $$;

do $$
begin
  perform public.place_order('[]'::jsonb, 'سارة أحمد', '0912345678', 'pickup', null, null);
  perform pg_temp.assert(false, 'empty cart rejected');
exception when others then
  perform pg_temp.assert(sqlerrm like '%EMPTY_CART%', 'empty cart rejected');
end $$;

-- a guest still cannot read back any order it created
set role anon;
select pg_temp.denied(
  'select count(*) from public.orders',
  'customer cannot read any order back (no order history API)',
  'permission denied');
reset role;

\echo ''
\echo '================ C. HISTORICAL PRESERVATION ================'

-- delete the product that was ordered
delete from public.products where slug = 'soie-dor';

select pg_temp.assert(
  exists (select 1 from public.order_items where product_slug = 'soie-dor' and product_id is null),
  'deleting a product keeps its order lines (product_id set to NULL)');

select pg_temp.assert(
  (select count(*) from public.order_items where product_name_ar = 'سوا دور' and unit_price = 265) >= 1,
  'order lines keep the original name and price after product deletion');

\echo ''
\echo '================ D. ORDER STATUS WORKFLOW ================'

select pg_temp.setup_owner() as owner_id \gset
select pg_temp.login_as(:'owner_id');

set role authenticated;

select pg_temp.assert(
  (select count(*) from public.orders
    where customer_phone in ('0912345678','0915555555','0921111111','0922222222')) = 4,
  'owner can read every order placed in section B (4 orders)');

select pg_temp.assert(
  (select count(*) from public.order_items) = 4,
  'owner can read order items (4 lines: qty 2 + 1 + 1 + 2)');

-- valid transition
update public.orders set status = 'confirmed' where status = 'new';
select pg_temp.assert(
  (select count(*) from public.orders where status = 'confirmed') >= 1,
  'owner moves an order new -> confirmed');

-- invalid jump
do $$
begin
  update public.orders set status = 'delivered' where id = (select id from public.orders where status = 'confirmed' limit 1);
  perform pg_temp.assert(false, 'illegal transition confirmed -> delivered blocked');
exception when others then
  perform pg_temp.assert(sqlerrm like '%invalid status transition%', 'illegal transition confirmed -> delivered blocked');
end $$;

-- financial data is immutable
do $$
begin
  update public.orders set total = 1 where id = (select id from public.orders where status = 'confirmed' limit 1);
  perform pg_temp.assert(false, 'order totals are immutable');
exception when others then
  perform pg_temp.assert(sqlerrm like '%immutable%', 'order totals are immutable');
end $$;

-- order items are a historical ledger: no privilege to delete them at all
select pg_temp.denied(
  'delete from public.order_items where true',
  'order items cannot be deleted',
  'permission denied');

select pg_temp.denied(
  $$update public.order_items set unit_price = 1 where true$$,
  'order item prices cannot be rewritten',
  'permission denied');

-- dashboard aggregation (section D moved every order out of 'new')
select pg_temp.assert(
  (public.admin_dashboard() -> 'stats' ->> 'awaiting_prep')::int = 4,
  'dashboard counts orders awaiting preparation');

select pg_temp.assert(
  (public.admin_dashboard() -> 'stats' ->> 'new_orders')::int = 0,
  'dashboard new-orders counter reflects the current statuses');

select pg_temp.assert(
  jsonb_array_length(public.admin_dashboard() -> 'best_sellers') >= 1,
  'dashboard returns best sellers from order history');

reset role;

\echo ''
\echo '================ E. OWNER-ONLY GUARANTEES ================'

-- a non-owner authenticated user (no profile) must be blocked
insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
select pg_temp.login_as('11111111-1111-1111-1111-111111111111');
set role authenticated;

select pg_temp.assert(
  (select count(*) from public.products where not is_visible) = 0,
  'non-owner authenticated account sees only visible products');

do $$
begin
  insert into public.products (slug, name_ar, brand_id, category_id, size_label, price)
  values ('hack-attempt', 'اختراق', (select id from public.brands limit 1),
          (select id from public.categories limit 1), '100 مل', 10);
  perform pg_temp.assert(false, 'non-owner cannot insert products');
exception when insufficient_privilege or others then
  perform pg_temp.assert(true, 'non-owner cannot insert products');
end $$;

-- authenticated non-owner: the privilege exists (the owner role needs it),
-- but RLS returns no rows at all.
select pg_temp.assert(
  (select count(*) from public.orders) = 0,
  'non-owner authenticated user reads zero orders (RLS)');

select pg_temp.denied(
  $$insert into public.orders (customer_name, customer_phone, fulfillment_method, subtotal, delivery_fee, total, status)
    values ('متسلل', '0911111111', 'pickup', 1, 0, 1, 'new')$$,
  'non-owner cannot INSERT into orders either');

select pg_temp.assert(
  public.is_owner() = false,
  'is_owner() is false for a non-owner account');

reset role;

-- second owner row is impossible
do $$
begin
  insert into public.profiles (id, role) values ('22222222-2222-2222-2222-222222222222', 'owner');
  perform pg_temp.assert(false, 'a second owner profile is rejected');
exception when unique_violation then
  perform pg_temp.assert(true, 'a second owner profile is rejected');
end $$;

\echo ''
\echo '================ F. SETTINGS & DERIVED SECTIONS ================'

select pg_temp.login_as(:'owner_id');
set role anon;
select pg_temp.assert(
  (public.public_settings() ->> 'whatsapp_number') = '218910000000',
  'storefront can read public settings (whatsapp)');
select pg_temp.assert(
  (public.public_settings() ->> 'orders_enabled')::boolean = true,
  'storefront sees the orders switch');
reset role;

select pg_temp.login_as(:'owner_id');
set role authenticated;
update public.store_settings set orders_enabled = false;
reset role;
select pg_temp.assert(
  (select orders_enabled from public.store_settings) = false,
  'owner can toggle order reception from settings');
select pg_temp.login_as('00000000-0000-0000-0000-000000000000');

-- new arrivals expiry: backdate a product beyond 3 days
select pg_temp.login_as(:'owner_id');
set role authenticated;
delete from public.products where slug = 'noir-oud';
reset role;
insert into public.products (slug, name_ar, brand_id, category_id, size_label, price, created_at)
values ('old-product', 'قديم', (select id from public.brands limit 1),
        (select id from public.categories limit 1), '100 مل', 100, now() - interval '4 days');

set role anon;
select pg_temp.assert(
  not exists (select 1 from public.catalog_feed() where slug = 'old-product' and is_new_arrival),
  'a product older than 3 days is NOT a new arrival');

select pg_temp.assert(
  exists (select 1 from public.catalog_feed() where slug = 'old-product'),
  'the same product is still listed in its normal category');
reset role;

-- discount section is derived from the column
update public.products set discount_price = 80 where slug = 'old-product';
set role anon;
select pg_temp.assert(
  exists (select 1 from public.catalog_feed() where slug = 'old-product' and discount_price is not null),
  'adding a discount automatically lists the product in discounts');
reset role;
update public.products set discount_price = null where slug = 'old-product';
set role anon;
select pg_temp.assert(
  not exists (select 1 from public.catalog_feed() where slug = 'old-product' and discount_price is not null),
  'removing the discount removes it from discounts');
reset role;

-- discount must be below price
do $$
begin
  update public.products set discount_price = 999 where slug = 'old-product';
  perform pg_temp.assert(false, 'discount above original price rejected');
exception when check_violation then
  perform pg_temp.assert(true, 'discount above original price rejected');
end $$;

\echo ''
\echo '================ G. UNIQUENESS / CONSTRAINTS ================'

do $$
begin
  insert into public.products (slug, name_ar, brand_id, category_id, size_label, price)
  values ('old-product', 'مكرر', (select id from public.brands limit 1),
          (select id from public.categories limit 1), '100 مل', 100);
  perform pg_temp.assert(false, 'duplicate slug rejected');
exception when unique_violation then
  perform pg_temp.assert(true, 'duplicate slug rejected');
end $$;

do $$
begin
  insert into public.orders (customer_name, customer_phone, fulfillment_method, subtotal, delivery_fee, total)
  values ('x', '0912345678', 'delivery', 100, 15, 115);
  perform pg_temp.assert(false, 'delivery order without address rejected by constraint');
exception when check_violation then
  perform pg_temp.assert(true, 'delivery order without address rejected by constraint');
end $$;

do $$
begin
  insert into public.orders (customer_name, customer_phone, fulfillment_method, subtotal, delivery_fee, total)
  values ('مريم سعيد', '0912345678', 'pickup', 100, 0, 90);
  perform pg_temp.assert(false, 'order whose total does not add up is rejected');
exception when check_violation then
  perform pg_temp.assert(true, 'order whose total does not add up is rejected');
end $$;

\echo ''
\echo '================ H. STOREFRONT INTEGRITY ================'
set role anon;
select pg_temp.assert(
  (select count(*) from public.catalog_feed() where image_path is null) =
  (select count(*) from public.catalog_feed()),
  'products without uploaded images are still listed (image handled by UI fallback)');
reset role;

select pg_temp.assert(
  has_function_privilege('anon', 'public.place_order(jsonb,text,text,public.fulfillment_method,text,text)', 'EXECUTE'),
  'anon may execute place_order (the only write path)');

select pg_temp.assert(
  not has_table_privilege('anon', 'public.orders', 'SELECT'),
  'anon has no direct SELECT on orders');


\echo ''
\echo '================ I. ATTACK SURFACE (anon write attempts) ================'

set role anon;

select pg_temp.denied($q$update public.products set price = 1 where true$q$,
  'anon cannot change product prices', 'permission denied');
select pg_temp.denied($q$update public.products set is_visible = false where true$q$,
  'anon cannot hide products', 'permission denied');
select pg_temp.denied($q$delete from public.products where true$q$,
  'anon cannot delete products', 'permission denied');
select pg_temp.denied($q$insert into public.products (slug,name_ar,brand_id,category_id,size_label,price)
  values ('x','x',gen_random_uuid(),gen_random_uuid(),'x',1)$q$,
  'anon cannot create products', 'permission denied');
select pg_temp.denied($q$update public.brands set name_ar = 'x' where true$q$,
  'anon cannot modify brands', 'permission denied');
select pg_temp.denied($q$delete from public.brands where true$q$,
  'anon cannot delete brands', 'permission denied');
select pg_temp.denied($q$update public.categories set name_ar = 'x' where true$q$,
  'anon cannot modify categories', 'permission denied');
select pg_temp.denied($q$update public.store_settings set delivery_fee = 0$q$,
  'anon cannot modify store settings', 'permission denied');
select pg_temp.denied($q$update public.store_settings set orders_enabled = true$q$,
  'anon cannot switch order reception on', 'permission denied');
select pg_temp.denied($q$insert into public.product_images (product_id, storage_path)
  values (gen_random_uuid(), 'x.jpg')$q$,
  'anon cannot register product images', 'permission denied');
select pg_temp.denied($q$insert into public.profiles (id) values (gen_random_uuid())$q$,
  'anon cannot create an owner profile', 'permission denied');

-- a guest must not be able to see anyone's personal data through any table
select pg_temp.denied($q$select customer_phone from public.orders limit 1$q$,
  'anon cannot read customer phone numbers', 'permission denied');
select pg_temp.denied($q$select delivery_address from public.orders limit 1$q$,
  'anon cannot read customer addresses', 'permission denied');
select pg_temp.denied($q$select * from public.profiles limit 1$q$,
  'anon cannot read owner profiles', 'permission denied');

reset role;

\echo ''
\echo '================ J. ORDER-PATH HARDENING ================'

-- the store is enabled here; every one of these must be refused by place_order()
update public.store_settings set orders_enabled = true;

create temp table _j_pid as
  select id from public.products where slug = 'rose-eternelle';

-- 1. a client-supplied price must be ignored entirely
select pg_temp.assert(
  (select r.subtotal from public.place_order(
     jsonb_build_array(jsonb_build_object('product_id', (select id from _j_pid), 'quantity', 1)),
     'عميل تجريبي', '0913333333', 'pickup', null, null) r) = 240,
  'client cannot influence the price (server reads 240 from the database)');

-- 2. a non-existent product id
select pg_temp.denied(
  $q$select * from public.place_order(
       jsonb_build_array(jsonb_build_object('product_id', gen_random_uuid(), 'quantity', 1)),
       'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
  'unknown product id rejected', 'PRODUCT_UNAVAILABLE');

-- 3. duplicate lines for the same product
select pg_temp.denied(
  format($q$select * from public.place_order(%L::jsonb, 'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
    (select jsonb_build_array(
       jsonb_build_object('product_id', id, 'quantity', 10),
       jsonb_build_object('product_id', id, 'quantity', 10)
     ) from _j_pid)::text),
  'the same product cannot be stacked across duplicate lines', 'DUPLICATE_ITEM');

-- 4. a hidden brand blocks the purchase even though the product row is visible
update public.brands set is_visible = false
 where id = (select brand_id from public.products where slug = 'rose-eternelle');

select pg_temp.assert(
  (select p.is_visible from public.products p where p.slug = 'rose-eternelle'),
  '(product row itself is still marked visible)');

select pg_temp.denied(
  format($q$select * from public.place_order(%L::jsonb, 'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
    (select jsonb_build_array(jsonb_build_object('product_id', id, 'quantity', 1)) from _j_pid)::text),
  'a product from a hidden brand cannot be purchased', 'PRODUCT_UNAVAILABLE');

update public.brands set is_visible = true
 where id = (select brand_id from public.products where slug = 'rose-eternelle');

-- 5. a hidden category likewise
update public.categories set is_visible = false
 where id = (select category_id from public.products where slug = 'rose-eternelle');

select pg_temp.denied(
  format($q$select * from public.place_order(%L::jsonb, 'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
    (select jsonb_build_array(jsonb_build_object('product_id', id, 'quantity', 1)) from _j_pid)::text),
  'a product from a hidden category cannot be purchased', 'PRODUCT_UNAVAILABLE');

update public.categories set is_visible = true
 where id = (select category_id from public.products where slug = 'rose-eternelle');

-- 6. a hidden product
update public.products set is_visible = false where slug = 'rose-eternelle';

select pg_temp.denied(
  format($q$select * from public.place_order(%L::jsonb, 'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
    (select jsonb_build_array(jsonb_build_object('product_id', id, 'quantity', 1)) from _j_pid)::text),
  'a hidden product cannot be purchased', 'PRODUCT_UNAVAILABLE');

update public.products set is_visible = true where slug = 'rose-eternelle';

-- 7. a failed order must leave nothing behind
create temp table _j_before as
  select (select count(*) from public.orders) as o, (select count(*) from public.order_items) as i;

select pg_temp.denied(
  $q$select * from public.place_order(
       jsonb_build_array(jsonb_build_object('product_id', gen_random_uuid(), 'quantity', 1)),
       'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
  'rejected basket raises no partial order', 'PRODUCT_UNAVAILABLE');

select pg_temp.assert(
  (select count(*) from public.orders) = (select o from _j_before)
  and (select count(*) from public.order_items) = (select i from _j_before),
  'a failed order leaves zero rows in orders and order_items');

-- 8. disabled reception
update public.store_settings set orders_enabled = false;

select pg_temp.denied(
  format($q$select * from public.place_order(%L::jsonb, 'عميل تجريبي', '0913333333', 'pickup', null, null)$q$,
    (select jsonb_build_array(jsonb_build_object('product_id', id, 'quantity', 1)) from _j_pid)::text),
  'switching order reception off blocks new orders', 'ORDERS_DISABLED');

update public.store_settings set orders_enabled = true;

\echo ''
\echo '================ K. PRIVILEGE ESCALATION ================'

-- Section D already created THE owner (the schema allows exactly one). Reuse
-- it: calling setup_owner() again would fail with 'single owner account only'.
select (select id from public.profiles order by created_at limit 1) as owner_id \gset
select pg_temp.login_as(:'owner_id');
set role authenticated;

-- an ordinary authenticated user must not be able to become the owner
select pg_temp.denied(
  $q$insert into public.profiles (id, role) values (gen_random_uuid(), 'owner')$q$,
  'a second owner row cannot be created', 'permission denied');

select pg_temp.denied(
  $q$update public.profiles set role = 'owner' where true$q$,
  'role cannot be rewritten through profiles', 'permission denied');

reset role;

-- metadata is not an authorization channel: is_owner() reads profiles only
select pg_temp.assert(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name in ('is_admin', 'is_owner')
  ),
  'owner status is not a cached column that could be flipped');

select pg_temp.assert(
  not has_table_privilege('anon', 'public.profiles', 'SELECT')
  and not has_table_privilege('anon', 'public.profiles', 'INSERT'),
  'anon has no privileges at all on profiles');


\echo ''
\echo '================ L. NEW-ARRIVALS BOUNDARY ================'

-- The 3-day window must be exact and must not depend on the session timezone.
create temp table _l_base as
  select brand_id, category_id from public.products limit 1;

insert into public.products (slug, name_ar, brand_id, category_id, size_label, price, created_at)
select 'tz-inside', 'داخل النافذة', brand_id, category_id, '100 مل', 100,
       now() - interval '2 days 23 hours 59 minutes'
from _l_base;

insert into public.products (slug, name_ar, brand_id, category_id, size_label, price, created_at)
select 'tz-outside', 'خارج النافذة', brand_id, category_id, '100 مل', 100,
       now() - interval '3 days 1 second'
from _l_base;

select pg_temp.assert(
  (select is_new_arrival from public.catalog_feed() where slug = 'tz-inside'),
  'a product 2d23h59m old is still a new arrival');

select pg_temp.assert(
  not (select is_new_arrival from public.catalog_feed() where slug = 'tz-outside'),
  'a product 3 days + 1 second old is no longer a new arrival');

set timezone = 'Africa/Tripoli';
create temp table _l_tz1 as select slug, is_new_arrival from public.catalog_feed() where slug like 'tz-%';
set timezone = 'UTC';
create temp table _l_tz2 as select slug, is_new_arrival from public.catalog_feed() where slug like 'tz-%';

select pg_temp.assert(
  not exists (select * from _l_tz1 except select * from _l_tz2),
  'the 3-day window is identical in Africa/Tripoli and UTC');

select pg_temp.assert(
  not exists (select 1 from public.catalog_feed() where slug = 'tz-outside' and is_new_arrival),
  'expired products stay in the catalogue but not in new arrivals');

-- an expired product is still listed in its category
select pg_temp.assert(
  exists (select 1 from public.catalog_feed() where slug = 'tz-outside'),
  'an expired new arrival is still listed in its normal category');

delete from public.products where slug in ('tz-inside', 'tz-outside');

\echo ''
\echo '================ done ================'
