---
name: Персональная витрина
status: draft
sources:
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\addendum.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\validation-report.md
updated: 2026-08-01
---

# Персональная витрина — EXPERIENCE.md

## Foundation

Single-surface responsive web, mobile-first. MVP optimizes for phones first for both seller and buyer. Desktop must work, but desktop is not the design source of truth.

`DESIGN.md` owns visual identity and tokens. This document owns IA, behavior, states, interaction, accessibility, and flow rules. When a mockup conflicts with either spine, the spines win.

MVP contact model: buyer does not register; CTA opens Telegram with a prefilled product-context message. WhatsApp, VK, multiple active messengers, internal chat, buyer accounts, and alternative seller contacts are not MVP.

Visual references:

- [`mockups/storefront-mobile.html`](mockups/storefront-mobile.html) — public storefront header, catalog grid, product card, Telegram CTA.
- [`mockups/seller-dashboard-mobile.html`](mockups/seller-dashboard-mobile.html) — seller home analytics hierarchy, top source, bottom navigation.

Spines win on conflict with mockups.

## Information Architecture

### Seller surfaces

| Surface | Reached from | Purpose |
|---|---|---|
| Seller auth | Direct / protected route | Seller registration and login |
| Seller home dashboard | After login | Today's views, product views, CTA clicks, top source, next action |
| Store setup/edit | Dashboard CTA / settings | Name, photo/avatar, optional description, slug, Telegram |
| Product list | Dashboard / bottom nav | Manage drafts, published, hidden products |
| Product create/edit | Product list / empty setup | Add or edit product content, media, price, availability, publish state |
| Import drafts | Product list / setup | Optional `Should`: Excel/CSV to product drafts |
| Analytics detail | Dashboard card tap | Today + 7-day metrics by store/product/source |
| Preview as buyer | Dashboard / store editor | Public storefront view without counting analytics |

### Buyer surfaces

| Surface | Reached from | Purpose |
|---|---|---|
| Public storefront | Store public link | Store header, optional description, catalog list/grid |
| Product detail | Product card tap | Photos, description, price, availability, CTA |
| Telegram handoff | CTA tap | Opens Telegram deep link with prefilled message |
| Not found | Invalid store/product URL | Clear 404, no marketplace browsing |
| Empty store | Public store with no products / unpublished | Explain that seller has not published products yet |

Navigation: seller uses bottom nav or compact top navigation on mobile: Home / Products / Analytics / Store. Buyer surfaces should not show app-like nav; the store link is the whole experience. The public storefront composition is illustrated in [`mockups/storefront-mobile.html`](mockups/storefront-mobile.html); the seller home composition is illustrated in [`mockups/seller-dashboard-mobile.html`](mockups/seller-dashboard-mobile.html).

## Voice and Tone

Microcopy should be calm, concrete, and non-salesy. Brand posture lives in `DESIGN.md`.

| Do | Don't |
|---|---|
| "Витрина опубликована." | "Поздравляем, ваш бизнес теперь онлайн!" |
| "Контакт продавца пока не настроен." | "Ошибка: messenger config invalid." |
| "Сегодня: 42 просмотра." | "Вау! Вас заметили 42 раза!" |
| "Откроем Telegram с текстом сообщения." | "Начать сделку" |
| "Скопировать текст сообщения" | "Fallback action" |

CTA labels:

- Buyer primary: `Связаться в Telegram`.
- Catalog compact CTA: `Связаться`.
- Seller primary setup: `Опубликовать витрину`.
- Preview: `Посмотреть как покупатель`.

## Component Patterns

Behavioral specs. Visual specs live in `DESIGN.md.Components`. Component names below are canonical implementation names; Russian UI labels are separate microcopy.

