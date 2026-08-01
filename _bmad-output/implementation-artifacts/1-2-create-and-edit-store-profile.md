---
baseline_commit: 6d9d32cf7c26b7167df585108f59a4862a30f439
---

# Story 1.2: Create and Edit Store Profile

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,  
I want to create and edit my store profile,  
so that buyers see who is selling the products and what the store is about.

## Acceptance Criteria

1. **Given** I am an authenticated seller without a store  
   **When** I open the Store section  
   **Then** I can create a store profile  
   **And** the store cannot be created without a required store name.

2. **Given** I am editing my store profile  
   **When** I add or change the store name, photo/avatar, optional description, or additional information  
   **Then** I can save the changes  
   **And** saved changes are reflected in the store profile data.

3. **Given** I leave optional description or additional information empty  
   **When** the store profile is displayed  
   **Then** the interface collapses empty optional areas cleanly  
   **And** no placeholder text is shown to buyers as real content.

4. **Given** profile saving fails because of validation or network error  
   **When** the error is shown  
   **Then** field-level errors appear near the relevant fields where possible  
   **And** entered values are preserved for correction.

5. **Given** I view the profile editor on a 360–430px mobile viewport  
   **When** I fill and save the form  
   **Then** labels, helper text, errors, and primary actions remain readable and tappable  
   **And** primary controls meet the 44x44 CSS px tap target requirement.

## Tasks / Subtasks

- [x] Add store profile persistence with Supabase RLS (AC: 1, 2)
  - [x] Add a timestamped migration under `supabase/migrations/` for `public.stores`.
  - [x] Model one store per seller for MVP with `seller_id uuid not null references auth.users(id) on delete cascade` and a unique constraint on `seller_id`.
  - [x] Include `name text not null`, nullable `avatar_path`, nullable `description`, nullable `additional_info`, `timezone text not null default 'Europe/Moscow'`, `created_at`, and `updated_at`.
  - [x] Add database checks for trimmed name length and optional field length; do not rely on UI validation only.
  - [x] Enable RLS and add authenticated-only select/insert/update policies where `(select auth.uid()) = seller_id`.
  - [x] Do not add public `slug`, Telegram contact fields, products, analytics, import tables, orders, reviews, payments, or buyer accounts in this story.

- [x] Add store avatar storage boundary (AC: 2)
  - [x] Add a Supabase Storage bucket for store avatars through the same migration, with private-by-default access.
  - [x] Add storage object policies for authenticated sellers to read/write/delete only objects in their own `auth.uid()` folder.
  - [x] Store only the object path in `stores.avatar_path`; generate any display URL server-side after authorization.
  - [x] Validate avatar uploads server-side: allow JPG/PNG/WebP, reject empty/unsupported files with text-first field errors, and enforce a small MVP size limit such as 2 MB.

- [x] Implement `features/store` domain slice (AC: 1, 2, 3, 4)
  - [x] Create store validation helpers and typed form/action state under `src/features/store/`.
  - [x] Create seller-scoped query/service functions that use `createSupabaseServerClient()` with the current SSR user session.
  - [x] Create an upsert server action for the current seller's store profile; never accept `seller_id` from the client.
  - [x] Preserve submitted form values on validation errors and return field-level errors for `name`, `avatar`, `description`, and `additional_info` where applicable.
  - [x] Revalidate `/seller/store` and `/seller` after a successful save so the seller shell can show the latest profile state.
  - [x] Keep `createSupabaseServiceRoleClient()` out of this feature and out of client components.

- [x] Replace the `/seller/store` placeholder with a mobile-first profile editor (AC: 1, 2, 3, 4, 5)
  - [x] Update `src/app/(seller)/seller/(admin)/store/page.tsx` to load the current seller's store profile and render create/edit state.
  - [x] Add a client form component using `useActionState` for pending/success/error UI.
  - [x] Use existing `GlassPanel`, `Button`, Tailwind tokens, and the calm monochrome visual language from Stories 1.0–1.1.
  - [x] Labels must be visible above fields; helper/error text must be below fields; errors must not be color-only.
  - [x] Optional empty description/additional-info values must collapse in any read-only summary/preview area instead of showing placeholder copy as real content.
  - [x] Keep the form usable at 360–430px with a single-column layout and 44x44 CSS px primary controls.

