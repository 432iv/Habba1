-- ============================================================================
-- HABBA — local stand-in for Supabase Storage.
-- Only the parts the migration and the policy tests touch: the two tables, RLS
-- enabled on objects, and the same broad table grants Supabase's Data API has.
-- This is NOT a copy of Supabase; it exists so 0004_storage.sql and its
-- policies can be executed and verified offline.
-- ============================================================================

create schema if not exists storage;

create table if not exists storage.buckets (
  id                 text primary key,
  name               text,
  public             boolean,
  file_size_limit    bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name      text,
  owner     uuid,
  metadata  jsonb
);

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;