| Component | Use | Behavioral rules |
|---|---|---|
| Store header | Public storefront | Uses `{components.store-header}`. Shows photo/avatar, name, optional description/info. Description omitted cleanly when empty. |
| Catalog view toggle | Public storefront | Uses `{components.catalog-view-toggle}`. List/grid choice persists locally per device; default grid on mobile when product photos exist. |
| Product card | Catalog | Uses `{components.product-card}`. Tap card opens detail; tap CTA starts Telegram flow for that product. CTA must not require product detail visit. |
| Product detail media | Product detail | Uses `{components.product-detail-media}`. Swipe/tap through photos. First photo is cover. Missing published photo is impossible by FR-6. |
| Telegram CTA | Catalog + detail | Uses `{components.button-telegram}` when destination clarity matters, otherwise `{components.button-primary}`. Records CTA click before handoff. Opens Telegram deep link with product title, price/по запросу, product URL. |
| Copy-message fallback | CTA failure | Uses `{components.copy-message-fallback}`. If deep link fails or is blocked, keep buyer on storefront/detail and expose prefilled message copy action. |
| Analytics summary widget | Seller home | Uses `{components.analytics-summary-widget}`. Shows today store views as primary, plus product views, CTA clicks, and top source when available. |
| Analytics card | Seller dashboard/detail | Uses `{components.analytics-card}`. Number + label + optional source context; no decorative chart if one number answers the question. |
| Product state control | Product editor/list | Uses `{components.product-state-control}`. Draft, published, hidden are explicit states; publish requires seller action. |
| Slug editor | Store setup | Uses `{components.slug-editor}`. Validates format and uniqueness before save; old slug 404 behavior belongs to product copy only if surfaced. |
| Import mapper | Import drafts | Uses `{components.import-mapper}`. Optional; creates drafts only, never publishes automatically. |
| Form field | Store/product editors | Uses `{components.form-field}`. Label above, helper/error below, field-level errors before page-level errors. |
| Empty state | Dashboard/storefront/product list | Uses `{components.empty-state}`. One short explanation and one next action. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| First seller login | Dashboard | Empty dashboard with primary CTA `Создать витрину`. No analytics chrome before store exists. |
| Cold storefront load | Public storefront/product detail | Skeleton matches final layout; no spinner-only screen. |
| Cold dashboard load | Seller dashboard | Skeleton analytics cards preserve layout and avoid metric jumps. |
| Store profile incomplete | Dashboard/setup | Checklist: store name, slug, Telegram, first product. |
| No published products | Public storefront | Empty store message. Store may exist, but catalog is empty. |
| First product published | Seller success | Show public link, `Посмотреть как покупатель`, and `Добавить товар`. |
| Activation target not met | Seller dashboard | Encourage adding products until 3 published; do not block public link after first product. |
| Product draft missing photo | Product editor | Draft can save; publish disabled until at least one photo. |
| Product save failed | Product editor | Keep local form values, show field/page error, allow retry. |
| Telegram not configured | Public storefront/product | CTA disabled: `Контакт продавца пока не настроен`. |
| Telegram deep link failed | Buyer CTA | Show copy-message fallback; do not show alternative contacts in MVP. |
| No analytics today | Seller dashboard | Zero state + prompt to share link. |
| Unknown source | Analytics | Label as `unknown`; never hide event count. |
| Seller preview | Preview as buyer | Badge/indicator for seller only; analytics not counted. |
| Known bot/crawler | Analytics | Excluded from seller-visible analytics. |
| Network offline | Seller editor/dashboard | Preserve current view; show text-first non-blocking notice. Publishing waits for reconnect. |

## Interaction Primitives

- Tap is the primary interaction. No hover-only controls.
- Bottom sheets may be used for compact seller actions, but modal stacks must never exceed one level.
- Product photos use horizontal swipe or visible next/previous affordances; photo count must be perceivable.
- Forms autosave only when the result is obvious; publish, delete, hide, and slug change require explicit action.
- Destructive actions require confirmation: delete product, change slug if public link already exists.
- Pull-to-refresh may appear on seller analytics; buyer storefront should simply load current data.
- Banned in MVP: infinite catalog feed, buyer login prompts, chat UI, cart UI, order status UI, review UI.

## Accessibility Floor

Behavioral floor; visual contrast lives in `DESIGN.md`.

- All primary tap targets are at least 44x44 CSS px.
- Focus order follows visible reading order.
- Product gallery images announce position and product context: `Фото {n} из {total}: {product title}`. Seller-provided alt text is post-MVP.
- Product gallery controls announce previous/next photo and disabled/end states.
- CTA announces destination: "Связаться в Telegram с продавцом".
- Disabled CTA uses actual disabled/`aria-disabled` semantics and announces the cause: "Контакт продавца пока не настроен".
- Catalog view toggle announces current state: list or grid.
- Analytics cards expose number + label together to screen readers; top-source example: "Просмотры магазина сегодня: 42. Лучший источник: Telegram."
- Reduce Motion disables glass-panel motion/blur transitions; no information conveyed by motion alone.
- Reduced transparency / high-contrast modes use the solid glass fallback from `{components.glass-panel}` / `{colors.surface-raised}`.
- Empty states and validation errors are text-first, not color-only.

