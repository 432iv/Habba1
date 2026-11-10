-- ============================================================================
-- HABBA — 0004_storage.sql
-- Supabase Storage buckets + object policies.
--
-- Buckets:
--   product-images  (public read)  product photos        ~1600px, JPEG/WebP
--   brand-logos     (public read)  brand logos           ~800px
--   category-images (public read)  category banners      ~1200px
--
-- Writes are owner-only. Reads are public so the storefront can use plain
-- public URLs (no signed links, no key exposure).
-- ============================================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',  'product-images',  true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('brand-logos',     'brand-logos',     true, 2097152, array['image/png','image/svg+xml','image/webp','image/jpeg']),
  ('category-images', 'category-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public download for the three public buckets -----------------------------
drop policy if exists habba_public_read_images on storage.objects;
create policy habba_public_read_images on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images','brand-logos','category-images'));

-- Owner-only upload / replace / delete --------------------------------------
drop policy if exists habba_owner_insert_images on storage.objects;
create policy habba_owner_insert_images on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images','brand-logos','category-images')
    and public.is_owner()
  );

drop policy if exists habba_owner_update_images on storage.objects;
create policy habba_owner_update_images on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images','brand-logos','category-images') and public.is_owner())
  with check (bucket_id in ('product-images','brand-logos','category-images') and public.is_owner());

drop policy if exists habba_owner_delete_images on storage.objects;
create policy habba_owner_delete_images on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images','brand-logos','category-images') and public.is_owner());

commit;
