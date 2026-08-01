# Deferred Work

## Deferred from: code review of 2-3-edit-product-and-manage-publication-state (2026-08-01)

- Direct deletion of the last `product_media` row for a published product remains possible through the pre-existing media-owner RLS policy; the current story did not introduce that policy or its bypass.

## Deferred from: code review of 2-2-manage-product-photos (2026-08-01)

- Publication-readiness guard and media editing for already published products are deferred to Story 2.3 because publication transitions входят в scope Story 2.3.

## Deferred from: code review of 2-4-seller-product-list-and-status-filters (2026-08-01)

- Bounded pagination for the seller product list is deferred because the unbounded query pre-dates Story 2.4 and pagination requires a separate UX/API decision.
- Runtime Supabase integration tests for cross-seller product and private media isolation are deferred because the repository has no integration harness or fixtures; source-level smoke guards remain in place.
