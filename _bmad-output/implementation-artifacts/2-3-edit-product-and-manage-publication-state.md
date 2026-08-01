---
baseline_commit: c9e3999
---

# Story 2.3: Edit Product and Manage Publication State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,
I want to edit a product and control whether it is Draft, Published, Hidden, or Deleted,
so that I decide exactly what buyers can see in my storefront.

## Acceptance Criteria

1. **Given** I am editing an existing product  
   **When** I change title, price/“по запросу”, description, availability, or photos  
   **Then** I can save the changes  
   **And** the updated values are reflected in seller product data.

2. **Given** a product is Draft or Hidden  
   **When** I explicitly publish it with a valid title, valid price mode/amount, valid availability, and 1–10 valid photos  
   **Then** the product becomes `published` and is returned by the published public catalog seam  
   **And** the publish action is explicit  
   **And** missing/invalid publication requirements are shown as text-first errors without changing the state.

3. **Given** a product is Published  
   **When** I explicitly hide it  
   **Then** the product becomes `hidden`  
   **And** it is removed from public storefront/catalog visibility  
   **And** its future public product lookup resolves as not found without exposing private data.

4. **Given** a product is Published  
   **When** its availability is `out_of_stock` and I save the product  
   **Then** it remains `published` and visible in the public catalog  
   **And** the public contract preserves the out-of-stock status for the later buyer CTA surface.

5. **Given** I explicitly delete a non-deleted product and confirm the destructive action  
   **When** deletion succeeds  
   **Then** the product becomes `deleted`/archived for lifecycle integrity  
   **And** it is excluded from seller edit lookup, public catalog lookup, and public product lookup  
   **And** associated public media references disappear immediately  
   **And** no private product details are returned to a buyer.

6. **Given** product state changes are saved  
   **When** seller or public queries run  
   **Then** visibility is enforced at the repository/RPC boundary  
   **And** Draft, Hidden, and Deleted products cannot appear because of client-side filtering mistakes.

7. **Given** I use the editor on mobile  
   **When** I save, publish, hide, or delete a product  
   **Then** the state, pending state, success/error message, and next action are clear at 360–430px  
   **And** primary controls are at least 44×44 CSS px and do not rely on color alone.

## Tasks / Subtasks

- [x] Extend the product lifecycle model and publication contract (AC: 1, 2, 3, 4, 5, 6)
  - [x] Add typed lifecycle states `draft | published | hidden | deleted` and explicit transition helpers in `src/features/product/`; do not scatter string comparisons across UI components.
  - [x] Preserve the existing Draft form contract: title is required (1–120 user-visible characters), description is optional (≤1,000 characters), price is fixed positive RUB or “по запросу”, and availability is `in_stock | out_of_stock`.
  - [x] Add server-side publication validation requiring all publishable core fields and 1–10 valid `product_media` rows; Draft save must still work with zero photos.
  - [x] Ensure saving core fields on a Published product cannot silently make it invalid or demote it. A failed validation must preserve submitted values and the existing lifecycle state.
  - [x] Define and enforce explicit transitions: `draft → published`, `hidden → published`, `published → hidden`, and any non-deleted state → `deleted`; ordinary field save preserves the current state. Do not add an implicit publish or an implicit delete.

- [x] Add server-side actions and data access for lifecycle changes (AC: 1–6)
  - [x] Refactor `src/features/product/actions.ts` so create/update actions support the current product status without accepting `seller_id`, `store_id`, `status`, or ownership data from hidden form fields.
  - [x] Add dedicated publish, hide, and delete Server Actions (or one typed lifecycle action) that accept only the route-bound product ID plus the requested transition/confirmation input.
  - [x] Re-authenticate inside every action, resolve the seller’s store server-side, verify ownership, re-read the current product/media state, validate the transition, and return typed result/form state errors.
  - [x] Publish atomically with its prerequisites: the product must not become `published` unless the server/database contract confirms valid core fields and 1–10 media rows. Map database/RLS errors to actionable Russian UI messages.
  - [x] Implement delete as a soft-delete lifecycle transition so stale URLs return public not-found and the future Story 2.4 list can decide how archived products are displayed. Do not hard-delete product rows in the request path.
  - [x] On delete, remove public references immediately and remove associated Storage objects through the Supabase Storage API using the already-established media ownership boundary. If physical cleanup fails after the state transition, keep the product private/inaccessible and return an explicit cleanup/retry/admin signal; never restore public visibility to hide a cleanup error.
  - [x] Revalidate `/seller/products`, the current editor route, the public store route, and any published product lookup paths after a successful mutation. Use `redirect` only after a successful destructive action or when the existing route contract requires it.

