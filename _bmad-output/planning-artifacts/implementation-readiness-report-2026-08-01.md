---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
includedDocuments:
  prd:
    - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md
    - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\addendum.md
  architecture:
    - C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md
  ux:
    - C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md
    - C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md
  epics:
    - C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-08-01
**Project:** test01

## Document Inventory

### PRD Files

- `prd.md` — `C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md`
- `addendum.md` — `C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\addendum.md`

### Architecture Files

- `ARCHITECTURE-SPINE.md` — `C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md`

### UX Design Files

- `DESIGN.md` — `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md`
- `EXPERIENCE.md` — `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md`

### Epics & Stories Files

- `epics.md` — `C:\Work\projects\test01\_bmad-output\planning-artifacts\epics.md`

### Discovery Issues

- Critical duplicates: none found.
- Missing required documents: none found.
- Sharded `index.md` versions for PRD, Architecture, UX, or Epics: none found.

## PRD Analysis

### Functional Requirements

#### FR1: Seller registration and login

Продавец может зарегистрироваться и войти в кабинет продавца.

**Consequences (testable):**

- Продавец не может создать Магазин без регистрации.
- Сессия продавца сохраняется между посещениями; конкретная длительность сессии задается в architecture/security decisions.
- Покупатель не видит экран регистрации при просмотре Витрины или нажатии CTA.

#### FR2: Store profile editing

Продавец может заполнить и редактировать название Магазина, фото/аватар, краткое описание и дополнительную информацию.

**Consequences (testable):**

- Название Магазина обязательно.
- Описание Магазина необязательно.
- Изменения профиля отображаются в публичной Витрине после сохранения.

#### FR3: Editable public store link

Продавец может задать и изменить уникальный публичный slug/username Магазина.

**Consequences (testable):**

- Система не позволяет сохранить занятый или невалидный slug.
- Slug допускает только латинские буквы нижнего регистра, цифры и дефис; длина 3-32 символа; slug не может начинаться или заканчиваться дефисом.
- Зарезервированные slug (`admin`, `api`, `login`, `signup`, `support`, `help`) недоступны для продавцов.
- Изменение slug не удаляет Магазин и Товары.
- Старая ссылка после смены slug возвращает 404 без редиректа в MVP.

#### FR4: Store preview

Продавец может открыть предпросмотр своей Витрины в режиме покупателя.

**Consequences (testable):**

- Предпросмотр показывает ту же структуру, что публичная Витрина.
- Неопубликованные Товары не отображаются в предпросмотре, если не включен специальный режим черновика.

#### FR5: Manual product creation

Продавец может вручную создать Товар с названием, ценой, описанием и фотографиями. Realizes UJ-1.

**Consequences (testable):**

- Название Товара обязательно.
- Название Товара: 2-80 символов.
- Цена может быть числом или состоянием "по запросу".
- Для рынка Россия/СНГ валюта MVP — RUB.
- Товар поддерживает Статус наличия: "в наличии" или "нет в наличии".
- Описание необязательно; максимум 2 000 символов.
- Товар можно сохранить как Черновик без публикации.

#### FR6: Product media management

Продавец может добавить, удалить и переупорядочить фотографии Товара.

**Consequences (testable):**

- В карточке товара первая фотография используется как обложка в каталоге.
- Товар без фотографии может быть сохранен как Черновик.
- Опубликованный товар должен иметь минимум одну фотографию.
- MVP поддерживает до 10 фотографий на Товар.
- Поддерживаемые форматы: JPG, PNG, WebP; максимальный размер исходного файла задается architecture, но UX должен заранее показывать ошибку для неподдерживаемого формата.

#### FR7: Product lifecycle states

Продавец может перевести Товар между состояниями Черновик, Опубликованный товар и Скрытый товар.

**Consequences (testable):**

- Черновик не виден Покупателю.
- Скрытый товар не виден в публичной Витрине, но остается в кабинете.
- Публикация требует явного действия продавца.
- Удаление Товара убирает его из кабинета и публичных поверхностей; прямой URL удаленного Товара возвращает 404.
- Товар со Статусом наличия "нет в наличии" остается видимым в Витрине, но CTA "Связаться" остается доступным, потому что продавец может обсудить сроки или альтернативы.

#### FR8: Product list management

Продавец может просматривать список своих Товаров, фильтровать по статусу и открывать редактирование.

**Consequences (testable):**

- Список различает Опубликованные, Черновики и Скрытые товары.
- Продавец может быстро перейти к редактированию выбранного Товара.

#### FR9: Excel/CSV import to drafts

