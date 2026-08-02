---
baseline_commit: 51ec6d6d760727fdfebbdbd0e7c589567b287ff2
---

# Story 5.1: Import Excel/CSV Products as Drafts

Status: done

<!-- Story generated from Epic 5 context and current project implementation. -->

## Story

As a seller,
I want to import an Excel or CSV file into product drafts,
so that I can move an existing small catalog into my storefront with minimal manual entry.

Release classification: Should / conditional. This story may ship only if it does not delay the core loop: manual product -> public storefront -> Telegram CTA -> analytics.

## Acceptance Criteria

1. **Supported upload and draft-only disclosure (FR9, AD-6, UX-DR12)**
   - **Given** I am an authenticated seller with a store
   - **When** I open product import
   - **Then** I can choose a supported `.csv`, `.xls`, or `.xlsx` file within the documented size/row limits
   - **And** the UI explicitly says that successful rows create Draft products only and are not published automatically
   - **And** unsupported extensions, empty files, oversized files, files with no usable header row, and files exceeding row limits receive actionable Russian errors.

2. **Preview and adjustable column mapping (FR9, UX-DR12, UX-DR13)**
   - **Given** the file has a recognizable header row
   - **When** it is parsed
   - **Then** the seller sees a mobile-simplified preview and the inferred mapping for product title, price/"по запросу", description, availability, and supported optional source metadata
   - **And** the seller can adjust or clear mappings before creating drafts
   - **And** unmapped columns are clearly identified and never silently written into unrelated product fields
   - **And** only the first worksheet is used for Excel workbooks; this limitation is stated in the UI.

3. **Authoritative row validation and partial success (FR9, FR21, AD-6, AD-13)**
   - **Given** the seller confirms a mapping
   - **When** rows are validated on the server
   - **Then** validation reuses the existing product draft contract (`title`, `description`, `priceMode`, `priceAmount`, `availabilityStatus`) and never trusts client-normalized values
   - **And** title is required; price may be numeric or "по запросу"; description and availability are optional with the existing product defaults
   - **And** each invalid row receives a stable row number and human-readable field/error details
   - **And** valid rows remain importable when other rows are invalid.

4. **Create seller-owned drafts with provenance (FR9, AD-6, AD-13, AD-21, SM-7)**
   - **Given** one or more rows are valid enough to import
   - **When** I confirm import
   - **Then** the system creates one seller-owned Product draft per valid row with prefilled supported fields
   - **And** every created product has `status = draft`, no media, and no publication side effect
   - **And** the import batch and row provenance retain the source filename/format, row number, mapping/result metadata, and product linkage without storing the raw uploaded file permanently
   - **And** the operation resolves the current store from the authenticated seller session; no client-provided `store_id` can widen ownership.

5. **Result summary and normal product flow (FR9, UX-DR13, UX-DR14)**
   - **Given** import processing completes
   - **When** the result is shown
   - **Then** the seller sees counts for created drafts, rejected rows, and any processing failure
   - **And** row errors remain inspectable without exposing raw file contents or secrets
   - **And** created drafts appear in the existing Products list with Draft status
   - **And** each draft can be edited, receive photos, and be published only through the existing product lifecycle flow.

6. **Mobile-first accessible mapper and error states (UX-DR12, UX-DR13, UX-DR14, FR21)**
   - **Given** I review mapping or row errors at 360–430px
   - **When** the import UI renders
   - **Then** it uses a readable stacked/table-like mobile layout with no horizontal page overflow
   - **And** primary actions have visible focus and at least 44px tap targets
   - **And** labels, status, row number, and errors are available to assistive technology without relying on color alone
   - **And** an import read/mutation failure is distinct from a valid zero-created result and offers retry guidance.

7. **Explicit scope boundary (AD-6, AD-21)**
   - **Given** screenshot/link recognition, AI extraction, arbitrary catalog metadata, or automatic publication is considered
   - **When** this story is implemented
   - **Then** those capabilities remain out of scope
   - **And** the implementation does not add buyer identity, orders, payments, media uploads, or a new publication path.

## Tasks / Subtasks

- [x] Task 1: Define the import domain contract and supported file/mapping scope (AC: 1–3, 7)
  - [x] Add typed import states, supported formats, limits, canonical target fields, mapping aliases, row/result error codes, and aggregate result contracts under `src/features/import`.
  - [x] Align normalization with `src/features/product/schema.ts`; preserve the current 120-character title, 1000-character description, `fixed/request` price modes, and `in_stock/out_of_stock` availability contract.
  - [x] Define safe limits for file bytes, worksheets, columns, and rows; reject unsupported/ambiguous input deterministically and document the chosen limits in UI and tests.
  - [x] Keep arbitrary source columns in provenance metadata only; do not expand the product model for unplanned fields.

