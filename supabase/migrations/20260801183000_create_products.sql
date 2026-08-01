create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  description text,
  price_mode text not null default 'request',
  price_amount numeric(12, 2),
  availability_status text not null default 'in_stock',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_title_length_check check (
    char_length(btrim(title)) between 1 and 120
  ),
  constraint products_description_length_check check (
    description is null or char_length(description) <= 1000
  ),
  constraint products_price_mode_check check (
    price_mode in ('fixed', 'request')
  ),
  constraint products_price_amount_check check (
    (price_mode = 'request' and price_amount is null)
    or (price_mode = 'fixed' and price_amount is not null and price_amount > 0)
  ),
  constraint products_availability_status_check check (
    availability_status in ('in_stock', 'out_of_stock')
  ),
  constraint products_status_check check (
    status in ('draft', 'published', 'hidden', 'deleted')
  )
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create index if not exists products_store_id_idx
on public.products (store_id);

create index if not exists products_store_status_idx
on public.products (store_id, status);

alter table public.products enable row level security;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products
for insert
to authenticated
with check (
  products.status = 'draft'
  and exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products
for update
to authenticated
using (
  products.status = 'draft'
  and exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.seller_id = (select auth.uid())
  )
)
with check (
  products.status = 'draft'
  and exists (
    select 1
    from public.stores
    where stores.id = products.store_id
      and stores.seller_id = (select auth.uid())
  )
);

create or replace function public.get_public_catalog_items_for_store(store_slug text)
returns table (
  id uuid,
  title text,
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
    products.price_mode,
    products.price_amount,
    products.availability_status,
    products.status
  from public.products
  join public.stores on stores.id = products.store_id
  where stores.slug = store_slug
    and products.status = 'published'
  order by products.updated_at desc, products.created_at desc;
$$;

revoke all on function public.get_public_catalog_items_for_store(text) from public;
grant execute on function public.get_public_catalog_items_for_store(text) to anon, authenticated;
