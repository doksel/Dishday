-- Avatars storage bucket — required for Profile screen avatar upload.
--
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL → New Query).
-- Idempotent: `ON CONFLICT DO NOTHING` makes it safe to re-run.
--
-- Why a separate SQL file and not a Prisma migration?
--   Supabase Storage schema (`storage.buckets`, `storage.objects`) is owned
--   and migrated by Supabase itself — we treat it as a managed system. Our
--   Prisma migrations only touch the `public` schema.
--
-- After running, the bucket is reachable at:
--   https://<project>.supabase.co/storage/v1/object/public/avatars/<userId>.jpg

-- 1. Create the bucket (public-read).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                                 -- public-read; anyone with the URL can view
  5 * 1024 * 1024,                      -- 5 MB cap per upload
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. RLS policies on storage.objects.
--    Default Supabase install has RLS enabled on `storage.objects`. Postgres
--    does NOT support `CREATE POLICY IF NOT EXISTS`, so we DROP+CREATE for
--    idempotency. `DROP POLICY IF EXISTS` is safe on first run.

-- 2a. Anyone (including anon) can read avatars — the bucket is public anyway,
--     but explicit policies are clearer and survive bucket re-creation.
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

-- 2b. Authenticated users can write only their own file
--     (path must equal `<auth.uid()>.jpg|png|webp`).
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '.', 1) = auth.uid()::text
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '.', 1) = auth.uid()::text
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '.', 1) = auth.uid()::text
);
