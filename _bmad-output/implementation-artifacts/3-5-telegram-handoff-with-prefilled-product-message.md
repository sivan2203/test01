---
baseline_commit: 21179bb433cfbbb47328d6ce5b7a8e2996a81e9a
---

# Story 3.5: Telegram Handoff with Prefilled Product Message

Status: done

<!-- Validation is optional; run code-review after implementation. -->

## Story

As a buyer,
I want the contact CTA to open Telegram with product context already prepared,
so that I can message the seller without manually copying product details.

## Acceptance Criteria

1. **Telegram handoff from both public surfaces (FR15, FR16, AD-3, AD-11)**
   - Given an enabled CTA in a catalog card or product detail page, when the buyer taps `Связаться в Telegram`, the system resolves the current published product and configured seller contact on the server.
   - The handoff opens the configured Telegram username using a supported HTTPS/deep-link format and preserves the selected store/product context.
   - The external URL contains a URL-encoded draft message with the current product title, stable product URL, and current price or `по запросу`.
   - The buyer is not asked to register and no Telegram API/bot dependency is introduced.

2. **CTA analytics ordering and metadata (FR16, FR18, FR19, AD-4, AD-7, AD-8)**
   - On an enabled CTA click, the server appends a `cta_click` event before returning/starting external navigation.
   - The append-only event includes `store_id`, `product_id`, `event_name`, UTC `occurred_at`, and optional anonymous session/source metadata; missing source is `unknown`.
   - The event path validates the public published product/store boundary server-side and never trusts client-provided title, price, username, or store ownership.
   - The implementation records intent only; it must not claim that Telegram opened, a message was sent, or a purchase/order completed.

3. **Editable draft and failure fallback (FR15, UX-DR8, UX-DR17)**
   - Once Telegram is opened or an open attempt is made, the buyer can edit the draft in Telegram before sending.
   - If the deep link is blocked/unavailable or the browser stays on the storefront/product page, the same prepared message remains available through a clearly labelled `Скопировать текст сообщения` action.
   - Copy success/failure is communicated with text, the fallback is keyboard/touch accessible, and no alternative contact channel or internal chat is shown.

4. **Mobile/accessibility/regression boundary (FR21, FR22, AD-2, AD-5)**
   - Catalog and detail use the same contact CTA behavior and keep their existing product visibility, not-found, preview, and media-access boundaries.
   - CTA/fallback actions have at least 44x44 CSS px targets, visible focus, destination-labeled accessible text, and work at 360–430px without relying on color alone.
   - Seller preview can show the handoff state but must not create a public buyer analytics event.

## Tasks / Subtasks

- [x] Task 1: Define the server-owned Telegram handoff contract (AC: 1, 2)
  - [x] Add pure contact-domain helpers for the product-context message, stable public product URL, Telegram HTTPS/deep-link URL, and URL encoding.
  - [x] Keep username normalization/validation from Story 3.4; reject missing/invalid contact and non-published/nonexistent products with typed errors.
  - [x] Document the exact message format and preserve `fixed` price formatting versus `по запросу`.

- [x] Task 2: Add the CTA-click ingestion boundary (AC: 2, 4)
  - [x] Add a timestamped Supabase migration for the append-only analytics event shape needed by `cta_click`, including store/product references, UTC timestamp, source/session fields, exclusion context, indexes, and least-privilege/RLS-safe ingestion.
  - [x] Add the server-side analytics/contact route or service that re-queries the public product/store, appends `cta_click`, then returns the prepared handoff payload; do not use a service-role client from public UI code.
  - [x] Accept optional source/session metadata, normalize absent source to `unknown`, and preserve preview exclusion without pretending to observe Telegram delivery.

- [x] Task 3: Implement the buyer CTA handoff and copy fallback (AC: 1, 3, 4)
  - [x] Convert `PublicProductContactCta` to the smallest required client boundary and call the server handoff contract on click before opening Telegram.
  - [x] Open the returned Telegram URL in a user-initiated manner; when opening is blocked/unsuccessful or the page remains active, expose the returned exact message in an accessible copy fallback.
  - [x] Handle pending, route error, clipboard-unavailable, and clipboard-success states with text-first messaging; do not navigate or emit events for a disabled CTA.

