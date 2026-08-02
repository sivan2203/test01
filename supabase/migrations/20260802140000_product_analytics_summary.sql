-- Story 4.4: seller-scoped product analytics summary read contract.
-- Rollback: revoke execute on the function and drop it. No ledger rows are
-- changed by this read-only function.

create or replace function public.get_seller_product_analytics_summary(
  target_period text default 'today'
)
returns table (
  period text,
  timezone text,
  period_start_utc timestamptz,
  period_end_utc timestamptz,
  product_id uuid,
  title text,
  status text,
  product_views bigint,
  cta_clicks bigint
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
    date_trunc('day', now() at time zone safe_store.timezone) as local_today
  from safe_store
),
period_window as (
  select
    local_calendar.id,
    local_calendar.timezone,
    case
      when target_period = 'last_7_days' then local_calendar.local_today - interval '6 days'
      else local_calendar.local_today
    end as local_start,
    local_calendar.local_today + interval '1 day' as local_end
  from local_calendar
  where target_period in ('today', 'last_7_days')
),
store_window as (
  select
    period_window.id,
    period_window.timezone,
    period_window.local_start at time zone period_window.timezone as period_start_utc,
    period_window.local_end at time zone period_window.timezone as period_end_utc
  from period_window
)
select
  target_period as period,
  store_window.timezone,
  store_window.period_start_utc,
  store_window.period_end_utc,
  products.id as product_id,
  products.title,
  products.status,
  count(analytics_events.id) filter (where analytics_events.event_name = 'product_view') as product_views,
  count(analytics_events.id) filter (where analytics_events.event_name = 'cta_click') as cta_clicks
from store_window
join public.products as products
  on products.store_id = store_window.id
  and products.status <> 'deleted'
left join public.analytics_events as analytics_events
  on analytics_events.store_id = store_window.id
  and analytics_events.product_id = products.id
  and analytics_events.event_name in ('product_view', 'cta_click')
  and analytics_events.excluded_reason is null
  and analytics_events.occurred_at >= store_window.period_start_utc
  and analytics_events.occurred_at < store_window.period_end_utc
group by
  store_window.id,
  store_window.timezone,
  store_window.period_start_utc,
  store_window.period_end_utc,
  products.id,
  products.title,
  products.status,
  products.updated_at,
  products.created_at
order by products.updated_at desc, products.created_at desc, products.id;
$function$;

revoke all on function public.get_seller_product_analytics_summary(text) from public, anon, authenticated;
grant execute on function public.get_seller_product_analytics_summary(text) to authenticated;
