---
baseline_commit: e1f8b7d9952d6d279258614d463e6c016383805d
---

# Story 4.4: Product-Level Analytics Summary

Status: done

<!-- Story generated from Epic 4 context. Validate before development if needed. -->

## Story

As a seller,
I want to see views and contact clicks per product,
so that I can understand which products attract buyer interest.

## Acceptance Criteria

1. **Product metrics for today and last 7 days (FR20, FR21, NFR5, UX-DR9, UX-DR17)**
   - **Given** I am an authenticated seller with a store
   - **When** I open the seller analytics surface
   - **Then** I can see product-level `product_view` and `cta_click` totals for my products
   - **And** the surface provides both `Сегодня` and `Последние 7 дней` periods
   - **And** the displayed period is explicit and the values are derived from the selected period.

2. **Canonical event grouping and exclusions (FR18, FR20, NFR5, AD-7, AD-14)**
   - **Given** eligible events in the append-only `analytics_events` ledger have `product_id`
   - **When** product summaries are calculated
   - **Then** `product_view` events are counted as product views and `cta_click` events as CTA clicks
   - **And** only rows with `excluded_reason IS NULL` contribute to seller-facing totals
   - **And** timestamps remain UTC in storage while period windows use the store IANA timezone with `Europe/Moscow` fallback
   - **And** no mutable counter table, raw event payload, buyer identity, referrer, or campaign metadata is introduced.

3. **Seller ownership and product coverage (FR20, NFR5, AD-15, AD-20)**
   - **Given** products belong to different stores or sellers
   - **When** a seller requests product analytics
   - **Then** the result includes only products owned by the authenticated seller's current store
   - **And** non-deleted seller products with zero metrics remain visible with clear zero values
   - **And** deleted products and another seller's products are not returned
   - **And** no client-provided `store_id` or product list can widen the ownership scope.

4. **Mobile-first product cards and zero states (FR21, UX-DR9, UX-DR17)**
   - **Given** I open product analytics at 360–430px
   - **When** product rows/cards render
   - **Then** each card keeps the product title, period, views, and CTA clicks readable without horizontal scrolling
   - **And** the layout is a scannable card/list composition rather than a dense table
   - **And** zero values are shown as `0` rather than hiding the product or replacing it with a fake empty state
   - **And** labels, values, focus order, contrast, forced-colors, and reduced-transparency behavior remain accessible.

5. **Read failures do not leak data or break the seller shell (NFR5, AD-2, AD-15)**
   - **Given** the analytics query is unavailable or returns malformed data
   - **When** the seller analytics surface renders
   - **Then** it shows a text-first non-blocking error/retry state
   - **And** it does not silently present zero as truth
   - **And** it remains behind seller authentication and does not become a public analytics endpoint
   - **And** no service-role credentials or raw ledger rows reach the browser.

6. **MVP scope boundary (FR20)**
   - **Given** 30-day analytics is a fast-follow requirement
   - **When** period controls are rendered
   - **Then** only `Сегодня` and `Последние 7 дней` are active in MVP
   - **And** 30 days is not implemented, or is clearly marked as future/fast-follow if mentioned internally.

## Tasks / Subtasks

- [x] Task 1: Define the product analytics aggregate contract (AC: 1–3, 5)
  - [x] Add typed period and product-summary result contracts in `src/features/analytics`.
  - [x] Represent each non-deleted seller product even when both metrics are zero; keep title/status/product ID only as needed by seller UI.
  - [x] Normalize RPC values defensively: non-negative safe integers, valid UUIDs, valid UTC timestamps/window metadata, supported period keys, and no raw event fields.

- [x] Task 2: Add a seller-scoped read query/RPC for today and the last 7 days (AC: 1–3, 5)
  - [x] Reuse the SSR Supabase user client and authenticated seller ownership pattern; do not import service-role into seller modules.
  - [x] Add a new timestamped SQL migration only; do not edit applied migrations.
  - [x] Implement a narrowly granted `SECURITY DEFINER` aggregate RPC or equivalent server-side read that resolves `auth.uid()` to the seller's store internally and returns aggregates only.
  - [x] Build store-local UTC windows for today and the inclusive last seven calendar days; preserve UTC `occurred_at` values and use the store timezone with `Europe/Moscow` fallback.
  - [x] Group only canonical `product_view` and `cta_click` events by `product_id`, filter `excluded_reason IS NULL`, and left-join the seller's non-deleted products so zero rows remain.
  - [x] Use explicit safe `search_path`, fully qualified relations, least-privilege execute grants, and a rollback note. Do not expose direct raw ledger SELECT access.