Продавец может импортировать Excel/CSV файл, чтобы система создала Черновики Товаров с предзаполненными полями. Это `Should` для MVP: сильная activation feature, но не hard blocker для первого релиза.

**Consequences (testable):**

- Импорт не публикует Товары автоматически.
- Продавец видит результат импорта как Черновики.
- Система поддерживает минимум один шаблон файла или ручное сопоставление колонок.
- Ошибки импорта объясняются понятным сообщением.
- Release gate: FR-9 входит в first release только если команда может реализовать загрузку файла, сопоставление колонок и создание Черновиков без задержки core loop `manual product -> storefront -> CTA -> analytics`.

#### FR10: Public storefront rendering

Система показывает публичную Витрину Магазина по уникальной ссылке.

**Consequences (testable):**

- Витрина доступна без авторизации покупателя.
- В шапке отображаются фото/аватар, название, дополнительная информация и необязательное описание.
- Неопубликованные и Скрытые товары не отображаются.

#### FR11: Catalog display modes

Покупатель может просматривать каталог Товаров списком или сеткой по два товара в ряд на мобильном экране.

**Consequences (testable):**

- Карточка в каталоге показывает фотографию, название, цену и CTA "Связаться".
- Переключение вида не меняет состав Товаров.
- Выбранный режим можно сохранять локально на устройстве.

#### FR12: Product detail page

Покупатель может открыть Карточку товара с фотографиями, названием, ценой, описанием и CTA "Связаться".

**Consequences (testable):**

- Фотографии можно пролистывать.
- Описание отображается полностью на Карточке товара; если UX применяет свернутый текст, должна быть явная кнопка раскрытия.
- CTA доступен в первом экране на мобильных viewport шириной 360-430px или закреплен в нижней зоне.

#### FR13: Empty and unavailable states

Система показывает понятные состояния, если Магазин существует, но в нем нет опубликованных Товаров, или если ссылка не найдена.

**Consequences (testable):**

- Пустая Витрина не выглядит как ошибка сервера.
- Несуществующая ссылка не раскрывает приватные данные.
- Прямая ссылка на Скрытый товар возвращает 404 для Покупателя.
- Прямая ссылка на Черновик возвращает 404 для Покупателя.

#### Public visibility and link behavior

| Entity/state | Public catalog | Direct public URL | Seller preview | Analytics |
|---|---|---|---|---|
| Магазин with published products | visible | 200 | visible | public views counted |
| Магазин with no published products | empty state | 200 | visible | public views counted |
| Missing Магазин slug | n/a | 404 | n/a | not counted |
| Old Магазин slug after change | n/a | 404 | n/a | not counted |
| Опубликованный товар | visible | 200 | visible | public views counted |
| Черновик | hidden | 404 | visible only in seller draft context | not counted as public view |
| Скрытый товар | hidden | 404 | visible in seller admin context | not counted as public view |
| Deleted Товар | hidden | 404 | hidden | not counted |

#### FR14: Messenger configuration

Продавец может настроить Telegram как единственный поддерживаемый MVP-канал для CTA. WhatsApp, VK, несколько активных мессенджеров и альтернативные контакты продавца остаются `Could`.

**Consequences (testable):**

- Без настроенного Telegram продавец видит предупреждение в кабинете.
- CTA не должен вести в невалидную ссылку.
- Публичная Витрина с ненастроенным Telegram показывает CTA disabled state с текстом "Контакт продавца пока не настроен".
- Telegram username/link validation happens before saving.

#### FR15: Prefilled product-context message

При нажатии CTA система открывает Telegram с Предзаполненным сообщением.

**Consequences (testable):**

- Сообщение содержит название Товара.
- Сообщение содержит ссылку на Карточку товара.
- Сообщение содержит цену или состояние "по запросу" на момент нажатия CTA.
- Покупатель может изменить сообщение перед отправкой в Telegram.
- Handoff открывается через Telegram web/app deep link; если deep link не открывается, Покупатель остается на Витрине и может скопировать текст сообщения.

#### FR16: CTA from catalog and product detail

Покупатель может нажать CTA из карточки в каталоге и из Карточки товара.

**Consequences (testable):**

- CTA из каталога передает контекст выбранного Товара.
- CTA из Карточки товара передает контекст того же Товара.
- Событие CTA click фиксируется до перехода в Telegram.

**Out of Scope:**

- Подтверждение факта отправки сообщения.
- Хранение переписки.
- Уведомления о новых сообщениях.
- Несколько активных мессенджеров одновременно в MVP.
- WhatsApp, VK и альтернативные контакты продавца остаются `Could`.

#### FR17: Seller home dashboard

Продавец видит домашний экран с главным виджетом "просмотры магазина за сегодня".

