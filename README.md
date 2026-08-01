# test01

Mobile-first personal storefront MVP foundation.

## Stack

- Node.js 24 LTS
- Next.js App Router
- React
- Tailwind CSS 4
- shadcn-compatible UI primitives
- Supabase JS/SSR clients
- Vercel-compatible build

## Setup

```bash
npm install
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill `.env.local` with Supabase values for local development. Never commit real secrets.

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run typecheck
npm run smoke
npm run build
```

`npm run check` runs lint, typecheck, production build, and the foundation smoke check.

## Route Boundaries

- Public buyer routes are available without auth, including `/` and `/:storeSlug`; storefront routes live under the `(public)` App Router group.
- Seller/admin routes live under `/seller`.
- `/seller` is protected by the Next.js 16 `src/proxy.ts` convention and Supabase SSR session cookies. Unauthenticated visitors are redirected to `/seller/sign-in`.

## Environment Boundaries

See `docs/environments.md`.

Preview deployments must point only to staging Supabase. Production deployments must point only to production Supabase.

## Seller Auth

Seller sign-in uses Supabase passwordless email links through `@supabase/ssr`.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` is used to build the email callback URL for local development and previews. Public storefront routes remain anonymous; auth is only for `/seller` routes.
