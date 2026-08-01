---
baseline_commit: d11d8b7c045877be4b92468c3cffd84744b3acf2
---

# Story 1.0: Initialize Greenfield Web App Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,  
I want the MVP web app foundation initialized with the agreed stack, routes, design primitives, database migration baseline, and environment boundaries,  
so that product stories can be implemented consistently without reworking the substrate.

## Acceptance Criteria

1. **Given** the project is greenfield  
   **When** the initial app foundation is created  
   **Then** it uses the architecture-approved stack: Node.js 24 LTS, Next.js App Router, React, Tailwind CSS, shadcn/ui, Supabase client packages, and Vercel-compatible configuration  
   **And** actual package versions are recorded if starter defaults differ from architecture assumptions.

2. **Given** the app routes are initialized  
   **When** route groups and shared folders are created  
   **Then** seller/admin surfaces and public buyer storefront surfaces are separated  
   **And** shared code is limited to primitives, adapters, auth/session, analytics ingestion, and design-system components.

3. **Given** the design system foundation is initialized  
   **When** base styles and primitives are available  
   **Then** monochrome tokens, contrast-safe text pairs, 44x44 CSS px tap target guidance, reduced motion, and reduced transparency fallbacks are represented in reusable primitives or documentation.

4. **Given** Supabase is introduced  
   **When** schema, RLS, storage policies, or seed data are needed  
   **Then** changes are represented through timestamped SQL migrations under `supabase/migrations/`  
   **And** browser code uses only public anon credentials while service-role usage is isolated to server-only maintenance/admin paths.

5. **Given** deployment configuration is prepared  
   **When** local, preview, staging, and production environments are documented or stubbed  
   **Then** preview deployments are intended to point only to staging Supabase and production only to production Supabase  
   **And** secrets are expected to live in provider environment variables, not committed files.

6. **Given** the foundation is complete  
   **When** a developer runs the baseline checks  
   **Then** the app has a minimal smoke test or verification path for public route rendering and seller route protection  
   **And** later stories can add domain tables/entities only when first needed.

## Tasks / Subtasks

- [x] Confirm repository baseline before scaffold (AC: 1)
  - [x] Verify there is no existing application source tree to preserve; current repo is greenfield except `README.md`, `_bmad/`, and `_bmad-output/`.
  - [x] Scaffold into the repository root, not a nested `my-app/` or `app/` wrapper directory.
  - [x] Preserve BMAD folders and existing planning artifacts.

- [x] Initialize the Next.js web app foundation (AC: 1, 6)
  - [x] Create a Next.js App Router project at repo root with TypeScript, ESLint, Tailwind CSS, App Router, and `@/*` import alias.
  - [x] Use Node.js 24 LTS as the target runtime in project docs/config where applicable.
  - [x] Add package scripts for local development, build, lint, and any typecheck/test command the scaffold supports.
  - [x] Record actual generated package versions in implementation notes if they differ from Architecture Stack assumptions.

- [x] Add shadcn/ui and Tailwind v4-compatible styling foundation (AC: 1, 3)
  - [x] Initialize shadcn/ui for the existing Next.js project.
  - [x] Add only the minimal primitive(s) needed for foundation verification, such as `button` or `card`; do not add a broad component catalog.
  - [x] Ensure Tailwind v4 setup uses `@tailwindcss/postcss` and `@import "tailwindcss"` / `@import 'tailwindcss'` style setup if the scaffold does not already configure it.
  - [x] Add project design token placeholders for monochrome colors, Telegram accent, raised/glass surfaces, radius, spacing, and typography roles without overbuilding all final components.

- [x] Establish route/module separation and shared source layout (AC: 2)
  - [x] Create or document App Router groups for public buyer routes and seller/admin routes.
  - [x] Create feature folders consistent with Architecture: `features/store`, `features/product`, `features/contact`, `features/analytics`, and `features/import` may exist as empty/module placeholders only when useful; do not add domain behavior yet.
  - [x] Create shared locations for `components/ui`, `components/design-system`, `lib/supabase`, and common primitives.
  - [x] Ensure public buyer routes do not import seller-admin-only modules.