**Consequences (testable):**

- Главная метрика отображается крупнее вторичных метрик.
- Если просмотров нет, система показывает нулевое состояние и подсказку поделиться ссылкой.
- "Сегодня" считается в часовом поясе Магазина; для MVP по умолчанию используется Europe/Moscow.

#### FR18: Basic analytics events

Система фиксирует Просмотр магазина, Просмотр товара и CTA click.

**Consequences (testable):**

- События привязаны к Магазину.
- Просмотр товара привязан к Товару.
- CTA click привязан к Товару и Магазину.
- Система не считает покупку или отправку сообщения без интеграции.
- События из seller preview не считаются публичной аналитикой.
- Явно распознанные bot/crawler visits не считаются публичной аналитикой.

#### FR19: Traffic source tracking

Система определяет или принимает Источник трафика для Просмотра магазина и CTA click.

**Consequences (testable):**

- Система поддерживает источник через UTM/метку ссылки.
- Если источник неизвестен, событие помечается как "unknown".
- Отдельные короткие ссылки по каналам — `Should`; базовая поддержка источников через UTM/source labels обязательна.
- Attribution precedence: explicit `source` label or UTM source wins over HTTP referrer; if both absent, source is `unknown`.
- Source metadata propagates from Витрина to Карточка товара and CTA click during the same session.

#### FR20: Product-level analytics summary

Продавец может увидеть базовую аналитику по Товарам: просмотры и CTA clicks.

**Consequences (testable):**

- Данные доступны за текущий день и последние 7 дней.
- 30-дневный период остается fast-follow.

#### Analytics event catalog

| Event | Exact trigger | Required properties | Optional properties | Excluded contexts | Attribution / time window |
|---|---|---|---|---|---|
| Просмотр магазина | Public Витрина renders for Покупатель | store_id, store_slug, occurred_at, session_id, source, user_agent_type | referrer, utm_source, utm_medium, utm_campaign | seller preview, admin views, known bots/crawlers | Europe/Moscow day boundary by default; source label/UTM overrides referrer |
| Просмотр товара | Public Карточка товара renders for Покупатель | store_id, product_id, occurred_at, session_id, source | referrer, utm fields, catalog_view_mode | seller preview, admin views, known bots/crawlers, hidden/draft/deleted products | inherits source from session when available |
| CTA click | Покупатель taps CTA "Связаться" before messenger handoff | store_id, product_id, messenger_type, occurred_at, session_id, source | product_price_snapshot, product_availability_snapshot, handoff_url_type | seller preview, admin views, invalid/disabled CTA | inherits source from session; counted even if external messenger send is unknown |

Deduplication: repeated `Просмотр магазина` or `Просмотр товара` events from the same session within 30 seconds may be collapsed for dashboard counts. CTA clicks are counted per tap, but obvious double taps within 3 seconds may be collapsed.

#### FR21: Mobile-first responsive surfaces

Все ключевые пользовательские surfaces работают на мобильном viewport.

**Consequences (testable):**

- Продавец может создать Магазин и Товар с телефона.
- Покупатель может открыть Витрину, Карточку товара и CTA с телефона.
- Desktop layout не должен ломать мобильную логику.
- Primary supported mobile viewport range for MVP: 360-430px width.
- Minimum tap target for primary controls: 44x44 CSS px.

#### FR22: Minimal visual language

Публичная Витрина и кабинет продавца используют спокойную монохромную визуальную систему с минимальным количеством декоративных элементов.

**Consequences (testable):**

- Интерфейс не должен выглядеть как маркетплейсная лента или тяжелый e-commerce кабинет.
- Liquid glass используется как визуальный акцент, а не как помеха читаемости.
- Текст, цены и CTA остаются читаемыми на мобильных экранах.
- Product photos and CTA remain visually dominant over decorative effects.
- Text contrast should meet WCAG AA for normal text where feasible in the chosen palette.

**Total FRs:** 22

### Non-Functional Requirements

NFR1: Performance ? Public Витрина and Карточка товара target P75 initial core content load under 2.5s on reasonable 4G.
NFR2: Availability ? Public storefront pages should target higher availability than seller admin surfaces; exact SLA is set by architecture, but public storefront downtime is release-blocking for launch checks.
NFR3: Accessibility ? Core flows use semantic labels, WCAG AA contrast where feasible, and 44x44 CSS px minimum tap targets for primary controls.
NFR4: Privacy ? Analytics should avoid collecting unnecessary personal data from Покупателей.
NFR5: Observability ? Analytics events must be inspectable by event name, store_id, product_id, source, occurred_at, and exclusion reason where applicable.
NFR6: Data Integrity ? Product publication state must be consistent; Черновик must not appear publicly by mistake.

