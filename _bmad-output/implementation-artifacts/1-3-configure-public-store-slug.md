---
baseline_commit: b3677ac661db7c60eed6106c80cf7fcdb5635c40
---

# Story 1.3: Configure Public Store Slug

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,  
I want to set and edit a unique public store slug,  
so that I can share a clean personal storefront link in my social profiles.

## Acceptance Criteria

1. **Given** I am editing my store settings  
   **When** I enter a public slug  
   **Then** the system validates format, length, reserved words, and uniqueness  
   **And** validation feedback is shown inline, not only as a toast.

2. **Given** the slug is valid and available  
   **When** I save it  
   **Then** the store receives a public URL based on that slug  
   **And** the seller can copy or share the link from the store settings area.

3. **Given** the slug is already taken or invalid  
   **When** I try to save it  
   **Then** the slug is not saved  
   **And** the interface explains what must be changed.

4. **Given** I change an existing slug  
   **When** the new slug is saved  
   **Then** the new public URL becomes the current store identity  
   **And** the old slug returns public 404 in MVP without redirect.

5. **Given** I view the slug editor on mobile  
   **When** validation or save state changes  
   **Then** the current state is clear through text and accessible state, not color alone  
   **And** the copy/share control remains tappable.

## Tasks / Subtasks

- [x] Add migration-owned slug persistence to `public.stores` (AC: 1, 2, 3, 4)
  - [x] Add a new timestamped migration under `supabase/migrations/`; do not edit the already-committed `20260801143000_create_stores.sql`.
  - [x] Add nullable `slug text` to `public.stores`; existing stores may have no slug until the seller configures one.
  - [x] Enforce slug validity in Postgres with checks: lowercase latin letters, digits, hyphen only; length 3-32 characters; cannot start/end with hyphen; no consecutive path separators or slash characters.
  - [x] Enforce reserved words in SQL: `admin`, `api`, `login`, `signup`, `support`, `help`; keep this list in sync with server validation constants.
  - [x] Add a unique constraint or unique index for non-null slug values. The database must be the source of truth for race-condition safety; UI/server prechecks are helpful but not sufficient.
  - [x] Add or update public-route-safe read access only as needed for current slug resolution. If a view is used, make it `security_invoker = true` and expose only buyer-safe store columns.
  - [x] Do not add slug history, alias tables, redirects, product URLs, analytics events, Telegram settings, or custom domains in this story.

- [x] Extend `src/features/store` validation and types with slug support (AC: 1, 3, 5)
  - [x] Add slug constants and helpers to `src/features/store/schema.ts`: `STORE_SLUG_MIN_LENGTH = 3`, `STORE_SLUG_MAX_LENGTH = 32`, reserved words, normalization, and validation.
  - [x] Slug normalization must trim whitespace and lowercase ASCII input before validation; invalid uppercase submissions should be saved only as normalized lowercase when the resulting slug is valid.
  - [x] Validation errors must be field-level on `slug` and must explain the exact problem: required format, length, reserved word, or taken slug.
  - [x] Update `StoreProfileValues`, `StoreProfileFieldErrors`, and initial form state to carry `slug`.
  - [x] Reuse `countStoreTextCharacters` for length checks so JS validation remains consistent with Postgres character semantics.

- [x] Update seller-scoped store save/read behavior without weakening ownership boundaries (AC: 1, 2, 3, 4)
  - [x] Update `getCurrentSellerStoreProfile()` to select/map `slug` and preserve explicit result statuses: `found`, `not_found`, `unauthenticated`, `error`.
  - [x] Update `saveStoreProfile()` to persist `slug` with the same seller-owned upsert; never accept `seller_id` or store id from the client.
  - [x] Before save, check whether a normalized slug is already used by a different store; return inline `slug` error when taken.
  - [x] Also handle database duplicate-key errors, including SQLSTATE `23505`, as a `slug` field error so concurrent saves cannot produce a generic failure.
  - [x] Preserve all submitted values on validation/network errors; do not lose name, description, additional info, or slug while reporting slug errors.
  - [x] Continue excluding `createSupabaseServiceRoleClient()` from `src/features/store`, public routes, and client components.

