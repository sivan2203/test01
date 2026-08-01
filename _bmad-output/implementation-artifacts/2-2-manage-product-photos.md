---
baseline_commit: 866acaa03f0a686819b2812ba633f1df7406cbe6
---

# Story 2.2: Manage Product Photos

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,
I want to add, remove, and reorder product photos,
so that buyers can understand the product visually before contacting me.

## Acceptance Criteria

1. **Given** I am editing a product  
   **When** I upload product photos  
   **Then** supported JPG, PNG, and WebP images can be attached  
   **And** unsupported formats show a clear UX error before publication.

2. **Given** a product has multiple photos  
   **When** I reorder them  
   **Then** the new order is saved  
   **And** the first ordered photo becomes the product cover.

3. **Given** I remove a product photo  
   **When** the product is saved  
   **Then** the removed photo is no longer shown in seller edit, public catalog card, or product detail  
   **And** remaining photos keep their saved order.

4. **Given** I try to publish a product  
   **When** it has no valid photos  
   **Then** publication is blocked  
   **And** the interface explains that a published product requires 1–10 photos.

5. **Given** product media is stored  
   **When** photos are accessed publicly  
   **Then** access follows product visibility rules  
   **And** draft, hidden, deleted, or unauthorized media is not exposed publicly.

6. **Given** I manage photos on mobile  
   **When** I add, remove, or reorder photos  
   **Then** the controls are usable at 360–430px  
   **And** all primary photo actions have accessible labels.

## Tasks / Subtasks

- [x] Create the product-media persistence and private Storage boundary (AC: 1, 2, 3, 4, 5)
  - [x] Add a timestamped SQL migration under `supabase/migrations/` for `public.product_media` with UUID id, product ownership, immutable storage path, MIME type, byte size, stable order, and timestamps.
  - [x] Enforce one product position per `sort_order`, valid positions for a maximum of 10 media items, supported MIME types (`image/jpeg`, `image/png`, `image/webp`), and product-level ordering indexes.
  - [x] Create the private `product-media` Storage bucket through the migration with a 6 MiB upload limit and the three supported MIME types; do not use a public bucket or manual dashboard-only setup.
  - [x] Add RLS policies for seller-owned product media upload/read/update/delete and published-product public signed reads. Policies must derive ownership from the product/store relationship and path, never from client-provided seller/store IDs.
  - [x] Add security-definer policy helpers only when needed to cross the `storage.objects`/product visibility boundary; constrain `search_path` and keep them narrowly scoped.
  - [x] Preserve the lifecycle invariant: draft media may be empty; a product may not be considered publishable unless it has 1–10 valid media rows. Do not add publication transitions in this story.

- [x] Add server-only media domain validation, queries, and mutations (AC: 1, 2, 3, 4, 5)
  - [x] Extend `src/features/product/` with media types, validation, seller media queries, and Server Actions following the existing result-object and `createSupabaseServerClient()` patterns.
  - [x] Accept `File` values from `FormData`; validate non-empty files, MIME type, 6 MiB maximum, and the 10-photo product limit before calling Storage. Unsupported files must return an actionable field/page error without a Storage write.
  - [x] Generate server-owned paths using the authenticated seller’s resolved store/product identity and a fresh media UUID; never accept `storage_path`, `store_id`, `seller_id`, or product ownership from hidden form fields.
  - [x] Upload through the private Supabase Storage API, insert the corresponding `product_media` row, and clean up an uploaded object if the database insert fails. Avoid service-role imports in ordinary seller/public feature code.
  - [x] Implement reorder as a server-side transaction/RPC or equivalent atomic operation that validates the complete ordered media ID list belongs to the product, contains each current media row exactly once, and normalizes positions from zero. The first row must be the cover.
  - [x] Implement removal so the media row and object are deleted only after ownership and product context are checked; normalize remaining order and prevent a published product from ending with zero media.
  - [x] Generate signed read URLs only after checking seller ownership for admin access or `status = published` for public access. Never return unsigned object URLs and never return media for draft, hidden, deleted, or unauthorized products.
  - [x] Revalidate the seller edit route and all product/public catalog paths affected by media changes. Keep product core fields and submitted values intact when a media action fails.

