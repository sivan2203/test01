---
baseline_commit: pending-uncommitted-story-1-4
---

# Story 2.1: Create Product Draft Manually

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,  
I want to manually create a product draft with core product information,  
so that I can start building my storefront catalog without publishing incomplete products.

## Acceptance Criteria

1. **Given** I am an authenticated seller with a store  
   **When** I open the Products section and choose to add a product  
   **Then** I can create a product with title, price or "по запросу", description, availability status, and draft status  
   **And** the product is saved as Draft by default.

2. **Given** I am creating a product draft  
   **When** I leave required fields empty or enter invalid values  
   **Then** the product is not saved as a valid draft/published item where validation requires it  
   **And** field-level errors explain what must be corrected.

3. **Given** a product is saved as Draft  
   **When** a buyer opens the public storefront or direct product URL  
   **Then** the draft product is not visible publicly  
   **And** public direct access returns a not-found state without private data leakage.

4. **Given** I save a product draft successfully  
   **When** I return to the Products list  
   **Then** the product appears in my seller product list with Draft status  
   **And** I can reopen it for editing.

5. **Given** I use the product creation form on mobile  
   **When** I fill fields and save  
   **Then** labels, helper text, errors, and primary actions are readable and tappable at 360-430px  
   **And** unsaved field values are preserved if saving fails.

## Tasks / Subtasks

- [x] Add product persistence with seller-owned Draft defaults (AC: 1, 2, 3, 4)
  - [x] Add a timestamped SQL migration for `public.products`.
  - [x] Model `id`, `store_id`, `title`, `description`, `price_mode`, `price_amount`, `availability_status`, `status`, `created_at`, and `updated_at`.
  - [x] Default `status` to `draft`; do not create Published, Hidden, Deleted transitions in this story.
  - [x] Add CHECK constraints for title length, optional description length, price mode/amount consistency, availability values, and lifecycle status values.
  - [x] Enable RLS and add seller-owned SELECT/INSERT/UPDATE policies through the owning store; never trust a client-submitted seller id.
  - [x] Add indexes needed by seller list and public published lookup: at minimum `store_id`, `(store_id, status)`, and owner/RLS-friendly access through stores.

- [x] Create product domain model, validation, queries, and actions (AC: 1, 2, 4, 5)
  - [x] Create `src/features/product/` with schema, form-state, seller queries, and server actions following the `features/store` result-object pattern.
  - [x] Validation rules: title required, title max 120 characters, description optional max 1,000 characters, `price_mode` is `fixed` or `request`, fixed price requires a positive amount, request price stores no amount, availability is `in_stock` or `out_of_stock`.
  - [x] Use `Array.from(value).length` for user-visible character counts, matching store validation.
  - [x] Server actions must call `createSupabaseServerClient()`, read `auth.getUser()`, resolve the current seller store server-side, and insert/update only that store's products.
  - [x] Preserve submitted values and field-level errors on validation, auth, missing-store, RLS, network, and database failures.
  - [x] Revalidate `/seller/products` and the edited product route after successful save.

- [x] Build mobile-first seller Products list and Add Product flow (AC: 1, 4, 5)
  - [x] Replace the current products placeholder at `src/app/(seller)/seller/(admin)/products/page.tsx` with a protected seller product list.
  - [x] Add a primary `Добавить товар` action with a 44x44 CSS px tap target.
  - [x] Add `src/app/(seller)/seller/(admin)/products/new/page.tsx` for creating a draft.
  - [x] Add `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx` so a saved Draft can be reopened for core-field editing.
  - [x] Show Draft status in the seller list and keep empty/error states text-first.
  - [x] Do not implement status filters, publish/hide/delete controls, product photos, Telegram CTA, import, or public buyer cards in this story.

- [x] Keep draft products invisible to public and preview buyer surfaces (AC: 3)
  - [x] Extend `src/features/store/public-catalog.ts` into a real server-only published-product query seam instead of returning a hardcoded empty list.
  - [x] Public catalog queries must include `status = "published"` at repository/query boundary; do not filter draft/hidden/deleted only in UI.
  - [x] If a public product detail route is added as a seam, it must use a published-only query and `notFound()` for Draft products. Otherwise, leave direct product URLs unimplemented so they 404.
  - [x] Seller preview must keep using the same public catalog seam and must not show Draft products in normal buyer preview.

