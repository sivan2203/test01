# Sprint Change Proposal — Implementation Readiness Fixes

**Date:** 2026-08-01  
**Project:** test01  
**Mode:** Batch  
**Trigger:** `bmad-check-implementation-readiness` report returned `NEEDS WORK before sprint planning`.

## 1. Issue Summary

Implementation readiness found the planning package strong but not yet clean enough for sprint planning. The package has complete PRD coverage, coherent UX, architecture, and epics, but several handoff-quality issues would create ambiguity for dev agents.

### Triggering Evidence

Source report:

- `C:\Work\projects\test01\_bmad-output\planning-artifacts\implementation-readiness-report-2026-08-01.md`

Findings requiring correction:

1. **High:** PRD/UX and Architecture conflict on whether a valid public store with zero published products should render a public empty storefront.
2. **Major:** no explicit greenfield setup story before the first implementation story.
3. **Major:** stories lack explicit story-level FR/UX/AD references.
4. **Minor:** Story 1.1 is too broad if setup remains implicit.
5. **Minor:** Epic 5 / Story 5.1 must remain visibly conditional so it does not delay the core MVP loop.

## 2. Checklist Analysis

### Section 1 — Understand the Trigger and Context

- [x] **1.1 Triggering story:** N/A. The trigger is not an implementation story failure; it is a readiness gate finding before sprint planning.
- [x] **1.2 Core problem:** planning handoff ambiguity. Category: misunderstanding/ambiguity in original requirements plus missing implementation substrate story.
- [x] **1.3 Evidence:** readiness report findings, PRD FR-13, UX empty-store state, Architecture AD-20, current `epics.md` story structure.

### Section 2 — Epic Impact Assessment

- [x] **2.1 Current epic impact:** Epic 1 needs a setup story or Story 1.1 split. Epic 3 is affected by the empty storefront invariant.
- [x] **2.2 Epic-level changes:** add Story 1.0 to Epic 1; clarify Story 1.1 scope; preserve Epic 5 conditional status.
- [x] **2.3 Remaining epics:** Epic 2 mostly unaffected; Epic 3 affected by public empty storefront state; Epic 4 affected only if empty storefront analytics behavior changes; Epic 5 unaffected except conditional labeling.
- [x] **2.4 New/obsolete epics:** no new epic needed; no epic obsolete.
- [x] **2.5 Order/priority:** keep epic order. Add Story 1.0 before Story 1.1. Keep Epic 5 after core MVP loop.

### Section 3 — Artifact Conflict and Impact Analysis

- [x] **3.1 PRD:** PRD is coherent and should remain source of truth for empty storefront unless user chooses otherwise.
- [x] **3.2 Architecture:** AD-20 needs revision to separate public route availability from activation completeness and from product publication count.
- [x] **3.3 UX:** UX aligns with PRD; no UX change required if Architecture is updated. If user rejects empty public state, UX must change.
- [x] **3.4 Other artifacts:** `epics.md` needs story changes; future sprint plan must preserve conditional Story 5.1. No code/deployment artifacts exist yet.

### Section 4 — Path Forward Evaluation

#### Option 1: Direct Adjustment

- **Viable:** yes.
- **Effort:** Low/Medium.
- **Risk:** Low.
- **Why:** fixes are localized to Architecture and Epics/Stories.

#### Option 2: Potential Rollback

- **Viable:** no.
- **Why:** no implementation work exists to roll back.

#### Option 3: PRD MVP Review

- **Viable:** not needed.
- **Why:** MVP scope remains achievable. No product strategy pivot needed.

#### Recommended Path

**Direct Adjustment.**

Rationale: this preserves the product concept and avoids unnecessary replanning. The issues are real but are handoff/invariant clarity problems, not scope collapse.

## 3. Recommended Approach

Apply four planning artifact updates:

