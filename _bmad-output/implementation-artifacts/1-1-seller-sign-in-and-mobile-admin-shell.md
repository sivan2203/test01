---
baseline_commit: 79abcc06c7b24442c8dabc80b97a4b5b160fd006
---

# Story 1.1: Seller Sign-in and Mobile Admin Shell

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,  
I want to register or sign in and land in a protected mobile-first seller cabinet,  
so that I can start creating my personal storefront from my phone.

## Acceptance Criteria

1. **Given** I am not authenticated  
   **When** I open any seller/admin route under `/seller`  
   **Then** I am redirected to seller sign-in  
   **And** public buyer storefront routes, including `/` and `/:storeSlug`, remain accessible without authentication.

2. **Given** I enter a valid seller email on the sign-in page  
   **When** I submit the passwordless sign-in/registration form  
   **Then** the app requests a Supabase email OTP/magic-link sign-in  
   **And** the UI shows a clear success state instructing me to check my email without creating a buyer account.

3. **Given** Supabase redirects back with an auth code after successful email confirmation  
   **When** the callback route exchanges the code for a session  
   **Then** I land on the seller home/admin shell  
   **And** the session is preserved between visits using Supabase SSR cookies.

4. **Given** I am authenticated  
   **When** I open `/seller` on a 360–430px mobile viewport  
   **Then** I see a mobile-first seller shell  
   **And** primary navigation exposes Home / Products / Analytics / Store with tap targets at least 44x44 CSS px.

5. **Given** the shared app foundation from Story 1.0 exists  
   **When** seller/admin shell screens render  
   **Then** they reuse existing shared primitives and design tokens  
   **And** Story 1.1 does not introduce a separate competing visual system.

6. **Given** seller identity is checked or used  
   **When** seller-scoped data or shell content is accessed  
   **Then** access is constrained to authenticated seller/admin routes using Supabase SSR user clients/RLS-compatible session context  
   **And** buyer routes do not require, expose, or depend on seller authentication.

7. **Given** I am authenticated in the seller shell  
   **When** I choose to sign out  
   **Then** the Supabase session is cleared  
   **And** I am redirected back to seller sign-in.

## Tasks / Subtasks

- [x] Replace placeholder seller route protection with real Supabase SSR session protection (AC: 1, 3, 6)
  - [x] Update `src/proxy.ts` to check the Supabase SSR user/session for `/seller/:path*` instead of relying on the temporary `seller_session=dev` bypass from Story 1.0.
  - [x] Keep `/seller/sign-in` accessible without a session and preserve the `from` query value when redirecting unauthenticated sellers.
  - [x] Ensure public routes in `src/app/(public)/...` and the root landing route do not import seller-auth-only modules and are not covered by the seller proxy matcher.
  - [x] Keep service-role imports out of proxy, public routes, client components, and ordinary seller actions.

- [x] Implement passwordless seller sign-in/registration flow (AC: 2, 3, 7)
  - [x] Create `src/features/seller-auth/` for auth-specific actions/helpers; do not put auth logic directly inside page components.
  - [x] Implement a server action for email OTP/magic-link sign-in using the existing Supabase SSR/server client pattern.
  - [x] Add an auth callback route such as `src/app/auth/callback/route.ts` that exchanges the Supabase code for a session and redirects to the safe `from` path or `/seller`.
  - [x] Implement sign-out through a server action that clears the Supabase session and redirects to `/seller/sign-in`.
  - [x] Validate email input server-side; show text-first errors and success copy; do not use color-only state.

- [x] Replace the seller sign-in placeholder UI (AC: 2, 5)
  - [x] Update `src/app/(seller)/seller/sign-in/page.tsx` to render the real sign-in/registration form.
  - [x] Use existing `Button`, `GlassPanel`, Tailwind v4 tokens, monochrome palette, and current typography/radius patterns from Story 1.0.
  - [x] Keep the copy calm and concrete; avoid marketplace/SaaS-heavy language.
  - [x] Do not add buyer login, password login, chat, cart, orders, reviews, or payment/delivery UI.

- [x] Build the protected mobile admin shell (AC: 3, 4, 5)
  - [x] Add a seller shell layout under `src/app/(seller)/seller/` that guards/render seller-only UI and provides mobile navigation.
  - [x] Replace the current `/seller` placeholder with a first-login empty dashboard state and primary CTA `Создать витрину`; do not implement store creation in this story.
  - [x] Add shell placeholder routes/pages for `/seller/products`, `/seller/analytics`, and `/seller/store` so the nav destinations exist without implementing their domain features.
  - [x] Ensure Home / Products / Analytics / Store nav labels are visible, focusable in reading order, and at least 44x44 CSS px.
  - [x] On 768px+ viewports, allow a centered/wider shell, but do not change navigation semantics.

