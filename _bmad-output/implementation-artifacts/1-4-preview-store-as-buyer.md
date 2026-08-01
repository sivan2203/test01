---
baseline_commit: pending-uncommitted-story-1-3
---

# Story 1.4: Preview Store as Buyer

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,  
I want to preview my storefront as a buyer would see it,  
so that I can check my public presentation before sharing the link.

## Acceptance Criteria

1. **Given** I am an authenticated seller with a store  
   **When** I open preview mode  
   **Then** I see the buyer-facing storefront layout for my store  
   **And** the preview uses the same structure as the public storefront.

2. **Given** my store has draft or hidden products  
   **When** I open buyer preview  
   **Then** unpublished products are not shown in the normal buyer view  
   **And** draft-only visibility is available only through an explicit seller draft context if implemented.

3. **Given** I am in preview mode  
   **When** the storefront is displayed  
   **Then** a seller-only preview indicator is visible  
   **And** the indicator is not part of the public buyer storefront.

4. **Given** I view or tap CTA elements in preview mode  
   **When** analytics events would normally be recorded  
   **Then** preview views and preview CTA taps are excluded from analytics.

5. **Given** the preview is opened on mobile  
   **When** I navigate between seller admin and preview  
   **Then** the flow is clear and reversible  
   **And** the preview remains usable at 360-430px viewport width.

## Tasks / Subtasks

- [x] Add a seller-only preview entry point from store settings (AC: 1, 3, 5)
  - [x] Add a clear `Посмотреть как покупатель` action to `/seller/store` when the authenticated seller has a store.
  - [x] If the store has no saved slug yet, show a text-first disabled/empty state explaining that the public link must be configured before preview can open.
  - [x] Link to a seller-authenticated preview route; do not open the public URL directly as the preview surface.
  - [x] Keep the control at least 44x44 CSS px and usable on 360-430px mobile width.

- [x] Create a protected seller preview route that reuses public storefront rendering structure (AC: 1, 3, 5)
  - [x] Add a route under the seller/admin surface, for example `src/app/(seller)/seller/(admin)/store/preview/page.tsx`.
  - [x] Load the current authenticated seller's store through seller-scoped queries; never accept `seller_id` or store id from query params.
  - [x] Reuse the same presentational storefront shell/components as `src/app/(public)/[storeSlug]/page.tsx` where possible, factoring shared UI into `src/features/store/public-storefront-shell.tsx` or similar.
  - [x] Add a seller-only preview indicator/badge that is rendered only by the preview route, not by the public route.
  - [x] Add an obvious return action back to `/seller/store`; do not rely on browser back only.

- [x] Preserve public route behavior while introducing preview context (AC: 1, 3)
  - [x] Keep `src/app/(public)/[storeSlug]/page.tsx` public and unauthenticated.
  - [x] Keep missing, invalid, old, or non-canonical slugs returning `notFound()`; do not relax Story 1.3 route identity rules.
  - [x] Public storefront must not import seller-admin route components or seller-only services.
  - [x] Preview may render owner-visible chrome, but that chrome must be supplied by preview context rather than leaking into public rendering.

- [x] Keep unpublished product visibility out of normal buyer preview (AC: 2)
  - [x] Because product persistence is not implemented yet, add explicit query/service seams and smoke checks so future product stories cannot render Draft/Hidden products in normal preview by client-side filtering.
  - [x] If a product list placeholder is shown, it must represent the public buyer state only: no draft/hidden examples in normal preview.
  - [x] Do not implement draft-only preview context unless a precise, seller-only context flag and data boundary are added; otherwise leave it out.
  - [x] Do not add product tables, product media, product detail routes, publication workflow, or product analytics in this story.

- [x] Ensure preview does not create analytics side effects (AC: 4)
  - [x] Do not call analytics ingestion from preview route or preview CTA placeholders.
  - [x] If analytics hooks/components are introduced as seams, require an explicit `context: "public" | "preview"` or equivalent and make preview excluded by default.
  - [x] Keep `src/features/analytics` and `src/app/api/analytics/route.ts` out of scope unless only adding static guardrails/no-op seams is necessary.