1. Update Architecture AD-20 to align with PRD/UX: valid store slug with zero published products renders public empty state `200`; activation completeness remains `>=3 published products`.
2. Add `Story 1.0: Initialize Greenfield Web App Foundation` before Story 1.1.
3. Add explicit story-level requirement trace lines to every story.
4. Mark Epic 5 / Story 5.1 as `Should / conditional` in the story body and sprint planning notes.

Change scope: **Moderate** — backlog/story organization changes are needed before sprint planning, but no fundamental product replan is required.

## 4. Detailed Change Proposals

### Proposal A — Architecture AD-20: resolve empty storefront invariant

**Artifact:** `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md`  
**Section:** `AD-20 — Public availability and activation completeness are distinct`

**OLD:**

```markdown
### AD-20 — Public availability and activation completeness are distinct

- **Binds:** UJ-1, SM-1, SM-2, UX State Patterns, onboarding/dashboard
- **Prevents:** onboarding, public storefront, and metrics disagreeing on whether a store is "live" after one product or three.
- **Rule:** `is_publicly_viewable` is true when a store has a valid slug and at least one published product. `activation_complete` is true when a seller has at least three published products. The public link is available at `is_publicly_viewable`; activation metrics and dashboard nudges use `activation_complete`.
```

**NEW:**

```markdown
### AD-20 — Public route availability and activation completeness are distinct

- **Binds:** FR-3, FR-10, FR-13, FR-17, SM-1, SM-2, UX State Patterns, onboarding/dashboard
- **Prevents:** public empty-store UX, storefront availability, analytics, and activation metrics disagreeing on whether a store exists, has products, or is activation-complete.
- **Rule:** A store public route is resolvable when the store exists and has a valid current slug. If it has zero published products, the public storefront returns HTTP 200 with the store header and empty catalog state, and eligible public store views may be counted. Published products are required for product cards/product detail visibility, not for the store route to exist. `activation_complete` is true when a seller has at least three published products. Dashboard nudges use `activation_complete`; public route existence uses valid store slug.
```

**Rationale:** PRD FR-13 and UX state patterns explicitly define a public empty storefront. Architecture should support that rather than blocking public availability until first product.

### Proposal B — Epics: add greenfield setup story

**Artifact:** `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md`  
**Section:** before `Story 1.1`

**OLD:**

```markdown
## Epic 1: Seller Store Setup & Mobile UX Foundation

Продавец может зарегистрироваться, создать базовый Магазин, настроить публичную ссылку, увидеть предпросмотр и работать в mobile-first интерфейсе с общей дизайн-системой.

### Story 1.1: Seller Sign-in and Mobile Admin Shell
```

**NEW:**

```markdown
## Epic 1: Seller Store Setup & Mobile UX Foundation

Продавец может зарегистрироваться, создать базовый Магазин, настроить публичную ссылку, увидеть предпросмотр и работать в mobile-first интерфейсе с общей дизайн-системой.

### Story 1.0: Initialize Greenfield Web App Foundation

As a developer,
I want the MVP web app foundation initialized with the agreed stack, routes, design primitives, database migration baseline, and environment boundaries,
So that product stories can be implemented consistently without reworking the substrate.

**Requirements:** NFR1, NFR2, NFR3, NFR5, AD-1, AD-2, AD-13, AD-15, AD-17, AD-18, UX-DR1, UX-DR2, UX-DR17, UX-DR18, UX-DR19

**Acceptance Criteria:**

**Given** the project is greenfield
**When** the initial app foundation is created
**Then** it uses the architecture-approved stack: Node.js 24 LTS, Next.js App Router, React, Tailwind CSS, shadcn/ui, Supabase client packages, and Vercel-compatible configuration
**And** actual package versions are recorded if starter defaults differ from architecture assumptions.

**Given** the app routes are initialized
**When** route groups and shared folders are created
**Then** seller/admin surfaces and public buyer storefront surfaces are separated
**And** shared code is limited to primitives, adapters, auth/session, analytics ingestion, and design-system components.

**Given** the design system foundation is initialized
**When** base styles and primitives are available
**Then** monochrome tokens, contrast-safe text pairs, 44x44 CSS px tap target guidance, reduced motion, and reduced transparency fallbacks are represented in reusable primitives or documentation.

**Given** Supabase is introduced
**When** schema, RLS, storage policies, or seed data are needed
**Then** changes are represented through timestamped SQL migrations under `supabase/migrations/`
**And** browser code uses only public anon credentials while service-role usage is isolated to server-only maintenance/admin paths.

**Given** deployment configuration is prepared
**When** local, preview, staging, and production environments are documented or stubbed
**Then** preview deployments are intended to point only to staging Supabase and production only to production Supabase
**And** secrets are expected to live in provider environment variables, not committed files.

**Given** the foundation is complete
**When** a developer runs the baseline checks
**Then** the app has a minimal smoke test or verification path for public route rendering and seller route protection
**And** later stories can add domain tables/entities only when first needed.
```