- [x] Establish Supabase client and migration boundaries (AC: 4)
  - [x] Add Supabase client packages required by architecture: `@supabase/supabase-js@2` and `@supabase/ssr`.
  - [x] Provide env example entries for `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon public key; do not commit real secrets.
  - [x] If service-role support is stubbed, place it in a server-only isolated module such as `lib/supabase/service-role` and prevent client imports.
  - [x] Create `supabase/migrations/` with documentation or placeholder structure; do not create all domain tables in this story.

- [x] Document environment and deployment expectations (AC: 5)
  - [x] Document local, preview, staging, and production environment separation.
  - [x] State that preview deployments point only to staging Supabase and production points only to production Supabase.
  - [x] State that secrets live in provider environment variables, never committed files.
  - [x] Keep Vercel compatibility: standard Next.js `build` / `start` scripts and no custom server unless explicitly justified.

- [x] Add baseline verification path (AC: 6)
  - [x] Verify the app builds successfully.
  - [x] Verify lint/typecheck passes or document scaffold limitations.
  - [x] Add a minimal smoke verification for public route rendering and seller route protection placeholder behavior.
  - [x] Update `README.md` with setup, env, and verification commands.

### Review Findings

- [x] [Review][Patch] Smoke check does not verify public rendering or seller redirect behavior [scripts/smoke-foundation.mjs:5]
- [x] [Review][Patch] Public buyer route is not placed in a documented `(public)` App Router group [src/app/[storeSlug]/page.tsx:1]
- [x] [Review][Patch] Telegram CTA color pair is below WCAG AA normal-text contrast [src/components/ui/button.tsx:14]
- [x] [Review][Patch] Node.js 24 target runtime is documented but not enforced in package config [package.json:1]
- [x] [Review][Patch] Temporary seller-session bypass is not gated to local development [src/proxy.ts:12]
- [x] [Review][Patch] Seller redirect drops query string from the return path [src/proxy.ts:19]
- [x] [Review][Patch] Baseline `check` script omits the production Next build [package.json:12]
- [x] [Review][Patch] Button primitive enforces 44px height but not 44px minimum width [src/components/ui/button.tsx:7]
- [x] [Review][Patch] Glass surface lacks explicit forced-colors/high-contrast fallback [src/components/design-system/surface.tsx:11]
- [x] [Review][Patch] README setup block is marked bash but uses Windows-only `copy` [README.md:17]

## Dev Notes

### Scope Boundary

This is a foundation story, not a product-feature story. It must create the substrate needed by later stories while avoiding premature domain implementation.

Do:

- scaffold the app at repo root;
- create minimal route/layout structure;
- create shared primitives and guardrails;
- add Supabase client/migration boundaries;
- document environment/deployment expectations;
- add baseline verification.

Do not:

- create all product/store/analytics/import tables upfront;
- implement seller registration UI beyond a placeholder/protected-route smoke path;
- implement product catalog, Telegram handoff, analytics ledger, or import behavior;
- add a large shadcn/ui component catalog before stories need it;
- commit real Supabase/Vercel secrets.

### Requirements Trace

`NFR1`, `NFR2`, `NFR3`, `NFR5`, `AD-1`, `AD-2`, `AD-13`, `AD-15`, `AD-17`, `AD-18`, `UX-DR1`, `UX-DR2`, `UX-DR17`, `UX-DR18`, `UX-DR19`.

### Architecture Guardrails

- MVP is a responsive web app; 360–430px phone viewport is the primary acceptance surface. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-1`]
- Seller admin and public storefront are separate route/module surfaces. Public buyer routes never require buyer auth and must not import seller-admin-only UI/services. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-2`]
- Domain mutations must go through server-side application services; database RLS is a defense layer, not the only policy location. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-13`]
- Browser/client code may use only public anon credentials. Seller-scoped work uses server-side SSR/user clients with RLS. Service-role clients are isolated to server-only admin/maintenance modules. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-15`]
- Schema, RLS, storage policies, and seed data change only through timestamped SQL migrations under `supabase/migrations/`. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-17`]
- Deployment envelope is Vercel + Supabase with local, preview, staging, and production separation. Preview points to staging Supabase only; production points to production Supabase only. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-18`]

### Stack Requirements

Architecture target stack:

- Node.js 24 LTS
- Next.js 16 App Router
- React 19.2
- Tailwind CSS 4.x
- shadcn/ui current CLI/components for Tailwind v4 + React 19
- Supabase hosted Postgres/Auth/Storage
- `@supabase/supabase-js@2`
- `@supabase/ssr`
- Vercel preview/staging/production deployments

If current scaffold defaults differ, record exact installed versions and update Architecture before relying on the difference downstream. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#Stack`]