- [x] Make the database and RLS lifecycle boundary authoritative (AC: 2, 3, 5, 6)
  - [x] Add a timestamped migration under `supabase/migrations/` instead of editing prior migrations or relying on dashboard changes.
  - [x] Update the current `products` owner policies, which currently allow updates only while `status = 'draft'`, so authenticated seller actions can update owned non-deleted products while deleted rows cannot be edited.
  - [x] Add a database-level guard/transaction/RPC for legal status transitions and the publication prerequisite. The database must reject direct or buggy writes that publish without valid fields/media.
  - [x] Keep `status = 'published'` as the sole public visibility predicate. Public SQL/RPC must never infer visibility from availability, media presence, UI state, or a client-side filter.
  - [x] Preserve the existing private `product-media` bucket, signed URL contract, media order/cover invariant, and `remove_product_media` protection against a published product becoming photo-less.
  - [x] Keep all schema, RLS, trigger, and function changes migration-owned with a rollback note and references to FR7/NFR6/AD-5/AD-13/AD-16/AD-17.

- [x] Extend seller editor and state controls without duplicating media management (AC: 1–5, 7)
  - [x] Update `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx` and `src/features/product/product-form.tsx` to load any editable non-deleted state, not only Draft, while preserving the existing field validation and `ProductMediaManager` integration.
  - [x] Add a colocated `product-state-control.tsx` or equivalent component using the existing `Button`, `GlassPanel`, and form-field styles. Show the current state as text (`Черновик`, `Опубликован`, `Скрыт`); do not show Deleted as an editable state.
  - [x] Provide one explicit primary state action appropriate to the current state: publish for Draft/Hidden, hide for Published, and a clearly separated destructive delete action with confirmation. Keep core “save changes” separate from lifecycle transitions.
  - [x] Show publish readiness inline: missing photo count, invalid price/availability/title, and any server failure must be understandable without inspecting the network or relying on a toast.
  - [x] Preserve local field values and already-loaded media after failed core save or lifecycle action. After success, show the new state and a clear next action (continue editing, open product list, or view the public store when available).
  - [x] Keep out-of-stock Published products visually and semantically distinct from Hidden/Deleted; do not disable or remove their future CTA data in the public DTO.
  - [x] Keep all primary controls keyboard reachable and at least 44×44 CSS px at 360–430px. Destructive actions require confirmation and no modal stack deeper than one level.

- [x] Keep seller/public query boundaries correct (AC: 2–6)
  - [x] Refactor `src/features/product/queries.ts` to provide an authenticated seller-owned non-deleted product lookup for the editor and lifecycle actions; malformed IDs, unauthorized IDs, and deleted products must resolve as not found.
  - [x] Do not make the existing seller product list/filter system a full Story 2.4 implementation. Add only the minimum reachability needed so a newly Published/Hidden product is not orphaned from seller navigation; full status filters remain Story 2.4 scope.
  - [x] Preserve `src/features/store/public-catalog.ts` as the single buyer-safe published catalog seam. Extend it only if needed for a future product-detail query; do not query `products`/`product_media` directly from public route components.
  - [x] If a public product lookup seam is added, require the immutable product ID plus active store/public context, return only `published` rows and buyer-safe signed media, and return not-found for Draft/Hidden/Deleted/unauthorized products.
  - [x] Never expose `store_id`, `storage_path`, `byte_size`, seller ownership, or unsigned Storage URLs in public DTOs. Keep out-of-stock status in the DTO.

