# Downstream Readiness Review — PRD: mobile-first персональная витрина

## Verdict

Ready to proceed to UX, architecture, epics, and story slicing. The previous high-severity conflict is resolved: MVP contact is Telegram-only, and WhatsApp, VK, multiple active messengers, and alternative contacts are explicitly `Could`.

No critical or high blockers remain. The remaining findings are precision issues that can be handled before or during UX/architecture kickoff, not blockers to starting downstream work.

## Severity counts

- Critical: 0
- High: 0
- Medium: 4
- Low: 3

## Findings

- **[medium]** Product public URL contract is missing (§4.3 FR-12; §4.4 FR-15; §10) — The prefilled Telegram message must include a link to the product card, but the PRD does not define the product URL identity model. Architecture needs to decide whether product URLs are slug-based, ID-based, title-derived, stable after edits, and how hidden/deleted products resolve. *Fix:* add a required architecture decision or PRD rule for product permalink identity.

- **[medium]** First-run public availability and activation success should be explicitly separated (§2.3 UJ-1; §7 SM-1/SM-2; §10) — The system can show a public link after one published product, while success metrics use 3 products. That can work, but downstream teams need the distinction. *Fix:* define "store technically public after >=1 published product" and "activation success after >=3 published products."

- **[medium]** "Best source" dashboard behavior is not fully acceptance-ready (§2.3 UJ-4; §4.5 FR-17-FR-20; §7 SM-4) — UJ-4 says the seller sees the best source of traffic, but the dashboard FRs do not specify ranking metric. *Fix:* define MVP best source as top source by store views, product views, or CTA clicks for the selected period.

- **[medium]** NFR launch baselines need architecture/UX binding (§4.6; §8) — Performance, availability, and accessibility have useful direction, but architecture/UX still need exact test profiles and launch gates. *Fix:* architecture should convert NFRs into measurable checks; UX should define visual/accessibility acceptance for the liquid-glass direction.

- **[low]** Analytics event catalog should constrain `messenger_type` for MVP (§4.5 Analytics event catalog) — The property is useful for future channels, but only Telegram is valid in MVP. *Fix:* set MVP allowed value to `telegram`; future values remain post-MVP.

- **[low]** Release taxonomy is now clear, but section 6.2 mixes Should, Could, and Fast-follow under one heading (§6.2) — The bullets themselves are labeled, so this is not blocking. *Fix:* downstream planning should treat §15 as canonical if there is any ambiguity.

- **[low]** Addendum contains architecture-relevant notes that must be handed off with the PRD (addendum §Technical and Architecture Notes) — Contact-channel abstraction and observed-vs-inferred analytics are important for architecture. *Fix:* include `addendum.md` in architecture/UX kickoff package.

## Ready signals

- MVP contact scope is now internally consistent: Telegram-only.
- Import is consistently conditional and no longer a hidden MVP blocker.
- Analytics is scoped to observable events, avoiding false claims about sent messages or purchases.
- Public storefront/product/CTA loop is coherent.
- Non-goals and release classification are explicit enough for story slicing.
- Buyer account/internal chat/payment/review scope is clearly excluded.

## Residual downstream risks

- If product URL identity is not decided early, Telegram message links and product detail stories may fork.
- If "best source" is not defined, analytics UI and event aggregation may diverge.
- If 1-product public availability vs 3-product activation is not clarified, onboarding success criteria may be misread.