- [x] Connect first-run navigation without expanding scope (AC: 1, 5)
  - [x] Update the seller home CTA `Создать витрину` to navigate to `/seller/store`.
  - [x] If a store already exists, the `/seller/store` screen should read as edit mode, not a second-create flow.
  - [x] Do not implement public slug editing, public link copy/share, buyer preview, product creation, Telegram settings, analytics widgets, or activation-complete logic in this story.

- [x] Extend verification for store profile behavior (AC: 1, 2, 3, 4, 5)
  - [x] Extend `scripts/smoke-foundation.mjs` or add a focused smoke script to verify the store route, store feature files, migration presence, RLS enablement, authenticated policies, and absence of service-role imports in `src/features/store`.
  - [x] Add static checks for profile validation boundaries: required name, optional fields allowed empty, unsupported avatar formats rejected, `Europe/Moscow` default timezone present.
  - [x] Run `npm.cmd run check`; it must pass lint, Next typegen + typecheck, production build, and smoke.
  - [x] Update README only if new local setup instructions are needed.

### Review Findings

- [x] [Review][Patch] Store profile read errors are treated as empty create state and can lead to accidental profile overwrite [src/features/store/queries.ts:63]
- [x] [Review][Patch] Avatar validation trusts client-provided MIME type without checking file signature [src/features/store/avatar.ts:15]
- [x] [Review][Patch] Uploaded replacement avatar is orphaned if store upsert fails or throws [src/features/store/actions.ts:71]
- [x] [Review][Patch] Existing avatar lookup errors are ignored before replacement saves [src/features/store/actions.ts:63]
- [x] [Review][Patch] Valid selected avatar is lost after other field validation errors without telling seller to reselect it [src/features/store/actions.ts:36]
- [x] [Review][Patch] `stores.avatar_path` can point outside the seller-owned storage folder through direct DB writes [supabase/migrations/20260801143000_create_stores.sql:3]
- [x] [Review][Patch] JS length validation can reject emoji/surrogate-pair text differently than Postgres `char_length` [src/features/store/schema.ts:24]

## Dev Notes

### Scope Boundary

This story creates the authenticated seller's basic store profile only.

Do:

- create the first `stores` persistence slice with RLS;
- allow the authenticated seller to create/edit their own store name, avatar, optional description, optional additional information, and timezone default;
- replace `/seller/store` placeholder with a real mobile-first form;
- link the seller home CTA to `/seller/store`;
- preserve Story 1.1 seller auth/session boundaries.

Do not:

- add or validate public store slug; that is Story 1.3;
- add buyer storefront rendering; that is Story 3.1;
- add preview-as-buyer; that is Story 1.4;
- add Telegram settings; that is Story 3.4;
- add products, product media, import, analytics events, orders, payments, reviews, ratings, chat, or buyer accounts;
- use service-role access for normal seller profile creation/editing.

### Requirements Trace

`FR2`, `FR21`, `FR22`, `AD-13`, `AD-15`, `AD-17`, `AD-20`, `UX-DR4`, `UX-DR13`, `UX-DR14`, `UX-DR17`.

### Previous Story Intelligence

Story 1.1 is complete and committed as `6d9d32c feat: add seller auth shell`.

Established patterns to reuse:

- Seller auth is protected by `src/proxy.ts` with Supabase SSR `getUser()` checks for `/seller/:path*`.
- The auth page lives outside the admin shell at `src/app/(seller)/seller/sign-in/page.tsx`.
- The seller shell lives under `src/app/(seller)/seller/(admin)/` and currently exposes Home / Products / Analytics / Store nav.
- `src/app/(seller)/seller/(admin)/store/page.tsx` is a placeholder and is the main route to replace.
- `src/app/(seller)/seller/(admin)/page.tsx` has the first-run CTA `Создать витрину`; convert it to a link to `/seller/store`.
- `src/features/seller-auth/actions.ts` demonstrates the server-action + `useActionState` pattern; keep store logic in `src/features/store`, not in seller-auth.
- `src/lib/supabase/server.ts` is the normal SSR/user Supabase client boundary for server actions/routes.
- `src/lib/supabase/service-role.ts` is server-only and must not be imported by ordinary seller actions.
- `scripts/smoke-foundation.mjs` is the current lightweight verification harness and should be extended with store-profile guardrails.
- Story 1.1 review specifically fixed Supabase proxy cookie preservation, config-first auth callback origin, sanitized auth callback redirects, safe redirect rules, and stale README auth guidance. Do not regress those checks.

### Architecture Guardrails