- [x] Preserve and extend Supabase boundaries without premature domain schema (AC: 6)
  - [x] Reuse `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/service-role.ts` boundaries from Story 1.0.
  - [x] If auth callback/proxy needs a response-mutating Supabase client, add a narrowly named helper under `src/lib/supabase/` and document why it exists.
  - [x] Do not create `stores`, `products`, analytics, import, or profile tables in this story.
  - [x] Add a timestamped SQL migration only if the implementation introduces a minimal seller-owned table; otherwise keep `supabase/migrations/` unchanged.

- [x] Update baseline verification for auth shell behavior (AC: 1, 3, 4, 6, 7)
  - [x] Extend `scripts/smoke-foundation.mjs` or add an auth-shell smoke script to verify built seller routes, proxy matcher coverage, public route availability, and absence of the Story 1.0 dev-cookie bypass.
  - [x] Add static or unit-level checks for safe redirect handling so `from` cannot redirect outside the app origin.
  - [x] Run `npm.cmd run check`; it must pass lint, Next typegen + typecheck, production build, and smoke.
  - [x] Update `README.md` with seller auth environment expectations and local sign-in notes if new configuration is required.

### Review Findings

- [x] [Review][Patch] Proxy drops refreshed Supabase cookies because `response` is read before `getUser()` can mutate it [src/proxy.ts:17]
- [x] [Review][Patch] Magic-link callback URL trusts request `Origin` before the configured site URL [src/features/seller-auth/actions.ts:31]
- [x] [Review][Patch] Callback failure redirects can preserve `code`/`next` query params and unhandled exchange exceptions can 500 [src/app/auth/callback/route.ts:18]
- [x] [Review][Patch] Safe seller redirect allows `/seller/sign-in/...` return targets that should fall back to the seller shell [src/proxy-rules.mjs:23]
- [x] [Review][Patch] README still documents the removed `seller_session=dev` bypass [README.md:53]

## Dev Notes

### Scope Boundary

This story implements seller authentication and the protected mobile shell only.

Do:

- replace placeholder seller auth with Supabase SSR cookie-based seller auth;
- implement passwordless email sign-in/registration;
- create the callback and sign-out path;
- create a mobile-first seller shell and nav destinations;
- keep public buyer routes anonymous;
- preserve Story 1.0 design/system boundaries.

Do not:

- implement store profile creation/editing; that is Story 1.2;
- implement slug configuration; that is Story 1.3;
- implement products, analytics data, Telegram handoff, import, payments, delivery, reviews, or buyer accounts;
- add password auth unless explicitly required by Supabase local configuration during implementation;
- use service-role clients for user-facing seller auth or seller shell access;
- create domain tables unless a minimal auth-owned table becomes unavoidable.

### Requirements Trace

`FR1`, `FR21`, `FR22`, `AD-1`, `AD-2`, `AD-9`, `AD-15`, `UX-DR16`, `UX-DR17`, `UX-DR19`.

### Previous Story Intelligence

Story 1.0 is complete and committed as `79abcc0 feat: initialize web app foundation`.

Established patterns to reuse:

- Next.js `16.2.12`, React `19.2.4`, Tailwind CSS `4.3.3`, Node.js `>=24 <25`.
- Source tree uses `src/app` with route groups: `src/app/(public)/[storeSlug]/page.tsx` and `src/app/(seller)/seller/...`.
- Seller protection currently lives in `src/proxy.ts`; rules shared with smoke checks live in `src/proxy-rules.mjs`.
- `Button` enforces `min-h-11 min-w-11`; use it for primary/sign-out/nav actions where suitable.
- `GlassPanel` includes reduced-motion and forced-colors fallbacks; use it for shell cards rather than inventing another surface primitive.
- `npm run check` already runs lint, `next typegen && tsc --noEmit`, production build, and smoke.
- Story 1.0 review specifically removed a production-risky `seller_session=dev` bypass except for the temporary local helper. Story 1.1 must replace this placeholder with real Supabase session checks.

Files likely updated in this story:

- `src/proxy.ts`
- `src/proxy-rules.mjs`
- `src/app/(seller)/seller/sign-in/page.tsx`
- `src/app/(seller)/seller/page.tsx`
- new `src/app/(seller)/seller/layout.tsx`
- new seller shell placeholder pages under `src/app/(seller)/seller/products`, `analytics`, and `store`
- new `src/app/auth/callback/route.ts`
- new `src/features/seller-auth/*`
- optionally new Supabase SSR proxy/callback helper under `src/lib/supabase/*`
- `scripts/smoke-foundation.mjs`
- `README.md`

### Architecture Guardrails

