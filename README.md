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
- `/seller` is protected by the Next.js 16 `src/proxy.ts` convention and redirects to `/seller/sign-in` unless a temporary local-development cookie `seller_session=dev` exists.

Story 1.1 replaces this placeholder route protection with the real seller auth flow.

## Environment Boundaries

See `docs/environments.md`.

Preview deployments must point only to staging Supabase. Production deployments must point only to production Supabase.
