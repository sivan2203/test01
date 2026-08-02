-- Story 5.1: seller-owned Excel/CSV import provenance for product drafts.
-- Rollback: drop import_product_drafts, the provenance trigger, policies, indexes,
-- tables, and provenance columns; then restore products_insert_own.
-- Raw uploaded files are intentionally not stored in this schema.

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  source_filename text not null,
  source_format text not null,
  column_mapping jsonb not null default '{}'::jsonb,
  source_headers jsonb not null default '[]'::jsonb,
  idempotency_key uuid not null,
  total_rows integer not null default 0,
  created_rows integer not null default 0,
  rejected_rows integer not null default 0,
  created_at timestamptz not null default now(),
  constraint import_batches_source_filename_length_check check (
    char_length(btrim(source_filename)) between 1 and 160
  ),
  constraint import_batches_source_format_check check (
    source_format in ('csv', 'xls', 'xlsx')
  ),
  constraint import_batches_counts_check check (
    total_rows between 0 and 100
    and created_rows between 0 and total_rows
    and rejected_rows between 0 and total_rows
  )
);

create unique index if not exists import_batches_store_idempotency_key_idx
on public.import_batches (store_id, idempotency_key);

create index if not exists import_batches_store_created_at_idx
on public.import_batches (store_id, created_at desc);

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null,
  outcome text not null,
  field_errors jsonb not null default '{}'::jsonb,
  product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint import_rows_row_number_check check (row_number between 2 and 10001),
  constraint import_rows_outcome_check check (
    outcome in ('invalid', 'created', 'failed')
  ),
  constraint import_rows_batch_row_key unique (import_batch_id, row_number)
);

create index if not exists import_rows_batch_id_idx
on public.import_rows (import_batch_id, row_number);

alter table public.products
  add column if not exists import_batch_id uuid references public.import_batches(id) on delete set null,
  add column if not exists import_row_id uuid references public.import_rows(id) on delete set null;

create index if not exists products_import_batch_id_idx
on public.products (import_batch_id)
where import_batch_id is not null;

create unique index if not exists products_import_row_id_key
on public.products (import_row_id)
where import_row_id is not null;

create or replace function public.validate_product_import_provenance()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  row_batch_id uuid;
  row_store_id uuid;
begin
  if new.import_row_id is null and new.import_batch_id is null then
    return new;
  end if;

  if new.import_row_id is null or new.import_batch_id is null then
    raise exception 'invalid_import_provenance';
  end if;

  select import_rows.import_batch_id, import_batches.store_id
  into row_batch_id, row_store_id
  from public.import_rows
  join public.import_batches on import_batches.id = import_rows.import_batch_id
  where import_rows.id = new.import_row_id;

  if row_batch_id is null
     or row_batch_id <> new.import_batch_id
     or row_store_id <> new.store_id then
    raise exception 'invalid_import_provenance';
  end if;

  return new;
end;
$$;

drop trigger if exists products_import_provenance_guard on public.products;
create trigger products_import_provenance_guard
before insert or update of import_batch_id, import_row_id on public.products
for each row
execute function public.validate_product_import_provenance();

create or replace function public.validate_import_row_product_link()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_id is null then
    if new.outcome = 'created' then
      raise exception 'created_import_row_requires_product';
    end if;
    return new;
  end if;

  if new.outcome <> 'created' or not exists (
    select 1
    from public.products
    where products.id = new.product_id
      and products.import_batch_id = new.import_batch_id
      and products.import_row_id = new.id
  ) then
    raise exception 'invalid_import_row_product_link';
  end if;

  return new;
end;
$$;

drop trigger if exists import_rows_product_link_guard on public.import_rows;
create trigger import_rows_product_link_guard
before insert or update of outcome, product_id, import_batch_id on public.import_rows
for each row
execute function public.validate_import_row_product_link();

alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;