- [x] Task 2: Add parser and preview/mapping flow for CSV and Excel (AC: 1–2, 6–7)
  - [x] Add the smallest justified spreadsheet parser dependency (SheetJS CE `xlsx` or an approved equivalent) and pin it; do not load a parser from a runtime CDN or execute workbook macros/formulas.
  - [x] Parse the selected file into a bounded preview using the first worksheet, handling UTF-8/BOM and common delimiter/locale representations without silently changing values.
  - [x] Add a seller-only import route reachable from the existing Products surface and a narrow client component only for file selection, preview, mapping, and submit state; keep auth, persistence, and authoritative validation server-side.
  - [x] Provide Russian mobile-first copy for supported formats, draft-only behavior, mapping controls, unmapped columns, first-sheet limitation, limits, and retry/error states.
  - [x] Ensure the client bundle never imports Supabase service-role code and never uploads/stores the raw file as a permanent asset.

- [x] Task 3: Add migration-owned batch/row provenance and secure draft import mutation (AC: 3–5, 7)
  - [x] Add a new timestamped migration only; do not edit applied migrations. Create seller-owned import batch/row provenance tables and product linkage (`import_batch_id`, optional `import_row_id`) required by AD-21, with RLS/policies and rollback notes.
  - [x] Use the existing seller SSR user client/server action and current-store ownership pattern; do not accept `store_id`, seller ID, product status, or publication flags from the browser.
  - [x] Implement a domain service/server action that receives the selected mapping plus bounded row values, re-validates every row, records row outcomes, and creates valid products with `status = draft` only.
  - [x] Preserve partial success: invalid rows are recorded with stable row-level errors while valid rows are linked to the batch and remain editable through normal product routes.
  - [x] Make batch writes safe against duplicate submits where practical (idempotency token or explicit duplicate-submit handling); never create a published product or media record as part of import.

- [x] Task 4: Integrate with existing seller product navigation and lifecycle (AC: 4–6)
  - [x] Add a clear import entry point to the existing seller Products surface without duplicating the seller shell/bottom navigation.
  - [x] Reuse the existing product list, edit form, media manager, publication validation, design-system surfaces, and error/result conventions.
  - [x] Show created drafts and the import result summary; provide links/actions into normal edit flows, not a parallel editor or publication mechanism.
  - [x] Keep public storefront routes, analytics ingestion, Telegram handoff, and product visibility queries unchanged except for compatible provenance fields.

- [x] Task 5: Add contract, parser, mutation, boundary, and accessibility coverage (AC: 1–7)
  - [x] Test CSV/XLS/XLSX format detection, BOM/delimiter handling, first-sheet behavior, bounded preview, malformed/empty/oversized inputs, and formula/macro/non-data rejection behavior.
  - [x] Test alias inference and manual mapping, clear/unmapped columns, numeric/"по запросу" prices, availability defaults, title/description limits, and row-level error reporting.
  - [x] Test server-side revalidation, seller/store ownership, draft-only status, no media/publication side effects, provenance links, partial success, and duplicate-submit handling.
  - [x] Add static boundary checks that import remains seller-authenticated, does not import service-role into client/public code, does not create a public GET upload endpoint, and leaves screenshot/link/AI import out of scope.
  - [x] Run `npm.cmd run check`; if live Supabase/RLS is unavailable, document the limitation while keeping migration and contract coverage deterministic.

## Dev Notes

### Business, release, and scope guardrails

- Epic 5 is conditional. If implementation threatens the completed core loop, stop and report the release-gate conflict rather than broadening scope.
- The product draft is intentionally permissive: title is required; price may be fixed or request; description and availability are optional. Publication remains governed by the existing lifecycle validation and media requirements.
- Do not infer or add SKU, stock quantity, categories, photos, payment, order, buyer, or arbitrary product metadata unless an existing product contract already supports it. Preserve unknown source columns only as bounded provenance/mapping metadata.
- Import is not AI recognition. Screenshot URLs, store links, OCR, enrichment, background jobs, and automatic publication are future work.

### Existing code to extend or preserve

- `src/features/import/README.md` already reserves the feature boundary; keep the implementation under `src/features/import`.
- `src/features/product/schema.ts` is authoritative for current draft normalization and limits; reuse `validateProductDraftValues` rather than duplicating validation.
- `src/features/product/actions.ts` is the established server-action and current-store ownership pattern; reuse its auth/error conventions.
- `src/features/product/queries.ts`, `src/features/product/product-list.ts`, `src/features/product/product-form.tsx`, and `src/features/product/product-media-manager.tsx` define seller list/edit/media seams and must remain the normal post-import flow.
- `src/app/(seller)/seller/(admin)/products/page.tsx` and `src/app/(seller)/seller/(admin)/products/new/page.tsx` define the seller Products surface; preserve its layout and navigation.
- `src/lib/supabase/server.ts` is for authenticated SSR/user access. `src/lib/supabase/service-role.ts` is never imported by a client component, public route, or ordinary seller import action.
- `supabase/migrations/` is append-only history. Add a timestamped migration for provenance tables/columns, RLS, indexes, and any import mutation RPC; include a rollback note.

