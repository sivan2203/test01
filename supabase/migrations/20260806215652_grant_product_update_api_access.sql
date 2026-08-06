-- Seller edits are limited to user-editable fields; lifecycle and identity
-- columns remain reachable only through their dedicated guarded workflows.
grant update (
  title,
  description,
  price_mode,
  price_amount,
  availability_status
) on table public.products to authenticated;
