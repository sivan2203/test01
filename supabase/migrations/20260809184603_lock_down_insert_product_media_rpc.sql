-- The platform grants new public-schema functions to `anon` by default.
-- Product-media writes are an authenticated seller operation only.
revoke execute on function public.insert_product_media(uuid, uuid, text, text, bigint, smallint) from anon;
grant execute on function public.insert_product_media(uuid, uuid, text, text, bigint, smallint) to authenticated;