**Total NFRs:** 6

### Additional Requirements

#### Product Data Contract

| Field | Required for Черновик | Required for Опубликованный товар | Notes |
|---|---:|---:|---|
| title | yes | yes | 2-80 characters |
| price | no | yes | numeric RUB or "по запросу" |
| availability_status | no | yes | "в наличии" or "нет в наличии"; default "в наличии" |
| description | no | no | max 2 000 characters |
| photos | no | yes | 1-10 images for published products |
| publication_status | yes | yes | Черновик / Опубликованный товар / Скрытый товар |
| sort_order | no | no | default newest published first; manual ordering can be fast-follow |

#### MVP Scope and Non-Goals

### 6.1 In Scope

- Seller account.
- Store profile.
- Editable unique store link.
- Manual product CRUD.
- Product photos, title, price, description.
- Simple availability status: in stock / out of stock.
- Draft, publish, hide, delete product states.
- Public mobile storefront.
- Product catalog list/grid.
- Product detail page.
- CTA to external Messenger with prefilled product-context message.
- Seller dashboard with today's store views.
- Basic analytics: store views, product views, CTA clicks.
- Traffic source tracking through required UTM/source labels.
- Store preview as buyer.
- Minimal monochrome/liquid-glass visual direction.

### 6.2 Should / Could Include if Feasible

- **Should / conditional:** Excel/CSV import into Черновики, gated by release capacity.
- **Should / conditional:** Separate source links by channel.
- **Could:** Additional messenger/contact channels — WhatsApp, VK, multiple active messengers, and alternative seller contacts.
- **Fast-follow:** 30-day analytics period.

### 6.3 Out of Scope for MVP

- Internal chat — deferred because it creates accounts, notifications, moderation, storage, safety, and support obligations.
- Payments and delivery — deferred because they change the product from storefront/contact to transaction platform.
- Reviews/ratings — deferred until there is a credible confirmation mechanism.
- AI import — deferred because source quality and extraction confidence are high-complexity.
- Advanced recommendations — deferred until enough behavioral data exists.
- Paid customization — deferred until the core storefront loop proves value.

- Не строим маркетплейс и не агрегируем продавцов в общий каталог.
- Не строим внутренний чат в MVP.
- Не создаем аккаунт покупателя в MVP.
- Не принимаем оплату и не управляем доставкой.
- Не делаем заказы, корзину, статусы заказов и фискализацию.
- Не делаем рейтинги, отзывы и подтверждение сделки.
- Не делаем CRM, dispute flow, жалобы и расследование инцидентов.
- Не делаем AI-импорт из скриншотов и ссылок в MVP.
- Не оптимизируем продукт под магазины с сотнями SKU.
- Не делаем платную кастомизацию в MVP.

#### Constraints and Guardrails

### 9.1 Privacy and Analytics Guardrails

- Track only the events needed for MVP analytics.
- Do not imply that CTA click equals sent message or purchase.
- Store source data in a way that can represent "unknown".
- No buyer identity is stored in MVP.

### 9.2 Trust and Safety Guardrails

- Since there is no internal chat or transaction, the platform cannot investigate deals in MVP.
- Public storefronts should not display unpublished product data.
- Seller profile fields should be designed to reduce obvious spam/abuse risk, even if full moderation is post-MVP.

### 9.3 Business Guardrails

- Free MVP is acceptable for validation. Monetization begins post-MVP through customization, extended analytics, trust blocks, or transaction modules.
- Do not introduce features that require support-heavy operations before product-market signal.

#### Release Classification

| Requirement / scope item | Classification | Notes |
|---|---|---|
| FR-1 to FR-8 | Must for MVP | Core seller account, store profile, manual catalog management |
| FR-9 Excel/CSV import | Should / conditional | Include only if it does not delay manual core loop |
| FR-10 to FR-18 | Must for MVP | Public storefront, product detail, messenger CTA, base analytics |
| FR-19 source tracking via UTM/source labels | Must for MVP | Generated short links are `Should` |
| FR-20 today + 7 day analytics | Must for MVP | 30-day analytics is fast-follow |
| FR-21 to FR-22 | Must for MVP | Mobile-first and visual baseline |
| WhatsApp, VK, multiple active messengers, alternative seller contacts | Could | Revisit after Russia/CIS interviews |
| AI import, payments, delivery, reviews, ratings, CRM | Out of scope for MVP | Preserved in addendum as future directions |

#### PRD Addendum: Accepted MVP Decision Package

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

#### PRD Addendum: Technical and Architecture Notes