- [x] Extend verification guardrails (AC: all)
  - [x] Extend `scripts/smoke-foundation.mjs` to require product feature files, product routes, product migration, RLS policies, server-only/public-boundary checks, and no service-role imports in product feature code.
  - [x] Smoke must fail if public catalog code lacks a `status`/`published` repository filter.
  - [x] Smoke must fail if product actions accept `seller_id` or `store_id` from form data instead of resolving store ownership server-side.
  - [x] Run `npm.cmd run check`; it must pass lint, Next typegen + typecheck, production build, and smoke.
  - [x] Update README only if local setup changes; otherwise leave it unchanged.

### Review Findings

- [x] [Review][Patch] RLS permits direct non-draft product writes before publish transitions exist [supabase/migrations/20260801183000_create_products.sql:61]
- [x] [Review][Patch] Product edit identity is controlled by hidden form data instead of the route/action boundary [src/features/product/actions.ts:31]
- [x] [Review][Patch] Public buyer product cards are implemented despite being out of Story 2.1 scope [src/features/store/public-storefront-shell.tsx:79]
- [x] [Review][Patch] Malformed edit route product IDs render a generic load error instead of not-found [src/features/product/queries.ts:154]
- [x] [Review][Patch] Smoke guardrails miss required product route/public-catalog service-role and migration-boundary checks [scripts/smoke-foundation.mjs:397]

## Dev Notes

### Scope Boundary

This story creates the product Draft foundation. It is the first product persistence story, so it must set safe lifecycle/data boundaries for later media, publication, public catalog, Telegram, analytics, and import stories.

Do:

- create a seller-owned `products` table and RLS policies;
- create/edit Draft products with core fields only;
- show saved Drafts in the seller Products list;
- enforce product visibility at query boundary so Draft products never reach public/preview buyer surfaces;
- preserve mobile-first, text-first validation behavior.

Do not:

- implement product photos/media, publish/hide/delete transitions, status filters, product import, public product detail UI, buyer catalog cards, Telegram handoff, analytics events, source attribution, orders, payments, reviews, chat, or buyer accounts;
- use service-role clients for ordinary seller product work;
- trust `seller_id` or `store_id` from client form data;
- make Draft products visible in public storefront, preview buyer mode, public catalog query results, or direct public product URLs.

### Requirements Trace

`FR5`, `FR7`, `FR21`, `NFR6`, `AD-5`, `AD-13`, `AD-15`, `AD-17`, `UX-DR10`, `UX-DR13`, `UX-DR14`.

### Previous Story Intelligence

Story 1.4 is complete and marked `done` in the working tree, but its implementation is not committed at the time this story was created. Treat the current working tree as the implementation baseline for Story 2.1 until the user commits Story 1.4.

Actionable learnings from Story 1.4:

- `src/features/store/public-catalog.ts` exists as a server-only published catalog seam. Story 2.1 must extend this file into a real published-products query instead of creating a parallel public catalog repository.
- The code review for Story 1.4 found that buyer preview must use the exact buyer-safe public model, not seller-only data. Apply the same rule to products: preview/public shell may receive only published buyer-facing product fields.
- Smoke checks currently enforce no draft/hidden placeholders or analytics calls in public/preview storefront shell. Extend those checks rather than replacing them.
- Story file encoding must stay clean UTF-8 without BOM; avoid PowerShell `Set-Content` rewrites for markdown when possible.
- Current public route guardrails still apply: public routes must not import seller-admin modules, must not require buyer auth, and public not-found must not hide infrastructure errors.

Recent commits:

- `011a3a9 Complete public store slug setup`
- `b3677ac feat: add store profile editor`
- `6d9d32c feat: add seller auth shell`
- `79abcc0 feat: initialize web app foundation`

### Architecture Guardrails

