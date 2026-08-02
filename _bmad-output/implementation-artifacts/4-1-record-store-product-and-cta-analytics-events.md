---
baseline_commit: 8977888cc442495957584e63747067496c1676e6
---

# Story 4.1: Record Store, Product, and CTA Analytics Events

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,
I want public storefront views, product views, and contact CTA clicks to be recorded,
so that I can later understand buyer interest in my store and products.

## Acceptance Criteria

1. **Storefront view event (FR18, NFR4, NFR5, AD-2, AD-7, AD-14)**
   - Given a buyer renders an eligible public storefront
   - When the storefront view is ingested
   - Then one canonical `store_view` event is appended to the analytics ledger
   - And it contains `store_id`, `store_slug`, `event_name`, UTC `occurred_at`, `user_agent_type`, and an anonymous/session identifier when available
   - And source metadata is preserved when already available, otherwise normalized to `unknown`
   - And a valid store slug may be counted even when the store has zero published products and renders the existing empty state; missing/old slugs are not counted.

2. **Product view event (FR18, NFR4, NFR5, AD-2, AD-5, AD-7, AD-14)**
   - Given a buyer renders a public product detail page
   - When the product view is ingested
   - Then one canonical `product_view` event is appended
   - And it contains `store_id`, `store_slug`, `product_id`, `event_name`, UTC `occurred_at`, and anonymous/session/source metadata where available
   - And draft, hidden, deleted, nonexistent, or cross-store products are rejected by the server-side public query boundary and never counted.

3. **CTA click remains an observed intent event (FR16, FR18, AD-4, AD-7)**
   - Given a buyer taps an enabled Telegram CTA from a public catalog card or product detail page
   - When the Telegram handoff starts
   - Then exactly one eligible `cta_click` event is appended before external navigation is returned/opened
   - And the existing server-owned product/store re-query and Telegram-only handoff behavior is preserved
   - And the event includes `store_id`, `store_slug`, `product_id`, `event_name`, `messenger_type: telegram`, UTC `occurred_at`, and source/session metadata where available
   - And the system records contact intent only; it does not claim that Telegram opened, a message was sent, a deal started, or a purchase completed.

4. **Preview, admin, bot, and disabled-state exclusions (FR18, NFR5, AD-2, AD-5)**
   - Given the seller views the storefront or product through the authenticated seller preview
   - When preview pages or preview CTAs render/are tapped
   - Then no public buyer event is counted
   - And preview exclusion is derived from the server-authenticated route/context, never from a client-provided opt-out flag.
   - Given a known bot/crawler user agent reaches the public ingestion boundary
   - When it would otherwise create an event
   - Then it is excluded from seller-facing counts and the exclusion reason is inspectable where the observation is retained.
   - Given a Telegram contact is disabled or invalid
   - When a buyer sees or taps the disabled CTA
   - Then no `cta_click` event is created and no external handoff is attempted.

5. **Append-only ledger and observability (NFR4, NFR5, AD-7, AD-14)**
   - Given eligible analytics events are stored
   - When the ledger is queried by later dashboard stories
   - Then raw events remain the canonical append-only source; this story must not introduce mutable counters or dashboard-specific aggregates
   - And events are inspectable by event name, store ID, product ID where applicable, source, UTC occurrence time, user-agent type, and exclusion reason where applicable
   - And event timestamps are stored in UTC while future day-window queries can use the store timezone (MVP default `Europe/Moscow`).
   - And repeated store/product views from the same non-null anonymous session within 30 seconds may be collapsed at ingestion, while CTA taps are counted per tap except obvious double taps within 3 seconds.

6. **Public-flow resilience and privacy (NFR1, NFR3, NFR4, AD-2, AD-9)**
   - Given analytics ingestion is slow, unavailable, or rejected
   - When a buyer opens a public storefront/product or starts Telegram handoff
   - Then the public page/handoff remains usable and does not expose a database error or buyer registration prompt
   - And any anonymous session cookie contains only an opaque UUID, no buyer identity/profile, and is created/read server-side at the ingestion boundary.

## Tasks / Subtasks

