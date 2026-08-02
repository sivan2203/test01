# Analytics Feature

Owns the append-only observed-event ledger, public ingestion boundary, source/session
normalization, exclusions, and later seller-facing summaries.

Story 4.1 records only `store_view`, `product_view`, and the existing `cta_click`
intent event. Public views use the server route at `/api/analytics`; the route owns
the opaque `buyer_session_id` cookie and the server-derived crawler classification.
Story 4.2 resolves attribution in `source-attribution.ts` using explicit `source`,
then `utm_source`, the server-owned `buyer_source` hint, and finally an allowlisted
external referrer. Only a lowercase stable source key is persisted; raw referrers,
query strings, campaign metadata, and buyer identity are never persisted.

The same server helper reads/writes `buyer_source` from both analytics and Telegram
handoff Route Handlers. The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, secure in
production, and contains no identity. The Supabase RPCs re-query the public
store/product boundary and are the only ledger write path. The RPCs are internal-only
and invoked by the isolated server-side service-role writer; raw rows remain canonical
and seller-facing summaries belong to later Epic 4 stories.