- [x] Task 4: Wire one shared behavior into catalog, detail, and preview (AC: 1, 4)
  - [x] Pass only the public product identity/snapshot required by the shared CTA from `public-catalog-view.tsx` and `public-product-detail.tsx`; do not create a second catalog CTA.
  - [x] Preserve current disabled state when Telegram is not configured, stable product-ID URLs, seller-preview indicator, and existing public query boundaries.
  - [x] Ensure the handoff message is generated from the server snapshot at click time so edits to title/price are reflected.

- [x] Task 5: Test and harden the complete flow (AC: 1–4)
  - [x] Add unit tests for message/URL generation, price/request mode, encoding, invalid/missing contact, and stable product URL behavior.
  - [x] Add route/service tests proving server re-query, `cta_click` ordering before returned handoff, optional source/session metadata, and no event for disabled/preview CTA.
  - [x] Add source/contract checks for shared catalog/detail CTA, no service-role/client leakage, accessibility labels/fallback, and Telegram-only scope.
  - [x] Run the full configured checks (`npm.cmd run check`) and report any runtime Supabase limitation explicitly rather than faking integration coverage.

## Dev Notes

### Implementation guardrails

- The repository is a Next.js 16.2.12 App Router vertical-slice monolith. Read the local Next.js docs under `node_modules/next/dist/docs/` before changing route handlers or client/server boundaries. Public pages are Server Components; only the interactive CTA/fallback should be a Client Component.
- Use the existing `src/features/contact/telegram.ts` validator and `src/features/store/public-contact-cta.tsx` shared CTA. Extend them; do not add a second catalog implementation, Telegram SDK, bot token, or internal chat.
- Telegram’s public username link supports `t.me/<username>?text=<draft_text>` and `tg://resolve?domain=<username>&text=<draft_text>`. Prefer the HTTPS form for web/app handoff and encode the draft with `URLSearchParams`/`encodeURIComponent`.
- Generate the message server-side from the current published product snapshot. A suitable stable contract is:
  `Здравствуйте! Пишу по товару «{title}». Цена: {priceLabel}. Ссылка на товар: {absoluteProductUrl}`.
  The exact punctuation may follow existing copy conventions, but title, price/request label, and URL are mandatory and the same returned string must feed the copy fallback.
- The public product URL is ID-stable and may be slug-decorated; the current route `/{storeSlug}/products/{productId}` is sufficient and must not be replaced by a title-only URL. Draft/hidden/deleted/nonexistent products remain public not-found.
- The server route/service must re-query via existing buyer-safe public boundaries and canonical Telegram username. Never accept client-supplied seller username, title, price, or an arbitrary redirect URL as authoritative.
- CTA-click analytics is an observed intent event, not a sent-message/purchase signal. Append it before external navigation. Use UTC storage, lowercase stable source keys, optional anonymous session ID, and `unknown` when no source exists. Full store/product-view summaries remain Story 4.1/4.2 scope; keep the event contract extensible for those stories.
- Preview is buyer-facing rendering with seller context. It must remain excluded from public analytics, and the route must not import service-role code into client/public surfaces.
- The copy fallback must use text-first status, actual button semantics, visible focus, and 44px+ targets. It must not expose WhatsApp, VK, phone, or internal chat.

### Relevant files and expected ownership