- External Messenger handoff should be abstracted behind a stable "contact channel" concept so internal chat or other channels can be added later without changing public storefront semantics.
- Analytics events should distinguish observed events from inferred outcomes. `CTA click` is observed; `message sent`, `deal started`, and `purchase completed` are not observed in MVP.
- Store slug changes are decided for MVP: old slug returns 404 without redirect. Alias reservation or redirect can be revisited post-MVP.
- If source tracking uses UTM parameters, architecture should preserve source metadata through product detail and CTA click.
- Import should be designed so unsupported fields do not block creation of drafts.
- PRD update pass added an MVP analytics event catalog covering triggers, required properties, exclusions, attribution, timezone/window, and dedupe rules.
- PRD update pass added release classification so FR-9 Excel/CSV import, generated source links, additional messenger/contact channels, and 30-day analytics cannot accidentally inflate `Must for MVP`.

### PRD Completeness Assessment

- PRD ???????? ?????????? ????? FR1?FR22, 6 cross-cutting NFRs, explicit non-goals, guardrails, release classification ? accepted MVP decision package.
- Phase-blocking open questions ???????????; ?????????? follow-ups non-blocking.
- FR9 ???? ??????????????? ??? `Should / conditional`; Telegram-only contact channel ????????? ??? MVP; WhatsApp/VK/?????????????? ???????? ? `Could`; AI import/payments/delivery/reviews/ratings/internal chat ? out of scope.

## Epic Coverage Validation

### Epic FR Coverage Extracted

- FR1: Epic 1 — seller registration/login
- FR2: Epic 1 — store profile editing
- FR3: Epic 1 — editable public store slug
- FR4: Epic 1 — store preview
- FR5: Epic 2 — manual product creation
- FR6: Epic 2 — product media management
- FR7: Epic 2 — product lifecycle states
- FR8: Epic 2 — product list management
- FR9: Epic 5 — Excel/CSV import to drafts
- FR10: Epic 3 — public storefront rendering
- FR11: Epic 3 — catalog list/grid display
- FR12: Epic 3 — product detail page
- FR13: Epic 3 — empty and unavailable states
- FR14: Epic 3 — Telegram configuration
- FR15: Epic 3 — prefilled Telegram message
- FR16: Epic 3 — CTA from catalog/detail
- FR17: Epic 4 — seller home dashboard
- FR18: Epic 4 — analytics events
- FR19: Epic 4 — traffic source tracking
- FR20: Epic 4 — product-level analytics summary
- FR21: Epic 1 — mobile-first responsive surfaces
- FR22: Epic 1 — minimal visual language

**Total FRs in epics:** 22

### Coverage Matrix

