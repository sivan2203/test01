-- Seller reads remain RLS-scoped. Mutations are intentionally exposed only
-- through invariant-preserving RPCs added by the hardening migration.
grant select on table public.product_media to authenticated;
