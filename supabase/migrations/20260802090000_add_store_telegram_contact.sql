-- Story 3.4: Telegram is the only enabled MVP contact adapter.
-- Rollback: drop the replacement public RPC, recreate the previous
-- get_public_store_by_slug(text) return shape, then drop the check and column
-- after verifying no dependent Story 3.5 handoff code remains.

alter table public.stores
add column if not exists telegram_username text;

do $$
begin
  alter table public.stores
  add constraint stores_telegram_username_format_check check (
    telegram_username is null
    or (
      char_length(telegram_username) between 5 and 32
      and telegram_username ~ '^[A-Za-z][A-Za-z0-9_]{4,31}$'
    )
  );
exception
  when duplicate_object then null;
end $$;

drop function if exists public.get_public_store_by_slug(text);

create function public.get_public_store_by_slug(store_slug text)
returns table (
  slug text,
  name text,
  avatar_path text,
  telegram_username text,
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
    stores.telegram_username,
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
