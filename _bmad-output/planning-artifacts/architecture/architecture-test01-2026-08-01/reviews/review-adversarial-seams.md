# Adversarial Seam Review — Персональная витрина Architecture

## Verdict

The previous incompatible-build examples are addressed. Supabase privilege use, storage visibility, top-source aggregation, public-vs-activation state, migration ownership, and import metadata now have explicit ADs or conventions.

## Findings

- **[low]** Service-role import boundary should be enforced by lint/test once code exists (§AD-15; Structural Seed) — The spine forbids broad service-role import, but code enforcement is future work. *Fix:* add a lint rule or architectural test during scaffold.
- **[low]** Signed media URL expiry/window is not specified (§AD-16) — The privacy invariant is clear; exact expiry can be story-level. *Fix:* set expiry in media stories.

## Ready signals

- No high-risk incompatible seam remains in the spine.
- AD-15 closes client/service-role/RLS ambiguity.
- AD-16 closes hidden/draft media leakage ambiguity.
- AD-19 closes top-source metric ambiguity.
- AD-20 closes public-vs-activation ambiguity.