### Architecture guardrails

- **AD-1/AD-2:** mobile-first seller admin remains isolated from public storefront routes; primary viewport is 360–430px.
- **AD-6:** imported products are always drafts and retain extraction metadata; no import code may call publish or bypass product lifecycle rules.
- **AD-13:** file parsing may happen in a bounded client preview, but domain mutation and policy enforcement go through a server action/route handler and domain service.
- **AD-15:** seller scope comes from authenticated SSR user context and RLS. Do not trust client store/product IDs.
- **AD-17:** all schema, indexes, RLS, and storage-policy changes are versioned migrations.
- **AD-21:** if FR-9 ships, import batches own source/row metadata and products retain `import_batch_id` plus optional `import_row_id` until publication. Do not persist the raw upload forever; define retention/cleanup semantics in the migration or notes.
- Keep raw file bytes and untrusted workbook formulas/macros out of the database and browser payload after preview. Store only bounded normalized values/error metadata needed for review and provenance.

### Proposed data and service contract

Use names consistent with the codebase, but preserve this meaning:

```ts
type ImportFormat = "csv" | "xls" | "xlsx";
type ImportTargetField =
  | "title"
  | "price"
  | "description"
  | "availability";

type ImportRowResult = {
  rowNumber: number;
  status: "valid" | "invalid" | "created";
  fieldErrors: Partial<Record<ImportTargetField, string>>;
  productId?: string;
};

type ImportResult = {
  batchId: string;
  createdCount: number;
  rejectedCount: number;
  rows: ImportRowResult[];
};
```

- The server must receive a bounded, typed representation of normalized row values plus the mapping; it must re-run product validation and independently derive `status = draft`.
- Numeric prices must normalize using the existing product rules (including comma decimal input where supported); non-numeric values become row errors, not silent zeroes.
- Treat blank availability as the existing `in_stock` default only when the row is otherwise valid. Unknown nonblank values should be row errors.
- Preserve original row numbers after blank-row filtering so the seller can find errors in the source file.
- Avoid an unbounded JSONB/raw-row payload. Bound string lengths, number of columns, row count, error count, and provenance size.

### UX and accessibility

- Use existing design-system primitives and seller-shell conventions; do not introduce a second table or form system.
- Prefer stacked row cards on mobile. Mapping controls may use horizontal scrolling inside a bounded region only if the page itself never overflows.
- Always expose draft-only behavior, created/rejected counts, row numbers, and actionable errors as text. Distinguish parse failure, validation rejection, partial success, and persistence failure.
- Preserve focus after mapping changes and submit results. Interactive controls need visible focus and at least 44px targets; status cannot rely on color alone.

### Library and Next.js guidance

- Current baseline is Node 24, Next.js 16.2.12, React 19.2.4, Tailwind CSS 4, Supabase JS 2, and `@supabase/ssr` 0.12.4. Do not upgrade unrelated packages.
- SheetJS CE documentation demonstrates parsing browser `File.arrayBuffer()` with `XLSX.read` and reading the first worksheet; pin the chosen package/version and keep parsing bounded. Do not use a CDN script at runtime.
- Before editing route code, read the local Next.js guides required by `AGENTS.md`, especially:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`
- Keep the route Server Component by default. A client component is appropriate only for browser file selection/preview/mapping; auth, persistence, and secret-bearing clients remain server-only.
- Next Server Actions have a default request body limit; either keep the bounded normalized submit below it or make an explicit, reviewed configuration change with a test. Never accept arbitrary large file bodies by default.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5 / Story 5.1]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — FR9, product data contract, release classification]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md` — AD-1, AD-2, AD-6, AD-13, AD-15, AD-17, AD-21]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md` — mobile-first and component rules]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md` — seller flow and state patterns]
- [Source: `src/features/product/schema.ts` — current product field validation and limits]
- [Source: `src/features/product/actions.ts` — seller server-action and ownership pattern]
- [Source: `src/features/import/README.md` — reserved import feature boundary]
- [Source: `https://docs.sheetjs.com/docs/` — SheetJS CE browser import and first-worksheet examples, accessed 2026-08-02]
- [Source: `https://nextjs.org/docs/app/api-reference/directives/use-server` — current Server Function/server-only guidance, accessed 2026-08-02]
- [Source: `https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions` — Server Action body-size limit, accessed 2026-08-02]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `python3` is unavailable in the Windows environment; workflow customization was resolved with the documented manual fallback.
- Sprint status, Epic 5 source context, PRD, architecture spine, UX artifacts, current product implementation, import boundary, package baseline, recent commits, and official current parser/Next.js guidance were inspected before creating this story.
- Red phase: contract, parser, normalization, migration, action-boundary, and UI-boundary tests failed before their implementation files existed.
- Green/refactor phase: added bounded SheetJS parsing, current product-contract normalization, seller-scoped draft mutation, provenance migration/RLS, mobile mapper/preview, and contract coverage.
- Parser hardening: `.xlsm` and formula-bearing workbooks are rejected; SheetJS macro payloads are not loaded into the import model.
- Live Supabase/RLS execution was not available in the workspace; migration/security contracts and application-level ownership/draft-only boundaries are covered statically.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created for Story 5.1.
- Implemented CSV/XLS/XLSX import with UTF-8/BOM and delimiter handling, first-sheet preview, inferred/manual mapping, and bounded 100-row/16-column/500-character inputs.
- Added server-side revalidation through the existing product draft schema, partial-success row results, duplicate-submit protection, and draft-only product creation.
- Added `import_batches`/`import_rows` provenance with seller RLS, product provenance links, no raw-file persistence, and rollback documentation.
- Added seller-only `/seller/products/import` flow with Russian mobile-first accessible states and preserved normal edit/media/publication flow.
- `npm.cmd run check` passed: production build, 56 contract tests, and foundation smoke check. Existing unrelated `<img>` lint warning remains.