- [x] Integrate a mobile-first seller photo manager into the existing product editor (AC: 1, 2, 3, 6)
  - [x] Extend `src/features/product/product-form.tsx` or a colocated client component with a photo manager; preserve the existing draft create/edit form and save behavior.
  - [x] Provide a multi-file image input limited to JPG/PNG/WebP, visible thumbnails, photo count (`n из 10`), cover indication for the first item, and a clear empty state that allows drafts without photos.
  - [x] Provide accessible 44×44 CSS px controls for remove and move earlier/later, with labels announcing photo position and product context. Disable boundary reorder controls rather than hiding them.
  - [x] Show unsupported type, size, limit, upload, reorder, and removal errors as text-first feedback; keep already-saved media and unsaved core-field values visible after failure.
  - [x] Require confirmation before removing a photo when that removal would leave a currently published product without a valid cover; do not add a publish button or implement publication transitions here.
  - [x] Keep the one-column editor usable at 360–430px and avoid introducing a new UI library. Reuse existing `Button`, `GlassPanel`, and form-field styling.

- [x] Extend public media contracts without leaking unpublished data (AC: 3, 5)
  - [x] Extend `src/features/store/public-catalog.ts` so the server-only published catalog seam exposes ordered published media/cover data through signed URLs; public consumers must not receive storage paths or seller-only metadata.
  - [x] Ensure removed media disappears from the catalog seam and future product-detail consumers, while remaining media preserve their persisted order.
  - [x] Keep the current Story 2.1 public shell and route boundaries intact: do not add buyer authentication, analytics, Telegram CTA, publication transitions, or the full buyer catalog/detail UI scheduled for later stories.
  - [x] Verify seller preview uses the buyer-safe published contract and cannot display draft/hidden/deleted media.

- [x] Add verification guardrails and run the full project checks (AC: all)
  - [x] Extend `scripts/smoke-foundation.mjs` to require the media migration, product-media table/constraints, private bucket, Storage policies, signed-URL boundary, media actions/queries, and editor integration.
  - [x] Add smoke assertions that reject public bucket usage, unsigned public object URLs, service-role imports in product/public code, client-submitted ownership/path values, unsupported MIME-only bypasses, and media returned for non-published products.
  - [x] Cover validation and ordering invariants with the repository’s available test/guardrail approach: supported MIME types, size/count limits, empty draft, cover-first ordering, exact reorder list, removal normalization, and published zero-media rejection.
  - [x] Run `npm.cmd run check` (lint, Next typegen/typecheck, production build, and smoke) and fix regressions before marking this story complete.
  - [x] Update `README.md` only if the local setup requires a new Supabase/storage environment step; otherwise leave it unchanged.

### Review Findings

- [x] [Review][Defer] Publication invariant and published-editor scope are deferred to Story 2.3 — publication transitions входят в scope Story 2.3.
- [x] [Review][Patch] Server Action body limit — fixed by configuring a 64 MiB multipart request budget in `next.config.ts`.
- [x] [Review][Patch] Anonymous raw product-media exposure — fixed by removing the public table SELECT policy and using a restricted published-media RPC.
- [x] [Review][Patch] Public catalog storage metadata — fixed by removing `byteSize` from the buyer-facing media contract and RPC result.
- [x] [Review][Patch] Mutable media identity — fixed with an immutable-identity trigger and no direct owner update policy.
- [x] [Review][Patch] Partial-upload cleanup — fixed by validating canonical paths and cleaning Storage before deleting inserted rows.
- [x] [Review][Patch] Non-atomic photo removal — fixed with transactional remove/normalize RPC plus database compensation if Storage deletion fails.
- [x] [Review][Patch] Unrecoverable media action errors — fixed by catching context and action-boundary exceptions.
- [x] [Review][Patch] Untracked Storage object names — fixed with canonical store/product/media UUID and extension validation in Storage policies.
- [x] [Review][Patch] Broken public media object failing the catalog — fixed by skipping only the unavailable signed media URL.
- [x] [Review][Patch] Media-load failures rendered as empty gallery — fixed with explicit load-error feedback for every non-success result.
- [x] [Review][Patch] Non-executable media verification — fixed by adding runtime smoke assertions for file validation, signatures, order normalization, and published removal rules.