- [x] Extend verification for preview guardrails (AC: 1, 2, 3, 4, 5)
  - [x] Extend `scripts/smoke-foundation.mjs` to verify the preview route builds and remains behind `/seller`.
  - [x] Add static checks that public route does not render preview indicator text and does not import seller/admin modules.
  - [x] Add static checks that preview route renders a seller-only indicator and a return link to `/seller/store`.
  - [x] Add static checks that preview/public storefront shell does not contain draft/hidden product placeholders or analytics event calls.
  - [x] Run `npm.cmd run check`; it must pass lint, Next typegen + typecheck, production build, and smoke.
  - [x] Update README only if new local setup instructions are introduced; otherwise leave it unchanged.

### Review Findings

- [x] [Review][Patch] Preview can render seller-only avatar that public buyers cannot see [src/app/(seller)/seller/(admin)/store/preview/page.tsx:73]
- [x] [Review][Patch] Published-only catalog visibility seam is only a UI type, not a query/service boundary [src/features/store/public-storefront-shell.tsx:13]
- [x] [Review][Patch] Story file was rewritten with UTF-8 BOM / mojibake noise [_bmad-output/implementation-artifacts/1-4-preview-store-as-buyer.md:1]

## Dev Notes

### Scope Boundary

This story adds seller preview-as-buyer for the current store. It is a UX/navigation and rendering-boundary story, not a product catalog story.

Do:

- create a protected preview route for the authenticated seller's own store;
- reuse public storefront layout structure so preview and public rendering do not diverge;
- show a seller-only preview indicator and a clear return path;
- keep preview analytics excluded;
- preserve Story 1.3 current-slug public route behavior.

Do not:

- implement product CRUD, product media, product publication, product detail, Telegram handoff, analytics ingestion, source attribution, import, orders, payments, reviews, ratings, chat, buyer accounts, custom domains, short links, slug aliases, or redirects;
- show draft/hidden product examples in normal buyer preview;
- import seller-admin-only modules into public buyer routes;
- make the public route require auth.

### Requirements Trace

`FR4`, `FR21`, `FR22`, `AD-2`, `AD-5`, `AD-7`, `AD-20`, `UX-DR20`.

### Previous Story Intelligence

Story 1.3 is complete in the working tree and marked `done`, but its implementation is not committed yet at the time this story was created. Treat the current working tree as the implementation baseline for Story 1.4 until the user commits Story 1.3.

Established patterns and guardrails to reuse:

- Public store identity lives at root `/(public)/[storeSlug]` and uses `getPublicStoreBySlug()` from `src/features/store/public-queries.ts`.
- `getPublicStoreBySlug()` returns a result union: `found`, `not_found`, `error`. Preserve this distinction; infrastructure/RPC errors must not become false 404s.
- Non-canonical public slugs such as uppercase route segments return not-found; do not normalize public route segments into valid current slugs.
- `public.stores.slug` is nullable, unique when present, SQL-validated, and reserves root collisions including `seller`.
- Public slug RPC returns only buyer-safe store fields; do not reintroduce internal store UUID exposure to anon callers.
- `/seller/store` owns store setup and edit UI. Extend it with a preview entry point rather than creating a competing settings surface.
- `scripts/smoke-foundation.mjs` already enforces route/build guardrails and should be extended with preview-specific checks.
- Story 1.3 code review fixed stale slug UI state, false public 404s, route collision, public UUID exposure, and avatar reselect race. Do not regress those checks.

Recent commits:

- `b3677ac feat: add store profile editor`
- `6d9d32c feat: add seller auth shell`
- `79abcc0 feat: initialize web app foundation`

### Architecture Guardrails