## Responsive & Platform

| Viewport | Behavior |
|---|---|
| 360–430px | Primary MVP layout. One-column seller flows; buyer grid supports two compact cards per row. |
| 431–767px | Same IA; slightly wider cards and media. |
| 768px+ | Public storefront may center content in a narrow column; seller dashboard may use two columns for analytics cards. |

The product is responsive web, not native mobile in MVP. It may be installed or bookmarked like a PWA later, but PWA install prompts are not MVP UX.

## Inspiration & Anti-patterns

- **Lifted from link-in-bio tools:** one public link and fast sharing.
- **Lifted from classifieds/product boards:** direct product card -> contact action.
- **Lifted from Instagram post analytics:** lightweight source/action feedback, but only with honest observable events.
- **Rejected — marketplace feed:** no global discovery, no seller aggregation, no marketplace ranking.
- **Rejected — heavy store builder:** no deep themes, no blocks marketplace, no layout rabbit hole in MVP.
- **Rejected — internal chat:** conversation happens in Telegram for MVP.

## Key Flows

### Flow 1 — Seller first launch (Анна, handmade lamps, phone in hand)

1. Анна registers/logs in.
2. Empty dashboard shows `Создать витрину`.
3. She adds store name, photo, optional description, slug, and Telegram.
4. She adds first product: title, price, description, at least one photo.
5. She publishes product.
6. System shows public link, preview, and add-product action.
7. **Climax:** Анна opens preview and sees a public storefront that looks ready to share.

Failure: slug taken -> inline validation; no entered store/product content is lost.

### Flow 2 — Buyer contact from Telegram post (Мария, browsing from a phone)

1. Мария taps seller link from Telegram.
2. Public storefront opens with store header and catalog.
3. She switches to grid, opens a dress card, views photos and price.
4. She taps `Связаться в Telegram`.
5. CTA click is recorded.
6. Telegram opens with prefilled product-context message.
7. **Climax:** Мария can send a useful first message without retyping product context.

Failure: Telegram deep link fails -> she remains on the product page and can copy the message text.

### Flow 3 — Seller checks today's signal (Анна, evening)

1. Анна opens seller dashboard.
2. Summary shows today's store views as primary metric.
3. Secondary cards show product views, CTA clicks, and top source if available.
4. She taps product analytics to see which product drew interest.
5. **Climax:** Анна decides whether to repost the link or improve a product card.

Empty: no views today -> dashboard suggests sharing the store link.

### Flow 4 — Optional import to drafts (Игорь, small clothes seller)

1. Игорь opens Product list and chooses import.
2. Uploads Excel/CSV.
3. Maps columns or accepts recognized fields.
4. System creates drafts, not published products.
5. Игорь reviews drafts, adds missing photos, and publishes selected products.
6. **Climax:** existing catalog becomes editable drafts without manual re-entry.

Failure: file not recognized -> show reason and a downloadable/visible table template.

### Flow 5 — Preview as buyer (Анна, before sharing the link)

1. Анна opens seller dashboard after publishing at least one product.
2. She taps `Посмотреть как покупатель`.
3. Preview opens using the public storefront layout with a seller-only preview indicator.
4. She opens a product card, checks photos, price, description, and Telegram CTA state.
5. She returns to seller mode.
6. **Climax:** Анна trusts the public link enough to copy it into social profiles.

Failure: preview shows an issue -> Анна returns to product/store editor; preview views and CTA taps are not counted in analytics.

## UX Decisions and Follow-ups

- **Decision:** Default public catalog view is grid on mobile when product photos exist, because photos are load-bearing for purchase intent.
- **Decision:** Telegram CTA may use Telegram blue only where destination clarity matters; otherwise primary black button is acceptable.
- **Spine-only coverage accepted for now:** Product detail and product editor are specified by spine tables. Add mockups only if implementation review finds layout ambiguity.
- [NOTE FOR UX] Product URL/permalink behavior is an architecture decision, but UX must design copy for deleted/hidden product links.