## Dev Notes

### Scope Boundary

This story owns product media storage, ordered media references, seller photo management, and the published-only media contract. It must prepare safe inputs for publication and public product surfaces without implementing those later surfaces.

Do:

- store files in private Supabase Storage and ordered references in `public.product_media`;
- support 0–10 photos for drafts and enforce 1–10 valid photos as the publication prerequisite;
- let an authenticated seller manage only media belonging to the seller’s own product;
- make the first persisted media row the cover;
- expose only short-lived signed URLs for seller-owned or published products;
- preserve existing Story 2.1 product form and public/preview boundaries.

Do not:

- add publish/hide/delete state transitions, status filters, Telegram CTA, analytics, import, buyer auth, payments, orders, or chat;
- use a public Storage bucket, unsigned public object URL, service-role client for ordinary seller/public reads, or client-submitted ownership/path fields;
- add full buyer catalog cards or product-detail UI if they are not already present; later Epic 3 stories own those surfaces;
- delete Storage metadata directly with SQL; use the Supabase Storage API for object operations and keep database schema changes migration-owned.

### Requirements Trace

`FR6`, `FR12`, `FR21`, `NFR3`, `NFR6`, `AD-1`, `AD-5`, `AD-12`, `AD-13`, `AD-15`, `AD-16`, `AD-17`, `UX-DR6`, `UX-DR17`.

### Previous Story Intelligence

Story 2.1 is complete and established the product Draft foundation:

- `src/features/product/actions.ts` resolves the authenticated seller’s store server-side and uses a bound route product ID for edits. Preserve that boundary for media actions.
- `src/features/product/queries.ts` contains seller-owned product lookup and UUID validation. Extend it or add a media-specific server-only query module; do not create a parallel ownership model.
- `src/features/store/public-catalog.ts` is the published-only public query seam. Extend its buyer-safe model rather than querying products/media directly from public route components.
- The product migration already defines lifecycle values `draft | published | hidden | deleted` and RLS through the owning store. Media policies must align with those values.
- Story 2.1 review guardrails rejected client-controlled product identity, public leakage, and service-role imports. Continue those checks.
- The project uses clean UTF-8 Markdown without BOM; use patch-based edits for story files.

Recent commits:

- `866acaa feat: add store preview and product drafts`
- `011a3a9 Complete public store slug setup`
- `b3677ac feat: add store profile editor`

### Architecture Guardrails