- [x] Add the mobile-first slug editor and public-link controls to `/seller/store` (AC: 1, 2, 3, 5)
  - [x] Extend `src/features/store/store-profile-form.tsx` rather than creating a competing settings form.
  - [x] Place the slug editor near the store name so the seller understands it is the public address of the store.
  - [x] Show the URL preview as `/{slug}` using the current browser origin for copy/share UI; do not hard-code production domains.
  - [x] Add a copy/share control that is at least 44x44 CSS px, text-labeled, usable on 360-430px mobile viewports, and not color-only.
  - [x] Use Clipboard API for copy and `navigator.share` when available; provide clear success/failure text in an accessible status region.
  - [x] Keep the calm monochrome/glass design language, visible labels, helper text below the input, and field-level errors before page-level errors.
  - [x] If an existing slug changes, make the UI explicit that the old link stops working in MVP.

- [x] Make the current public slug route respect current store identity without implementing the catalog (AC: 2, 4)
  - [x] Update `src/app/(public)/[storeSlug]/page.tsx` so it no longer renders a generic 200 page for every arbitrary slug.
  - [x] Add a public-safe query helper, for example in `src/features/store/public-queries.ts`, that resolves only current store slugs.
  - [x] For missing, invalid, or old slugs, call Next `notFound()` and do not redirect.
  - [x] For a current slug, keep a minimal placeholder/public shell only; do not implement product catalog, product detail, Telegram CTA logic, analytics events, or preview mode in this story.
  - [x] Public route code must not import seller-admin-only UI/services beyond shared design primitives and public-safe store query/types.

- [x] Extend verification for slug behavior (AC: 1, 2, 3, 4, 5)
  - [x] Extend `scripts/smoke-foundation.mjs` to verify slug migration snippets: `slug text`, lowercase/format checks, reserved words, uniqueness, and no alias/redirect table.
  - [x] Add static checks for store schema/action/UI: slug constants, reserved word validation, duplicate/taken slug handling, `23505` handling, value preservation, and no service-role imports.
  - [x] Add a smoke check that the public `[storeSlug]` route uses a slug resolver and `notFound()` instead of rendering every slug blindly.
  - [x] Run `npm.cmd run check`; it must pass lint, Next typegen + typecheck, production build, and smoke.
  - [x] Update README only if the implementation introduces new local setup requirements; otherwise leave it unchanged.

### Review Findings

- [x] [Review][Patch] Reserved slug list allows root route collisions such as `/seller` [src/features/store/schema.ts:6]
- [x] [Review][Patch] Public route accepts non-canonical slug paths after normalizing the route segment [src/features/store/public-queries.ts:38]
- [x] [Review][Patch] Public store resolver turns infrastructure or RPC failures into false 404 responses [src/features/store/public-queries.ts:53]
- [x] [Review][Patch] Public slug RPC exposes internal store UUID although the placeholder page does not need it [supabase/migrations/20260801160000_add_store_slug.sql:52]
- [x] [Review][Patch] Duplicate-slug race can remove a newly uploaded avatar without telling the seller to reselect it [src/features/store/actions.ts:213]
- [x] [Review][Patch] Slug editor can show stale server errors, stale link status, or stale normalized input after state changes [src/features/store/store-profile-form.tsx:27]
- [x] [Review][Patch] Empty slug input references a missing `store-slug-preview` description element [src/features/store/store-profile-form.tsx:133]

## Dev Notes

### Scope Boundary

This story adds the public store slug/username and shareable public link identity for an existing seller store.

Do:

- add `stores.slug` as a current unique public identity;
- validate slug on server and in SQL;
- add inline slug editor UI to the existing `/seller/store` form;
- allow copy/share of the current public link from store settings;
- make the existing public route return 404 for missing/old slugs instead of rendering every arbitrary slug.

Do not:

- build the full public storefront catalog; that is Story 3.1 and Story 3.2;
- build preview-as-buyer; that is Story 1.4;
- build Telegram settings or handoff; those are Stories 3.4 and 3.5;
- add products, product media, analytics events, source attribution, import, orders, payments, reviews, ratings, chat, buyer accounts, custom domains, short links, slug aliases, or redirects;
- use service-role access for normal seller/admin or public buyer flows.

