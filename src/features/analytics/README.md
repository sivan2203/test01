# Analytics Feature

Owns the append-only observed-event ledger, public ingestion boundary, source/session
normalization, exclusions, and later seller-facing summaries.

Story 4.1 records only `store_view`, `product_view`, and the existing `cta_click`
intent event. Public views use the server route at `/api/analytics`; the route owns
the opaque `buyer_session_id` cookie and the server-derived crawler classification.
The Supabase RPCs re-query the public store/product boundary and are the only ledger
write path. The RPCs are internal-only and invoked by the isolated server-side
service-role writer; raw rows are canonical; source attribution persistence and summaries
belong to later Epic 4 stories.