- MVP is responsive web; phone viewport `360-430px` is the primary acceptance surface. Desktop may enhance layout but cannot change feature semantics. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-1`]
- Seller admin and public storefront are separate route/module surfaces. Public storefront routes never require buyer auth and never import seller-admin-only UI/services. Seller preview must call public rendering paths with preview context, and preview analytics are excluded at ingest. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-2`]
- Product visibility is derived only from lifecycle state. Public/normal buyer preview queries include only `status=published`; Draft, Hidden, and Deleted are excluded at repository/query boundary, not filtered only in UI. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- Analytics is append-only observed-event ledger, but this story must not emit preview events. Preview exclusions belong at ingest when analytics ships. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-7`]
- Public route availability and activation completeness are distinct. A valid current slug is enough for route resolvability; published products are not required for the store route to exist. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-20`]
- Schema/RLS/storage changes are migration-owned. Avoid schema changes in this story unless strictly required; product and analytics schemas belong to later epics. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]

### UX Guardrails

- Preview as buyer is reached from dashboard/store editor and uses public storefront layout with a seller-only preview indicator. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Flow-5-Preview-as-buyer`]
- Seller preview state has a badge/indicator for seller only; analytics are not counted. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- Public storefront composition is store header plus catalog list/grid. Product catalog may be empty; missing product functionality should be represented as an empty/public placeholder, not as seller draft content. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Buyer-surfaces`]
- Navigation between seller admin and preview must be reversible and explicit. Preview should include a clear return action; buyer public route should not show app-like seller nav. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Information-Architecture`]
- Mobile seller flows are one column at `360-430px`; primary actions remain readable and tappable. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Responsive-&-Platform`]

### Existing Files to Read Before Implementation

Read these files completely before editing:

- `src/app/(public)/[storeSlug]/page.tsx` — current public storefront placeholder/current-slug rendering path.
- `src/features/store/public-queries.ts` — public current-slug resolver and result union.
- `src/app/(seller)/seller/(admin)/store/page.tsx` — seller store page wrapper and protected route context.
- `src/features/store/store-profile-form.tsx` — current store editor and public-link controls where preview entry may be added or adjacent component may be used.
- `src/features/store/queries.ts` — seller-scoped store profile read model.
- `src/app/(seller)/seller/(admin)/layout.tsx` — seller shell/navigation to preserve.
- `src/components/ui/button.tsx` and `src/components/design-system/surface.tsx` — existing primitives.
- `scripts/smoke-foundation.mjs` — current verification harness.
- `src/lib/supabase/server.ts` and `src/lib/supabase/service-role.ts` — allowed SSR/user boundary and forbidden service-role boundary.
- `src/proxy.ts` and `src/proxy-rules.mjs` — seller route auth guard.

### Suggested File Structure

```text
src/app/(seller)/seller/(admin)/store/preview/page.tsx
src/app/(public)/[storeSlug]/page.tsx
src/features/store/public-storefront-shell.tsx
src/features/store/public-queries.ts
src/features/store/queries.ts
src/features/store/store-profile-form.tsx
scripts/smoke-foundation.mjs
```

Use existing files where possible. A separate shared shell component is preferred if it prevents public/preview divergence.

### Latest Technical Notes