- [x] Task 3: Implement the analytics detail surface and mobile product cards (AC: 1, 4, 6)
  - [x] Replace the seller analytics placeholder at `src/app/(seller)/seller/(admin)/analytics/page.tsx` with an async authenticated Server Component using the new query.
  - [x] Add period selection for today/last 7 days using the existing seller route conventions; do not create a public GET endpoint or a 30-day implementation.
  - [x] Create/reuse components under `src/features/analytics` with the existing `analytics-card`/glass-panel visual language; do not build a second design system.
  - [x] Render product title, period, views, CTA clicks, and zero values as readable cards/list items at 360–430px; preserve seller bottom navigation and public-route isolation.
  - [x] Provide explicit accessible labels/sentences, text-first empty state for no products, and non-blocking retry/error state that does not masquerade as valid zero metrics.

- [x] Task 4: Preserve existing analytics and product behavior (AC: 2, 3, 5)
  - [x] Reuse canonical event names, stable source/session contracts, exclusion semantics, and store timezone conventions from Stories 4.1–4.3.
  - [x] Do not change public analytics ingestion, Telegram handoff, seller home summary, product visibility rules, or seller navigation except where shared typed contracts require a compatible extension.
  - [x] Keep analytics read results aggregate-only and seller-owned; no buyer identity, raw referrer/UTM, or message/purchase outcome is added.

- [x] Task 5: Add contract/unit and static boundary coverage (AC: 1–6)
  - [x] Test mapping of today/7-day RPC results, malformed rows, negative counts, invalid UUIDs/timestamps, and missing/zero product rows.
  - [x] Test grouping semantics: product views and CTA clicks count independently, excluded rows are ignored, and rows from another store/product are not returned.
  - [x] Test Europe/Moscow and a non-default IANA timezone around local midnight; verify UTC event storage is not shifted.
  - [x] Test both period controls, mobile-readable card content, zero/error states, no public analytics route, no service-role import, and no 30-day active control.
  - [x] Run `npm.cmd run check`; if live Supabase/RLS is unavailable, document that limitation without weakening static/contract coverage.

## Dev Notes

### Business and scope boundary

Stories 4.1–4.2 established the append-only analytics ledger, public ingestion, anonymous session/source attribution, and exclusions. Story 4.3 established the seller-authenticated home summary RPC and today's store-level widget. This story adds product-level detail for the existing seller analytics navigation. It must not rebuild ingestion, add mutable counters, or turn the existing placeholder into an unrestricted raw-event report.

The MVP answer is intentionally small: product title, views, CTA clicks, and the selected period for today and the last seven store-local calendar days. 30-day analytics is fast-follow and remains out of scope.

### Existing implementation to extend

- `src/app/(seller)/seller/(admin)/analytics/page.tsx` is the current analytics placeholder and is the intended route surface to implement.
- `src/app/(seller)/seller/(admin)/layout.tsx` already owns Home / Products / Analytics / Store navigation; preserve it and do not duplicate navigation in the page.
- `src/features/analytics/seller-home-analytics.ts` and `seller-home-summary.ts` establish server-only query/result mapping and safe numeric/timezone normalization; reuse patterns or extract shared helpers without breaking Story 4.3.
- `src/features/analytics/analytics-summary-widget.tsx` and design-system `GlassPanel` establish the existing analytics card/glass language and error/zero-state tone.
- `src/features/store/queries.ts` and `src/features/product/queries.ts` establish seller auth, current-store ownership, and non-deleted product selection patterns.
- `src/features/analytics/event-contract.ts` is the canonical source for `product_view`, `cta_click`, exclusions, and UUID/timestamp rules.
- `supabase/migrations/20260802110000_create_analytics_events.sql`, `20260802120000_complete_analytics_ingestion.sql`, and `20260802130000_seller_home_analytics.sql` are applied migration history. Do not edit them; add a new timestamped migration if schema/RPC work is required.

