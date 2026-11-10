-- ============================================================================
-- HABBA — 0001_schema.sql
-- Core PostgreSQL schema for the HABBA perfume storefront + admin dashboard.
--
-- Design notes:
--  * UUID primary keys, timestamptz everywhere.
--  * ONE size per product (no variants, no stock quantities) — by design.
--  * Order items store a full price/name SNAPSHOT so history survives
--    product edits and deletions (product_id becomes NULL on delete).
--  * "New arrivals" and "discounted" are DERIVED, never stored flags:
--      - new arrival  = created_at >= now() - interval '3 days'
--      - discounted   = discount_price IS NOT NULL
--  * Effective price = COALESCE(discount_price, price) as a generated column.
-- ============================================================================

begin;

create extension if not exists pg_trgm;      -- fast ILIKE search on Arabic names

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'new',        -- جديد
      'confirmed',  -- مؤكد
      'preparing',  -- قيد التجهيز
      'ready',      -- جاهز للتسليم / للاستلام
      'delivered',  -- تم التسليم
      'cancelled'   -- ملغي
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'fulfillment_method') then
    create type public.fulfillment_method as enum ('delivery', 'pickup');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.slugify(p_value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
           lower(coalesce(p_value, '')),
           '[^a-z0-9\u0621-\u064A]+', '-', 'g'
         ));
$$;

-- ---------------------------------------------------------------------------
-- profiles — the single owner account (mirrors auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'owner' check (role = 'owner'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Only ONE owner row is ever allowed.
create or replace function public.enforce_single_owner()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.profiles where id <> new.id) then
    raise exception 'HABBA supports a single owner account only'
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_single_owner on public.profiles;
create trigger profiles_single_owner
  before insert on public.profiles
  for each row execute function public.enforce_single_owner();

-- SECURITY DEFINER so policies can call it without recursive RLS.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'owner'
  );
$$;

grant execute on function public.is_owner() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9\u0621-\u064A-]+$'),
  name_ar       text not null check (length(trim(name_ar)) > 0),
  name_en       text not null check (length(trim(name_en)) > 0),
  tagline_ar    text,
  description_ar text,
  logo_path     text,                       -- Supabase Storage object path
  is_visible    boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists brands_visible_idx on public.brands (is_visible, sort_order);

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9\u0621-\u064A-]+$'),
  name_ar       text not null check (length(trim(name_ar)) > 0),
  name_en       text,
  description_ar text,
  image_path    text,
  is_visible    boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists categories_visible_idx on public.categories (is_visible, sort_order);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name_ar           text not null check (length(trim(name_ar)) > 0),
  name_en           text,
  brand_id          uuid not null references public.brands (id) on delete restrict,
  category_id       uuid not null references public.categories (id) on delete restrict,
  description_ar    text,
  size_label        text not null check (length(trim(size_label)) > 0),  -- e.g. "100 مل"
  price             numeric(10, 2) not null check (price > 0),           -- original price, LYD
  discount_price    numeric(10, 2) check (discount_price is null or discount_price > 0),
  concentration     text,                                                 -- e.g. "Eau de Parfum"
  fragrance_family  text,                                                 -- e.g. "زهري"
  notes_top         text[],
  notes_heart       text[],
  notes_base        text[],
  is_visible        boolean not null default true,
  is_best_seller    boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- A discount must be strictly cheaper than the original price.
  constraint products_discount_below_price
    check (discount_price is null or discount_price < price),

  -- Effective selling price (never null) — used by storefront, sorting, orders.
  effective_price numeric(10, 2) generated always as (coalesce(discount_price, price)) stored,
  discount_percent integer generated always as (
    case when discount_price is null then 0
         else round((1 - discount_price / price) * 100)::integer end
  ) stored
);