- [x] Add lifecycle-focused verification and run the full checks (AC: all)
  - [x] Extend `scripts/smoke-foundation.mjs` with the lifecycle migration, transition/action files, editor state control, public status boundary, and no service-role import assertions.
  - [x] Cover state-transition cases: Draft save with zero photos; Draft/Hidden publish success with valid data/media; publish rejection for missing photo/invalid fields; Published hide; Hidden re-publish; Published out-of-stock remains public; delete confirmation and public not-found; unauthorized/malformed/deleted IDs.
  - [x] Assert publication is rejected both in the application validation path and at the database/RPC boundary; do not rely only on UI-disabled buttons.
  - [x] Assert client-submitted owner/status/path fields cannot override server-derived identity or legal transition rules.
  - [x] Run `npm.cmd run check` (lint, Next typegen/typecheck, production build, and smoke) and fix regressions before marking this story complete.
  - [x] Update `README.md` only if the lifecycle migration or local Supabase setup adds a required step; otherwise leave it unchanged.

## Dev Notes

### Scope Boundary

This story owns editing existing products and the lifecycle state machine needed to publish, hide, and delete them. It must consume Story 2.2 media capabilities without recreating upload/reorder/remove logic.

Do:

- preserve the existing product data contract and mobile Draft editing;
- make publication explicit and server/database validated;
- keep `out_of_stock` Published products public;
- soft-delete product rows, immediately remove public visibility/media references, and keep all deleted data inaccessible through seller/public query seams;
- keep the public storefront/catalog buyer-safe and published-only.

Do not:

- implement the full buyer catalog grid, product detail UI, Telegram CTA, analytics, import, payments, orders, reviews, chat, or buyer authentication;
- publish automatically after a core-field save or after upload;
- let a client choose `store_id`, `seller_id`, storage paths, arbitrary lifecycle status, or a product row outside the route-bound ID;
- hard-delete product rows or mutate `storage.objects` directly with SQL;
- weaken the private bucket/signed URL boundary or expose Draft/Hidden/Deleted media;
- implement Story 2.4’s complete status-filtered product list.

### Requirements Trace

`FR5`, `FR7`, `FR13`, `FR21`, `NFR6`, `AD-5`, `AD-13`, `AD-16`, `UX-DR10`, `UX-DR15`, `UX-DR17`.

### Previous Story Intelligence

Story 2.2 is complete at baseline commit `c9e3999` and explicitly deferred publication readiness and published-product editor scope to this story.

- `src/features/product/actions.ts` currently creates Drafts and updates only rows with `status = 'draft'`; refactor this boundary rather than adding a parallel product mutation path.
- `src/features/product/queries.ts` currently lists and loads Drafts only. The editor must load owned non-deleted products for Published/Hidden lifecycle work, while malformed/unauthorized/deleted IDs remain not found.
- `src/features/product/media-actions.ts` already re-checks ownership/status, uses private Storage, signed reads, normalized order, and the `remove_product_media` RPC. Reuse it; do not add a second media service.
- `src/features/product/media-queries.ts` returns seller media for non-deleted products and buyer media through the published RPC. Keep the public DTO free of storage paths and byte sizes.
- `src/features/product/product-media-manager.tsx` already shows the 0–10 draft empty state and blocks removal of the last photo from a Published product. Its `productStatus` input must continue to reflect server state after lifecycle changes.
- `supabase/migrations/20260801183000_create_products.sql` defines `draft | published | hidden | deleted`, but its owner update policy currently permits Draft-only updates. A new migration must change the policy/guard safely.
- `supabase/migrations/20260801200000_create_product_media.sql` owns the private bucket, signed media RPC, reorder/remove/restore functions, and Storage policies. Do not edit or duplicate that migration.
- Prior review fixes rejected client-controlled product identity, public media leakage, service-role imports, non-atomic media removal, and missing exception boundaries. Preserve those guardrails.
- The repository uses clean UTF-8 Markdown without BOM; use patch-based edits for story files and source changes.