**Rationale:** greenfield substrate is necessary before Story 1.1, but it should not create all domain tables upfront.

### Proposal C — Story 1.1: narrow scope after setup story

**Artifact:** `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md`  
**Section:** Story 1.1 acceptance criteria

**OLD AC:**

```markdown
**Given** the visual foundation is loaded
**When** seller/admin screens render
**Then** they use the MVP monochrome design tokens, readable contrast, and minimal liquid-glass treatment
**And** the UI does not resemble a marketplace feed.
```

**NEW AC:**

```markdown
**Given** the shared app foundation from Story 1.0 exists
**When** seller/admin shell screens render
**Then** they use the shared mobile-first navigation and design primitives
**And** Story 1.1 does not introduce a separate competing visual system.
```

**Add to Story 1.1:**

```markdown
**Requirements:** FR1, FR21, FR22, AD-1, AD-2, AD-9, AD-15, UX-DR16, UX-DR17, UX-DR19
```

**Rationale:** Story 1.1 becomes auth + protected mobile shell, while Story 1.0 owns shared foundation.

### Proposal D — Add story-level requirement trace lines

**Artifact:** `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md`  
**Pattern:** add one `**Requirements:** ...` line after each user story block and before `**Acceptance Criteria:**`.

Recommended mapping:

| Story | Requirements line |
|---|---|
| Story 1.0 | `**Requirements:** NFR1, NFR2, NFR3, NFR5, AD-1, AD-2, AD-13, AD-15, AD-17, AD-18, UX-DR1, UX-DR2, UX-DR17, UX-DR18, UX-DR19` |
| Story 1.1 | `**Requirements:** FR1, FR21, FR22, AD-1, AD-2, AD-9, AD-15, UX-DR16, UX-DR17, UX-DR19` |
| Story 1.2 | `**Requirements:** FR2, FR21, FR22, AD-13, UX-DR4, UX-DR13, UX-DR14, UX-DR17` |
| Story 1.3 | `**Requirements:** FR3, FR21, AD-10, UX-DR11, UX-DR13, UX-DR17` |
| Story 1.4 | `**Requirements:** FR4, FR21, FR22, AD-2, AD-5, AD-7, UX-DR20` |
| Story 2.1 | `**Requirements:** FR5, FR7, FR21, NFR6, AD-5, AD-13, UX-DR10, UX-DR13, UX-DR14` |
| Story 2.2 | `**Requirements:** FR6, FR12, FR21, AD-12, AD-16, UX-DR6, UX-DR17` |
| Story 2.3 | `**Requirements:** FR5, FR7, FR13, NFR6, AD-5, AD-13, AD-16, UX-DR10, UX-DR15` |
| Story 2.4 | `**Requirements:** FR8, FR21, AD-13, UX-DR10, UX-DR14, UX-DR16, UX-DR17` |
| Story 3.1 | `**Requirements:** FR10, FR13, FR21, FR22, NFR1, NFR2, AD-2, AD-5, AD-10, AD-20, UX-DR4, UX-DR14, UX-DR19` |
| Story 3.2 | `**Requirements:** FR11, FR16, FR21, FR22, AD-4, AD-5, UX-DR3, UX-DR5, UX-DR7, UX-DR17, UX-DR19` |
| Story 3.3 | `**Requirements:** FR12, FR13, FR16, FR21, FR22, NFR1, AD-5, AD-11, AD-12, AD-16, UX-DR6, UX-DR7, UX-DR17` |
| Story 3.4 | `**Requirements:** FR14, FR21, AD-3, AD-13, UX-DR7, UX-DR13, UX-DR17` |
| Story 3.5 | `**Requirements:** FR15, FR16, FR18, FR19, AD-3, AD-4, AD-8, UX-DR7, UX-DR8, UX-DR17` |
| Story 4.1 | `**Requirements:** FR18, NFR4, NFR5, AD-2, AD-4, AD-7, AD-14` |
| Story 4.2 | `**Requirements:** FR19, NFR4, NFR5, AD-8, AD-14` |
| Story 4.3 | `**Requirements:** FR17, FR19, FR20, FR21, NFR5, AD-14, AD-19, AD-20, UX-DR9, UX-DR14, UX-DR16` |
| Story 4.4 | `**Requirements:** FR18, FR20, FR21, NFR5, AD-7, AD-14, AD-19, UX-DR9, UX-DR17` |
| Story 5.1 | `**Requirements:** FR9, FR21, AD-6, AD-13, AD-21, UX-DR12, UX-DR13, UX-DR14` |