- MVP is responsive web; phone viewport `360–430px` is the primary acceptance surface. Desktop may enhance layout but cannot change feature semantics. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-1`]
- Seller admin and public storefront are separate route/module surfaces. Public buyer routes never require seller auth and must not import seller-admin-only UI/services. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-2`]
- Domain mutations go through server-side application services; client components cannot write inconsistent shapes directly to the database. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- Browser/client code may use only public anon credentials. Seller-scoped reads/writes use server-side Supabase SSR/user clients with RLS. Service-role clients stay isolated to server-only maintenance/admin modules. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- Database tables, indexes, RLS policies, storage policies, and seed reference data must be versioned SQL migrations under `supabase/migrations/`. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- Public route availability and activation completeness are distinct. This story may create store existence; do not implement activation-complete, public route availability, or product-count semantics yet. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-20`]
- Store timezone matters for future analytics day buckets. Include a default `Europe/Moscow` timezone now so later dashboard work has a stable data home. [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-14`]

### Data Contract Guidance

Recommended `public.stores` shape for this story:

```sql
id uuid primary key default gen_random_uuid(),
seller_id uuid not null references auth.users(id) on delete cascade,
name text not null,
avatar_path text,
description text,
additional_info text,
timezone text not null default 'Europe/Moscow',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
unique (seller_id)
```

Validation constraints to enforce in SQL and server code:

- `btrim(name)` must be non-empty.
- Name should have an MVP max length such as 80 characters.
- Optional `description` and `additional_info` may be empty/null; if present, keep a small mobile-friendly max length such as 500 characters each.
- `seller_id` is derived from `auth.getUser()` / session context, never from form data.
- The story should not create `slug`; Story 1.3 owns slug format, uniqueness, reserved words, old-link 404, and public URL copy/share.

RLS policy intent:

- `select`: authenticated seller can read their own store.
- `insert`: authenticated seller can create a store only for themselves.
- `update`: authenticated seller can update only their own store and cannot change ownership.
- no delete behavior is required in this story.

Storage intent for `store-avatars`:

- private bucket;
- object paths start with the current seller id, e.g. `{seller_id}/avatar-{uuid}.webp`;
- authenticated owner can select/insert/update/delete objects in their own folder;
- public storefront stories can later generate authorized/signed display URLs after validating store visibility.

### UX Guardrails

- Store setup/edit belongs to Seller surfaces and is reached from dashboard CTA or Store nav. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Information-Architecture`]
- First seller login state starts with empty dashboard CTA `Создать витрину`. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- Store header/profile content includes photo/avatar, name, optional description/info. Missing optional content collapses cleanly. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- Form fields use label above and helper/error below; field-level errors appear before page-level errors. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- Mobile seller flows are one column at `360–430px`; primary actions remain readable and tappable. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Responsive-&-Platform`]
- Use calm, concrete copy. Avoid marketplace/SaaS-heavy language and decorative stock-art empty states. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Do's-and-Don'ts`]

### Existing Files to Read Before Implementation

Read these files completely before editing:

- `src/app/(seller)/seller/(admin)/store/page.tsx` — current Store placeholder to replace.
- `src/app/(seller)/seller/(admin)/page.tsx` — dashboard CTA should link to Store.
- `src/app/(seller)/seller/(admin)/layout.tsx` — existing seller shell/nav semantics to preserve.
- `src/features/store/README.md` — current store feature boundary note.
- `src/features/seller-auth/actions.ts` and `src/features/seller-auth/sign-in-form.tsx` — server action + `useActionState` pattern.
- `src/lib/supabase/server.ts` — SSR/user client boundary.
- `src/lib/supabase/service-role.ts` — forbidden boundary for this feature.
- `scripts/smoke-foundation.mjs` — current smoke harness to extend.
- `src/components/ui/button.tsx` and `src/components/design-system/surface.tsx` — existing primitives.

### Suggested File Structure

```text
src/features/store/
  actions.ts
  avatar.ts
  form-state.ts
  queries.ts
  schema.ts
  store-profile-form.tsx
supabase/migrations/
  20260801HHMMSS_create_stores.sql