drop policy if exists "import_batches_select_own" on public.import_batches;
create policy "import_batches_select_own"
on public.import_batches
for select
to authenticated
using (
  exists (
    select 1
    from public.stores
    where stores.id = import_batches.store_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "import_batches_insert_own" on public.import_batches;
create policy "import_batches_insert_own"
on public.import_batches
for insert
to authenticated
with check (
  exists (
    select 1
    from public.stores
    where stores.id = import_batches.store_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "import_batches_update_own" on public.import_batches;
create policy "import_batches_update_own"
on public.import_batches
for update
to authenticated
using (
  exists (
    select 1
    from public.stores
    where stores.id = import_batches.store_id
      and stores.seller_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.stores
    where stores.id = import_batches.store_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "import_rows_select_own" on public.import_rows;
create policy "import_rows_select_own"
on public.import_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.import_batches
    join public.stores on stores.id = import_batches.store_id
    where import_batches.id = import_rows.import_batch_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "import_rows_insert_own" on public.import_rows;
create policy "import_rows_insert_own"
on public.import_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.import_batches
    join public.stores on stores.id = import_batches.store_id
    where import_batches.id = import_rows.import_batch_id
      and stores.seller_id = (select auth.uid())
  )
);

drop policy if exists "import_rows_update_own" on public.import_rows;
create policy "import_rows_update_own"
on public.import_rows
for update
to authenticated
using (
  exists (
    select 1
    from public.import_batches
    join public.stores on stores.id = import_batches.store_id
    where import_batches.id = import_rows.import_batch_id
      and stores.seller_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.import_batches
    join public.stores on stores.id = import_batches.store_id
    where import_batches.id = import_rows.import_batch_id
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
  and (
    products.import_batch_id is null
    or exists (
      select 1
      from public.import_batches
      where import_batches.id = products.import_batch_id
        and import_batches.store_id = products.store_id
    )
  )
);

create or replace function public.import_product_drafts(
  p_store_id uuid,
  p_source_filename text,
  p_source_format text,
  p_column_mapping jsonb,
  p_source_headers jsonb,
  p_idempotency_key uuid,
  p_rows jsonb
)
returns table (
  batch_id uuid,
  row_number integer,
  outcome text,
  field_errors jsonb,
  product_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_batch_id uuid;
  source_row jsonb;
  target_row_id uuid;
  target_product_id uuid;
  target_row_number integer;
  target_status text;
  target_values jsonb;
  target_errors jsonb;
  created_count integer := 0;
  rejected_count integer := 0;
begin
  if not exists (
    select 1 from public.stores
    where stores.id = p_store_id and stores.seller_id = (select auth.uid())
  ) then
    raise exception 'import_store_not_found';
  end if;

  if jsonb_typeof(p_rows) <> 'array'
     or jsonb_array_length(p_rows) not between 1 and 100 then
    raise exception 'invalid_import_rows';
  end if;

  insert into public.import_batches (
    store_id, source_filename, source_format, column_mapping, source_headers,
    idempotency_key, total_rows
  ) values (
    p_store_id, p_source_filename, p_source_format, p_column_mapping,
    p_source_headers, p_idempotency_key, jsonb_array_length(p_rows)
  )
  on conflict (store_id, idempotency_key) do nothing
  returning id into target_batch_id;

  if target_batch_id is null then
    select id into target_batch_id
    from public.import_batches
    where store_id = p_store_id and idempotency_key = p_idempotency_key;

    return query
    select import_rows.import_batch_id, import_rows.row_number, import_rows.outcome,
      import_rows.field_errors, import_rows.product_id
    from public.import_rows
    where import_rows.import_batch_id = target_batch_id
    order by import_rows.row_number;
    return;
  end if;

  for source_row in select value from jsonb_array_elements(p_rows)
  loop
    target_row_number := (source_row ->> 'rowNumber')::integer;
    target_status := source_row ->> 'status';
    target_values := source_row -> 'values';
    target_errors := coalesce(source_row -> 'fieldErrors', '{}'::jsonb);

    if target_row_number not between 2 and 10001
       or target_status not in ('valid', 'invalid')
       or jsonb_typeof(target_errors) <> 'object' then
      raise exception 'invalid_import_row';
    end if;

    insert into public.import_rows (import_batch_id, row_number, outcome, field_errors)
    values (
      target_batch_id,
      target_row_number,
      case when target_status = 'invalid' then 'invalid' else 'failed' end,
      target_errors
    )
    returning id into target_row_id;

    if target_status = 'invalid' then
      rejected_count := rejected_count + 1;
      continue;
    end if;

    if jsonb_typeof(target_values) <> 'object'
       or char_length(btrim(coalesce(target_values ->> 'title', ''))) not between 1 and 120
       or coalesce(target_values ->> 'priceMode', '') not in ('fixed', 'request')
       or coalesce(target_values ->> 'availabilityStatus', '') not in ('in_stock', 'out_of_stock')
       or char_length(coalesce(target_values ->> 'description', '')) > 1000
       or (
         target_values ->> 'priceMode' = 'fixed'
         and (
           coalesce(target_values ->> 'priceAmount', '') !~ '^\d+(\.\d{1,2})?$'
           or (target_values ->> 'priceAmount')::numeric <= 0
           or (target_values ->> 'priceAmount')::numeric > 999999999.99
         )
       ) then
      raise exception 'invalid_import_product';
    end if;

    insert into public.products (
      store_id, title, description, price_mode, price_amount, availability_status,
      status, import_batch_id, import_row_id
    ) values (
      p_store_id,
      btrim(target_values ->> 'title'),
      nullif(btrim(coalesce(target_values ->> 'description', '')), ''),
      target_values ->> 'priceMode',
      case when target_values ->> 'priceMode' = 'fixed'
        then (target_values ->> 'priceAmount')::numeric else null end,
      target_values ->> 'availabilityStatus',
      'draft', target_batch_id, target_row_id
    )
    returning id into target_product_id;

    update public.import_rows
    set outcome = 'created', product_id = target_product_id
    where id = target_row_id;
    created_count := created_count + 1;
  end loop;

  update public.import_batches
  set created_rows = created_count, rejected_rows = rejected_count
  where id = target_batch_id;

  return query
  select import_rows.import_batch_id, import_rows.row_number, import_rows.outcome,
    import_rows.field_errors, import_rows.product_id
  from public.import_rows
  where import_rows.import_batch_id = target_batch_id
  order by import_rows.row_number;
end;
$$;

revoke all on function public.import_product_drafts(uuid, text, text, jsonb, jsonb, uuid, jsonb) from public;
grant execute on function public.import_product_drafts(uuid, text, text, jsonb, jsonb, uuid, jsonb) to authenticated;