### Requirements Trace

`FR3`, `FR21`, `AD-10`, `AD-13`, `AD-15`, `AD-17`, `AD-20`, `UX-DR11`, `UX-DR13`, `UX-DR17`.

### Previous Story Intelligence

Story 1.2 is complete and committed as `b3677ac feat: add store profile editor`.

Established patterns to reuse:

- `public.stores` already exists with one store per seller, `seller_id`, `name`, `avatar_path`, `description`, `additional_info`, `timezone`, timestamps, RLS, and private `store-avatars` storage.
- `src/features/store` is the correct domain slice for this story. Extend `actions.ts`, `queries.ts`, `schema.ts`, `form-state.ts`, and `store-profile-form.tsx`; do not create a second store settings module.
- `saveStoreProfile()` already derives the seller from `supabase.auth.getUser()` and uses `seller_id: user.id`; keep that ownership boundary.
- `getCurrentSellerStoreProfile()` intentionally returns explicit statuses. Do not collapse query errors into empty create state.
- Store avatar lifecycle was hardened in code review: signature validation, uploaded-file cleanup on failed save, existing avatar lookup error handling, seller-folder `avatar_path` SQL check, and Unicode-aware length validation. Do not regress these guardrails while adding slug.
- `/seller/store` already blocks rendering an empty form when the store cannot be loaded. Preserve this behavior so a query failure cannot overwrite existing profile data.
- `scripts/smoke-foundation.mjs` is the lightweight verification harness and should be extended with slug guardrails.
- The public route currently exists at `src/app/(public)/[storeSlug]/page.tsx` and renders a placeholder for any slug. This story must change that behavior for current/missing slug identity, while still leaving catalog rendering for Epic 3.

Recent commits:

- `b3677ac feat: add store profile editor`
- `6d9d32c feat: add seller auth shell`
- `79abcc0 feat: initialize web app foundation`

### Architecture Guardrails

- MVP is responsive web; phone viewport `360-430px` is the primary acceptance surface. Desktop may enhance layout but cannot change feature semantics. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-1`]
- Seller admin and public storefront are separate route/module surfaces. Public storefront routes never require buyer auth and never import seller-admin-only UI/services. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-2`]
- Store slug is the public store identity. It must be unique and validated before save; after a slug change, the old slug resolves 404 in MVP without redirect. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-10`]
- Domain mutations go through server-side application services; client components cannot write inconsistent shapes directly to the database. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- Browser/client code may use only public anon credentials. Seller-scoped reads/writes use server-side Supabase SSR/user clients with RLS. Service-role clients stay isolated to server-only maintenance/admin modules. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- Database tables, indexes, RLS policies, storage policies, and seed reference data must be versioned SQL migrations under `supabase/migrations/`. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- Public route availability and activation completeness are distinct: a store public route is resolvable when the store exists and has a valid current slug. Published products are not required for the route to exist. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-20`]

### Data Contract Guidance

Add slug through a new migration, for example:

```sql
alter table public.stores
add column if not exists slug text;

alter table public.stores
add constraint stores_slug_format_check check (
  slug is null
  or (
    char_length(slug) between 3 and 32
    and slug = lower(slug)
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

alter table public.stores
add constraint stores_slug_reserved_check check (
  slug is null
  or slug not in ('admin', 'api', 'login', 'signup', 'support', 'help')
);

create unique index if not exists stores_slug_unique_idx
on public.stores (slug)
where slug is not null;
```

Implementation notes:

- If using `alter table ... add constraint`, account for idempotency; `add constraint if not exists` is not universally available, so use a safe `do $$ begin ... exception when duplicate_object then null; end $$;` block if needed.
- Keep slug nullable so sellers can create/edit a store profile before choosing a public link.
- Store only the current slug. Do not preserve old slugs in an alias/history table.
- Old slug 404 means: after updating `stores.slug` from `old` to `new`, resolving `/old` finds no current store and returns not-found. No redirect.
- Public route lookup should select only buyer-safe fields needed for the placeholder/current identity path. Avoid exposing seller admin concerns in public route modules.

### UX Guardrails