Recent work:

- `c9e3999 feat: complete product media story`
- `866acaa feat: add store preview and product drafts`
- `011a3a9 Complete public store slug setup`

### Product Lifecycle Contract

- `draft`: seller-editable; may have zero photos; never public.
- `published`: explicit seller action; requires valid core fields and 1–10 valid media rows; public catalog/detail seams may return it.
- `hidden`: seller-editable; may retain media; never public; explicit publish can return it to `published` after validation.
- `deleted`: soft-deleted terminal public state for this MVP; not editable through normal seller routes, never public, and eligible for later archived-list treatment. Do not expose it as a normal editor state.
- `out_of_stock` is availability, not lifecycle: a Published product remains public and keeps its buyer-safe availability value.
- Ordinary field save never changes lifecycle. Publish/hide/delete are separate explicit actions.

### Architecture Guardrails

- Vertical-slice product capability remains in `src/features/product` and seller routes under `(seller)/seller/(admin)/products`. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#Design-Paradigm`]
- Public visibility is derived only from `status = 'published'` at repository/RPC boundary. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- All create/update/publish/hide/delete mutations go through server-side actions/services; RLS is a defense layer, not the domain state machine. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- Seller work uses the SSR/user Supabase client with RLS. Ordinary product code must not import the service-role client. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- Product media stays private and receives signed URLs only after seller ownership or published visibility checks. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16`]
- Product/RLS/trigger/function changes are timestamped migrations under `supabase/migrations/`. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- Primary acceptance viewport is 360–430px; primary tap targets are at least 44×44 CSS px. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-1`]

### UX Guardrails

