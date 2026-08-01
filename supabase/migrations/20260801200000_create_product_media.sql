create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_media_storage_path_check check (char_length(storage_path) between 10 and 512),
  constraint product_media_mime_type_check check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint product_media_byte_size_check check (byte_size > 0 and byte_size <= 6291456),
  constraint product_media_sort_order_check check (sort_order between 0 and 9),
  constraint product_media_product_sort_order_key unique (product_id, sort_order) deferrable initially immediate
);

drop trigger if exists product_media_set_updated_at on public.product_media;
create trigger product_media_set_updated_at
before update on public.product_media
for each row
execute function public.set_updated_at();

create or replace function public.prevent_product_media_identity_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.product_id <> old.product_id
     or new.storage_path <> old.storage_path then
    raise exception 'product_media_identity_is_immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists product_media_identity_immutable on public.product_media;
create trigger product_media_identity_immutable
before update on public.product_media
for each row
execute function public.prevent_product_media_identity_change();

create index if not exists product_media_product_id_idx
on public.product_media (product_id, sort_order, created_at);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-media',
  'product-media',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.product_media_product_owner(
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

create or replace function public.product_media_owner(object_name text)
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
      and public.product_media_product_owner(product_media.product_id, object_name)
  );
$$;

create or replace function public.product_media_published(object_name text)
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

create or replace function public.product_media_storage_owner(object_name text)
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

revoke all on function public.product_media_product_owner(uuid, text) from public;
revoke all on function public.product_media_owner(text) from public;
revoke all on function public.product_media_published(text) from public;
revoke all on function public.product_media_storage_owner(text) from public;

