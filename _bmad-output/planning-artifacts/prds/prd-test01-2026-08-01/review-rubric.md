# PRD Quality Review — PRD: mobile-first персональная витрина для малых продавцов

## Overall verdict

The PRD is ready to proceed into UX, architecture, epics, and story slicing. The prior high-severity messenger-scope conflict is resolved: the MVP now consistently supports Telegram only, while WhatsApp, VK, multiple active messengers, and alternative seller contacts are explicitly `Could`.

No critical or high findings remain. The remaining issues are medium/low precision improvements around downstream contracts: top-source analytics display, product URL identity, release decision timing for conditional import, and NFR baselines.

## Decision-readiness — strong

The PRD now states its major MVP choices clearly: mobile-first personal storefront, Telegram-only external contact, no internal chat, no buyer account, no payments/delivery, no reviews/ratings, no marketplace aggregation, and source-aware lightweight analytics. Section 13 states that no phase-blocking open questions remain, and the addendum preserves the accepted MVP decision package with date and rationale.

The messenger decision is no longer ambiguous. §3 defines Messenger as Telegram-only for MVP; §4.4 FR-14 states that Telegram is the single supported MVP channel; §4.4 FR-16 excludes multiple active messengers and explicitly places WhatsApp, VK, and alternative contacts in `Could`; §15 repeats the release classification.

### Findings

- **[medium]** Conditional import still lacks a hard release decision point (§2.3 UJ-2; §4.2 FR-9; §6.2; §7 SM-7; §13) — Import is consistently marked `Should / conditional`, which is good scope hygiene, but the PRD does not name who decides whether it ships in the first release or by what milestone. *Fix:* add a non-blocking follow-up owner/timing such as "PM decides by MVP scope freeze after 5-7 seller interviews or engineering sizing."

## Substance over theater — strong

The PRD is not padded with decorative product-management furniture. User journeys are tied to actual scope decisions: UJ-1 drives first-run setup, UJ-2 gates import, UJ-3 drives Telegram handoff, UJ-4 drives analytics, and UJ-5 drives preview. The Non-Goals and Release Classification sections do real work by keeping marketplace, chat, payments, delivery, reviews, CRM, AI import, and customization out of MVP.

The visual direction is still high-level, but it is appropriately bounded for a PRD and should be expanded in UX rather than over-specified here.

### Findings

- **[low]** Visual language still uses taste words that need UX translation (§4.6 FR-22) — "монохромная", "минималистичный", and "liquid glass" describe direction but not design tokens or states. *Fix:* route to UX spec with examples, contrast targets, component states, and acceptable use of glass effects.

## Strategic coherence — strong

The thesis is coherent: "витрина до магазина" as a lightweight conversion layer between social discovery and seller conversation. The feature set follows that thesis: fast setup, public storefront, product detail, contextual CTA, and basic analytics. The product avoids becoming a marketplace, commerce engine, or support-heavy chat platform.

Success metrics mostly validate the thesis: time to first storefront, activation, contact intent, source-aware views, product-view-to-CTA rate, and dashboard return. Counter-metrics correctly warn against vanity feature count, raw views without context, and premature customization.

### Findings

- **[medium]** Dashboard "best source" appears in UJ-4 but is not explicit enough in dashboard FR consequences (§2.3 UJ-4; §4.5 FR-17-FR-20) — UJ-4 says the seller sees the best traffic source, while FR-17 names today's store views as the main widget and FR-19 handles source tracking. This is probably intended, but story slicing may miss the "best source" display. *Fix:* add a FR-17 or FR-20 consequence that the dashboard shows top source for the selected period when source data exists.

## Done-ness clarity — adequate

Most FRs include testable consequences and are ready for story extraction. Product creation, media, lifecycle states, storefront visibility, product detail, CTA handoff, analytics events, source attribution, viewport bounds, and tap target requirements are concrete enough for implementation planning.

Some acceptance details still belong either in architecture or UX, but the PRD should tighten a few contracts before final story slicing to avoid avoidable interpretation drift.

### Findings