- Product state control is a canonical seller component; state is visible, publish requires explicit action, and destructive delete requires confirmation. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`, `#Interaction-Primitives`]
- Draft missing a photo is a valid save state; the editor explains that publication needs at least one photo. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- Product save failure preserves local values and shows field/page errors; validation is text-first and not color-only. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`, `#Accessibility-Floor`]
- Seller flows remain one-column and touch-friendly at 360–430px. Use calm monochrome surfaces and existing design-system primitives. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Layout-&-Spacing`, `#Components`]
- Do not remove the public CTA contract for out-of-stock products; availability informs buyer context but does not change lifecycle visibility. [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-7-Product-lifecycle-states`]

### Existing Files to Read Before Implementation

Read completely before editing:

- `src/features/product/actions.ts`, `queries.ts`, `schema.ts`, `form-state.ts`, `product-form.tsx` — current Draft validation, action state, route-bound identity, and form behavior.
- `src/features/product/media-actions.ts`, `media-queries.ts`, `media-schema.ts`, `product-media-manager.tsx` — ownership, signed URLs, media invariant, and failure-state patterns from Story 2.2.
- `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx`, `products/page.tsx` — dynamic `params` promise, editor composition, seller navigation, and current Draft-only assumptions.
- `src/features/store/public-catalog.ts`, `public-storefront-shell.tsx`, `src/app/(public)/[storeSlug]/page.tsx` — buyer-safe published boundary and preview behavior.
- `src/lib/supabase/server.ts`, `src/lib/supabase/service-role.ts` — allowed client privilege boundary.
- `supabase/migrations/20260801183000_create_products.sql`, `20260801200000_create_product_media.sql`, and existing store migrations — SQL/RLS/trigger style.
- `scripts/smoke-foundation.mjs` — repository guardrail conventions.
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`, `server-actions.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` — required Next.js 16 guidance from `AGENTS.md`.

### Suggested File Structure

```text
supabase/migrations/20260801HHMMSS_add_product_lifecycle_guards.sql
src/features/product/schema.ts
src/features/product/lifecycle.ts
src/features/product/actions.ts
src/features/product/form-state.ts
src/features/product/queries.ts
src/features/product/product-form.tsx
src/features/product/product-state-control.tsx
src/features/product/media-actions.ts
src/features/store/public-catalog.ts
src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx
scripts/smoke-foundation.mjs
```

Keep the exact split consistent with the existing feature if a clearer colocated structure is justified. Do not add a new UI or upload dependency.

### Library and Framework Requirements

- Package baseline is Node.js `>=24 <25`, Next.js `16.2.12`, React `19.2.4`, `@supabase/supabase-js` `^2.111.0`, and `@supabase/ssr` `^0.12.4`; do not upgrade dependencies in this story.
- Use `<form action={serverAction}>` and `useActionState` for pending/error state; Server Actions receive `FormData`, but still re-check auth/ownership and treat all client input as untrusted. [Source: `node_modules/next/dist/docs/01-app/02-guides/forms.md`, https://nextjs.org/docs/app/guides/forms]
- Dynamic route `params` are promises in this Next.js version; use `const { productId } = await params`. [Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`, https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-segments]
- Use `revalidatePath`/appropriate cache invalidation after mutations so seller/public reads reflect lifecycle changes in the same flow. [Source: `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, https://nextjs.org/docs/app/guides/updating-data]
- Supabase RLS updates require a matching SELECT policy; `using` constrains the existing row and `with check` constrains the resulting row. [Source: https://supabase.com/docs/guides/database/postgres/row-level-security]
- Delete product-media objects with `supabase.storage.from('product-media').remove(paths)`; never delete `storage.objects` with SQL. [Source: https://supabase.com/docs/reference/javascript/file-buckets-remove]

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- A migration with legal transition/publication guards, updated owner policies, and no destructive edits to prior migrations.
- Application and database/RPC coverage for Draft save without photos, valid publish, invalid publish, hide, re-publish, out-of-stock visibility, delete, deleted URL not-found, unauthorized IDs, and public leakage prevention.
- Seller editor coverage for all non-deleted states, explicit state actions, confirmation, pending/error/success states, and preserved values/media after failure.
- Public catalog/detail seams returning only `published` products and buyer-safe signed media; Draft/Hidden/Deleted rows and media must not be returned.
- Smoke checks for no service-role imports in product/public/client code, no client-controlled ownership/status/path, private Storage, and `status = 'published'` repository filtering.

### Latest Technical Notes

- Next.js Forms guidance updated February 27, 2026 confirms Server Actions + `useActionState` for form validation and pending state; keep the established repository pattern. [Source: https://nextjs.org/docs/app/guides/forms]
- Current Supabase RLS guidance confirms `using`/`with check` behavior for updates and the need for a corresponding SELECT policy. [Source: https://supabase.com/docs/guides/database/postgres/row-level-security]
- Current Supabase Storage guidance uses the Storage API’s `remove(paths)` for object deletion; database metadata must not be mutated directly. [Source: https://supabase.com/docs/reference/javascript/file-buckets-remove]

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-2.3-Edit-Product-and-Manage-Publication-State`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-7-Product-lifecycle-states`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#Product-data-contract`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- [Source: `_bmad-output/implementation-artifacts/2-2-manage-product-photos.md#Review-Findings`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- [Source: Next.js Forms](https://nextjs.org/docs/app/guides/forms)
- [Source: Next.js Server Actions](https://nextjs.org/docs/app/guides/updating-data)
- [Source: Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Source: Supabase Storage remove](https://supabase.com/docs/reference/javascript/file-buckets-remove)

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Read the complete sprint status; first backlog story selected: `2-3-edit-product-and-manage-publication-state`.
- Analyzed Epic 2, Story 2.3 acceptance criteria, PRD FR5/FR7/FR13/product contract, architecture AD-5/AD-13/AD-16/AD-17, UX state/accessibility patterns, Story 2.1 and completed Story 2.2 implementation/review findings, current product/media code, migrations, smoke harness, recent git history, and repository Next.js 16 docs.
- Checked current official Next.js Forms/Server Actions and Supabase RLS/Storage guidance for the story’s mutation and cleanup boundaries.

### Completion Notes List

- Added `draft | published | hidden | deleted` lifecycle helpers and server-side publication checks for core fields and 1–10 photos.
- Added explicit publish/hide/delete Server Actions with seller ownership re-checks, soft-delete behavior, public path revalidation, and Storage cleanup/admin signal.
- Updated the seller editor/list to load non-deleted products, show lifecycle state, preserve failed form values, and expose mobile-safe state controls.
- Added migration `20260801213000_add_product_lifecycle_guards.sql` with legal transition/publication triggers, RLS update policy, transition RPC, public product lookup, and deleted-media cleanup policy.
- Extended the public catalog seam with `getPublicProductForStore` while keeping buyer DTOs published-only and free of Storage metadata.
- Verification passed: `npm.cmd run check` (lint, Next typegen/typecheck, production build, smoke). Lint retains the pre-existing `@next/next/no-img-element` warning in `product-media-manager.tsx`.

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Publication readiness, lifecycle transitions, soft-delete semantics, media cleanup, seller/public query boundaries, and review-derived guardrails are specified.

### File List

- `_bmad-output/implementation-artifacts/2-3-edit-product-and-manage-publication-state.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `supabase/migrations/20260801213000_add_product_lifecycle_guards.sql`
- `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx`
- `src/app/(seller)/seller/(admin)/products/page.tsx`
- `src/features/product/actions.ts`
- `src/features/product/lifecycle.ts`
- `src/features/product/product-lifecycle-context.tsx`
- `src/features/product/product-form.tsx`
- `src/features/product/product-media-manager.tsx`
- `src/features/product/product-state-control.tsx`
- `src/features/product/queries.ts`
- `src/features/product/schema.ts`
- `src/features/store/public-catalog.ts`

### Implementation Plan

- Added a pure lifecycle contract with explicit transitions and publication readiness validation.
- Extended seller product actions/queries to support non-deleted editing, publish/hide/delete actions, ownership checks, and path revalidation.
- Added migration-owned lifecycle triggers, publication guards, transition RPC, public published-product lookup, and deleted-product media cleanup policy.
- Added mobile seller state controls and preserved the existing product/media editors.
- Extended smoke guardrails and verified with the full project check.

### Change Log

- 2026-08-01: Implemented Story 2.3 lifecycle state management, publication guards, seller editor controls, public lookup boundary, and verification guardrails; marked story ready for review.

- 2026-08-01: Applied all code-review patches: protected direct lifecycle writes, synchronized editor state, hardened Storage cleanup errors, enforced media ordering, and expanded lifecycle smoke scenarios.

### Review Findings

- [x] [Review][Patch] Direct authenticated product updates can change lifecycle status without the explicit Server Action/RPC, confirmation, or Storage cleanup [supabase/migrations/20260801213000_add_product_lifecycle_guards.sql:75]
- [x] [Review][Patch] Lifecycle controls and ProductMediaManager retain stale status/action state after sequential hide/publish operations [src/features/product/product-state-control.tsx:47]
- [x] [Review][Patch] A thrown Storage cleanup failure after soft-delete returns the old lifecycle state and generic error, leaving no retry/admin signal [src/features/product/actions.ts:421]
- [x] [Review][Patch] Publication guard validates media count but not the media ordering/cover invariant [supabase/migrations/20260801213000_add_product_lifecycle_guards.sql:56]
- [x] [Review][Patch] Smoke verification is source-text/pure-helper based and does not execute required Server Action, RLS/RPC, unauthorized-ID, public-not-found, or Storage-cleanup scenarios [scripts/smoke-foundation.mjs:666]
- [x] [Review][Defer] Direct deletion of the last media row for a published product can bypass the protected media RPC [supabase/migrations/20260801200000_create_product_media.sql:393] — deferred, pre-existing