- MVP is responsive web; phone viewport `360–430px` is the primary acceptance surface. Desktop may enhance layout but cannot change feature semantics. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-1`]
- Seller admin and public storefront are separate route/module surfaces. Public storefront routes never require buyer auth and never import seller-admin-only UI/services. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-2`]
- Auth applies only to seller/admin routes. Public buyer sessions may use anonymous session IDs for analytics later, but no buyer account/profile exists in MVP. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-9`]
- Browser/client code may use only public anon credentials. Seller-scoped reads/writes use server-side Supabase SSR/user clients with RLS. Service-role clients stay isolated to server-only maintenance/admin modules. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#AD-15`]
- The architecture maps seller auth/profile/slug work to `features/seller-auth`, `features/store`, and seller route surfaces; this story should create/use `features/seller-auth` only for auth concerns. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md#Module-Boundary-Map`]

### UX Guardrails

- Seller mobile navigation is bottom nav or compact top nav with Home / Products / Analytics / Store. Buyer surfaces do not show app-like navigation. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#Information-Architecture`]
- First seller login state is an empty dashboard with primary CTA `Создать витрину`; no analytics chrome should appear before a store exists. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#State-Patterns`]
- Accessibility floor: 44x44 CSS px tap targets, visible focus order matching reading order, disabled semantics, text-first errors/empty states, no color-only validation. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#Accessibility-Floor`]
- Responsive behavior: `360–430px` one-column seller flows; `431–767px` same IA; `768px+` may use wider/two-column enhancements without semantic changes. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md#Responsive-&-Platform`]
- Seller cabinet design: home dashboard first shows today's state, primary action is singular, and lists must not feel like desktop tables on mobile. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md#Layout-System`]

### Product Requirements

