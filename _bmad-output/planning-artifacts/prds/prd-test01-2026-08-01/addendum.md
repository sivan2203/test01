---
title: "PRD Addendum: персональная витрина"
status: draft
created: 2026-08-01
updated: 2026-08-01
---

# PRD Addendum: персональная витрина

## Source Extracts

### Product Brief

- Product is a mobile-first personal storefront for small sellers who sell through social networks and messengers.
- Positioning: not a lightweight marketplace, but a conversion layer between social network and seller messenger.
- MVP pillars: personal storefront, publication/source analytics, mobile-first.
- MVP excludes internal chat, buyer account, payments, delivery, reviews, ratings, CRM, AI import, and paid customization.

### Market Research

- Strongest opportunity: "storefront before a store."
- Buyer journey: social discovery -> structured storefront/product detail -> message seller.
- Seller adoption depends on fast setup and visible usefulness, not feature breadth.
- CTA click is measurable; sent message and completed deal are not measurable without messenger/payment integrations.
- Direct competitors/adjacent tools: Linktree, Beacons, Taplink, Shopify Starter, Ecwid, WhatsApp Business Catalog, Robo.Market, marketplace storefronts, BerkatStore.

## Deferred Product Directions

### Import

- AI import from existing store links, screenshots, and social posts.
- Confidence scoring for recognized fields.
- Batch approval for imported drafts.

### Analytics

- Time on product page.
- Photo-depth analytics.
- Funnel: storefront view -> product view -> photo interaction -> CTA click.
- Automated recommendations based on behavior.
- Daily "Pulse" summary.

### Customization and Monetization

- Custom storefront blocks.
- Visual themes and advanced layout controls.
- Paid customization packages.

### Trust and Transactions

- Seller rating.
- Product/store reviews after confirmed deal.
- Online payment.
- Delivery.
- Order status.
- Fiscalization.
- Dispute and investigation tooling.

## Technical and Architecture Notes

- External Messenger handoff should be abstracted behind a stable "contact channel" concept so internal chat or other channels can be added later without changing public storefront semantics.
- Analytics events should distinguish observed events from inferred outcomes. `CTA click` is observed; `message sent`, `deal started`, and `purchase completed` are not observed in MVP.
- Store slug changes are decided for MVP: old slug returns 404 without redirect. Alias reservation or redirect can be revisited post-MVP.
- If source tracking uses UTM parameters, architecture should preserve source metadata through product detail and CTA click.
- Import should be designed so unsupported fields do not block creation of drafts.
- PRD update pass added an MVP analytics event catalog covering triggers, required properties, exclusions, attribution, timezone/window, and dedupe rules.
- PRD update pass added release classification so FR-9 Excel/CSV import, generated source links, additional messenger/contact channels, and 30-day analytics cannot accidentally inflate `Must for MVP`.

## Accepted MVP Decision Package

Accepted by user on 2026-08-01:

- Public working name: "Персональная витрина".
- First launch geography: Russia/CIS.
- MVP messenger: Telegram only.
- WhatsApp, VK, multiple active messengers, and alternative seller contacts remain `Could` until market interviews justify moving them into MVP or fast-follow.
- Excel/CSV import is `Should`, not a hard blocker for first release.
- Product price supports number and "по запросу".
- Product availability/status is included as simple "в наличии" / "нет в наличии"; no inventory/warehouse logic.
- Old store slug returns 404 after seller changes slug in MVP.
- Source tracking uses UTM/source labels as required baseline; separate generated links are `Should`.
- Analytics period: today + 7 days in MVP; 30 days is fast-follow.
- Initial success targets: first storefront within 10 minutes, 60% of registered sellers publish 3+ products, 30% of active storefronts receive at least one CTA click within 7 days.

## Remaining Non-Blocking PRD Follow-Ups

- Validate the public product name before launch.
- Confirm Excel/CSV import priority through seller interviews.
- Re-check WhatsApp, VK, and alternative seller contact priority after launch-market interviews.

## Validation Update Notes

PRD update pass on 2026-08-01 addressed the two high findings from validation:

- Excel/CSV import is now explicitly conditional through UJ-2, FR-9, SM-7, IA, and Release Classification.
- Analytics/source tracking now has an event catalog and metric definitions.

The update also tightened public visibility/link behavior, messenger fallback behavior, product data contract, first-run seller flow, NFRs, and remaining assumptions.