| FR Number | PRD Requirement | Epic Coverage | Story Trace | Status |
|---|---|---|---|---|
| FR1 | Seller registration and login ? Продавец может зарегистрироваться и войти в кабинет продавца. | Epic 1 — seller registration/login | Story 1.1 ? Seller Sign-in and Mobile Admin Shell | ? Covered |
| FR2 | Store profile editing ? Продавец может заполнить и редактировать название Магазина, фото/аватар, краткое описание и дополнительную информацию. | Epic 1 — store profile editing | Story 1.2 ? Create and Edit Store Profile | ? Covered |
| FR3 | Editable public store link ? Продавец может задать и изменить уникальный публичный slug/username Магазина. | Epic 1 — editable public store slug | Story 1.3 ? Configure Public Store Slug | ? Covered |
| FR4 | Store preview ? Продавец может открыть предпросмотр своей Витрины в режиме покупателя. | Epic 1 — store preview | Story 1.4 ? Preview Store as Buyer | ? Covered |
| FR5 | Manual product creation ? Продавец может вручную создать Товар с названием, ценой, описанием и фотографиями. Realizes UJ-1. | Epic 2 — manual product creation | Story 2.1 ? Create Product Draft Manually | ? Covered |
| FR6 | Product media management ? Продавец может добавить, удалить и переупорядочить фотографии Товара. | Epic 2 — product media management | Story 2.2 ? Manage Product Photos | ? Covered |
| FR7 | Product lifecycle states ? Продавец может перевести Товар между состояниями Черновик, Опубликованный товар и Скрытый товар. | Epic 2 — product lifecycle states | Story 2.3 ? Edit Product and Manage Publication State | ? Covered |
| FR8 | Product list management ? Продавец может просматривать список своих Товаров, фильтровать по статусу и открывать редактирование. | Epic 2 — product list management | Story 2.4 ? Seller Product List and Status Filters | ? Covered |
| FR9 | Excel/CSV import to drafts ? Продавец может импортировать Excel/CSV файл, чтобы система создала Черновики Товаров с предзаполненными полями. Это `Should` для MVP: сильная activation feature, но не hard blocker для первого релиза. | Epic 5 — Excel/CSV import to drafts | Story 5.1 ? Import Excel/CSV Products as Drafts | ? Covered |
| FR10 | Public storefront rendering ? Система показывает публичную Витрину Магазина по уникальной ссылке. | Epic 3 — public storefront rendering | Story 3.1 ? Public Storefront by Slug | ? Covered |
| FR11 | Catalog display modes ? Покупатель может просматривать каталог Товаров списком или сеткой по два товара в ряд на мобильном экране. | Epic 3 — catalog list/grid display | Story 3.2 ? Buyer Catalog List/Grid View | ? Covered |
| FR12 | Product detail page ? Покупатель может открыть Карточку товара с фотографиями, названием, ценой, описанием и CTA "Связаться". | Epic 3 — product detail page | Story 3.3 ? Public Product Detail Page | ? Covered |
| FR13 | Empty and unavailable states ? Система показывает понятные состояния, если Магазин существует, но в нем нет опубликованных Товаров, или если ссылка не найдена. | Epic 3 — empty and unavailable states | Story 3.1 / Story 3.3 ? public empty/not-found states | ? Covered |
| FR14 | Messenger configuration ? Продавец может настроить Telegram как единственный поддерживаемый MVP-канал для CTA. WhatsApp, VK, несколько активных мессенджеров и альтернативные контакты продавца остаются `Could`. | Epic 3 — Telegram configuration | Story 3.4 ? Configure Telegram Contact Channel | ? Covered |
| FR15 | Prefilled product-context message ? При нажатии CTA система открывает Telegram с Предзаполненным сообщением. | Epic 3 — prefilled Telegram message | Story 3.5 ? Telegram Handoff with Prefilled Product Message | ? Covered |
| FR16 | CTA from catalog and product detail ? Покупатель может нажать CTA из карточки в каталоге и из Карточки товара. | Epic 3 — CTA from catalog/detail | Story 3.2 / Story 3.3 / Story 3.5 ? catalog/detail CTA | ? Covered |
| FR17 | Seller home dashboard ? Продавец видит домашний экран с главным виджетом "просмотры магазина за сегодня". | Epic 4 — seller home dashboard | Story 4.3 ? Seller Home Analytics Widget | ? Covered |
| FR18 | Basic analytics events ? Система фиксирует Просмотр магазина, Просмотр товара и CTA click. | Epic 4 — analytics events | Story 4.1 ? Record Store, Product, and CTA Analytics Events | ? Covered |
| FR19 | Traffic source tracking ? Система определяет или принимает Источник трафика для Просмотра магазина и CTA click. | Epic 4 — traffic source tracking | Story 4.2 ? Attribute Traffic Source Across Buyer Session | ? Covered |
| FR20 | Product-level analytics summary ? Продавец может увидеть базовую аналитику по Товарам: просмотры и CTA clicks. | Epic 4 — product-level analytics summary | Story 4.4 ? Product-Level Analytics Summary | ? Covered |
| FR21 | Mobile-first responsive surfaces ? Все ключевые пользовательские surfaces работают на мобильном viewport. | Epic 1 — mobile-first responsive surfaces | Story 1.1 / Stories 1.2?5.1 ? mobile-first acceptance criteria | ? Covered |
| FR22 | Minimal visual language ? Публичная Витрина и кабинет продавца используют спокойную монохромную визуальную систему с минимальным количеством декоративных элементов. | Epic 1 — minimal visual language | Story 1.1 / Story 3.1 / seller-buyer UI stories ? minimal visual language | ? Covered |

### Missing Requirements

No missing FR coverage found. All PRD FR1?FR22 are represented in the epics coverage map and have a plausible story implementation path.

### Extra FRs in Epics but Not PRD

No extra FR IDs found in epics coverage map.

### Coverage Statistics

- Total PRD FRs: 22
- FRs covered in epics: 22
- Coverage percentage: 100%

## UX Alignment Assessment

### UX Document Status

Found.

- `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md`
- `C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md`

### UX ↔ PRD Alignment

Mostly aligned.

- Mobile-first seller and buyer flows match PRD FR21.
- Minimal monochrome/liquid-glass direction matches PRD FR22.
- Store header, catalog list/grid, product card, product detail gallery, Telegram CTA, copy-message fallback, seller preview, analytics widgets, and import mapper map cleanly to FR2, FR4, FR9–FR20.
- UX correctly keeps buyer registration, internal chat, cart/order/payment/reviews, and non-Telegram channels out of MVP.