create index if not exists products_brand_idx      on public.products (brand_id);
create index if not exists products_category_idx   on public.products (category_id);
create index if not exists products_visible_idx    on public.products (is_visible, created_at desc);
create index if not exists products_new_idx        on public.products (created_at desc) where is_visible;
create index if not exists products_discount_idx   on public.products (discount_price) where discount_price is not null;
create index if not exists products_bestseller_idx on public.products (is_best_seller) where is_best_seller and is_visible;
create index if not exists products_name_trgm_idx  on public.products using gin ((name_ar || ' ' || coalesce(name_en, '')) gin_trgm_ops);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- created_at drives the automatic 3-day "new arrivals" window: it must not move.
create or replace function public.freeze_created_at()
returns trigger
language plpgsql
as $$
begin
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists products_freeze_created_at on public.products;
create trigger products_freeze_created_at
  before update on public.products
  for each row execute function public.freeze_created_at();

-- Auto slug (never leaves a product without a URL-safe identifier).
create or replace function public.products_set_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
begin
  if new.slug is null or length(trim(new.slug)) = 0 then
    base := nullif(public.slugify(coalesce(new.name_en, new.name_ar)), '');
    if base is null then
      base := 'perfume';
    end if;
    new.slug := base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  else
    new.slug := lower(trim(new.slug));
  end if;
  return new;
end;
$$;

drop trigger if exists products_slugify on public.products;
create trigger products_slugify
  before insert on public.products
  for each row execute function public.products_set_slug();

-- ---------------------------------------------------------------------------
-- product_images (multiple images per product; exactly one primary)
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (length(trim(storage_path)) > 0),
  alt_ar       text,
  is_primary   boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (product_id, storage_path)
);

create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,
  customer_name       text not null check (length(trim(customer_name)) >= 3),
  customer_phone      text not null check (length(regexp_replace(customer_phone, '\D', '', 'g')) >= 9),
  fulfillment_method  public.fulfillment_method not null,
  delivery_address    text,
  customer_note       text,
  subtotal            numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee        numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total               numeric(10, 2) not null check (total >= 0),
  status              public.order_status not null default 'new',
  status_updated_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Pickup orders never carry an address; delivery always does.
  constraint orders_delivery_needs_address check (
    (fulfillment_method = 'pickup'  and delivery_address is null) or
    (fulfillment_method = 'delivery' and delivery_address is not null
       and length(trim(delivery_address)) >= 6)
  ),
  constraint orders_total_matches check (total = subtotal + delivery_fee)
);

create index if not exists orders_status_idx  on public.orders (status, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx   on public.orders (customer_phone);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.orders_set_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or length(trim(new.order_number)) = 0 then
    new.order_number := 'HB-' || to_char(now(), 'YYMMDD') || '-' ||
                        lpad(nextval('public.order_number_seq')::text, 4, '0');
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.status_updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_number on public.orders;
create trigger orders_number
  before insert or update on public.orders
  for each row execute function public.orders_set_number();

-- ---------------------------------------------------------------------------
-- order_items — immutable snapshot of what was bought, at the price paid
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  product_slug    text,                       -- snapshot for linking, survives deletion
  product_name_ar text not null,
  product_name_en text,
  brand_name_ar   text not null,
  size_label      text not null,
  unit_price      numeric(10, 2) not null check (unit_price > 0),  -- price actually paid
  list_price      numeric(10, 2),                                  -- original price at purchase (if discounted)
  quantity        integer not null check (quantity between 1 and 20),
  line_total      numeric(10, 2) generated always as (unit_price * quantity) stored,
  created_at      timestamptz not null default now()
);

create index if not exists order_items_order_idx   on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- store_settings — exactly one row, all values owner-editable
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id                     boolean primary key default true check (id),
  whatsapp_number        text,          -- international format digits only: 218XXXXXXXXX
  contact_phone          text,
  delivery_fee           numeric(10, 2) check (delivery_fee is null or delivery_fee >= 0),
  free_delivery_threshold numeric(10, 2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  store_address          text,
  working_hours          text,
  orders_enabled         boolean not null default false,
  updated_at             timestamptz not null default now()
);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- Bootstrap the single settings row with NULL business values.
-- No fee, number, address or threshold is invented here.
insert into public.store_settings (id) values (true) on conflict (id) do nothing;

commit;
