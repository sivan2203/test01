-- Allows the products INSERT policy to validate import provenance.
-- The existing import_batches_select_own RLS policy still limits rows to the seller's own store.
grant select on table public.import_batches to authenticated;
