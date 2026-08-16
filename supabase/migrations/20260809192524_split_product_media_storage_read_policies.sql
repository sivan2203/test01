-- Keep published storefront media readable by visitors without evaluating
-- seller-only helper functions for the anonymous role.
drop policy if exists "product_media_storage_read" on storage.objects;

create policy "product_media_storage_published_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-media'
  and private.product_media_published(name)
);

create policy "product_media_storage_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-media'
  and private.product_media_owner(name)
);