### UX ↔ Architecture Alignment

Mostly aligned.

- Architecture supports responsive web as the MVP platform, matching UX mobile-first assumptions.
- Public storefront and seller admin are separated by route/module boundary, supporting UX preview and buyer/admin separation.
- Telegram-only adapter, CTA-before-handoff analytics, source propagation, append-only analytics ledger, signed media URL visibility, product lifecycle visibility, and Supabase/RLS boundaries support the UX flows.
- Architecture includes shared `ui/` and `design-system/` areas, supporting the UX component system.

### Alignment Issues

#### HIGH — Empty storefront public visibility conflict

PRD and UX say an existing store with no published products should render an empty public storefront:

- PRD FR-13: if a store exists but has no published products, the system shows a clear empty state.
- PRD public visibility matrix: “Магазин with no published products” → public visibility `empty state`, HTTP `200`, store header `visible`, analytics `public views counted`.
- UX `EXPERIENCE.md`: “Empty store | Public store with no products / unpublished | Explain that seller has not published products yet.”

Architecture AD-20 says:

- `is_publicly_viewable` is true when a store has a valid slug and at least one published product.
- The public link is available at `is_publicly_viewable`.

This creates an implementation ambiguity: should a valid store slug with zero published products return public empty `200`, or behave as not publicly viewable until the first published product?

**Impact:** affects public route behavior, seller first-run experience, empty-state UX, analytics counting, and Story 3.1 acceptance criteria.

**Recommendation:** before sprint planning, choose one invariant and update either Architecture AD-20 or PRD/UX/Story 3.1. The PRD/UX currently lean toward `200 empty state` for existing store slug with zero published products; Architecture currently leans toward public availability only after one published product.

### Warnings

- No missing UX documentation warning: UX documentation exists and is substantial.
- No broad architecture support warning: the architecture supports the main UX flows, aside from the empty storefront invariant above.

## Epic Quality Review

### Overall Assessment

The epic structure is mostly strong:

- Epics are user-value oriented, not purely technical milestones.
- Dependencies flow naturally: seller/store foundation → catalog → public storefront/contact loop → analytics → optional import.
- No circular epic dependencies found.
- Acceptance criteria generally use clear Given/When/Then structure and include happy paths, errors, visibility rules, and mobile/accessibility concerns.
- Database/entity creation is not front-loaded into a single all-models story; entity work is implied where each domain story first needs it.

### Epic Structure Validation

| Epic | User Value Focus | Independence | Notes |
|---|---|---|---|
| Epic 1: Seller Store Setup & Mobile UX Foundation | Pass | Pass with setup caveat | Seller can sign in, create profile, configure slug, preview store. Greenfield setup is not explicit. |
| Epic 2: Product Catalog Management | Pass | Pass | Can function using Epic 1 seller/store foundation. |
| Epic 3: Public Storefront & Telegram Contact Loop | Pass | Pass with PRD/Architecture caveat | Can function using Epic 1 + 2 outputs; affected by empty storefront visibility ambiguity. |
| Epic 4: Seller Analytics & Source Insight | Pass | Pass | Builds on public storefront/contact events; does not require future import. |
| Epic 5: Conditional Fast Catalog Import | Pass | Pass | Correctly scoped as conditional/Should and drafts-only. |

### Story Quality Findings

#### MAJOR — Missing explicit greenfield setup story

Architecture describes a greenfield responsive web app stack: Next.js, React, Tailwind, shadcn/ui, Supabase, Vercel, migrations, environment separation, RLS/storage policy boundaries. The current story list starts with seller sign-in/admin shell, but no story explicitly covers:

- initial project scaffold;
- dependency installation/pinning;
- environment configuration;
- Supabase project/migration baseline;
- CI/smoke test baseline;
- Vercel/Supabase preview/staging/production env separation;
- shared app route groups and design-system foundation.

**Impact:** Story 1.1 may be too implicit for the first dev agent. Implementation could start without a stable substrate, causing repeated churn across later stories.

**Recommendation:** before sprint planning, add a small Story 1.0 or revise Story 1.1 into two stories:

1. `Story 1.0: Initialize Greenfield Web App Foundation`
2. `Story 1.1: Seller Sign-in and Mobile Admin Shell`

Keep setup minimal and tied to enabling user-facing stories, not “build all infrastructure.”

#### MAJOR — Stories lack explicit FR references inside each story

The document has a complete FR Coverage Map and the coverage validation confirms 22/22 FRs are covered. However, individual story blocks do not explicitly list the FR IDs they implement.

