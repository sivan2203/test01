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
and seller-facing summaries derive from the raw ledger.

Story 4.3 adds the seller home summary through `get_seller_home_analytics_summary()`.
The read is authenticated and seller-scoped inside a `security definer` RPC because
the raw ledger remains unavailable to ordinary authenticated table reads. The RPC
returns only today's aggregate counts, the store-local UTC window, and top source
ranked by eligible public `store_view` count. It filters `excluded_reason is null`,
uses the store's IANA timezone with `Europe/Moscow` fallback, and never returns raw
events, referrers, campaign metadata, or buyer identity. The seller page uses the
SSR user client and must not import the service-role client.