**Rationale:** downstream story creation and development agents can work from a single story block without rediscovering PRD/UX/Architecture traceability.

### Proposal E — Preserve Epic 5 conditional status

**Artifact:** `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md`  
**Section:** Story 5.1

**Add after Requirements line:**

```markdown
**Release Classification:** Should / conditional. Include in first release only if it does not delay the core MVP loop: manual product → public storefront → Telegram CTA → analytics.
```

**Rationale:** prevents optional import from becoming an accidental sprint blocker.

## 5. Implementation Handoff

### Scope Classification

**Moderate.**

This is not a product strategy replan. It is a backlog/planning correction that should happen before `bmad-sprint-planning`.

### Handoff Recipients

- **Product/Planning owner:** approve the invariant decision and story updates.
- **Architect:** apply Architecture AD-20 update if approved.
- **PM/Story owner:** apply epics/story traceability and greenfield setup story updates.
- **Readiness validator:** re-run `bmad-check-implementation-readiness`.

### Success Criteria

The correction is successful when:

1. Architecture no longer conflicts with PRD/UX on empty public storefront behavior.
2. `epics.md` includes a greenfield setup story before Story 1.1.
3. Every story has explicit requirement traceability.
4. Story 5.1 remains visibly conditional.
5. Re-run readiness has no High/Major findings.

## 6. Recommended Next Steps

1. Approve or edit this proposal.
2. Apply approved edits to Architecture and Epics.
3. Re-run `bmad-check-implementation-readiness`.
4. If clear, proceed to `bmad-sprint-planning`.

## 7. Approval and Routing

**Approval status:** Approved by user on 2026-08-01.  
**Change scope classification:** Moderate.  
**Routed to:** Product/Planning owner + Architect + PM/Story owner.

### Handoff Responsibilities

- **Architect:** apply Proposal A to `ARCHITECTURE-SPINE.md`.
- **PM/Story owner:** apply Proposals B–E to `epics.md`.
- **Readiness validator:** re-run `bmad-check-implementation-readiness` after edits.
- **Sprint planning owner:** proceed to `bmad-sprint-planning` only after readiness re-run clears High/Major findings.

### Checklist Finalization

- Checklist 6.1 Review completion: done.
- Checklist 6.2 Proposal accuracy: done.
- Checklist 6.3 User approval: done.
- Checklist 6.4 Update `sprint-status.yaml`: N/A — sprint planning has not been created yet.
- Checklist 6.5 Handoff plan: done.

### Success Criteria Reminder

The correction is complete when Architecture and Epics are updated, readiness is re-run, and the resulting report has no High/Major blockers before sprint planning.