- **[medium]** Product public URL/permalink identity is implied but not defined (§4.3 FR-12; §4.4 FR-15; §10 Buyer surfaces) — FR-15 requires the prefilled message to contain a product-card link, but the PRD does not define whether product URLs are slug-based, ID-based, stable after title edits, or what hidden/deleted product URLs return beyond deleted products. *Fix:* add product URL identity rules or explicitly delegate them to architecture as a required decision before implementation.
- **[medium]** Availability NFR delegates too much to architecture (§8) — "exact SLA is set by architecture" is acceptable, but launch readiness needs a minimum PRD-level gate. *Fix:* add a baseline launch check such as public storefront/product pages must pass smoke checks and no known public-page outage ships to production.
- **[medium]** Performance/accessibility baselines remain partly soft (§4.6; §8) — P75 2.5s on "reasonable 4G" and WCAG AA "where feasible" give direction but need test profile and exception handling. *Fix:* architecture/UX should define the device/network profile and any allowed contrast exceptions before implementation acceptance.

## Scope honesty — strong

Scope boundaries are now explicit and internally consistent. The PRD clearly rejects internal chat, buyer accounts, payments, delivery, reviews, ratings, marketplace aggregation, AI import, CRM, dispute flow, and paid customization for MVP. The Telegram-only decision is reflected in glossary, FRs, risks, release classification, and addendum.

### Findings

- **[low]** Some future directions appear in multiple places with slightly different grouping (§5; §6.2; §6.3; §15; addendum) — This is not contradictory now, but it increases maintenance cost. *Fix:* keep §15 as the canonical release classification and let other sections reference that taxonomy.

## Downstream usability — thin

The document is usable downstream, but this is the dimension with the most remaining cleanup. FR IDs are contiguous, UJs have named protagonists, major glossary terms are defined, and release classification is clear enough to begin UX/architecture. However, several cross-document handoff details still need tightening so architecture and story slicing do not invent different answers.

### Findings

- **[medium]** First-run success threshold can still be read two ways (§2.3 UJ-1; §7 SM-1/SM-2; §10 First-run seller flow) — UJ-1 and SM-1 emphasize publishing a store with 3 products, while §10 says success/dashboard shift happens after at least one published product. This may be intentional, but it should be explicitly separated as "technically public after 1 product" vs "activation success at 3 products." *Fix:* add one sentence to §10 or metric definitions separating public availability from activation success.
- **[medium]** Analytics source contract is improved but top-source aggregation is not fully specified (§4.5 Analytics event catalog; §7 SM-4/SM-5) — Event-level source propagation is defined, but the dashboard aggregation rules for "best source" are not. *Fix:* define whether best source ranks by store views, product views, CTA clicks, or configurable metric for MVP.
- **[low]** Event catalog keeps `messenger_type` even though MVP is Telegram-only (§4.5 Analytics event catalog) — This is architecturally sensible for future channels, but MVP acceptance should treat allowed value as `telegram`. *Fix:* note that `messenger_type=telegram` is the only valid MVP value.

## Shape fit — strong

The shape fits a chain-top consumer/seller product PRD. It has enough narrative for UX, enough requirements for epics/stories, enough technical guardrails for architecture, and enough scope classification to protect MVP.

### Findings

- **[low]** Addendum should travel with architecture/UX handoff (§0; addendum) — Some important future-proofing notes live only in addendum, especially contact-channel abstraction and analytics observed-vs-inferred boundaries. *Fix:* hand off both `prd.md` and `addendum.md` together to architecture and UX.

## Mechanical notes

- FR IDs appear contiguous from FR-1 to FR-22.
- UJ IDs appear contiguous from UJ-1 to UJ-5, with named protagonists.
- SM IDs appear contiguous from SM-1 to SM-7, plus counter-metrics SM-C1 to SM-C4.
- No inline `[ASSUMPTION]` tags remain.
- The previous high-severity alternative-contacts conflict is resolved in the current PRD.
- Minor terminology drift remains around generic "Messenger" wording in a few labels, but the glossary makes MVP Telegram-only.