- `src/features/contact/telegram.ts` — pure message, URL, and username contracts.
- `src/features/contact/README.md` — update the adapter/handoff contract and out-of-scope boundaries.
- `src/features/store/public-contact-cta.tsx` — shared interactive CTA and fallback; preserve disabled/unconfigured behavior.
- `src/features/store/public-catalog-view.tsx`, `src/features/store/public-product-detail.tsx` — pass public product context only.
- `src/features/store/public-catalog.ts`, `src/features/store/public-queries.ts` — use existing published/public-safe query boundaries; do not leak private data.
- `src/app/api/contact/telegram/route.ts` and/or `src/features/analytics/*` — server-side handoff and CTA event orchestration, depending on the existing feature pattern.
- `src/app/(public)/[storeSlug]/page.tsx`, `src/app/(public)/[storeSlug]/products/[productId]/page.tsx` — preserve dynamic public routes and current not-found/error handling.
- `supabase/migrations/<timestamp>_create_analytics_events.sql` — schema/RLS changes only through a timestamped migration; include rollback notes.
- `scripts/smoke-foundation.mjs` and focused `scripts/*-contract.test.mjs` — executable guardrails; no fake runtime Supabase claims.

### Testing standards

- Existing verification is `npm.cmd run check` (lint, typecheck, build, smoke). No new dependency is expected.
- Test pure helpers with Node’s built-in test runner or the repository’s existing source-contract approach. For route/service tests, mock Supabase at the boundary and assert call order: append event before handoff payload/navigation.
- Include encoded Unicode/Russian title, fixed price, request price, long title within product limits, invalid contact, missing product, disabled CTA, popup/clipboard failure, and preview exclusion cases.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.5-Telegram-Handoff-with-Prefilled-Product-Message`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.1-Record-Store-Product-and-CTA-Analytics-Events`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-15-Prefilled-product-context-message`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-16-CTA-from-catalog-and-product-detail`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-3`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-4`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-7`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-8`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-11`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#Telegram-handoff`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- [Source: `AGENTS.md`]
- [Source: `node_modules/next/dist/docs/01-app/02-guides/forms.md`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`]
- [Source: `package.json`]
- [Source: `src/features/contact/telegram.ts`]
- [Source: `src/features/store/public-contact-cta.tsx`]
- [Source: `src/features/store/public-catalog.ts`]
- [Source: `src/features/store/public-queries.ts`]
- [Source: `supabase/migrations/20260802090000_add_store_telegram_contact.sql`]
- [External: https://core.telegram.org/api/links#public-username-links]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `node --test scripts/telegram-handoff.test.mjs scripts/cta-click-contract.test.mjs scripts/telegram-handoff-contract.test.mjs scripts/contact-contract.test.mjs` — 12 tests passed.
- `npm.cmd run check` — lint, typecheck, production build, and smoke passed; one existing `@next/next/no-img-element` warning remains in `src/features/product/product-media-manager.tsx`.
- Supabase runtime/RLS and real Telegram client opening were not available in the local harness; migration and route contracts are covered by static/source checks.

### Completion Notes List

- Story context created from Epic 3, PRD, architecture spine, UX system, Story 3.4 learnings, current source, and official Telegram deep-link documentation.
- Added server-owned Telegram message/URL generation from the current published product snapshot, including fixed/request price and stable product URL.
- Added append-only analytics event migration and a security-definer RPC that validates published product/contact state before inserting `cta_click`.
- Added Next.js route handler that re-queries public data, records CTA intent before returning the handoff, and carries optional source/session metadata.
- Reworked the shared CTA for catalog/detail/preview with user-gesture window opening, pending/error/copy states, accessible fallback, and preview exclusion.
- Preserved the existing Story 3.4 dirty worktree changes; only the files below were touched for Story 3.5.

### File List

- `_bmad-output/implementation-artifacts/3-5-telegram-handoff-with-prefilled-product-message.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/cta-click-contract.test.mjs`
- `scripts/smoke-foundation.mjs`
- `scripts/telegram-handoff-contract.test.mjs`
- `scripts/telegram-handoff.test.mjs`
- `src/app/api/contact/telegram/route.ts`
- `src/app/api/contact/telegram/preview/route.ts`
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx`
- `src/features/analytics/cta-click.ts`
- `src/features/contact/README.md`
- `src/features/contact/handoff.ts`
- `src/features/contact/handoff-service.ts`
- `src/features/contact/preview.ts`
- `src/features/contact/telegram-request.ts`
- `src/features/contact/telegram-route.ts`
- `src/features/contact/telegram.ts`
- `src/features/store/public-catalog-view.tsx`
- `src/features/store/public-contact-cta.tsx`
- `src/features/store/public-product-detail.tsx`
- `src/features/store/public-storefront-shell.tsx`
- `supabase/migrations/20260802110000_create_analytics_events.sql`
- `scripts/handoff-contract.test.mjs`
- `scripts/preview-contract.test.mjs`
- `scripts/telegram-request.test.mjs`

### Change Log

- 2026-08-02: Created comprehensive implementation story for Telegram handoff with prefilled product message.
- 2026-08-02: Started implementation; status moved to in-progress.
- 2026-08-02: Implemented Telegram handoff, CTA-click ingestion boundary, copy fallback, preview exclusion, and regression contracts; validation passed and status moved to review.

### Review Findings

- [x] [Review][Patch][high] Seller preview loses preview context on product detail [`src/features/store/public-catalog-view.tsx:48-71`, `src/app/(public)/[storeSlug]/products/[productId]/page.tsx:15-40`] — the preview catalog links to the ordinary public product URL, and the public product page renders the CTA without `isPreview`; a seller clicking the CTA from preview detail therefore records a buyer `cta_click`, violating AC4.
- [x] [Review][Patch][high] Preview exclusion is controlled by the client [`src/app/api/contact/telegram/route.ts:53-62`, `src/features/contact/handoff.ts:75-92`] — the API accepts `body.isPreview` and the service skips analytics when it is true, so any public caller can suppress a valid CTA event; preview status must be derived or authorized server-side, and public requests must not be able to opt out of analytics.
- [x] [Review][Patch][medium] Non-object JSON causes an unhandled 500 [`src/app/api/contact/telegram/route.ts:16-42`] — `POST` dereferences `body.storeSlug` after parsing without checking that the JSON value is a non-null object; `null` and array payloads should return the documented 400 response.
- [x] [Review][Patch][medium] Product detail now fails closed on contact lookup errors [`src/app/(public)/[storeSlug]/products/[productId]/page.tsx:15-30`] — the page queries the store/contact profile and throws before querying the product, introducing a new failure boundary that can hide an otherwise public product; preserve product visibility and disable the CTA safely when optional contact lookup fails.
- [x] [Review][Patch][medium] Anonymous CTA ingestion has no abuse control [`supabase/migrations/20260802110000_create_analytics_events.sql:61-66,107-110`] — the security-definer RPC is executable by `anon` and accepts unlimited repeated writes for known public IDs, allowing analytics inflation and unbounded storage growth; add an appropriate rate/replay bound before relying on this event ledger.
- [x] [Review][Patch][medium] Product URL fallback trusts the request Host [`src/app/api/contact/telegram/route.ts:54-55`, `src/features/contact/telegram.ts:101-107`] — when `NEXT_PUBLIC_SITE_URL` is absent, `request.url` supplies the origin and is only scheme-validated, so a spoofed host can place an attacker-controlled product link in the seller message; use a trusted configured origin or an allowlist.
- [x] [Review][Patch][medium] Handoff requests can remain pending forever [`src/features/store/public-contact-cta.tsx:31-59,105`] — the CTA opens an `about:blank` tab and disables itself before `fetch` resolves, with no timeout or abort path; a stalled request leaves the buyer with a blank tab and no retry/fallback state.
- [x] [Review][Patch][low] Clipboard fallback can leak a hidden textarea [`src/features/store/public-contact-cta.tsx:72-85`] — if `document.execCommand("copy")` throws, the temporary textarea is not removed; clean it up in a `finally` block.
- [x] [Review][Patch][medium] Route/service tests are source-contract checks, not behavioral tests [`scripts/telegram-handoff-contract.test.mjs:8-29`] — the test uses regex and `indexOf` assertions and never executes the route or mocks the Supabase boundary, so request validation, preview authorization, and append-before-response behavior are not actually proven as required by Task 5.
