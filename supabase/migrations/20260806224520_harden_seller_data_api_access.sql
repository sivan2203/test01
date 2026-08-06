create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.product_media_product_owner(
  target_product_id uuid,
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products
    join public.stores on stores.id = products.store_id
    where products.id = target_product_id
      and products.status <> 'deleted'
      and stores.seller_id = (select auth.uid())
      and object_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      and split_part(object_name, '/', 1) = stores.id::text
      and split_part(object_name, '/', 2) = products.id::text
  );
$$;

create or replace function private.product_media_owner(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_media
    where product_media.storage_path = object_name
      and private.product_media_product_owner(product_media.product_id, object_name)
  );
$$;

create or replace function private.product_media_published(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_media
    join public.products on products.id = product_media.product_id
    where product_media.storage_path = object_name
      and products.status = 'published'
  );
$$;

create or replace function private.product_media_storage_owner(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products
    join public.stores on stores.id = products.store_id
    where products.status <> 'deleted'
      and stores.seller_id = (select auth.uid())
      and object_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      and split_part(object_name, '/', 1) = stores.id::text
      and products.id = split_part(object_name, '/', 2)::uuid
  );
$$;

create or replace function private.product_media_storage_delete_owner(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.products
    join public.stores on stores.id = products.store_id
    where stores.seller_id = (select auth.uid())
      and products.id = split_part(object_name, '/', 2)::uuid
      and object_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      and split_part(object_name, '/', 1) = stores.id::text
  );
$$;

revoke all on function private.product_media_product_owner(uuid, text) from public;
revoke all on function private.product_media_owner(text) from public;
revoke all on function private.product_media_published(text) from public;
revoke all on function private.product_media_storage_owner(text) from public;
revoke all on function private.product_media_storage_delete_owner(text) from public;

grant execute on function private.product_media_product_owner(uuid, text) to authenticated;
grant execute on function private.product_media_owner(text) to authenticated;
grant execute on function private.product_media_published(text) to anon, authenticated;
grant execute on function private.product_media_storage_owner(text) to authenticated;
grant execute on function private.product_media_storage_delete_owner(text) to authenticated;

revoke execute on function public.product_media_product_owner(uuid, text) from anon, authenticated;
revoke execute on function public.product_media_owner(text) from anon, authenticated;
revoke execute on function public.product_media_published(text) from anon, authenticated;
revoke execute on function public.product_media_storage_owner(text) from anon, authenticated;
revoke execute on function public.product_media_storage_delete_owner(text) from anon, authenticated;

drop policy if exists "product_media_owner_select" on public.product_media;
create policy "product_media_owner_select"
on public.product_media
for select
to authenticated
using (private.product_media_owner(storage_path));

drop policy if exists "product_media_owner_insert" on public.product_media;
create policy "product_media_owner_insert"
on public.product_media
for insert
to authenticated
with check (private.product_media_product_owner(product_id, storage_path));

drop policy if exists "product_media_owner_delete" on public.product_media;
create policy "product_media_owner_delete"
on public.product_media
for delete
to authenticated
using (private.product_media_owner(storage_path));

drop policy if exists "product_media_storage_owner_insert" on storage.objects;
create policy "product_media_storage_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-media'
  and private.product_media_storage_owner(name)
);

drop policy if exists "product_media_storage_owner_update" on storage.objects;
create policy "product_media_storage_owner_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-media' and private.product_media_owner(name))
with check (bucket_id = 'product-media' and private.product_media_owner(name));

drop policy if exists "product_media_storage_owner_delete" on storage.objects;
create policy "product_media_storage_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-media'
  and private.product_media_storage_delete_owner(name)
);

drop policy if exists "product_media_storage_read" on storage.objects;
create policy "product_media_storage_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-media'
  and (
    private.product_media_published(name)
    or private.product_media_owner(name)
  )
);

create or replace function public.insert_product_media(
  target_media_id uuid,
  target_product_id uuid,
  target_storage_path text,
  target_mime_type text,
  target_byte_size bigint,
  target_sort_order smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  expected_extension text;
begin
  if (select auth.uid()) is null
     or not private.product_media_product_owner(
       target_product_id,
       target_storage_path
     ) then
    raise exception 'product_not_owned';
  end if;

  expected_extension := case target_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    else null
  end;

  if expected_extension is null
     or target_byte_size <= 0
     or target_byte_size > 6291456
     or split_part(target_storage_path, '/', 3) <>
       target_media_id::text || '.' || expected_extension then
    raise exception 'invalid_product_media';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'product-media'
      and name = target_storage_path
  ) then
    raise exception 'product_media_object_not_found';
  end if;

  select count(*)::integer
  into current_count
  from public.product_media
  where product_id = target_product_id;

  if current_count >= 10 then
    raise exception 'product_media_limit_reached';
  end if;

  if target_sort_order <> current_count::smallint then
    raise exception 'invalid_product_media_order';
  end if;

  insert into public.product_media (
    id,
    product_id,
    storage_path,
    mime_type,
    byte_size,
    sort_order
  ) values (
    target_media_id,
    target_product_id,
    target_storage_path,
    target_mime_type,
    target_byte_size,
    target_sort_order
  );
end;
$$;

revoke all on function public.insert_product_media(uuid, uuid, text, text, bigint, smallint)
from public;
grant execute on function public.insert_product_media(uuid, uuid, text, text, bigint, smallint)
to authenticated;

revoke insert, update, delete on table public.product_media from authenticated;
grant select on table public.product_media to authenticated;

revoke update on table public.products from authenticated;
grant update (
  title,
  description,
  price_mode,
  price_amount,
  availability_status
) on table public.products to authenticated;
