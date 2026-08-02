-- This enables draft creation through the Data API; the existing RLS policy
-- still limits inserts to draft products belonging to the seller's own store.
grant insert on table public.products to authenticated;
