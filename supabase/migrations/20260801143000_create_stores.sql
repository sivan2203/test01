create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_path text,
  description text,
  additional_info text,
  timezone text not null default 'Europe/Moscow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_seller_id_key unique (seller_id),
  constraint stores_name_length_check check (
    char_length(btrim(name)) between 1 and 80
  ),
  constraint stores_description_length_check check (
    description is null or char_length(description) <= 500
  ),
  constraint stores_additional_info_length_check check (
    additional_info is null or char_length(additional_info) <= 500
  ),
  constraint stores_avatar_path_owner_check check (
    avatar_path is null or split_part(avatar_path, '/', 1) = seller_id::text
  ),
  constraint stores_timezone_check check (char_length(btrim(timezone)) between 1 and 64)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row
execute function public.set_updated_at();

alter table public.stores enable row level security;

drop policy if exists "stores_select_own" on public.stores;
create policy "stores_select_own"
on public.stores
for select
to authenticated
using ((select auth.uid()) = seller_id);

drop policy if exists "stores_insert_own" on public.stores;
create policy "stores_insert_own"
on public.stores
for insert
to authenticated
with check ((select auth.uid()) = seller_id);

drop policy if exists "stores_update_own" on public.stores;
create policy "stores_update_own"
on public.stores
for update
to authenticated
using ((select auth.uid()) = seller_id)
with check ((select auth.uid()) = seller_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-avatars',
  'store-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "store_avatars_select_own" on storage.objects;
create policy "store_avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'store-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "store_avatars_insert_own" on storage.objects;
create policy "store_avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'store-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "store_avatars_update_own" on storage.objects;
create policy "store_avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'store-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'store-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "store_avatars_delete_own" on storage.objects;
create policy "store_avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'store-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
