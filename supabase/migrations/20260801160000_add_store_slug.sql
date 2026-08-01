alter table public.stores
add column if not exists slug text;

do $$
begin
  alter table public.stores
  add constraint stores_slug_format_check check (
    slug is null
    or (
      char_length(slug) between 3 and 32
      and slug = lower(slug)
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.stores
  add constraint stores_slug_reserved_check check (
    slug is null
    or slug not in ('admin', 'api', 'login', 'signup', 'support', 'help', 'seller')
  );
exception
  when duplicate_object then null;
end $$;

create unique index if not exists stores_slug_unique_idx
on public.stores (slug)
where slug is not null;

create or replace function public.is_store_slug_available(candidate_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.stores
    where slug = candidate_slug
      and seller_id <> (select auth.uid())
  );
$$;

revoke all on function public.is_store_slug_available(text) from public;
grant execute on function public.is_store_slug_available(text) to authenticated;

create or replace function public.get_public_store_by_slug(store_slug text)
returns table (
  slug text,
  name text,
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
    stores.description,
    stores.additional_info,
    stores.timezone
  from public.stores
  where stores.slug = store_slug
  limit 1;
$$;

revoke all on function public.get_public_store_by_slug(text) from public;
grant execute on function public.get_public_store_by_slug(text) to anon, authenticated;