### File List

- `_bmad-output/implementation-artifacts/5-1-import-excel-csv-products-as-drafts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `package.json`
- `package-lock.json`
- `scripts/import-action-contract.test.mjs`
- `scripts/import-contract.test.mjs`
- `scripts/import-migration-contract.test.mjs`
- `scripts/import-normalization.test.mjs`
- `scripts/import-parser-contract.test.mjs`
- `scripts/import-ui-contract.test.mjs`
- `src/app/(seller)/seller/(admin)/products/page.tsx`
- `src/app/(seller)/seller/(admin)/products/import/page.tsx`
- `src/features/import/actions.ts`
- `src/features/import/import-contract.ts`
- `src/features/import/import-normalization.ts`
- `src/features/import/import-parser.ts`
- `src/features/import/import-product-flow.tsx`
- `supabase/migrations/20260802150000_product_import.sql`

### Change Log

- 2026-08-02: Created comprehensive Story 5.1 context for conditional Excel/CSV-to-draft import.
- 2026-08-02: Implemented bounded Excel/CSV preview and mapping, seller-scoped draft import with provenance/RLS, mobile UI, tests, and validation; status moved to review.
- 2026-08-02: Hardened workbook safety by rejecting formulas and macro-enabled formats; parser tests expanded.
- 2026-08-02: Code review fixes: made draft import transactional and seller-scoped, stabilized idempotency/provenance, hardened parser bounds and CSV handling, and expanded contract coverage.

### Review Findings

- [x] [Review][Patch] Add seller-scoped `UPDATE` policy for import batches and handle counter-update errors [supabase/migrations/20260802150000_product_import.sql:170]
- [x] [Review][Patch] Preserve physical source row numbers without rejecting sparse files that contain at most 100 nonblank rows [src/features/import/actions.ts:101]
- [x] [Review][Patch] Keep one idempotency key per selected import so retrying cannot create duplicate drafts [src/features/import/import-product-flow.tsx:53]
- [x] [Review][Patch] Reconcile the server payload cap with the advertised row, column, and cell limits [src/features/import/actions.ts:49]
- [x] [Review][Patch] Make provenance writes reliable: handle row/product-link and batch-summary mutation failures atomically or explicitly [supabase/migrations/20260802150000_product_import.sql:270]
- [x] [Review][Patch] Localize parser errors and correct the inconsistent server limit messages [src/features/import/import-parser.ts:158]
- [x] [Review][Patch] Mark each preview column as mapped or ignored, rather than relying on a generic statement [src/features/import/import-product-flow.tsx:199]
- [x] [Review][Patch] Provide retry guidance for partial persistence failures [src/features/import/actions.ts:230]
- [x] [Review][Patch] Reject invalid CSV encodings and make delimiter inference quote-aware [src/features/import/import-parser.ts:37]
- [x] [Review][Patch] Guard against stale file-selection parsing results and excessive XLSX expansion before row limits apply [src/features/import/import-product-flow.tsx:60]
- [x] [Review][Patch] Enforce one-to-one, outcome-consistent links between imported products and provenance rows [supabase/migrations/20260802150000_product_import.sql:106]
