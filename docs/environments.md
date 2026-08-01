# Environment and Deployment Boundaries

The MVP deployment envelope is Vercel + hosted Supabase.

## Environments

- `local`: developer machine, local env values.
- `preview`: Vercel preview deployment; must point only to staging Supabase.
- `staging`: shared validation environment and database/storage/auth project.
- `production`: public production deployment; must point only to production Supabase.

## Secrets

- Real secrets live in provider environment variables.
- Do not commit `.env.local`, production env files, or Supabase service role keys.
- Browser code may use only `NEXT_PUBLIC_*` Supabase public values.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and restricted to isolated maintenance/admin modules.

## Promotion Guardrail

Public pages must pass smoke checks before production promotion.