- [x] Task 1: Consolidate the analytics event domain contract (AC: 1-5)
  - [x] Extend the existing `src/features/analytics/cta-click.ts` contract or extract a shared analytics module for `store_view`, `product_view`, and `cta_click` without breaking Story 3.5 imports.
  - [x] Define stable event names, valid event/context combinations, source/session normalization, UTC timestamp validation, `user_agent_type`, `messenger_type`, and exclusion reason values.
  - [x] Keep source resolution intentionally narrow to the metadata already available at this story boundary; do not duplicate the session-scoped UTM/referrer attribution work reserved for Story 4.2.

- [x] Task 2: Complete the append-only Supabase ledger and secure ingestion functions (AC: 1-5)
  - [x] Add a new timestamped migration under `supabase/migrations/` that evolves the existing `analytics_events` table created by Story 3.5 only as needed for the event catalog (`store_slug`, user-agent type, Telegram messenger type, and optional event snapshots/metadata where justified); do not edit an already-applied migration in place.
  - [x] Add/replace server-callable ingestion RPCs for public store views and product views, and update the existing CTA RPC to use the shared canonical shape while preserving its published-product/contact validation, rate bound, and append-before-handoff behavior.
  - [x] Validate store slug, store/product ownership, public product lifecycle, configured Telegram contact for CTA, event name, source, session UUID, and exclusion context inside the server/database boundary; never trust client-supplied title, price, seller ID, or arbitrary redirect URL.
  - [x] Keep `analytics_events` protected by RLS, revoke direct table writes from `anon`/`authenticated`, grant only the minimum RPC execution privileges, use explicit schema qualification/search-path safety for any `security definer` function, and add indexes for event/store/product/time lookups.
  - [x] Document rollback notes in the migration and ensure migrations remain the only source of schema/RLS/function changes.

- [x] Task 3: Add the public analytics ingestion boundary (AC: 1-6)
  - [x] Add the architecture-seeded `src/app/api/analytics/route.ts` and a server-only orchestration module under `src/features/analytics/` using the existing SSR Supabase client; public UI must not import the service-role client.
  - [x] Parse and validate a minimal payload containing public identity (`storeSlug`, optional `productId`, event type, and already-available metadata); malformed/non-object payloads return a controlled 400 response.
  - [x] Derive request facts server-side from route/auth context, cookies, and headers: anonymous session ID, trusted source input, user-agent classification, and bot exclusion. The client must not be able to set `isPreview` to suppress a valid event.
  - [x] Create/read the opaque `buyer_session_id` cookie at the Route Handler boundary when needed, using secure production cookie attributes and no personal data. Existing CTA handoff must continue to read the same cookie.
  - [x] Make analytics failures non-blocking for public rendering; return a small machine-readable result for tests/observability without leaking SQL or service credentials.

- [x] Task 4: Wire eligible public renders without breaking preview or handoff (AC: 1-4, 6)
  - [x] Add the smallest client boundary needed for a one-shot `store_view`/`product_view` beacon and mount it from `src/app/(public)/[storeSlug]/page.tsx` and `src/app/(public)/[storeSlug]/products/[productId]/page.tsx` only after the existing public query boundary succeeds.
  - [x] Ensure a store page emits only `store_view` and a product detail page emits only `product_view`; do not infer a store view from a product page and do not create duplicate catalog/detail CTA implementations.
  - [x] Preserve the current public not-found/error behavior, published-product visibility, stable product URLs, Telegram handoff, and mobile/accessibility behavior. Analytics failure must not turn a valid public page into a 5xx response.
  - [x] Keep seller preview routes/beacons and preview Telegram handoff excluded through server-authenticated context; preview detail navigation must not lose its preview context.

- [x] Task 5: Test and harden the event flow (AC: 1-6)
  - [x] Add executable unit tests for all event contracts, source/session normalization, UTC timestamps, valid/invalid event combinations, bot/exclusion reasons, deduplication windows, and anonymous-session behavior.
  - [x] Add route/service tests with mocked Supabase boundaries proving public re-query, cross-store/lifecycle rejection, non-object request handling, non-blocking failures, and CTA append-before-handoff ordering.
  - [x] Add source/contract checks proving the public pages mount the beacon exactly once, preview/admin surfaces do not emit public events, the table is not directly writable by public roles, and service-role code is not imported into public/client modules.
  - [x] Add migration/static checks for event names, required columns, indexes, RLS/revoke/grant statements, exclusion filtering, UTC storage, and no mutable analytics counters.
  - [x] Run `npm.cmd run check`; report any unavailable runtime Supabase/RLS integration explicitly rather than claiming live database coverage.

## Dev Notes

