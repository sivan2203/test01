-- Story 2.3: make product lifecycle transitions explicit and publication-safe.
-- Rollback: drop the functions/triggers/policies introduced here and restore the
-- previous products_update_own policy from 20260801183000_create_products.sql.

create or replace function public.enforce_product_lifecycle_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if coalesce(current_setting('app.product_lifecycle_transition', true), '') <> 'on' then
    raise exception 'invalid_product_transition';
  end if;

  if old.status = 'deleted' then
    raise exception 'invalid_product_transition';
  end if;

  if new.status = 'deleted'
     or (old.status = 'draft' and new.status = 'published')
     or (old.status = 'hidden' and new.status = 'published')
     or (old.status = 'published' and new.status = 'hidden') then
    return new;
  end if;

  raise exception 'invalid_product_transition';
end;
$$;

drop trigger if exists products_lifecycle_transition_guard on public.products;
create trigger products_lifecycle_transition_guard
before update of status on public.products
for each row
execute function public.enforce_product_lifecycle_transition();

create or replace function public.enforce_published_product_contract()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  media_count integer;
  min_sort_order smallint;
  max_sort_order smallint;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if char_length(btrim(new.title)) not between 1 and 120
     or new.price_mode not in ('fixed', 'request')
     or new.availability_status not in ('in_stock', 'out_of_stock')
     or (new.price_mode = 'request' and new.price_amount is not null)
     or (new.price_mode = 'fixed' and (new.price_amount is null or new.price_amount <= 0)) then
    raise exception 'invalid_product_publication';
  end if;

  select count(*)::integer, min(sort_order), max(sort_order)
  into media_count, min_sort_order, max_sort_order
  from public.product_media
  where product_id = new.id;

  if media_count < 1
     or media_count > 10
     or min_sort_order <> 0
     or max_sort_order <> (media_count - 1)::smallint then
    raise exception 'published_product_requires_media';
  end if;

  return new;
end;
$$;

drop trigger if exists products_publication_contract_guard on public.products;
create trigger products_publication_contract_guard
before insert or update on public.products
for each row
execute function public.enforce_published_product_contract();

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products
for update
to authenticated
using (
  products.status <> 'deleted'
  and exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.seller_id = (select auth.uid())
  )
)
with check (
  products.status in ('draft', 'published', 'hidden', 'deleted')
  and exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.seller_id = (select auth.uid())
  )
);

create or replace function public.transition_product_lifecycle(
  target_product_id uuid,
  target_status text
)
returns table (
  product_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  if target_status not in ('published', 'hidden', 'deleted') then
    raise exception 'invalid_product_transition';
  end if;

  select products.status
  into current_status
  from public.products
  join public.stores on stores.id = products.store_id
  where products.id = target_product_id
    and products.status <> 'deleted'
    and stores.seller_id = (select auth.uid())
  for update;

  if current_status is null then
    raise exception 'product_not_found';
  end if;

  if target_status = 'published'
     and current_status not in ('draft', 'hidden') then
    raise exception 'invalid_product_transition';
  end if;

  if target_status = 'hidden' and current_status <> 'published' then
    raise exception 'invalid_product_transition';
  end if;

  perform set_config('app.product_lifecycle_transition', 'on', true);
  update public.products
  set status = target_status,
      updated_at = now()
  where id = target_product_id;

  return query
  select target_product_id, target_status;
end;
$$;

revoke all on function public.transition_product_lifecycle(uuid, text) from public;
grant execute on function public.transition_product_lifecycle(uuid, text) to authenticated;

create or replace function public.get_public_product_for_store(
  store_slug text,
  target_product_id uuid
)
returns table (
  id uuid,
  title text,
  description text,
  price_mode text,
  price_amount numeric,
  availability_status text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    products.id,
    products.title,
    products.description,
    products.price_mode,
    products.price_amount,
    products.availability_status,
    products.status
  from public.products
  join public.stores on stores.id = products.store_id
  where stores.slug = store_slug
    and products.id = target_product_id
    and products.status = 'published';
$$;

revoke all on function public.get_public_product_for_store(text, uuid) from public;
grant execute on function public.get_public_product_for_store(text, uuid) to anon, authenticated;

create or replace function public.product_media_storage_delete_owner(object_name text)
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

revoke all on function public.product_media_storage_delete_owner(text) from public;

drop policy if exists "product_media_storage_owner_delete" on storage.objects;
create policy "product_media_storage_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-media'
  and public.product_media_storage_delete_owner(name)
);