### Recommended aggregate contract

Names may follow local style, but preserve this meaning and keep the browser payload aggregate-only:

```ts
type AnalyticsPeriod = "today" | "last_7_days";

type ProductAnalyticsSummary = {
  productId: string;
  title: string;
  status: "draft" | "published" | "hidden";
  productViews: number;
  ctaClicks: number;
};

type SellerProductAnalyticsSummary = {
  status: "found";
  period: AnalyticsPeriod;
  timezone: string;
  periodStartUtc: string;
  periodEndUtc: string;
  products: ProductAnalyticsSummary[];
};
```

The query must resolve the seller's current store from the authenticated session, never trust browser-supplied store/product scope, include all non-deleted products for that store with a left join, and count only eligible canonical events. A zero-valued product is still a valid summary row.

For `last_7_days`, use seven store-local calendar dates including today, with the lower bound at local midnight six days ago and the upper bound at the next local midnight. The RPC may return both periods in one aggregate payload or query one period at a time; the UI must make the selected period explicit and must not mix windows.

### Security and architecture guardrails

- **AD-2:** seller analytics is an authenticated admin surface; public storefront routes never import seller-only analytics UI/services.
- **AD-7:** `analytics_events` remains append-only and canonical; summaries derive from raw events and may not be replaced by mutable counters.
- **AD-14:** persist/compare event timestamps in UTC; derive day windows in the store's IANA timezone, defaulting safely to `Europe/Moscow`.
- **AD-15:** use the SSR user client for seller reads. A `SECURITY DEFINER` RPC must set a safe search path, qualify relations, verify `auth.uid()` ownership, and grant execution only to the necessary authenticated role.
- **AD-17:** all database/RPC/grant/index changes are versioned timestamped migrations with rollback notes.
- **AD-20:** product analytics coverage and public product visibility are separate. Do not hide a seller's draft/hidden product from their analytics row merely because it has no public events; deleted products remain excluded.
- Exclude every event with non-null `excluded_reason`, including preview/crawler/invalid contexts. Do not infer sent Telegram messages, purchases, or buyer identity.

### UX and accessibility guardrails

- Mobile-first target is 360–430px, one column, 16px mobile padding, and no horizontal overflow.
- Product analytics should look like readable cards/list rows, not a dense spreadsheet. Keep the product title, selected period, `Просмотры`, and `Переходы в Telegram` visible together.
- Use calm Russian microcopy from `EXPERIENCE.md`; zero values are honest data, while no-products and read-error states are distinct.
- Text/ARIA must expose metric labels and values together; do not rely only on color, size, or card position. Preserve visible focus and minimum 44x44 tap targets for interactive controls.
- Follow the existing monochrome/liquid-glass system only when contrast remains sufficient; forced-colors and reduced-transparency must retain readable solid surfaces.

### Testing and validation requirements

Use the repository's Node 24 `node:test` contract style and dependency injection. Minimum coverage:

- valid aggregate mapping for both periods, zero values, and empty product list;
- malformed counts, UUIDs, period keys, time windows, and raw-field rejection;
- event grouping by product and event name, non-null exclusion filtering, seller/store ownership boundary, and deleted-product exclusion;
- today/last-7-days window boundaries for Europe/Moscow and another IANA timezone around midnight/DST-safe calculations;
- static checks that the route remains seller-auth protected, does not import service-role, does not expose public analytics GET, preserves existing ingestion/home summary, and does not activate 30-day UI;
- mobile card labels and retry/error/empty-state copy where the repository's current test approach permits.

Run `npm.cmd run check` at completion. It covers lint, Next type generation/typecheck, build, contract tests, and smoke checks; it does not prove live Supabase/RLS behavior without a configured runtime database.

### Library/framework and local Next.js guidance

The repository uses Node `>=24 <25`, Next.js `16.2.12`, React `19.2.4`, Tailwind CSS 4, `@supabase/ssr` `0.12.4`, and `@supabase/supabase-js` `2.111.0`. Do not add dependencies for this story.