- Vertical-slice modular monolith: product capability should live in `src/features/product` plus seller route segments under `(seller)/seller/(admin)/products`. Shared code is allowed only for primitives/adapters/auth/session/analytics/design-system. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#Design-Paradigm`]
- Mobile viewport `360-430px` is the primary acceptance surface. Keep the product form one-column, readable, and tappable. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-1`]
- Product visibility is derived only from lifecycle state. Public queries include only `status=published`; Draft, Hidden, and Deleted are excluded at repository/query boundary. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- Domain mutations go through server-side application services/actions. Client components must not write database rows directly. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- Supabase privilege boundary: seller-scoped reads/writes use SSR/user clients with RLS; ordinary seller server actions must not import service-role. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- Schema/RLS/storage changes are migration-owned under `supabase/migrations/`. Product table and policies must be represented in a timestamped SQL migration. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- Product media belongs to later stories. Do not create product storage buckets or media tables here unless absolutely necessary; Story 2.2 owns product photos/media. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-12`]

### Product Data Contract for This Story

Use these names unless an implementation-blocking reason is found:

- `status`: `draft | published | hidden | deleted`; default `draft`; Story 2.1 can create/update only Draft records.
- `price_mode`: `fixed | request`.
- `price_amount`: numeric amount used only when `price_mode = fixed`; `null` when `price_mode = request`.
- `availability_status`: `in_stock | out_of_stock`.
- `title`: required, trim before save, 1-120 user-visible characters.
- `description`: optional, trim before save, max 1,000 user-visible characters.

Recommended database constraints:

- `char_length(btrim(title)) between 1 and 120`
- `description is null or char_length(description) <= 1000`
- `price_mode in ('fixed', 'request')`
- `(price_mode = 'request' and price_amount is null) or (price_mode = 'fixed' and price_amount is not null and price_amount > 0)`
- `availability_status in ('in_stock', 'out_of_stock')`
- `status in ('draft', 'published', 'hidden', 'deleted')`

### UX Guardrails

