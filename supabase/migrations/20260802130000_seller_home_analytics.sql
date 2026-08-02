-- Story 4.3: seller home analytics summary read contract.
-- Rollback: revoke execute on the function and drop it. No ledger rows are
-- changed by this read-only function.

create or replace function public.get_seller_home_analytics_summary()
returns table (
  timezone text,
  day_start_utc timestamptz,
  day_end_utc timestamptz,
  store_views bigint,
  product_views bigint,
  cta_clicks bigint,
  top_source text
)
language sql
stable
security definer
set search_path = ''
as $function$
with safe_store as (
  select
    stores.id,
    coalesce(
      (
        select timezone_names.name
        from pg_catalog.pg_timezone_names as timezone_names
        where timezone_names.name = stores.timezone
        limit 1
      ),
      'Europe/Moscow'
    ) as timezone
  from public.stores as stores
  where stores.seller_id = auth.uid()
),
local_calendar as (
  select
    safe_store.id,
    safe_store.timezone,
    date_trunc('day', now() at time zone safe_store.timezone) as local_day_start
  from safe_store
),
store_window as (
  select
    local_calendar.id,
    local_calendar.timezone,
    local_calendar.local_day_start at time zone local_calendar.timezone as day_start_utc,
    (local_calendar.local_day_start + interval '1 day') at time zone local_calendar.timezone as day_end_utc
  from local_calendar
)
select
  store_window.timezone,
  store_window.day_start_utc,
  store_window.day_end_utc,
  count(*) filter (where analytics_events.event_name = 'store_view') as store_views,
  count(*) filter (where analytics_events.event_name = 'product_view') as product_views,
  count(*) filter (where analytics_events.event_name = 'cta_click') as cta_clicks,
  (
    select source_events.source
    from public.analytics_events as source_events
    where source_events.store_id = store_window.id
      and source_events.event_name = 'store_view'
      and source_events.excluded_reason is null
      and source_events.occurred_at >= store_window.day_start_utc
      and source_events.occurred_at < store_window.day_end_utc
    group by source_events.source
    order by count(*) desc, source_events.source asc
    limit 1
  ) as top_source
from store_window
left join public.analytics_events
  on analytics_events.store_id = store_window.id
  and analytics_events.excluded_reason is null
  and analytics_events.occurred_at >= store_window.day_start_utc
  and analytics_events.occurred_at < store_window.day_end_utc
group by
  store_window.id,
  store_window.timezone,
  store_window.day_start_utc,
  store_window.day_end_utc;
$function$;

revoke all on function public.get_seller_home_analytics_summary() from public, anon, authenticated;
grant execute on function public.get_seller_home_analytics_summary() to authenticated;
