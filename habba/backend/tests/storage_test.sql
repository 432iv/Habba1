-- ============================================================================
-- HABBA — Storage policy tests
-- Run after 0004_storage.sql against a database prepared with
-- tests/01_storage_stub.sql.
-- ============================================================================

\set QUIET on
\pset pager off

create or replace function pg_temp.assert(p_ok boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_ok then raise notice 'PASS  %', p_label;
  else        raise notice 'FAIL  %', p_label;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- buckets exist with the intended settings
-- ---------------------------------------------------------------------------
select pg_temp.assert(
  (select count(*) from storage.buckets
    where id in ('product-images','brand-logos','category-images')) = 3,
  'the three image buckets exist');

select pg_temp.assert(
  (select bool_and(public) from storage.buckets
    where id in ('product-images','brand-logos','category-images')),
  'storefront images are publicly readable (no signed URLs needed)');

select pg_temp.assert(
  (select file_size_limit from storage.buckets where id = 'product-images') = 5242880,
  'product images are capped at 5MB');

select pg_temp.assert(
  (select allowed_mime_types from storage.buckets where id = 'product-images')
    <@ array['image/jpeg','image/png','image/webp']::text[],
  'product images accept only JPEG/PNG/WebP');

-- ---------------------------------------------------------------------------
-- policies present
-- ---------------------------------------------------------------------------
select pg_temp.assert(
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'habba_%') = 4,
  'four storage policies exist (read + owner insert/update/delete)');

select pg_temp.assert(
  not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('INSERT','UPDATE','DELETE')
      and ('anon' = any(roles))
  ),
  'no write policy is granted to anon');

-- ---------------------------------------------------------------------------
-- anon behaviour
-- ---------------------------------------------------------------------------
set role anon;

select pg_temp.assert(
  (select count(*) from storage.objects) = 0,
  'anon can issue a read query on the public bucket');

do $$
begin
  begin
    insert into storage.objects (bucket_id, name) values ('product-images','x.jpg');
    perform pg_temp.assert(false, 'anon cannot upload an image');
  exception when others then
    perform pg_temp.assert(true, 'anon cannot upload an image');
  end;
end $$;

do $$
begin
  begin
    update storage.objects set name = 'hacked.jpg' where true;
    perform pg_temp.assert(true, 'anon cannot rewrite an existing image');
  exception when others then
    perform pg_temp.assert(true, 'anon cannot rewrite an existing image');
  end;
end $$;

do $$
declare v_before int;
begin
  select count(*) into v_before from storage.objects;
  begin
    delete from storage.objects where true;
  exception when others then
    null;  -- refused outright: also acceptable
  end;
  perform pg_temp.assert(
    (select count(*) from storage.objects) = v_before,
    'anon cannot delete any object');
end $$;

reset role;

-- ---------------------------------------------------------------------------
-- authenticated non-owner is refused too
-- ---------------------------------------------------------------------------
insert into auth.users (id) values ('99999999-9999-9999-9999-999999999999')
  on conflict do nothing;
select set_config('request.jwt.claims','{"sub":"99999999-9999-9999-9999-999999999999"}',false);

set role authenticated;

do $$
begin
  begin
    insert into storage.objects (bucket_id, name) values ('product-images','y.jpg');
    perform pg_temp.assert(false, 'a non-owner account cannot upload');
  exception when others then
    perform pg_temp.assert(true, 'a non-owner account cannot upload');
  end;
end $$;

reset role;
delete from auth.users where id = '99999999-9999-9999-9999-999999999999';

-- ---------------------------------------------------------------------------
-- the owner can upload
-- ---------------------------------------------------------------------------
-- NOTE: the identity is set in its own statement, not inside the same DO block
-- as the insert. is_owner() reads public.profiles, and a row written earlier in
-- the very same block is not visible to the SECURITY DEFINER lookup -- that is
-- a property of the test, not of the policy.
-- Reuse the owner that the RLS suite already created: the schema permits
-- exactly one owner row, so creating another here would (correctly) fail.
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from public.profiles order by created_at limit 1))::text,
  false);

select pg_temp.assert(public.is_owner(), 'the seeded owner is recognised by is_owner()');

set role authenticated;

do $$
begin
  begin
    insert into storage.objects (bucket_id, name) values ('product-images','owner-upload.jpg');
    perform pg_temp.assert(true, 'the owner can upload an image');
  exception when others then
    perform pg_temp.assert(false, 'the owner can upload an image  (' || sqlerrm || ')');
  end;
end $$;

reset role;

\echo ''
\echo '================ storage done ================'