- Store setup/edit includes name, photo/avatar, optional description, slug, and Telegram, but this story adds only slug; Telegram remains future scope. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Information-Architecture`]
- Slug editor belongs to Store setup and validates format and uniqueness before save; validation appears inline, not as a toast-only error. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- Forms use label above, helper/error below, and field-level errors before page-level errors. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- Slug change requires explicit action/confirmation if the public link already exists. Because the current `/seller/store` form saves the whole profile at once, satisfy this by explicit helper text or confirmation copy near save/copy; do not silently imply the old link still works. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Interaction-Primitives`]
- Mobile seller flows are one column at `360-430px`; primary actions and copy/share controls remain readable and tappable. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Responsive-&-Platform`]
- Use calm, concrete copy. Avoid marketplace/SaaS-heavy language and decorative stock-art empty states. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Do's-and-Don'ts`]

### Existing Files to Read Before Implementation

Read these files completely before editing:

- `supabase/migrations/20260801143000_create_stores.sql` — current store schema/RLS/storage baseline; do not edit directly.
- `src/features/store/schema.ts` — existing validation constants, Unicode character counting, and profile value types.
- `src/features/store/form-state.ts` — initial form state and field error typing.
- `src/features/store/actions.ts` — seller-owned save action, avatar lifecycle, revalidation, and error-preserving form state.
- `src/features/store/queries.ts` — seller store read status model and avatar signed URL logic.
- `src/features/store/store-profile-form.tsx` — current mobile-first form to extend with slug editor and copy/share controls.
- `src/app/(seller)/seller/(admin)/store/page.tsx` — current Store route wrapper and cannot-load behavior.
- `src/app/(public)/[storeSlug]/page.tsx` — public placeholder route that must stop returning 200 for arbitrary slugs.
- `scripts/smoke-foundation.mjs` — static/build smoke harness to extend.
- `src/lib/supabase/server.ts` and `src/lib/supabase/service-role.ts` — permitted SSR/user client boundary and forbidden service-role boundary.
- `src/components/ui/button.tsx` and `src/components/design-system/surface.tsx` — existing primitives.

### Suggested File Structure

```text
src/features/store/
  actions.ts
  form-state.ts
  public-queries.ts
  queries.ts
  schema.ts
  store-profile-form.tsx
supabase/migrations/
  20260801HHMMSS_add_store_slug.sql
```

Possible route changes:

```text
src/app/(public)/[storeSlug]/page.tsx
src/app/(seller)/seller/(admin)/store/page.tsx
scripts/smoke-foundation.mjs
```

### Latest Technical Notes