```

Possible route changes:

```text
src/app/(seller)/seller/(admin)/store/page.tsx
src/app/(seller)/seller/(admin)/page.tsx
scripts/smoke-foundation.mjs
```

### Latest Technical Notes

- Supabase RLS should be enabled on tables in exposed schemas such as `public`; policies can use `(select auth.uid()) = seller_id` and should specify `to authenticated` for performance and clarity. [Source: Supabase Row Level Security docs — https://supabase.com/docs/guides/database/postgres/row-level-security]
- Supabase Storage uses RLS policies on `storage.objects`; uploads require insert policy, overwrites require select/update, and folder-based ownership can be enforced with `storage.foldername(name)` and the authenticated user id. [Source: Supabase Storage Access Control docs — https://supabase.com/docs/guides/storage/security/access-control]
- Next.js forms can call Server Actions via `<form action={...}>`; `useActionState` is the current pattern for validation errors and pending state in Client Components. [Source: Next.js Forms Guide — https://nextjs.org/docs/app/guides/forms]

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- `/seller/store` building and reachable only through the existing seller auth guard.
- Store profile validation requiring name server-side.
- Optional empty description/additional info preserved as empty/null and not rendered as buyer-facing placeholder content.
- Avatar validation rejecting unsupported file types before persistence.
- RLS migration present for `stores` and storage objects.
- No service-role import in `src/features/store`, public routes, or client components.
- The seller home CTA navigates to `/seller/store`.

If no real Supabase project is configured locally, checks should verify code paths, migrations, and build behavior without requiring live database writes.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1.2-Create-and-Edit-Store-Profile`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#First-run-seller-flow`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/implementation-artifacts/1-1-seller-sign-in-and-mobile-admin-shell.md#Previous-Story-Intelligence`]
- [Source: Supabase Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security]
- [Source: Supabase Storage Access Control — https://supabase.com/docs/guides/storage/security/access-control]
- [Source: Next.js Forms Guide — https://nextjs.org/docs/app/guides/forms]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Implementation Plan

- Add migration-owned persistence first so the app has a clear store data contract, RLS boundary, and avatar storage home.
- Keep all seller mutations inside `src/features/store` server actions/services and derive ownership from the current Supabase SSR user.
- Replace the Store placeholder with a mobile-first editor while preserving the existing seller shell and leaving slug/Telegram/products for later stories.
- Extend static smoke checks because local/CI may not have a live Supabase project for database writes.

### Debug Log References

- `git rev-parse HEAD` -> `6d9d32cf7c26b7167df585108f59a4862a30f439`.
- `npm.cmd run check` passed: lint, Next typegen + typecheck, production build, smoke.
- Code review reviewer layers: Edge Case Hunter completed; Blind Hunter and Acceptance Auditor timed out and were interrupted.
- `npm.cmd run check` passed after applying 7 code review patches.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Added migration `20260801143000_create_stores.sql` with `stores`, one-store-per-seller uniqueness, RLS policies, default `Europe/Moscow` timezone, and private `store-avatars` storage policies.
- Implemented `src/features/store` validation, avatar helpers, seller-scoped query, server action, form state, and mobile form UI.
- Replaced `/seller/store` placeholder with create/edit profile editor and signed avatar display after seller authorization.
- Updated seller home CTA to navigate to `/seller/store`.
- Extended smoke checks for store migration/RLS, avatar validation boundaries, no service-role imports, route presence, and dashboard CTA wiring.
- Preserved scope boundaries: no slug, Telegram, products, analytics, public storefront, payments, reviews, chat, or buyer accounts were added.
- Code review patches applied: query errors now block the editor instead of showing create mode, avatar uploads validate file signatures, failed saves clean up uploaded avatars, existing avatar lookup errors block replacement, sellers are told to reselect avatars after validation errors, `avatar_path` is constrained to the seller storage folder, and JS length validation now counts Unicode characters consistently with Postgres.

### File List

- `_bmad-output/implementation-artifacts/1-2-create-and-edit-store-profile.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/app/(seller)/seller/(admin)/page.tsx`
- `src/app/(seller)/seller/(admin)/store/page.tsx`
- `src/features/store/actions.ts`
- `src/features/store/avatar.ts`
- `src/features/store/form-state.ts`
- `src/features/store/queries.ts`
- `src/features/store/schema.ts`
- `src/features/store/store-profile-form.tsx`
- `supabase/migrations/20260801143000_create_stores.sql`

### Change Log

- 2026-08-01: Created Story 1.2 context package and marked ready for development.
- 2026-08-01: Implemented Story 1.2 store profile persistence, editor UI, and verification; moved status to review.
- 2026-08-01: Applied Story 1.2 code review patches and moved status to done.
