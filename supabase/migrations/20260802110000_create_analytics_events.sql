-- Story 3.5: append-only CTA click event ledger foundation.
-- Rollback: revoke the function, drop the indexes/table, then remove the CTA
-- route before deploying a rollback so public clicks are not written to a
-- missing table.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  event_name text not null,
  source text not null default 'unknown',
  session_id uuid,
  occurred_at timestamptz not null default now(),
  excluded_reason text,
  constraint analytics_events_event_name_check check (
    event_name in ('store_view', 'product_view', 'cta_click')
  ),
  constraint analytics_events_source_check check (
    source = lower(source)
    and char_length(source) between 1 and 64
    and source ~ '^[a-z0-9][a-z0-9_-]{0,63}$'
  )
);

create index if not exists analytics_events_store_occurred_at_idx
on public.analytics_events (store_id, occurred_at desc);

create index if not exists analytics_events_product_occurred_at_idx
on public.analytics_events (product_id, occurred_at desc);

create index if not exists analytics_events_name_store_idx
on public.analytics_events (event_name, store_id, occurred_at desc);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;

drop function if exists public.record_public_cta_click(text, uuid, text, uuid);

create function public.record_public_cta_click(
  store_slug text,
  target_product_id uuid,
  event_source text default null,
  event_session_id uuid default null
)
returns table (
  event_id uuid,
  store_id uuid,
  product_id uuid,
  occurred_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store_id uuid;
  event_row_id uuid;
  event_time timestamptz := now();
  normalized_source text := lower(btrim(coalesce(event_source, 'unknown')));
begin
  if normalized_source !~ '^[a-z0-9][a-z0-9_-]{0,63}$' then
    normalized_source := 'unknown';
  end if;

  select stores.id
    into target_store_id
  from public.stores
  join public.products on products.store_id = stores.id
  where stores.slug = record_public_cta_click.store_slug
    and stores.telegram_username is not null
    and products.id = target_product_id
    and products.status = 'published'
  limit 1;

  if target_store_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'Public product or Telegram contact not found.';
  end if;

  -- Bound anonymous event amplification while keeping the endpoint public.
  -- Session-backed callers are limited independently; callers without a
  -- session share a conservative product-level bucket.
  if (
    select count(*)
    from public.analytics_events
    where event_name = 'cta_click'
      and store_id = target_store_id
      and product_id = target_product_id
      and occurred_at >= event_time - interval '1 minute'
      and (
        (event_session_id is null and session_id is null)
        or (event_session_id is not null and session_id = event_session_id)
      )
  ) >= 60 then
    raise exception using
      errcode = 'P0001',
      message = 'CTA click rate limit exceeded.';
  end if;

  insert into public.analytics_events (
    store_id,
    product_id,
    event_name,
    source,
    session_id,
    occurred_at,
    excluded_reason
  )
  values (
    target_store_id,
    target_product_id,
    'cta_click',
    normalized_source,
    event_session_id,
    event_time,
    null
  )
  returning id into event_row_id;

  return query
  select event_row_id, target_store_id, target_product_id, event_time;
end;
$$;

revoke all on function public.record_public_cta_click(text, uuid, text, uuid)
from public;
grant execute on function public.record_public_cta_click(text, uuid, text, uuid)
to anon, authenticated;