- Supabase recommends enabling RLS on exposed schemas like `public` and specifying Postgres roles with `to authenticated`/`to anon`; authenticated own-row policies should use `(select auth.uid()) = seller_id` for clarity and performance. [Source: Supabase Row Level Security docs — https://supabase.com/docs/guides/database/postgres/row-level-security]
- Supabase RLS policies are table-level; if using a public view for store lookup, Postgres 15+ supports `security_invoker = true` so the view obeys underlying RLS for `anon`/`authenticated` roles. [Source: Supabase Row Level Security docs — https://supabase.com/docs/guides/database/postgres/row-level-security#views]
- Supabase Storage access remains RLS-policy controlled on `storage.objects`; do not change store avatar bucket publicness in this story. Public storefront avatar rendering can later use authorized/signed URLs after visibility checks. [Source: Supabase Storage Access Control docs — https://supabase.com/docs/guides/storage/security/access-control]
- Next.js forms can invoke Server Actions through the form `action` attribute, and `useActionState` is the current pattern for validation errors and pending state in Client Components. Continue the Story 1.2 pattern. [Source: Next.js Forms Guide — https://nextjs.org/docs/app/guides/forms]

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- `/seller/store` building and reachable only through the existing seller auth guard.
- Store profile save still requiring a name server-side.
- Slug validation enforced in server code and SQL: format, length, reserved words, uniqueness.
- Duplicate slug and SQLSTATE `23505` mapped to inline `slug` field errors.
- Submitted form values preserved on validation and network errors.
- Public URL preview/copy/share present only when a valid/current slug exists or is being edited.
- Public `[storeSlug]` route no longer rendering a generic 200 for arbitrary missing slugs; missing/old slugs use `notFound()`.
- No service-role import in `src/features/store`, public routes, or client components.
- No slug history, redirect, custom-domain, Telegram, product, analytics, order, review, chat, or buyer-account scope added.

If no real Supabase project is configured locally, checks should verify code paths, migrations, and build behavior without requiring live database writes.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.3-Configure-Public-Store-Slug`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-3-Editable-public-store-link`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-10`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-20`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/implementation-artifacts/1-2-create-and-edit-store-profile.md#Previous-Story-Intelligence`]
- [Source: Supabase Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security]
- [Source: Supabase Storage Access Control — https://supabase.com/docs/guides/storage/security/access-control]
- [Source: Next.js Forms Guide — https://nextjs.org/docs/app/guides/forms]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Implementation Plan

- Add `stores.slug` through a new migration with database-level validity and uniqueness guarantees.
- Extend the existing `src/features/store` profile form/action/query path with slug rather than creating a separate settings flow.
- Resolve current slugs in the existing public `[storeSlug]` route only enough to enforce current identity and 404 for missing/old slugs; leave catalog/CTA/analytics for later epics.
- Extend static smoke checks because local/CI may not have a live Supabase project for database writes.

### Debug Log References

- `git rev-parse HEAD` -> `b3677ac661db7c60eed6106c80cf7fcdb5635c40`.
- `git log --oneline -5` reviewed; latest story commit is `b3677ac feat: add store profile editor`.
- Story 1.2 file reviewed for previous implementation and review learnings.
- Current store feature files, public route placeholder, store migration, package versions, and smoke harness reviewed.
- Official docs checked for current Supabase RLS/view guidance and Next.js forms/useActionState guidance.
- `npm.cmd run check` passed: lint, Next typegen + typecheck, production build, smoke.
- Code review layers completed: Blind Hunter, Edge Case Hunter, and Acceptance Auditor.
- `npm.cmd run check` passed after applying all 7 code review patches.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Story 1.3 keeps scope tight around editable public slug, public link copy/share, and current-slug 404 behavior.
- Story intentionally excludes public catalog, preview, Telegram, products, analytics, redirects, aliases, custom domains, and buyer accounts.
- Added migration `20260801160000_add_store_slug.sql` with nullable `stores.slug`, SQL format/reserved checks, unique index, authenticated slug availability RPC, and public-safe current-slug resolver RPC.
- Extended `src/features/store` profile validation, form state, seller query, and save action with normalized slug support, inline taken-slug errors, and `23505` race-condition handling.
- Extended `/seller/store` with mobile-first slug editor, relative public-link preview, copy/share controls, and explicit old-link-stops-working copy.
- Updated public `[storeSlug]` route to resolve only current store slugs and call `notFound()` for missing/invalid/old slugs while leaving catalog/Telegram/analytics scope out.
- Extended smoke checks for slug migration, validation, duplicate handling, public route resolver, and no service-role imports.
- Code review patches applied: `seller` reserved as a root route collision, non-canonical public slugs now 404, public resolver errors no longer become false 404s, public slug RPC no longer exposes internal store UUID, duplicate slug races preserve avatar reselect guidance, slug editor stale state/ARIA issues fixed, and smoke checks updated for these guardrails.

### File List

- `_bmad-output/implementation-artifacts/1-3-configure-public-store-slug.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/app/(public)/[storeSlug]/page.tsx`
- `src/app/(seller)/seller/(admin)/store/page.tsx`
- `src/features/store/actions.ts`
- `src/features/store/form-state.ts`
- `src/features/store/public-queries.ts`
- `src/features/store/queries.ts`
- `src/features/store/schema.ts`
- `src/features/store/store-profile-form.tsx`
- `supabase/migrations/20260801160000_add_store_slug.sql`

### Change Log

- 2026-08-01: Created Story 1.3 context package and marked ready for development.
- 2026-08-01: Started Story 1.3 implementation; baseline commit captured.
- 2026-08-01: Implemented Story 1.3 public store slug persistence, editor UI, current-slug route resolution, and verification; moved status to review.
- 2026-08-01: Applied Story 1.3 code review patches and moved status to done.