- FR-1: Seller can register and log in to the seller cabinet; seller cannot create a store without registration; seller session persists between visits; buyer never sees registration when viewing storefront or tapping CTA. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md#FR-1-Seller-registration-and-login`]
- First-run seller flow starts with sign-up/login, then empty dashboard with primary CTA `Создать витрину`, then store profile, products, public link, and analytics in later stories. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md#First-run-seller-flow`]
- Seller surfaces include login/registration, seller home dashboard, store profile editor, product list, product editor, optional import, analytics detail, and preview mode. Story 1.1 only establishes login/registration plus shell destinations. [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md#Seller-surfaces`]

### Latest Technical Notes

- Supabase recommends `@supabase/ssr` for SSR frameworks where the user session lives in cookies; it handles cookie-based sessions and refresh-token rotation. [Source: Supabase “Which package to use” — https://supabase.com/docs/guides/auth/choosing-a-server-package]
- Supabase SSR Auth stores access and refresh tokens in secure cookies for server access; `@supabase/ssr` uses the PKCE flow by default. [Source: Supabase SSR Advanced Guide — https://supabase.com/docs/guides/auth/server-side/advanced-guide]
- Supabase troubleshooting guidance says `@supabase/auth-helpers` is deprecated and fixes/features focus on `@supabase/ssr`; do not introduce auth-helpers. [Source: Supabase Next.js Auth troubleshooting — https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV]
- Next.js 16 uses the `proxy.ts` convention for request-time redirects/rewrites; `middleware.ts` is deprecated. Story 1.0 already aligned to `src/proxy.ts`. [Source: local Next docs `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`]
- Next.js forms can call Server Actions via the form `action` attribute; `useActionState` can expose pending/success/error state for client-side form UX. [Source: Next.js Forms Guide — https://nextjs.org/docs/app/guides/forms]
- Next.js authentication guidance supports form + Server Action login/signup flows because Server Actions execute on the server. [Source: Next.js Authentication Guide — https://nextjs.org/docs/app/guides/authentication]

### Implementation Guidance

#### Auth method

Use passwordless email OTP/magic-link for this story. It satisfies “register or sign in” with minimal UI and no password management. The same form can serve registration and sign-in through Supabase Auth. If Supabase project settings require a different email OTP mode locally, document that in README and keep UI copy generic: “Проверьте email”.

#### Safe redirects

Do not trust arbitrary `from` values. Only redirect to same-origin relative paths beginning with `/seller`; otherwise fall back to `/seller`. Preserve query strings for valid seller paths.

Suggested helper responsibilities:

- `getSafeSellerRedirectPath(value: string | null): string`
- `isSellerPath(pathname: string): boolean`
- keep these helpers pure enough for smoke/static checks.

#### Shell structure

Prefer:

```text
src/app/(seller)/seller/
  layout.tsx
  page.tsx
  sign-in/page.tsx
  products/page.tsx
  analytics/page.tsx
  store/page.tsx
src/features/seller-auth/
  actions.ts
  schema-or-validation.ts
  redirect.ts
```

The seller layout should render only seller/admin UI and should not wrap `/seller/sign-in` if that makes the auth page visually noisy. If using nested route groups is cleaner, keep public URL paths stable.

#### Supabase client boundaries

Reuse:

- `createSupabaseBrowserClient()` only in Client Components that truly need browser auth APIs.
- `createSupabaseServerClient()` for server actions/routes that operate as the current user.
- `createSupabaseServiceRoleClient()` must not be imported in this story.

If proxy needs to refresh session cookies, use an SSR client pattern that can read/write request/response cookies. Be careful with cache headers on token refresh per Supabase SSR guidance.

### Testing Requirements

At minimum, implementation must leave:

- `npm.cmd run check` passing.
- unauthenticated `/seller` protected by real session check, not `seller_session=dev`;
- `/seller/sign-in` reachable without session;
- public `/` and `/:storeSlug` build and remain auth-free;
- auth callback validates and exchanges `code`;
- sign-out clears session and redirects to `/seller/sign-in`;
- seller nav destination pages build;
- smoke/static checks catch regressions in proxy matcher, route placement, and safe redirect handling.

If no real Supabase project is configured in CI/local env, tests should verify logic and build behavior without making network calls. Do not require real emails to pass baseline checks.

### Project Structure Notes

Current repository has a clean foundation after Story 1.0:

- App Router under `src/app`.
- Public storefront placeholder under `src/app/(public)/[storeSlug]/page.tsx`.
- Seller placeholders under `src/app/(seller)/seller/...`.
- Shared primitives under `src/components/ui` and `src/components/design-system`.
- Supabase boundaries under `src/lib/supabase`.
- Smoke script under `scripts/smoke-foundation.mjs`.

No domain database tables exist yet. Keep it that way unless this story explicitly needs a minimal auth-adjacent migration, and if so include a timestamped SQL migration plus RLS note.

### References

- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md#Story-1.1`]
- [Source: `C:\Work\projects\test01\_bmad-output\implementation-artifacts\1-0-initialize-greenfield-web-app-foundation.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md`]
- [Source: `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md`]
- [Source: Supabase “Which package to use” — https://supabase.com/docs/guides/auth/choosing-a-server-package]
- [Source: Supabase SSR Advanced Guide — https://supabase.com/docs/guides/auth/server-side/advanced-guide]
- [Source: Supabase Next.js Auth troubleshooting — https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV]
- [Source: Next.js Forms Guide — https://nextjs.org/docs/app/guides/forms]
- [Source: Next.js Authentication Guide — https://nextjs.org/docs/app/guides/authentication]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `git rev-parse HEAD` -> `79abcc06c7b24442c8dabc80b97a4b5b160fd006`.
- `npm.cmd run check` passed: lint, Next typegen + typecheck, production build, smoke.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Replaced Story 1.0 seller dev-cookie placeholder with Supabase SSR session checks in `src/proxy.ts`.
- Added a response-mutating Supabase proxy helper for request-time auth cookie handling.
- Added safe seller redirect helpers and smoke coverage for external/open redirect rejection.
- Implemented passwordless email sign-in request, auth callback code exchange, and sign-out server action.
- Replaced seller sign-in placeholder with a real mobile-first email form and text-first success/error states.
- Added protected seller shell route group with Home / Products / Analytics / Store navigation and placeholder destination pages.
- Preserved scope boundaries: no store/profile/product/analytics/import tables or domain behavior were added.
- Updated README and `.env.example` for seller auth callback configuration.
- Code review patches applied: preserved refreshed Supabase proxy cookies, made magic-link callback origin config-first, sanitized callback error redirects, tightened safe seller redirect targets, and removed stale dev-cookie README guidance.

### File List

- `.env.example`
- `README.md`
- `_bmad-output/implementation-artifacts/1-1-seller-sign-in-and-mobile-admin-shell.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/app/(seller)/seller/(admin)/analytics/page.tsx`
- `src/app/(seller)/seller/(admin)/layout.tsx`
- `src/app/(seller)/seller/(admin)/page.tsx`
- `src/app/(seller)/seller/(admin)/products/page.tsx`
- `src/app/(seller)/seller/(admin)/store/page.tsx`
- `src/app/(seller)/seller/page.tsx` (deleted)
- `src/app/(seller)/seller/sign-in/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/features/seller-auth/actions.ts`
- `src/features/seller-auth/redirect.ts`
- `src/features/seller-auth/sign-in-form.tsx`
- `src/features/seller-auth/state.ts`
- `src/lib/supabase/proxy.ts`
- `src/proxy-rules.mjs`
- `src/proxy.ts`

### Change Log

- 2026-08-01: Implemented Story 1.1 seller sign-in and mobile admin shell; moved status to review.
