-- Allow authenticated sellers to reach the stores table through the Data API.
-- Existing RLS policies remain responsible for restricting each seller to their own row.
grant usage on schema public to authenticated;
grant select, insert, update on table public.stores to authenticated;
