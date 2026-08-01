# Architecture Update Pass Report — 2026-08-01

## Summary

Applied architecture validation findings to `ARCHITECTURE-SPINE.md`. Deterministic lint passes after the update.

## Closed or materially addressed

- Added **AD-15 — Supabase privilege boundary is explicit** to close the high findings around service-role/RLS/client usage.
- Added **AD-16 — Product media access follows product visibility** to prevent draft/hidden media leakage.
- Added **AD-17 — Schema changes are migration-owned** for database/RLS/storage policy change control.
- Added **AD-18 — Deployment envelope is Vercel + Supabase with preview/staging/production separation**.
- Added **AD-19 — Dashboard top source is ranked by store views in MVP**.
- Added **AD-20 — Public availability and activation success are distinct states**.
- Added **AD-21 — Import extraction metadata has a data home when FR-9 ships**.
- Added conventions for Supabase clients, migrations, and top-source ranking.
- Updated structural seed with Supabase client modules and `supabase/migrations/`.
- Updated ERD with `IMPORT_ROW`.
- Updated capability map to reference new ADs.

## Verification

- `lint_spine.py` result after update: pass, 0 findings.

## Remaining non-blocking

- Exact package versions still need lockfile confirmation when the project is scaffolded.
- Detailed SLOs can wait until production traffic exists; launch smoke checks are now fixed by AD-18.