- Vertical-slice product capability belongs in `src/features/product` with seller routes under `src/app/(seller)/seller/(admin)/products`. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#Design-Paradigm`]
- Private product media is mandatory. The first ordered media item is the cover, and public references must disappear immediately when media is removed. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-12`]
- Signed URLs are server-generated only after checking seller ownership or published visibility. Draft, hidden, deleted, and unauthorized media must never receive public access. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16`]
- All mutations go through server-side actions/services; RLS is a defense layer, not a replacement for domain checks. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- Browser/public code uses anon credentials; ordinary seller actions do not import the service-role client. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- Storage bucket, product-media schema, and Storage policies must be versioned SQL migrations. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- The primary acceptance viewport is 360–430px and primary controls need 44×44 CSS px targets. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-1`]

### Product Media Contract

- Bucket: `product-media`, private, allowed MIME types `image/jpeg`, `image/png`, `image/webp`, maximum file size 6 MiB for the standard upload path.
- Product limit: maximum 10 rows. Draft may contain zero; publication validation must require at least one valid row and never more than 10.
- Media row: `id uuid`, `product_id uuid`, `storage_path text`, `mime_type text`, `byte_size bigint`, `sort_order smallint`, `created_at`, `updated_at`.
- The path is server-generated and should be namespaced by resolved store/product identity, for example `<store-id>/<product-id>/<media-id>.<extension>`; the exact extension mapping must be deterministic from validated MIME type.
- `sort_order` is normalized to `0..n-1` after upload, reorder, or removal. The row with `sort_order = 0` is the cover.
- Public DTO contains only `id`, `url`, `sortOrder`, `isCover` and buyer-safe MIME metadata if needed; never expose `storage_path`, byte size, seller IDs, or Storage object metadata publicly.

### Supabase and Next.js Implementation Notes

- Next.js 16 dynamic route params are promises; use `await params` in existing/new route pages. [Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`]
- Server Actions receive `FormData`, can receive `File` values, and must re-check authentication/authorization inside the action. Use `useActionState` for validation and pending/error state. [Source: `node_modules/next/dist/docs/01-app/02-guides/forms.md`]
- Supabase standard uploads use multipart `File` values and are recommended for files no larger than 6 MB; this story’s 6 MiB rule keeps the implementation on that path. [Source: https://supabase.com/docs/guides/storage/uploads/standard-uploads]
- Private buckets require RLS for access; signed URLs are the supported temporary read mechanism. [Source: https://supabase.com/docs/guides/storage/buckets/fundamentals]
- Storage object operations go through the Storage API; do not mutate `storage.objects` directly with SQL. [Source: https://supabase.com/docs/guides/storage/schema/design]
- Storage policies may use `storage.foldername`, `storage.extension`, and operation-aware helpers, but must be scoped to the product/store ownership and bucket. [Source: https://supabase.com/docs/guides/storage/schema/helper-functions]
- The Supabase JavaScript `createSignedUrl(path, expiresIn)` API is the server-side mechanism for returning temporary media URLs. [Source: https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl]

### Existing Files to Read Before Implementation

Read these files completely before editing:

- `src/features/product/actions.ts`, `src/features/product/queries.ts`, `src/features/product/schema.ts`, `src/features/product/form-state.ts`, `src/features/product/product-form.tsx` — existing product identity, server action, validation, and mobile form patterns.
- `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx` and `src/app/(seller)/seller/(admin)/products/page.tsx` — editor/list integration and route ownership boundaries.
- `src/features/store/public-catalog.ts`, `src/features/store/public-storefront-shell.tsx`, and `src/app/(public)/[storeSlug]/page.tsx` — buyer-safe public model and preview boundary.
- `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, and `src/lib/supabase/service-role.ts` — client privilege boundaries.
- `supabase/migrations/20260801183000_create_products.sql` and existing store migrations — SQL/RLS style and lifecycle constraints.
- `scripts/smoke-foundation.mjs` — current static guardrail conventions.
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`, `server-actions.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` — repository-specific Next.js 16 guidance required by `AGENTS.md`.

### Suggested File Structure

```text
supabase/migrations/20260801HHMMSS_create_product_media.sql
src/features/product/media-schema.ts
src/features/product/media-queries.ts
src/features/product/media-actions.ts
src/features/product/product-media-manager.tsx
src/features/product/product-form.tsx
src/features/store/public-catalog.ts
scripts/smoke-foundation.mjs
```

Keep the exact file split consistent with the existing feature if a different but clearer colocated structure is chosen. Do not introduce a new upload dependency unless the existing platform cannot satisfy the story; additional dependencies require user approval.

### UX Guardrails

- A product editor may save a Draft without photos; missing photos are a publication prerequisite, not a draft-save error. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- Photo controls must be touch-friendly, text-first, and usable in one column on mobile. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- Gallery images announce `Фото {n} из {total}: {product title}`; previous/next or move controls announce position and disabled/end state. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- Product photos are visually load-bearing; keep the calm monochrome system and avoid decorative UI that competes with the image. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Component-Patterns`]
- Removing a photo is destructive and needs clear confirmation when it can affect the current published invariant. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- A migration containing `product_media`, private `product-media` bucket configuration, ownership/visibility policies, constraints, and indexes.
- Server-side tests or smoke assertions for MIME/size/count validation, clean rejection before Storage upload, owner scoping, signed URL generation, and no service-role imports.
- Reorder tests/assertions proving exact membership validation, normalized `0..n-1` positions, and cover-first behavior.
- Removal tests/assertions proving removed paths/rows are not returned, remaining order is preserved, and a published product cannot become photo-less.
- Seller edit integration with thumbnails, count, cover, upload/remove/reorder controls, accessible labels, and failure-state preservation.
- Public catalog seam returning only ordered signed media for published products and no media for draft/hidden/deleted/unauthorized products.
- Smoke guardrails covering the migration, routes, Storage boundary, ownership boundary, and public visibility boundary.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-2.2-Manage-Product-Photos`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-6-Product-media-management`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#Product-data-contract`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-12`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- [Source: `_bmad-output/implementation-artifacts/2-1-create-product-draft-manually.md#Previous-Story-Intelligence`]
- [Source: Next.js Forms](https://nextjs.org/docs/app/guides/forms)
- [Source: Supabase Storage standard uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Source: Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Source: Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Source: Supabase signed URLs](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl)

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Implementation Plan

- Establish the migration, private bucket, product-media table, and RLS/signed-URL policies first.
- Add server-only media validation, upload, reorder, removal, and signed-read services without changing product lifecycle transitions.
- Integrate the mobile photo manager into the existing product edit surface and preserve draft form failure state.
- Extend the published-only public catalog contract and smoke guardrails.
- Run `npm.cmd run check`, then re-scan all acceptance criteria and task checkboxes before marking the story ready for review.

### Debug Log References

- Sprint status read completely; first backlog story selected: `2-2-manage-product-photos`.
- Epic 2 requirements, PRD FR6/product contract, architecture AD-12/AD-16/AD-17, UX media/accessibility patterns, Story 2.1 implementation, recent git history, repository Next.js 16 docs, and official Supabase Storage docs reviewed.
- RED phase confirmed smoke failure before media files existed; GREEN and refactor phases completed with repeated full `npm.cmd run check` passes.
- Final validation completed: lint passed with the existing Next `<img>` advisory warning, Next typegen/typecheck passed, production build passed, and foundation smoke passed.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Added private `product-media` Storage and ordered `product_media` references with seller/public RLS boundaries and atomic reorder RPC.
- Added server-side MIME, signature, size, count, ownership, upload, signed-read, reorder, and removal handling with cleanup paths.
- Added mobile-first photo manager with thumbnails, cover/order controls, accessible labels, confirmation, and failure-preserving feedback.
- Extended the published-only public catalog contract with ordered signed media while preserving Story 2.1 public/preview scope.
- Verified with `npm.cmd run check` and media-specific smoke guardrails.

### File List

- `_bmad-output/implementation-artifacts/2-2-manage-product-photos.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `supabase/migrations/20260801200000_create_product_media.sql`
- `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx`
- `src/features/product/media-actions.ts`
- `src/features/product/media-queries.ts`
- `src/features/product/media-schema.ts`
- `src/features/product/product-media-manager.tsx`
- `src/features/store/public-catalog.ts`

### Change Log

- 2026-08-01: Created comprehensive Story 2.2 context package and marked ready for development.
- 2026-08-01: Implemented product media storage, seller management, signed public media contract, and verification guardrails; marked ready for review.