- Next.js `notFound()` terminates rendering for missing resources and renders the segment not-found UI; use it for missing public slugs, not for infrastructure failures. [Source: Next.js notFound docs — https://nextjs.org/docs/app/api-reference/functions/not-found]
- Next.js `redirect()` can be used from Server Components and throws to terminate rendering; if a preview route redirects, keep redirect calls outside `try/catch`. [Source: Next.js redirect docs — https://nextjs.org/docs/app/api-reference/functions/redirect]
- Supabase RLS should stay enabled for exposed `public` tables; service-role clients must not appear in browser/public route code. Security-definer functions can bypass RLS and must expose only minimal, intended data. [Source: Supabase Row Level Security docs — https://supabase.com/docs/guides/database/postgres/row-level-security]

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- Seller preview route builds under `/seller/...` and remains protected by the existing seller auth guard.
- `/seller/store` offers a clear preview action only when the seller has a store/slug or a clear disabled state when slug is missing.
- Public `[storeSlug]` route remains unauthenticated and keeps Story 1.3 current-slug not-found/error behavior.
- Preview route renders seller-only indicator; public route does not.
- Preview route includes an explicit return action to `/seller/store`.
- Preview/public shell does not render draft/hidden product placeholders in normal buyer view.
- Preview code does not call analytics ingestion or CTA event recording.
- No service-role import in `src/features/store`, public routes, preview route, or client components.

If no live Supabase project is configured locally, checks should verify code paths, route builds, and static guardrails without requiring live database writes.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.4-Preview-Store-as-Buyer`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-4-Store-preview`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#Public-visibility-and-link-behavior`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-2`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-7`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Flow-5-Preview-as-buyer`]
- [Source: `_bmad-output/implementation-artifacts/1-3-configure-public-store-slug.md#Previous-Story-Intelligence`]
- [Source: Next.js notFound — https://nextjs.org/docs/app/api-reference/functions/not-found]
- [Source: Next.js redirect — https://nextjs.org/docs/app/api-reference/functions/redirect]
- [Source: Supabase Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Implementation Plan

- Factor a shared public storefront shell first so preview and public route share structure.
- Add protected seller preview route that loads the current seller store and passes preview context to the shell.
- Add preview entry point from store settings with disabled/missing-slug state.
- Extend smoke checks to guard route protection, preview badge isolation, no analytics side effects, no draft/hidden placeholders, and no service-role imports.
- RED/GREEN/REFACTOR executed with smoke guardrails first: preview files/shell checks failed before implementation, then passed after route/shell/form changes.
- Code review patch pass completed: preview now uses buyer-safe store projection, catalog visibility has a server-only public seam, and the story file was normalized without BOM.

### Debug Log References

- `sprint-status.yaml` reviewed; next backlog story selected: `1-4-preview-store-as-buyer`.
- Story 1.3 file and current Story 1.3 working-tree implementation reviewed for slug/public-route guardrails.
- Relevant epics, PRD, architecture, and UX excerpts reviewed for FR4, AD-2, AD-5, AD-7, AD-20, and preview flow.
- Official Next.js `notFound`/`redirect` docs and Supabase RLS docs checked for current framework guidance.
- `npm.cmd run smoke` failed in RED phase because preview route and storefront shell were intentionally missing.
- `npm.cmd run lint` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run check` passed after implementation.
- `npm.cmd run check` passed after code review patches.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Story 1.4 scope is preview-as-buyer only; products, Telegram, analytics ingestion, and public catalog implementation remain out of scope.
- Added a shared buyer-facing storefront shell reused by public route and seller preview route.
- Added protected `/seller/store/preview` route that loads only the authenticated seller's own store, shows a seller-only preview indicator, and includes an explicit return link.
- Added a `/seller/store` preview entry point with a disabled text-first state until the public slug is saved.
- Added a server-only public catalog seam returning buyer-visible published catalog items only; it returns an empty list until product persistence ships.
- Code review fix: preview strips seller-only avatar data until the public storefront exposes the same buyer-facing avatar model.
- Code review fix: story file normalized back to clean UTF-8 without BOM/mojibake noise.
- Extended smoke guardrails for preview route build coverage, public/preview isolation, no draft/hidden placeholders, no analytics calls, and no service-role leakage.

### File List

- `_bmad-output/implementation-artifacts/1-4-preview-store-as-buyer.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/app/(public)/[storeSlug]/page.tsx`
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx`
- `src/features/store/public-catalog.ts`
- `src/features/store/public-storefront-shell.tsx`
- `src/features/store/store-profile-form.tsx`

### Change Log

- 2026-08-01: Created Story 1.4 context package and marked ready for development.
- 2026-08-01: Implemented seller preview-as-buyer route, shared public storefront shell, store-settings preview entry point, and preview guardrail checks.
- 2026-08-01: Addressed code review findings: buyer-safe preview projection, public catalog seam, and clean story-file encoding.
