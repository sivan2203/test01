-- Story 4.1: complete the append-only public analytics event ledger.
-- Rollback: revoke the three public ingestion RPCs, drop the helper and RPCs,
-- remove the added constraints/indexes/columns, then restore the Story 3.5
-- record_public_cta_click function before rolling back the public beacon.

alter table public.analytics_events
  add column if not exists store_slug text;

update public.analytics_events as events
set store_slug = coalesce(stores.slug, 'unknown')
from public.stores as stores
where stores.id = events.store_id
  and events.store_slug is null;

alter table public.analytics_events
  alter column store_slug set default 'unknown',
  alter column store_slug set not null;

alter table public.analytics_events
  add column if not exists user_agent_type text not null default 'unknown',
  add column if not exists messenger_type text;

update public.analytics_events
set messenger_type = 'telegram'
where event_name = 'cta_click'
  and messenger_type is null;

do $$
begin
  alter table public.analytics_events
    add constraint analytics_events_store_slug_check check (
      store_slug = 'unknown'
      or (
        char_length(store_slug) between 3 and 32
        and store_slug = lower(store_slug)
        and store_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.analytics_events
    add constraint analytics_events_user_agent_type_check check (
      user_agent_type in ('browser', 'crawler', 'unknown')
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.analytics_events
    add constraint analytics_events_messenger_type_check check (
      messenger_type is null or messenger_type = 'telegram'
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.analytics_events
    add constraint analytics_events_excluded_reason_check check (
      excluded_reason is null
      or excluded_reason in (
        'crawler',
        'preview',
        'invalid_context',
        'disabled_contact',
        'rate_limited'
      )
    );
exception
  when duplicate_object then null;
end $$;

create index if not exists analytics_events_store_slug_occurred_at_idx
on public.analytics_events (store_slug, occurred_at desc);

create index if not exists analytics_events_session_occurred_at_idx
on public.analytics_events (session_id, occurred_at desc)
where session_id is not null;

create or replace function public.append_public_analytics_event(
  p_event_name text,
  p_store_slug text,
  p_product_id uuid,
  p_event_source text,
  p_event_session_id uuid,
  p_event_user_agent_type text,
  p_messenger_type text
)
returns table (
  event_id uuid,
  store_id uuid,
  product_id uuid,
  event_name text,
  occurred_at timestamptz,
  deduplicated boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store_id uuid;
  target_product_id uuid := p_product_id;
  event_row_id uuid;
  event_time timestamptz := now();
  normalized_source text := lower(btrim(coalesce(p_event_source, 'unknown')));
  normalized_user_agent_type text := lower(btrim(coalesce(p_event_user_agent_type, 'unknown')));
  exclusion text;
  duplicate_event record;
  duplicate_found boolean := false;
  rate_limit_count bigint;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Analytics ingestion is internal only.';
  end if;

  if p_event_name not in ('store_view', 'product_view', 'cta_click') then
    raise exception using errcode = '22023', message = 'Invalid analytics event.';
  end if;

  if normalized_source !~ '^[a-z0-9][a-z0-9_-]{0,63}$' then
    normalized_source := 'unknown';
  end if;

  if normalized_user_agent_type not in ('browser', 'crawler', 'unknown') then
    normalized_user_agent_type := 'unknown';
  end if;

  if p_event_name = 'store_view' then
    if p_product_id is not null or p_messenger_type is not null then
      raise exception using errcode = '22023', message = 'Invalid store view context.';
    end if;

    select stores.id
    into target_store_id
    from public.stores as stores
    where stores.slug = p_store_slug
      and stores.slug is not null
    limit 1;
  elsif p_event_name = 'product_view' then
    if p_product_id is null or p_messenger_type is not null then
      raise exception using errcode = '22023', message = 'Invalid product view context.';
    end if;

    select stores.id
    into target_store_id
    from public.stores as stores
    join public.products as products on products.store_id = stores.id
    where stores.slug = p_store_slug
      and products.id = p_product_id
      and products.status = 'published'
    limit 1;
  else
    if p_product_id is null or p_messenger_type <> 'telegram' then
      raise exception using errcode = '22023', message = 'Invalid CTA context.';
    end if;

    select stores.id
    into target_store_id
    from public.stores as stores
    join public.products as products on products.store_id = stores.id
    where stores.slug = p_store_slug
      and stores.telegram_username is not null
      and products.id = p_product_id
      and products.status = 'published'
    limit 1;
  end if;

  if target_store_id is null then
    raise exception using errcode = 'P0002', message = 'Public analytics context not found.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_event_name || ':' || target_store_id::text || ':' ||
      coalesce(target_product_id::text, 'store') || ':' ||
      coalesce(p_event_session_id::text, 'anonymous'),
      0
    )
  );

  exclusion := case
    when normalized_user_agent_type = 'crawler' then 'crawler'
    else null
  end;

  if p_event_name in ('store_view', 'product_view')
     and p_event_session_id is not null then
    select events.id, events.occurred_at
    into duplicate_event
    from public.analytics_events as events
    where events.event_name = p_event_name
      and events.store_id = target_store_id
      and events.product_id is not distinct from target_product_id
      and events.session_id = p_event_session_id
      and events.excluded_reason is null
      and events.occurred_at >= event_time - interval '30 seconds'
    order by events.occurred_at desc
    limit 1;
    duplicate_found := found;
  elsif p_event_name = 'cta_click' and p_event_session_id is not null then
    select events.id, events.occurred_at
    into duplicate_event
    from public.analytics_events as events
    where events.event_name = 'cta_click'
      and events.store_id = target_store_id
      and events.product_id = target_product_id
      and events.session_id = p_event_session_id
      and events.excluded_reason is null
      and events.occurred_at >= event_time - interval '3 seconds'
    order by events.occurred_at desc
    limit 1;
    duplicate_found := found;
  end if;

  if duplicate_found then
    return query
    select
      duplicate_event.id,
      target_store_id,
      target_product_id,
      p_event_name,
      duplicate_event.occurred_at,
      true;
    return;
  end if;

  if p_event_name in ('store_view', 'product_view') then
    select count(*)
    into rate_limit_count
    from public.analytics_events as events
    where events.event_name = p_event_name
      and events.store_id = target_store_id
      and events.product_id is not distinct from target_product_id
      and events.excluded_reason is null
      and events.occurred_at >= event_time - interval '1 minute';

    if rate_limit_count >= 1000 then
      raise exception using errcode = 'P0001', message = 'View rate limit exceeded.';
    end if;
  end if;

  if p_event_name = 'cta_click'
     and (
       select count(*)
       from public.analytics_events as events
        where events.event_name = 'cta_click'
          and events.store_id = target_store_id
          and events.product_id = target_product_id
          and events.excluded_reason is null
          and events.occurred_at >= event_time - interval '1 minute'
         and (
           (p_event_session_id is null and events.session_id is null)
           or (p_event_session_id is not null and events.session_id = p_event_session_id)
         )
     ) >= 60 then
    raise exception using errcode = 'P0001', message = 'CTA click rate limit exceeded.';
  end if;

  insert into public.analytics_events (
    store_id,
    store_slug,
    product_id,
    event_name,
    messenger_type,
    source,
    session_id,
    user_agent_type,
    occurred_at,
    excluded_reason
  )
  values (
    target_store_id,
    p_store_slug,
    target_product_id,
    p_event_name,
    case when p_event_name = 'cta_click' then 'telegram' else null end,
    normalized_source,
    p_event_session_id,
    normalized_user_agent_type,
    event_time,
    exclusion
  )
  returning id into event_row_id;

  return query
  select event_row_id, target_store_id, target_product_id, p_event_name, event_time, false;
end;
$$;

revoke all on function public.append_public_analytics_event(text, text, uuid, text, uuid, text, text)
from public;

create or replace function public.record_public_store_view(
  store_slug text,
  event_source text default null,
  event_session_id uuid default null,
  event_user_agent_type text default 'unknown'
)
returns table (
  event_id uuid,
  store_id uuid,
  product_id uuid,
  event_name text,
  occurred_at timestamptz,
  deduplicated boolean
)
language sql
security definer
set search_path = public
as $$
  select * from public.append_public_analytics_event(
    'store_view',
    store_slug,
    null,
    event_source,
    event_session_id,
    event_user_agent_type,
    null
  );
$$;

create or replace function public.record_public_product_view(
  store_slug text,
  target_product_id uuid,
  event_source text default null,
  event_session_id uuid default null,
  event_user_agent_type text default 'unknown'
)
returns table (
  event_id uuid,
  store_id uuid,
  product_id uuid,
  event_name text,
  occurred_at timestamptz,
  deduplicated boolean
)
language sql
security definer
set search_path = public
as $$
  select * from public.append_public_analytics_event(
    'product_view',
    store_slug,
    target_product_id,
    event_source,
    event_session_id,
    event_user_agent_type,
    null
  );
$$;

drop function if exists public.record_public_cta_click(text, uuid, text, uuid);

create function public.record_public_cta_click(
  store_slug text,
  target_product_id uuid,
  event_source text,
  event_session_id uuid,
  event_user_agent_type text
)
returns table (
  event_id uuid,
  store_id uuid,
  product_id uuid,
  event_name text,
  occurred_at timestamptz,
  deduplicated boolean
)
language sql
security definer
set search_path = public
as $$
  select * from public.append_public_analytics_event(
    'cta_click',
    store_slug,
    target_product_id,
    event_source,
    event_session_id,
    event_user_agent_type,
    'telegram'
  );
$$;

create function public.record_public_cta_click(
  store_slug text,
  target_product_id uuid,
  event_source text,
  event_session_id uuid
)
returns table (
  event_id uuid,
  store_id uuid,
  product_id uuid,
  event_name text,
  occurred_at timestamptz,
  deduplicated boolean
)
language sql
security definer
set search_path = public
as $$
  select * from public.record_public_cta_click(
    store_slug,
    target_product_id,
    event_source,
    event_session_id,
    'unknown'
  );
$$;

revoke all on function public.record_public_store_view(text, text, uuid, text) from public;
revoke all on function public.record_public_product_view(text, uuid, text, uuid, text) from public;
revoke all on function public.record_public_cta_click(text, uuid, text, uuid, text) from public;
revoke all on function public.record_public_cta_click(text, uuid, text, uuid) from public;

grant execute on function public.record_public_store_view(text, text, uuid, text) to service_role;
grant execute on function public.record_public_product_view(text, uuid, text, uuid, text) to service_role;
grant execute on function public.record_public_cta_click(text, uuid, text, uuid, text) to service_role;
grant execute on function public.record_public_cta_click(text, uuid, text, uuid) to service_role;

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from anon, authenticated;
