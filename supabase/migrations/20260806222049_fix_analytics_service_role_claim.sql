-- PostgREST exposes current JWT claims as request.jwt.claims JSON. Keep the
-- legacy scalar fallback for compatibility with older Supabase deployments.
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
  request_claims jsonb;
  request_role text;
  exclusion text;
  duplicate_event record;
  duplicate_found boolean := false;
  rate_limit_count bigint;
begin
  begin
    request_claims :=
      (nullif(current_setting('request.jwt.claims', true), ''))::jsonb;
  exception
    when invalid_text_representation then
      request_claims := null;
  end;

  request_role := coalesce(
    request_claims ->> 'role',
    nullif(current_setting('request.jwt.claim.role', true), ''),
    ''
  );

  if request_role <> 'service_role' then
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

comment on function public.append_public_analytics_event(text, text, uuid, text, uuid, text, text)
is 'Internal service-role analytics ingestion with legacy and JSON JWT claim compatibility.';