- Product create/edit belongs to Seller Product list / Product create/edit surfaces. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Information-Architecture`]
- Product state control makes Draft/Published/Hidden explicit, but Story 2.1 should surface Draft only and leave publish/hide/delete for Story 2.3. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- Draft can save without photos; publish is disabled until photos in later stories. Do not block Draft creation because product photos are absent. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- Product save failure must keep local form values, show field/page error, and allow retry. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- Form fields use label above, helper/error below, and field-level errors before page-level errors. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- Empty states should have one short explanation and one next action. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]

### Existing Files to Read Before Implementation

Read these files completely before editing:

- `src/app/(seller)/seller/(admin)/products/page.tsx` — current Products placeholder to replace.
- `src/app/(seller)/seller/(admin)/layout.tsx` — seller shell/navigation and mobile width constraints.
- `src/features/store/queries.ts` — current seller-scoped store lookup and result union pattern.
- `src/features/store/actions.ts`, `src/features/store/form-state.ts`, `src/features/store/schema.ts`, `src/features/store/store-profile-form.tsx` — server action, validation, form state, and `useActionState` pattern to mirror.
- `src/features/store/public-catalog.ts` — published catalog seam from Story 1.4 to extend.
- `src/features/store/public-storefront-shell.tsx` and `src/app/(public)/[storeSlug]/page.tsx` — public/preview buyer boundary to preserve.
- `src/lib/supabase/server.ts` and `src/lib/supabase/service-role.ts` — allowed SSR user client and forbidden ordinary seller service-role boundary.
- `scripts/smoke-foundation.mjs` — verification harness to extend.
- `supabase/migrations/20260801143000_create_stores.sql` and `supabase/migrations/20260801160000_add_store_slug.sql` — migration/RLS style to follow.

### Suggested File Structure

```text
supabase/migrations/20260801HHMMSS_create_products.sql
src/app/(seller)/seller/(admin)/products/page.tsx
src/app/(seller)/seller/(admin)/products/new/page.tsx
src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx
src/features/product/actions.ts
src/features/product/form-state.ts
src/features/product/product-form.tsx
src/features/product/queries.ts
src/features/product/schema.ts
src/features/store/public-catalog.ts
scripts/smoke-foundation.mjs
```

Use existing components (`Button`, `GlassPanel`, form field patterns) rather than introducing new UI libraries.

### Latest Technical Notes

- Next.js Forms guide shows Server Actions can be used directly as `<form action={...}>`; with `useActionState`, the hook returns current state, action, and pending boolean for disabled/loading states. Use this pattern to preserve validation state in the product form. [Source: Next.js Forms guide — https://nextjs.org/docs/app/guides/forms]
- Supabase RLS policies should be attached per table and can enforce ownership through `using` and `with check`. For insert policies, `with check ((select auth.uid()) = owner_column)` is the relevant pattern; for product ownership through stores, use an `exists` check against `stores.seller_id`. [Source: Supabase Row Level Security docs — https://supabase.com/docs/guides/database/postgres/row-level-security]
- Supabase docs note `auth.uid()` returns `null` for unauthenticated requests; policies should target `authenticated` and use `(select auth.uid())` consistently, matching existing store migrations. [Source: Supabase Row Level Security docs — https://supabase.com/docs/guides/database/postgres/row-level-security]

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- Product migration present with table, constraints, RLS enabled, seller-owned policies, and indexes.
- Seller Products page builds and includes an add-product entry point.
- Product create route builds and saves Draft by default through a server action.
- Product edit route builds and can reopen an owned Draft without accepting owner IDs from route/form input beyond the product id path segment.
- Validation preserves submitted values and field errors for invalid title/price/description/availability.
- Public catalog seam queries only `status=published`; Draft products created in this story are not returned.
- No service-role import in `src/features/product`, seller product routes, public catalog, or client components.
- Smoke checks cover product boundaries listed above.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-2.1-Create-Product-Draft-Manually`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-5-Manual-product-creation`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-7-Product-lifecycle-states`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-21-Mobile-first-responsive-surfaces`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#NFR-6-Data-Integrity`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- [Source: `_bmad-output/implementation-artifacts/1-4-preview-store-as-buyer.md#Previous-Story-Intelligence`]
- [Source: Next.js Forms — https://nextjs.org/docs/app/guides/forms]
- [Source: Supabase RLS — https://supabase.com/docs/guides/database/postgres/row-level-security]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Implementation Plan

- Start with product migration/RLS and smoke RED checks for persistence/visibility boundaries.
- Add `features/product` schema/form-state/actions/queries following the existing store feature result-object pattern.
- Replace seller products placeholder with product list plus add/edit routes.
- Extend `features/store/public-catalog.ts` to use the products table with published-only filtering.
- Run full `npm.cmd run check` before marking complete.

### Debug Log References

- `sprint-status.yaml` reviewed; next backlog story selected: `2-1-create-product-draft-manually`.
- Epic 2 and Story 2.1 acceptance criteria extracted from `epics.md`.
- PRD, architecture, UX, previous Story 1.4, existing product placeholder, store actions/schema/query patterns, Supabase migrations, and smoke harness reviewed.
- Official Next.js Forms and Supabase RLS docs checked for current implementation guidance.
- Project `AGENTS.md` checked; local Next.js 16 docs for forms, server actions, and dynamic routes were reviewed against the implementation.

### Completion Notes List

- Added product Draft persistence with Supabase migration, constraints, indexes, seller-owned RLS policies, and published-only public catalog RPC.
- Added product schema, validation, form state, seller queries, and server action for create/update Draft flows without accepting client owner IDs.
- Replaced seller Products placeholder with mobile-first Draft list, Add Product route, and Draft edit route.
- Extended public catalog seam and storefront shell so only published buyer-facing product fields can reach public/preview surfaces.
- Extended smoke guardrails for product routes, migration/RLS, no service-role usage, no client-submitted ownership, and published-only public visibility.
- Verified with `npm.cmd run check`.

### File List

- `_bmad-output/implementation-artifacts/2-1-create-product-draft-manually.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `supabase/migrations/20260801183000_create_products.sql`
- `src/app/(seller)/seller/(admin)/products/page.tsx`
- `src/app/(seller)/seller/(admin)/products/new/page.tsx`
- `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx`
- `src/features/product/actions.ts`
- `src/features/product/form-state.ts`
- `src/features/product/product-form.tsx`
- `src/features/product/queries.ts`
- `src/features/product/schema.ts`
- `src/features/store/public-catalog.ts`
- `src/features/store/public-storefront-shell.tsx`

### Change Log

- 2026-08-01: Created Story 2.1 context package and marked ready for development.
- 2026-08-01: Implemented Story 2.1 Draft product create/edit foundation and marked ready for review.
- 2026-08-01: Applied code review patches and verified the completed Story 2.1 implementation.
