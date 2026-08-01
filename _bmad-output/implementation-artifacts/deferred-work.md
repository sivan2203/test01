# Deferred Work

## Deferred from: code review of 2-3-edit-product-and-manage-publication-state (2026-08-01)

- Direct deletion of the last `product_media` row for a published product remains possible through the pre-existing media-owner RLS policy; the current story did not introduce that policy or its bypass.

## Deferred from: code review of 2-2-manage-product-photos (2026-08-01)

- Publication-readiness guard and media editing for already published products are deferred to Story 2.3 because publication transitions входят в scope Story 2.3.

## Deferred from: code review of 2-4-seller-product-list-and-status-filters (2026-08-01)

- Bounded pagination for the seller product list is deferred because the unbounded query pre-dates Story 2.4 and pagination requires a separate UX/API decision.
- Runtime Supabase integration tests for cross-seller product and private media isolation are deferred because the repository has no integration harness or fixtures; source-level smoke guards remain in place.

## Deferred from: code review of 3-1-public-storefront-by-slug (2026-08-01)

- Atomic store/catalog snapshot across slug reassignment is deferred because the separate slug-based queries pre-date Story 3.1 and fixing it requires a shared snapshot or store-ID query contract.
- Revalidation against product visibility changes during the request is deferred because the visibility RPC/query boundary pre-dates Story 3.1 and requires an atomic data-access change.
- Invalid/non-array catalog RPC data being treated as an empty catalog is deferred because that behavior pre-dates the current change and requires a broader public-catalog result-contract decision.
- Runtime Supabase/RLS integration coverage for RPC, Storage policy, and partial media failures is deferred because the repository has no integration harness or fixtures.
- Rollback documentation for the public avatar migration is deferred as an operational documentation task.
