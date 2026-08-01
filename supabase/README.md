# Supabase Boundary

All schema, RLS, storage policy, and seed data changes must be represented as timestamped SQL migrations under `supabase/migrations/`.

Do not create or change production schema manually through the Supabase dashboard without adding the matching migration to this directory.

Story 1.0 intentionally creates only the migration home. Domain tables are added by the first story that needs them.
