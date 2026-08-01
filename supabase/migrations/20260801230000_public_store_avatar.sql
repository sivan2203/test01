drop function if exists public.get_public_store_by_slug(text);

create function public.get_public_store_by_slug(store_slug text)
returns table (
  slug text,
  name text,
  avatar_path text,
  description text,
  additional_info text,
  timezone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    stores.slug,
    stores.name,
    stores.avatar_path,
    stores.description,
    stores.additional_info,
    stores.timezone
  from public.stores
  where stores.slug = store_slug
    and stores.slug is not null
  limit 1;
$$;

revoke all on function public.get_public_store_by_slug(text) from public;
grant execute on function public.get_public_store_by_slug(text) to anon, authenticated;

create or replace function public.is_public_store_avatar_path(object_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores
    where stores.slug is not null
      and stores.avatar_path = object_path
  );
$$;

revoke all on function public.is_public_store_avatar_path(text) from public;
grant execute on function public.is_public_store_avatar_path(text) to anon, authenticated;

drop policy if exists "store_avatars_select_public" on storage.objects;
create policy "store_avatars_select_public"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'store-avatars'
  and public.is_public_store_avatar_path(name)
);
