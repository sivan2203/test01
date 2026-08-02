-- Allows the Data API read path for signed-in sellers; existing RLS policies
-- continue to restrict each seller to products in their own store.
grant select on table public.products to authenticated;