**Impact:** downstream `bmad-create-story` / dev handoff may require extra cross-referencing. A dev agent reading only one story might not know its exact PRD traceability.

**Recommendation:** add a short `**Requirements:** FRx, UX-DRy, AD-z` line to each story before acceptance criteria, or at minimum `**FRs:** FRx` for every story.

#### MINOR — Story 1.1 may be large for a first implementation slice

Story 1.1 currently combines seller registration/sign-in, protected route behavior, persistent session, mobile admin shell navigation, visual foundation, and seller auth boundary.

**Impact:** likely still feasible, but on a greenfield app it could become too broad if scaffold/setup remains implicit.

**Recommendation:** if a dedicated setup story is added, keep Story 1.1 focused on auth + protected mobile shell + public route auth exclusion.

#### MINOR — Conditional Epic 5 should be tagged visibly in sprint planning

Epic 5 is properly scoped as `Should / conditional`, but sprint planning should preserve that status so it does not delay the core MVP loop.

**Recommendation:** mark Story 5.1 as conditional in sprint plan and sequence it after the core loop unless capacity explicitly allows.

### Dependency Analysis

No forward dependencies found within epics.

- Story 1.2 uses authenticated seller shell from Story 1.1.
- Story 1.3 uses store profile/settings from Story 1.2.
- Story 1.4 uses store/profile/slug preview context from previous stories.
- Epic 2 stories progress from draft creation → media → lifecycle → list management.
- Epic 3 stories progress from public storefront → catalog → product detail → Telegram config → handoff.
- Epic 4 stories progress from event capture → source attribution → dashboard widget → product-level summaries.
- Epic 5 is isolated and conditional.

### Best Practices Compliance Checklist

- Epic delivers user value: Pass.
- Epic can function independently: Pass, with empty storefront invariant requiring resolution.
- Stories appropriately sized: Mostly pass; Story 1.1 has sizing risk.
- No forward dependencies: Pass.
- Database tables created when needed: Pass at planning level.
- Clear acceptance criteria: Pass.
- Traceability to FRs maintained: Partial pass; epic-level traceability exists, story-level FR references missing.

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK before sprint planning.**

The planning package is close: PRD, UX, Architecture, and Epics/Stories are present; FR coverage is complete; the product scope is coherent. However, implementation should not start until the identified High/Major issues are resolved, because they will otherwise create ambiguity for the first dev stories and public-route behavior.

### Issue Summary

This assessment identified **5 issues** across **3 categories**:

1. UX/Architecture alignment
2. Greenfield implementation readiness
3. Story-level handoff quality / sprint sequencing

### Critical Issues Requiring Immediate Action

No Critical issues found.

### High Issues Requiring Resolution

1. **Empty storefront public visibility conflict**
   - PRD/UX: existing store with zero published products should render public empty state with HTTP 200 and count public views.
   - Architecture AD-20: public link is available only when store has valid slug and at least one published product.
   - Required decision: choose `200 empty state` or `not publicly viewable until first published product`, then update Architecture or PRD/UX/Story 3.1 accordingly.

### Major Issues Requiring Resolution

1. **Missing explicit greenfield setup story**
   - Add a small setup story before Story 1.1, or split Story 1.1.
   - It should cover scaffold, dependency pins, env baseline, Supabase migration baseline, route-group foundation, minimal CI/smoke checks, and deployment environment assumptions.

2. **Missing story-level FR references**
   - Add `**Requirements:** FRx, UX-DRy, AD-z` or at least `**FRs:** FRx` to each story.
   - The current FR Coverage Map is complete, but individual stories are not self-contained enough for downstream dev handoff.

### Minor Issues / Watch Items

1. **Story 1.1 sizing risk**
   - If greenfield setup remains implicit, Story 1.1 is likely too broad.
   - After adding setup story, keep Story 1.1 focused on auth + protected mobile shell.

2. **Epic 5 conditional status**
   - Preserve Story 5.1 as `Should / conditional` in sprint planning so it does not delay the core MVP loop.

### Recommended Next Steps

1. Resolve the empty storefront invariant and update the affected artifact(s).
2. Add or split a greenfield setup story before implementation begins.
3. Add explicit requirement trace lines to all story blocks.
4. Re-run implementation readiness after those updates.
5. If the re-run clears High/Major issues, proceed to `bmad-sprint-planning`.

### Final Note

The product plan is directionally strong and well-scoped. The remaining issues are not conceptual product failures; they are handoff-quality issues. Fixing them before sprint planning will make the first implementation stories much cleaner and reduce “wait, what should this route do?” churn during development.

**Assessment date:** 2026-08-01  
**Assessor:** Codex via `bmad-check-implementation-readiness`