### Context and scope

- This is the first story of Epic 4, but Story 3.5 already introduced the `analytics_events` table, `cta_click` RPC, CTA ordering, and `src/features/analytics/cta-click.ts`. Extend those seams; do not create a second ledger or Telegram handoff.
- This story delivers ingestion and raw-event integrity only. Seller home widgets, source attribution persistence/precedence, and product-level analytics summaries belong to Stories 4.2-4.4. Do not add dashboard aggregates or a 30-day UI.
- The event catalog in the PRD is the normative shape: `store_view` on public storefront render, `product_view` on public product render, and `cta_click` before Telegram handoff. Observed intent is not delivery or purchase.

### Existing implementation to preserve

- `src/features/contact/handoff.ts` calls the existing `record_public_cta_click` RPC through `createSupabaseServerClient`; keep this server-only boundary and preserve current public store/product re-query.
- `src/features/contact/handoff-service.ts` guarantees event-before-handoff by calling `recordCtaClick` before building/returning the Telegram payload. Keep this ordering even if the underlying recorder is generalized.
- `src/features/contact/telegram-route.ts` already normalizes source/session metadata and reads `buyer_session_id`; reuse the normalizers and trusted-origin checks instead of inventing a client-side analytics client.
- `src/features/store/public-catalog.ts` and `src/features/store/public-queries.ts` are the buyer-safe public query boundaries. Draft/hidden/deleted/cross-store product checks must remain there or in the database RPC used by the recorder.
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx` passes `isPreview` to the shared storefront shell; the public product page separately verifies the authenticated seller store through `isAuthorizedPreviewStore`. Do not treat a query parameter alone as authorization.
- The project has no runtime Supabase fixture/integration harness. Existing tests are Node built-in tests and source-contract/smoke checks; add behavioral seams that can be tested with dependency injection, and label live-RLS limitations accurately.

### Architecture guardrails

- **AD-2:** seller admin/preview and public buyer surfaces are separate. Public routes do not require buyer auth. Preview events are excluded server-side.
- **AD-4:** CTA click is appended before generating/opening the external Telegram handoff; it records intent only.
- **AD-7:** raw events are append-only and canonical. Summaries may later be derived or cached, but this story must not make counters authoritative.
- **AD-9:** buyers remain anonymous. The only client correlation state allowed is an opaque anonymous session ID.
- **AD-14:** persist `timestamptz`/UTC and leave store-timezone day windows to later query/summary work; store timezone already exists on the store profile with `Europe/Moscow` as MVP default.
- **AD-20:** a valid store route with zero published products is still a public 200 empty state and may count `store_view`; product views still require a published product.
- **AD-15:** browser/public code uses anon-safe access only; seller-scoped server work uses SSR/user clients; service-role stays isolated in `src/lib/supabase/service-role.ts` and is not imported by public routes, client components, or ordinary RPC orchestration.
- **AD-17:** all schema, RLS, function, and index changes are timestamped SQL migrations.

### Event contract and exclusion rules

Use lowercase stable event names and source keys. At minimum the canonical row must expose:

```text
id: uuid
store_id: uuid
store_slug: text
product_id: uuid | null
event_name: store_view | product_view | cta_click
messenger_type: telegram | null
source: lowercase stable key, default unknown
session_id: uuid | null
user_agent_type: browser | crawler | unknown
occurred_at: timestamptz (UTC)
excluded_reason: null for counted events; stable reason for retained exclusions
```

- `store_view`: store identity required; product ID and messenger type are null.
- `product_view`: store and published product required; product must belong to the store.
- `cta_click`: store, published product, and `messenger_type = telegram` required; contact must be configured and enabled.
- Seller preview/admin, invalid/disabled CTA, bot/crawler, and invalid public product contexts must never contribute to seller-facing counts. If an excluded observation is retained for observability, set `excluded_reason` and make all later summaries filter `excluded_reason IS NULL`.
- A missing/invalid source becomes `unknown`; do not store referrer URLs or buyer identity as a substitute for source attribution. Story 4.2 owns explicit-source/UTM/referrer precedence and session propagation.
- View dedupe must never merge distinct anonymous sessions. A null session is not a global identity; if dedupe is applied, scope it to a non-null session or use a deliberately bounded anonymous replay strategy.

### File structure requirements

Expected ownership; confirm exact names against current code before editing:

```text
src/app/(public)/[storeSlug]/page.tsx                         # UPDATE: store-view beacon
src/app/(public)/[storeSlug]/products/[productId]/page.tsx   # UPDATE: product-view beacon + preview guard
src/app/api/analytics/route.ts                               # NEW: public ingestion Route Handler
src/features/analytics/README.md                             # UPDATE: event ownership/contract
src/features/analytics/cta-click.ts                          # UPDATE or compatibility re-export
src/features/analytics/<event-contract>.ts                   # NEW/UPDATE: shared domain contract
src/features/analytics/<public-ingestion>.ts                 # NEW: server orchestration + DI seam
src/features/<store-or-analytics-beacon>.tsx                 # NEW: smallest client beacon boundary
src/features/contact/handoff*.ts                             # UPDATE only if needed to reuse recorder
scripts/<analytics-contract>.test.mjs                         # NEW/UPDATE: executable guardrails
scripts/smoke-foundation.mjs                                  # UPDATE if smoke registration is required
supabase/migrations/<timestamp>_complete_analytics_ingestion.sql # NEW: schema/RPC/RLS/index evolution
```

Do not add a client Supabase write, service-role import, buyer registration, internal chat, Telegram SDK/bot, mutable counters, dashboard chart, source-link generator, or 30-day analytics UI.

### Testing requirements

- Use Node 24 built-in `node:test` patterns already present in `scripts/` and dependency-injected functions for route/service behavior.
- Test Russian/Unicode titles only where metadata is passed through; analytics rows must not store product title/description unless an explicitly justified optional snapshot is needed by later requirements.
- Cover: store/product valid UUIDs, wrong store/product association, hidden/draft/deleted product, no published product/store boundary, malformed JSON/null/array payload, absent/invalid source, valid/invalid session cookie, browser/crawler UA, preview auth mismatch, disabled Telegram, duplicate view windows, CTA double-tap bound, RPC failure, and CTA ordering.
- `npm.cmd run check` is the repository gate: lint, typecheck, production build, and smoke. Do not claim that it validates a live Supabase migration when no runtime database is configured.

### Project structure notes

- The actual repo uses `src/app/(seller)/seller/(admin)/...` rather than the architecture seed's shortened seller route; public paths and feature ownership already match the seed.
- The repository is on Next.js `16.2.12`, React `19.2.4`, Node `>=24 <25`, Supabase JS `2.111.0`, and `@supabase/ssr` `0.12.4`. Do not add dependencies for this story.
- Public pages are Server Components. Keep the analytics beacon as the only new client boundary; it must tolerate hydration/network failure and never block page content.
- Route Handlers use native Web `Request`/`Response`; this repo's Next 16 docs also require async `cookies()` usage. Cookie writes belong in the Route Handler, not a Server Component.

### Latest technical guidance

- Next.js Route Handlers are uncached for POST by default and use Web Request/Response APIs; use the existing `POST` pattern and return controlled JSON statuses. See [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) and local `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
- Next.js `cookies()` is asynchronous in the current App Router and cookie mutation is supported in Route Handlers/Server Functions, not during ordinary Server Component rendering. See [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies).
- Supabase requires RLS on exposed public tables and least-privilege grants. If a `security definer` function is retained for a public RPC, qualify relations/search path explicitly and revoke broad execute privileges; see [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Supabase Database Functions](https://supabase.com/docs/guides/database/functions).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 4.1: Record Store, Product, and CTA Analytics Events]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — FR-18 Basic analytics events]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — FR-19 Traffic source tracking]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — Analytics event catalog]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/addendum.md` — Technical and Architecture Notes]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md` — AD-2, AD-4, AD-7, AD-9, AD-14, AD-15, AD-17]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md` — Component Patterns, State Patterns, Accessibility Floor]
- [Source: `_bmad-output/implementation-artifacts/3-5-telegram-handoff-with-prefilled-product-message.md` — existing CTA ledger/handoff implementation and review learnings]
- [Source: `src/features/analytics/cta-click.ts`]
- [Source: `src/features/contact/handoff.ts`]
- [Source: `src/features/contact/handoff-service.ts`]
- [Source: `src/features/contact/telegram-route.ts`]
- [Source: `src/features/store/public-catalog.ts`]
- [Source: `src/features/store/public-queries.ts`]
- [Source: `src/app/(public)/[storeSlug]/page.tsx`]
- [Source: `src/app/(public)/[storeSlug]/products/[productId]/page.tsx`]
- [Source: `supabase/migrations/20260802110000_create_analytics_events.sql`]
- [Source: `package.json`]
- [Source: `AGENTS.md`]
- [External: https://nextjs.org/docs/app/getting-started/route-handlers]
- [External: https://nextjs.org/docs/app/api-reference/functions/cookies]
- [External: https://supabase.com/docs/guides/database/postgres/row-level-security]
- [External: https://supabase.com/docs/guides/database/functions]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Implementation Plan

- Consolidated the Story 3.5 CTA contract into a shared analytics event catalog with stable event/context validation, source/session normalization, UTC timestamps, user-agent classification, and compatibility re-exports.
- Added a timestamped Supabase migration that extends the append-only ledger and provides secure, server-validated store-view, product-view, and CTA ingestion RPCs with RLS, least-privilege grants, crawler exclusions, view/CTA deduplication, and rate bounds.
- Added a server-only public ingestion orchestration seam and Next.js Route Handler that owns the opaque anonymous session cookie, trusted request facts, controlled responses, and non-blocking failure behavior.
- Mounted one-shot public buyer beacons after successful public query boundaries, while preserving seller preview and Telegram handoff exclusions.
- Added executable contract/DI/static guardrail tests and validated with the repository `npm.cmd run check` gate.

### Debug Log References

- `python3 _bmad/scripts/resolve_customization.py ...` unavailable in the Windows environment; workflow customization was resolved manually from base/team/user files.
- Full sprint status, epics, PRD, architecture spine, UX documents, current public/contact/analytics source, prior Story 3.5, recent git history, and local Next.js route-handler/forms docs were inspected.
- Official Next.js and Supabase documentation was checked for current Route Handler/cookie/RLS/security-definer guidance.
- RED phase confirmed the new analytics contract test failed before implementation; GREEN phase reached 24/24 Node tests and a passing production check.
- `npm.cmd run check` passed lint, Next.js typecheck, production build, and smoke checks. Lint retains one pre-existing `@next/next/no-img-element` warning in `src/features/product/product-media-manager.tsx`.
- Supabase CLI/runtime RLS integration is unavailable in this workspace; migration and security behavior are covered by static executable checks and were not claimed as live database coverage.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story is scoped to extend the existing Story 3.5 CTA ledger into complete public store/product/CTA event ingestion; dashboard/source-summary work remains in later Epic 4 stories.
- Current epic/story selection: first backlog story in sprint order, `4-1-record-store-product-and-cta-analytics-events`.
- Implemented server-owned public analytics ingestion for store/product views and preserved CTA intent recording before Telegram handoff, with crawler exclusions and bounded deduplication.
- Public buyer rendering remains resilient to analytics failures; seller preview/admin surfaces do not mount public analytics beacons.
- Definition of Done validated: all tasks checked, acceptance criteria mapped, tests pass, code quality/build/smoke pass, and no live Supabase/RLS runtime was available for verification.

### File List

- `_bmad-output/implementation-artifacts/4-1-record-store-product-and-cta-analytics-events.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/analytics-contract.test.mjs`
- `src/app/(public)/[storeSlug]/page.tsx`
- `src/app/(public)/[storeSlug]/products/[productId]/page.tsx`
- `src/app/api/analytics/route.ts`
- `src/features/analytics/README.md`
- `src/features/analytics/cta-click.ts`
- `src/features/analytics/event-contract.ts`
- `src/features/analytics/public-analytics-beacon.tsx`
- `src/features/analytics/public-ingestion-server.ts`
- `src/features/analytics/public-ingestion.ts`
- `src/features/contact/handoff-service.ts`
- `src/features/contact/handoff.ts`
- `src/features/contact/telegram-route.ts`
- `src/features/store/public-product-detail.tsx`
- `src/features/store/public-storefront-shell.tsx`
- `supabase/migrations/20260802120000_complete_analytics_ingestion.sql`
- `tsconfig.json`

### Change Log

- 2026-08-02: Created comprehensive implementation story for public store, product, and CTA analytics event ingestion.
- 2026-08-02: Implemented Story 4.1 analytics contracts, secure Supabase ingestion, public beacons, CTA integration, tests, and validation; status moved to review.

### Review Findings

- [ ] [Review][Patch] Cookie-less CTA crashes before insertion — when `event_session_id` is null, neither deduplication branch initializes `duplicate_event`, but the function still evaluates `duplicate_event.id`; ordinary first-time buyers without the cookie can therefore fail to receive Telegram. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:187-201]
- [ ] [Review][Patch] Google inspection crawlers are misclassified — the user-agent classifier does not recognize `Google-InspectionTool`, so known crawler visits can be counted as browser events. [src/features/analytics/event-contract.ts:22-23]
- [ ] [Review][Patch] Runtime event-name validation is incomplete — `buildAnalyticsEvent` relies on the TypeScript union and emits an event for an invalid runtime string instead of checking the canonical catalog. [src/features/analytics/event-contract.ts:89-117]

- [ ] [Review][Patch] Analytics failure blocks Telegram handoff — `recordCtaClick` throws on RPC rejection/unavailability and `prepareTelegramHandoffWithDependencies` returns an error before building the Telegram payload, violating AC6's non-blocking handoff requirement. [src/features/contact/handoff.ts:35; src/features/contact/handoff-service.ts:115]
- [ ] [Review][Patch] Public RPC trusts caller-supplied user-agent classification — `anon`/`authenticated` can call the ingestion RPCs with `event_user_agent_type = 'browser'`, bypassing crawler exclusion instead of relying on the server-derived request facts required by AC4. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:263-289,386-389]
- [ ] [Review][Patch] Public view RPCs have no amplification guard — callers can invoke the granted RPCs with fresh UUID sessions or `NULL` and create unlimited `store_view`/`product_view` rows because deduplication only checks an identical non-null session within 30 seconds. This permits seller-facing count inflation. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:174-186,386-387]
- [ ] [Review][Patch] Crawler observations consume the CTA rate-limit bucket — the CTA rate-limit count omits `excluded_reason IS NULL`, so retained crawler events can exhaust the same product/session bucket and reject legitimate anonymous CTA attempts. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:213-225]
- [ ] [Review][Patch] Concurrent duplicate events are not prevented — deduplication and CTA rate limiting use check-then-insert without a lock or uniqueness strategy, allowing concurrent view/double-tap requests to append duplicates inside the configured windows. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:174-253]
- [ ] [Review][Patch] Product beacon can mount after a failed store query — the product page handles `not_found` but continues when `getPublicStoreBySlug` returns `error`, then mounts `product_view` despite the requirement to beacon only after successful public query boundaries. [src/app/(public)/[storeSlug]/products/[productId]/page.tsx:31-49]
- [ ] [Review][Patch] Existing CTA ledger rows are left without `messenger_type` — the migration adds the nullable column but does not backfill historical `cta_click` rows from Story 3.5 to `telegram`, so canonical CTA rows remain incomplete after migration. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:19-21]
- [ ] [Review][Patch] Story 4.1 tests are not executed by the repository gate — `npm run check` does not invoke `scripts/analytics-contract.test.mjs`, and the added tests do not exercise the actual Route Handler or CTA failure-resilience path. [package.json:8-15; scripts/analytics-contract.test.mjs:100-215]
- [ ] [Review][Decision] Public RPC user-agent trust boundary remains — removing anonymous RPC execution would require an ingestion authentication design or service-role route, which conflicts with the story's SSR-client/AD-15 constraints. The current route derives UA server-side, but direct public RPC callers can still provide a different classification. [supabase/migrations/20260802120000_complete_analytics_ingestion.sql:263-289,386-389]
### Review Resolution

- [x] Applied the implementation fixes for the cookie-less CTA crash, non-blocking handoff, view amplification bound, crawler rate-limit exclusion, concurrent deduplication lock, product query error boundary, legacy Telegram backfill, crawler classification, runtime event-name validation, and contract-test gate.
- [x] Re-ran `npm.cmd run check`: lint, typecheck, production build, 14 contract tests, and smoke all pass. The pre-existing `no-img-element` warning remains.
- [ ] The public RPC user-agent trust boundary remains an architecture action item; the current SSR-client design does not provide an unforgeable server-to-database proof without introducing a new ingestion authentication mechanism.
- [x] Protected the ingestion boundary: analytics RPCs now require the `service_role` JWT claim and are no longer executable by `anon`/`authenticated`; the isolated server-only writer is the only application caller.
- [x] Decision resolved by moving all analytics writes behind the isolated service-role writer and revoking public RPC execution; Story 4.1 has no remaining review blocker.