Before editing route code, read the repository-local Next.js guides required by `AGENTS.md`, especially:

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`

Keep the analytics page as a Server Component by default. Use a narrow client component only for a period selector if the existing route conventions require client state; do not move DB reads, auth, or secrets into the client bundle.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4 / Story 4.4]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — FR18, FR20, FR21, NFR5, analytics privacy guardrails]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/addendum.md` — today + 7-day analytics scope and attribution decisions]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md` — AD-2, AD-7, AD-14, AD-15, AD-17, AD-20, analytics structure]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md` — analytics-card, mobile layout, contrast and liquid-glass rules]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md` — seller analytics IA, product analytics flow, zero/error/accessibility states]
- [Source: `_bmad-output/implementation-artifacts/4-1-record-store-product-and-cta-analytics-events.md` — canonical ledger and exclusion semantics]
- [Source: `_bmad-output/implementation-artifacts/4-2-attribute-traffic-source-across-buyer-session.md` — stable source/session contract]
- [Source: `_bmad-output/implementation-artifacts/4-3-seller-home-analytics-widget.md` — seller summary RPC, timezone helpers, review learnings, and test conventions]
- [Source: `src/features/analytics/event-contract.ts` — canonical event names and normalization]
- [Source: `src/features/analytics/seller-home-summary.ts` — existing aggregate/timezone mapping patterns]
- [Source: `src/features/product/queries.ts` — seller-owned non-deleted product query]
- [Source: `supabase/migrations/20260802130000_seller_home_analytics.sql` — existing secure seller aggregate RPC pattern]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `python3` is unavailable in the Windows environment; workflow customization was resolved with the documented manual fallback.
- Supabase CLI/local runtime is not installed in this workspace, so live SQL/RLS execution is unavailable; contract coverage asserts the seller/product/event join topology and exercises application-level malformed-data and DST boundaries.
- Full sprint status, Epic 4 source context, PRD, architecture spine, UX documents, Stories 4.1–4.3, recent code, and git history were inspected before creating this story.
- Red phase: the new product analytics contract suite failed before the summary contract, query, RPC migration, and detail surface existed.
- Green/refactor phase: implemented the aggregate mapper, timezone windows, seller-scoped RPC/query, mobile cards, period links, error/empty states, and analytics documentation; `npm.cmd run check` passed.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created for Story 4.4.
- Story implementation is complete and explicitly preserves the canonical ledger, seller ownership boundary, mobile-first UX, and 30-day fast-follow scope.
- Implemented today/last-7-days product analytics from canonical eligible events, including zero-valued non-deleted seller products.
- Added aggregate-only database and SSR boundaries, accessible mobile cards, retry/error states, and 8 focused Story 4.4 contract tests.

### File List

- `_bmad-output/implementation-artifacts/4-4-product-level-analytics-summary.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `package.json`
- `scripts/product-analytics-contract.test.mjs`
- `src/app/(seller)/seller/(admin)/analytics/page.tsx`
- `src/features/analytics/README.md`
- `src/features/analytics/product-analytics-summary.ts`
- `src/features/analytics/product-analytics.ts`
- `src/features/analytics/product-analytics-view.tsx`
- `supabase/migrations/20260802140000_product_analytics_summary.sql`

### Change Log

- 2026-08-02: Created comprehensive Story 4.4 context for product-level analytics summary.
- 2026-08-02: Implemented seller-scoped product analytics for today and the last 7 days, mobile detail cards, secure aggregate RPC, tests, and documentation; status moved to review.

### Review Findings

- [x] [Review][Patch] Null RPC data is rendered as a valid empty-product state — the query now rejects every non-array RPC result and routes it to the retry error state.
- [x] [Review][Patch] Require explicit UTC timestamps — the mapper now accepts only explicit UTC ISO timestamps and rejects date-only, timezone-less, and calendar-invalid values.
- [x] [Review][Patch] Show the selected period inside every product card — cards and their accessible labels now include the active period.
- [x] [Review][Patch] Include the selected period in the no-products state — the empty state now makes the active period explicit.
- [x] [Review][Patch] Make fallback windows DST-safe — store-local start and end midnights are derived independently for both summary and product analytics windows.
- [x] [Review][Patch] Add behavioral coverage for SQL grouping and timezone boundaries — contract coverage now locks the seller/product/event join topology and executes malformed-data plus America/New_York DST cases; live SQL/RLS execution is documented as unavailable because the workspace has no Supabase runtime.