### Recommended Source Structure

Use the architecture structure as the target shape, adjusted only if the scaffold requires a `src/` directory decision:

```text
app/
  (public)/
  (seller)/
  api/
components/
  ui/
  design-system/
features/
  store/
  product/
  contact/
  analytics/
  import/
lib/
  supabase/
    browser.ts
    server.ts
    service-role.ts
supabase/
  migrations/
```

If using `src/`, keep the same semantic structure under `src/` and update `tsconfig` alias/documentation accordingly. Do not mix root `app/` and `src/app/`.

### UX Guardrails

- Design foundation must support monochrome palette, Telegram accent, typography roles, spacing/radius scale, and component token map. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md#Tokens`]
- Load-bearing text contrast should meet WCAG AA where feasible. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md#Color-System`]
- Primary tap targets must be at least 44x44 CSS px. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#Accessibility-Behavior`]
- Reduced motion must avoid motion-only information; reduced transparency/high-contrast contexts use solid raised surface fallback. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#Accessibility-Behavior`]
- Primary MVP responsive range is 360–430px; 431–767px keeps same IA; 768px+ may enhance layout without changing semantics. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#Responsive-&-Platform`]

### Latest Technical Notes

- Next.js installation docs state `create-next-app@latest` default setup enables TypeScript, Tailwind, ESLint, App Router, Turbopack, and `@/*` import alias; minimum Node.js version is 20.9, while this project targets Node.js 24 LTS. [Source: Next.js Installation, 2026-03-16]
- Next.js App Router pages/layouts are Server Components by default; use Client Components only for interactivity/browser APIs. [Source: Next.js Server and Client Components, 2026-03-16]
- Tailwind v4 setup uses `tailwindcss` + `@tailwindcss/postcss`, PostCSS plugin config, and `@import "tailwindcss"` in global CSS. [Source: Next.js CSS docs / Tailwind v4 blog]
- shadcn/ui Next.js docs support initializing an existing Next.js project with `shadcn@latest init` and adding components incrementally. [Source: shadcn/ui Next.js docs]
- Supabase Next.js Auth quickstart uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env values for the public client. If this project uses an anon key name instead, document the mapping consistently. [Source: Supabase Next.js Auth quickstart]

### Testing Requirements

At minimum, this story should leave:

- package install lockfile committed for the selected package manager;
- `build` command passing;
- lint/typecheck command passing or documented if scaffold provides only one;
- smoke verification that a public route renders without auth;
- smoke verification or placeholder middleware behavior showing seller/admin route protection will be enforced in Story 1.1;
- README commands for setup, env, build/lint/check.

### Project Structure Notes

Current repository before this story has no application source tree. Existing files are mostly BMAD configuration and generated planning artifacts; `README.md` currently only contains `# test01!`.

No previous implementation story exists, so there are no prior story learnings or code patterns to preserve. Recent commits are documentation/planning commits:

- `d11d8b7 docs: resolve BMad readiness findings`
- `480e848 docs: add BMad implementation planning artifacts`
- `d3ffefa feat: create plan and documentation`

### References

- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md#Story-1.0`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\implementation-readiness-report-2026-08-01.md#Rerun-After-Correct-Course-Updates`]
- [Source: Next.js Installation — https://nextjs.org/docs/app/getting-started/installation]
- [Source: Next.js Server and Client Components — https://nextjs.org/docs/app/getting-started/server-and-client-components]
- [Source: Next.js CSS / Tailwind setup — https://nextjs.org/docs/app/getting-started/css]
- [Source: shadcn/ui Next.js — https://ui.shadcn.com/docs/installation/next]
- [Source: Supabase Auth with Next.js — https://supabase.com/docs/guides/auth/quickstarts/nextjs]
- [Source: Node.js Releases — https://nodejs.org/en/about/previous-releases]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `node --version` -> `v24.13.1`.
- `npx.cmd create-next-app@latest next-scaffold-temp --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm --yes` completed after one transient `ECONNRESET` retry.
- `npm.cmd install @supabase/supabase-js@2 @supabase/ssr` completed after one transient `ECONNRESET` retry.
- `npx.cmd shadcn@latest init -d` failed twice with `ECONNRESET`; implemented shadcn-compatible local configuration/primitives manually and installed the minimal utility packages.
- `npm.cmd install class-variance-authority clsx tailwind-merge` completed.
- `npm.cmd run check` passed: lint, typecheck, smoke.
- `npm.cmd run build` passed with Next.js `16.2.12` and detected `Proxy (Middleware)`.
- `npm.cmd install --save-dev @types/node@24` updated Node typings to `24.13.3`.
- `npm.cmd run check` passed after code-review patches: lint, Next typegen + typecheck, build, smoke.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.

- Initialized the greenfield Next.js App Router foundation in the repository root while preserving `_bmad/` and `_bmad-output/`.
- Stack installed/verified: Node.js `v24.13.1`, Next.js `16.2.12`, React/React DOM `19.2.4`, Tailwind CSS `4.3.3`, `@tailwindcss/postcss` `4.3.3`, TypeScript `5.9.3`, Supabase JS `2.111.0`, Supabase SSR `0.12.4`.
- Added shadcn-compatible component metadata and minimal UI primitives (`Button`, `GlassPanel`) instead of a broad component catalog.
- Replaced network-dependent `next/font/google` usage with a system font stack so production builds work without external font fetches.
- Added public storefront and seller route placeholders with Next.js 16 `src/proxy.ts` seller-route protection placeholder.
- Added Supabase browser/server/service-role module boundaries, `.env.example`, and migration folder documentation without creating domain tables.
- Added local/preview/staging/production environment documentation and README setup/verification instructions.
- Baseline validation passed: `npm.cmd run check` and `npm.cmd run build`.
- Resolved code-review findings: strengthened smoke verification, moved public storefront route into `(public)` group, enforced Node 24 via `engines`, updated Node typings, gated the temporary seller cookie bypass to development, preserved seller redirect query state, included build in `npm run check`, improved tap-target/accessibility contrast and forced-colors fallbacks, and split README setup commands by shell.

### File List

- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `_bmad-output/implementation-artifacts/1-0-initialize-greenfield-web-app-foundation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `components.json`
- `docs/environments.md`
- `eslint.config.mjs`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- `scripts/smoke-foundation.mjs`
- `src/app/(public)/[storeSlug]/page.tsx`
- `src/app/(seller)/seller/page.tsx`
- `src/app/(seller)/seller/sign-in/page.tsx`
- `src/app/favicon.ico`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/design-system/index.ts`
- `src/components/design-system/surface.tsx`
- `src/components/ui/button.tsx`
- `src/features/analytics/README.md`
- `src/features/contact/README.md`
- `src/features/import/README.md`
- `src/features/product/README.md`
- `src/features/store/README.md`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/service-role.ts`
- `src/lib/utils.ts`
- `src/proxy-rules.mjs`
- `src/proxy.ts`
- `supabase/README.md`
- `supabase/migrations/.gitkeep`
- `tsconfig.json`

### Change Log

- 2026-08-01: Implemented Story 1.0 greenfield web app foundation and moved status to review.
- 2026-08-01: Applied code-review fixes and moved Story 1.0 to done.
