---
title: "Fix local store profile API grants"
type: "bugfix"
created: "2026-08-02"
status: "done"
review_loop_iteration: 0
context: []
baseline_commit: "3a276ddf647fc600541b5640d0105c564bddf287"
---

<frozen-after-approval>

## Intent

**Problem:** In the current local Supabase stack, `api.auto_expose_new_tables = false`. The `public.stores` table has row-level security policies but no table privileges for the `authenticated` role. As a result, a signed-in seller cannot load a store profile on `/seller`, and cannot reliably create or edit it.

**Approach:** Add one versioned Supabase migration that grants `USAGE` on the `public` schema and only `SELECT`, `INSERT`, and `UPDATE` on `public.stores` to `authenticated`. The existing owner-scoped RLS policies remain the authorization boundary.

## Boundaries

### Always

- Generate a new migration through the Supabase CLI; do not alter applied migrations.
- Grant `USAGE` on `public`, plus `SELECT`, `INSERT`, and `UPDATE` only on `public.stores`, to `authenticated`.
- Keep the existing RLS policies and their `auth.uid() = seller_id` ownership checks unchanged.
- Apply and verify the migration against the local Supabase stack.

### Ask first

- Applying this migration to the hosted Supabase project.
- Broadening table privileges to `products`, `product_media`, or any other table.
- Changing `api.auto_expose_new_tables` or the API schema exposure.

### Never

- Disable RLS or weaken its ownership predicates.
- Grant `anon`, `public`, or service-role access to `public.stores`.
- Grant `DELETE` access.
- Replace the minimal grant with a global automatic-exposure setting.

## I/O Contract

| Actor / state | Operation | Expected result |
| --- | --- | --- |
| Authenticated seller without a store | Read own store | A permitted empty result; the UI offers profile creation. |
| Authenticated seller | Create or update own store | Permitted by table grant and owner-scoped RLS policy. |
| Authenticated seller | Read or modify another seller's store | Blocked by existing RLS policies. |
| Anonymous visitor | Any `stores` table operation | Blocked because no table privilege is granted. |

## Code Map

- `supabase/migrations/20260801143000_create_stores.sql` — defines `public.stores` and its existing RLS policies.
- `supabase/migrations/<generated>_grant_store_api_access.sql` — new minimal table-privilege migration.
- `src/features/store/queries.ts` — seller Home reads the current seller's profile.
- `src/features/store/actions.ts` — profile form reads, creates, and updates `public.stores`.
- `src/app/(seller)/seller/(admin)/page.tsx` — renders the current error state when the profile query fails.

## Tasks

1. Generate a new Supabase migration for store API access.
2. Add the least-privilege schema and table grants for `authenticated`, with a short note that RLS remains in force.
3. Apply it locally and inspect the resulting privileges.
4. Run project verification and confirm the seller Home/profile flow is no longer blocked by a database-permission error.

## Acceptance Criteria

1. With the local Supabase stack running, a signed-in seller opening `/seller` no longer receives the generic “Не удалось загрузить магазин” state due to missing table privileges.
2. A signed-in seller can create and later edit only their own store profile.
3. Existing RLS policies still prevent one seller from reading or modifying another seller's store.
4. Anonymous users have no table privileges on `public.stores`.
5. The change is represented by a new, unapplied-before migration and does not rewrite migration history.

## Design Notes

Schema and table privileges permit the Data API to execute the operation; RLS evaluates which rows that operation may affect. Both are needed here. No sequence privilege is needed because `stores.id` uses UUID generation, and storage policies are out of scope.

## Verification

- Apply the generated migration to the local Supabase instance.
- Inspect grants for `public.stores` and confirm that only the intended authenticated operations were added.
- Run the relevant project checks.
- Manually refresh `/seller` while signed in locally, then create or edit the store profile and return to Home.

</frozen-after-approval>

## Implementation Completion

- [x] Generated and added a new versioned Supabase migration for the approved store API access change.
- [x] Applied the migration to the local Supabase instance and confirmed it appears in local migration history.
- [x] Confirmed `authenticated` has only `SELECT`, `INSERT`, and `UPDATE` on `public.stores`; `anon` did not receive those privileges.
- [x] Confirmed the existing authenticated RLS policies remain in place and transactionally verified seller-profile create and update access with rollback.
- [x] Ran `supabase db lint --local`, scoped source lint, and TypeScript type checking successfully. The full project check is separately blocked by generated local Supabase runtime files under `supabase/.temp` being linted.

## Suggested Review Order

- Makes the `public` schema reachable without exposing any table operation.
  [`20260802173803_grant_store_api_access.sql:3`](../../supabase/migrations/20260802173803_grant_store_api_access.sql#L3)

- Permits only profile reads, creates, and edits; existing RLS still filters rows.
  [`20260802173803_grant_store_api_access.sql:4`](../../supabase/migrations/20260802173803_grant_store_api_access.sql#L4)