create or replace function public.reorder_product_media(
  target_product_id uuid,
  ordered_media_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  incoming_count integer;
begin
  if not exists (
    select 1
    from public.products
    join public.stores on stores.id = products.store_id
    where products.id = target_product_id
      and products.status <> 'deleted'
      and stores.seller_id = (select auth.uid())
  ) then
    raise exception 'product_not_owned';
  end if;

  select count(*)::integer
  into current_count
  from public.product_media
  where product_id = target_product_id;

  select count(distinct incoming.id)::integer
  into incoming_count
  from unnest(coalesce(ordered_media_ids, array[]::uuid[])) as incoming(id)
  join public.product_media media
    on media.id = incoming.id
   and media.product_id = target_product_id;

  if current_count <> coalesce(array_length(ordered_media_ids, 1), 0)
     or current_count <> incoming_count then
    raise exception 'invalid_product_media_order';
  end if;

  set constraints product_media_product_sort_order_key deferred;

  with ordering as (
    select incoming.id, (ordinality - 1)::smallint as sort_order
    from unnest(ordered_media_ids) with ordinality as incoming(id, ordinality)
  )
  update public.product_media media
  set sort_order = ordering.sort_order,
      updated_at = now()
  from ordering
  where media.id = ordering.id
    and media.product_id = target_product_id;
end;
$$;

revoke all on function public.reorder_product_media(uuid, uuid[]) from public;
grant execute on function public.reorder_product_media(uuid, uuid[]) to authenticated;

create or replace function public.get_published_product_media_for_catalog(
  target_product_ids uuid[]
)
returns table (
  id uuid,
  product_id uuid,
  storage_path text,
  mime_type text,
  sort_order smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    media.id,
    media.product_id,
    media.storage_path,
    media.mime_type,
    media.sort_order
  from public.product_media media
  join public.products product on product.id = media.product_id
  where product.status = 'published'
    and media.product_id = any(coalesce(target_product_ids, array[]::uuid[]))
  order by media.product_id, media.sort_order;
$$;

create or replace function public.remove_product_media(
  target_product_id uuid,
  target_media_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  media_count integer;
begin
  if not exists (
    select 1
    from public.products
    join public.stores on stores.id = products.store_id
    where products.id = target_product_id
      and products.status <> 'deleted'
      and stores.seller_id = (select auth.uid())
  ) then
    raise exception 'product_not_owned';
  end if;

  select count(*)::integer
  into media_count
  from public.product_media
  where product_id = target_product_id;

  if not exists (
    select 1
    from public.product_media
    where id = target_media_id
      and product_id = target_product_id
  ) then
    raise exception 'product_media_not_found';
  end if;

  if exists (
    select 1
    from public.products
    where id = target_product_id
      and status = 'published'
  ) and media_count <= 1 then
    raise exception 'published_product_requires_media';
  end if;

  set constraints product_media_product_sort_order_key deferred;

  delete from public.product_media
  where id = target_media_id
    and product_id = target_product_id;

  with ordering as (
    select id, (row_number() over (order by sort_order, created_at) - 1)::smallint as sort_order
    from public.product_media
    where product_id = target_product_id
  )
  update public.product_media media
  set sort_order = ordering.sort_order,
      updated_at = now()
  from ordering
  where media.id = ordering.id;
end;
$$;

create or replace function public.restore_product_media(
  target_product_id uuid,
  target_media_id uuid,
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
  restore_order smallint;
begin
  if not exists (
    select 1
    from public.products
    join public.stores on stores.id = products.store_id
    where products.id = target_product_id
      and products.status <> 'deleted'
      and stores.seller_id = (select auth.uid())
  ) then
    raise exception 'product_not_owned';
  end if;

  if exists (select 1 from public.product_media where id = target_media_id) then
    return;
  end if;

  select count(*)::integer
  into current_count
  from public.product_media
  where product_id = target_product_id;

  if current_count >= 10 then
    raise exception 'product_media_limit_reached';
  end if;

  restore_order := greatest(0, least(target_sort_order, current_count))::smallint;
  set constraints product_media_product_sort_order_key deferred;

  update public.product_media
  set sort_order = sort_order + 1,
      updated_at = now()
  where product_id = target_product_id
    and sort_order >= restore_order;

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
    restore_order
  );
end;
$$;

revoke all on function public.get_published_product_media_for_catalog(uuid[]) from public;
grant execute on function public.get_published_product_media_for_catalog(uuid[]) to anon, authenticated;
revoke all on function public.remove_product_media(uuid, uuid) from public;
grant execute on function public.remove_product_media(uuid, uuid) to authenticated;
revoke all on function public.restore_product_media(uuid, uuid, text, text, bigint, smallint) from public;
grant execute on function public.restore_product_media(uuid, uuid, text, text, bigint, smallint) to authenticated;

alter table public.product_media enable row level security;

drop policy if exists "product_media_owner_select" on public.product_media;
create policy "product_media_owner_select"
on public.product_media
for select
to authenticated
using (public.product_media_owner(storage_path));

drop policy if exists "product_media_published_select" on public.product_media;

drop policy if exists "product_media_owner_insert" on public.product_media;
create policy "product_media_owner_insert"
on public.product_media
for insert
to authenticated
with check (public.product_media_product_owner(product_id, storage_path));

drop policy if exists "product_media_owner_update" on public.product_media;

drop policy if exists "product_media_owner_delete" on public.product_media;
create policy "product_media_owner_delete"
on public.product_media
for delete
to authenticated
using (public.product_media_owner(storage_path));

drop policy if exists "product_media_storage_owner_insert" on storage.objects;
create policy "product_media_storage_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-media'
  and public.product_media_storage_owner(name)
);

drop policy if exists "product_media_storage_owner_update" on storage.objects;
create policy "product_media_storage_owner_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-media' and public.product_media_owner(name))
with check (bucket_id = 'product-media' and public.product_media_owner(name));

drop policy if exists "product_media_storage_owner_delete" on storage.objects;
create policy "product_media_storage_owner_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-media' and public.product_media_storage_owner(name));

drop policy if exists "product_media_storage_read" on storage.objects;
create policy "product_media_storage_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-media'
  and (
    public.product_media_published(name)
    or public.product_media_owner(name)
  )
);
