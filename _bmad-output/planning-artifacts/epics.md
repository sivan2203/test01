---
stepsCompleted:
  - step-01-requirements-extracted
  - step-02-epic-list-approved
  - step-03-epics-and-stories-created
  - step-04-final-validation-complete
inputDocuments:
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\architecture\architecture-test01-2026-08-01\ARCHITECTURE-SPINE.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\DESIGN.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\ux-designs\ux-test01-2026-08-01\EXPERIENCE.md
---

# test01 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for test01, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Продавец может зарегистрироваться и войти в кабинет продавца; Магазин нельзя создать без регистрации, сессия сохраняется между посещениями, Покупатель не видит регистрацию при просмотре Витрины или CTA.

FR2: Продавец может заполнить и редактировать профиль Магазина: обязательное название, фото/аватар, необязательное описание и дополнительную информацию; изменения отображаются в публичной Витрине после сохранения.

FR3: Продавец может задать и изменить уникальный публичный slug/username Магазина; slug валидируется на занятость, формат, длину, reserved words; старая ссылка после смены slug возвращает 404 без редиректа в MVP.

FR4: Продавец может открыть предпросмотр своей Витрины в режиме покупателя; предпросмотр использует структуру публичной Витрины и не показывает неопубликованные товары вне специального draft context.

FR5: Продавец может вручную создать Товар с названием, ценой, описанием, фотографиями, статусом наличия и возможностью сохранить как Черновик; обязательность и ограничения полей соответствуют product data contract.

FR6: Продавец может добавить, удалить и переупорядочить фотографии Товара; первая фотография является обложкой, опубликованный товар требует 1–10 фото в форматах JPG/PNG/WebP, неподдерживаемый формат должен давать UX-ошибку до публикации.

FR7: Продавец может переводить Товар между Черновиком, Опубликованным и Скрытым состояниями; Черновики/Скрытые товары не видны покупателю, публикация явная, удалённый товар возвращает 404, out-of-stock товар остаётся видимым с доступным CTA.

FR8: Продавец может просматривать список своих Товаров, фильтровать по статусу и быстро открывать редактирование выбранного Товара.

FR9: Продавец может импортировать Excel/CSV в Черновики Товаров с предзаполненными полями; импорт не публикует автоматически, показывает результат как Черновики, поддерживает шаблон или сопоставление колонок, объясняет ошибки. Requirement classification: `Should / conditional`.

FR10: Система показывает публичную Витрину Магазина по уникальной ссылке без авторизации покупателя; шапка содержит фото/аватар, название, дополнительную информацию и необязательное описание; неопубликованные/скрытые товары не отображаются.

FR11: Покупатель может просматривать каталог Товаров списком или сеткой по два товара в ряд на мобильном; карточка показывает фото, название, цену и CTA; переключение вида не меняет состав товаров и может сохраняться локально.

FR12: Покупатель может открыть Карточку товара с фотографиями, названием, ценой, описанием и CTA; фото пролистываются, описание доступно полностью, CTA доступен в первом экране mobile viewport 360–430px или закреплён снизу.

FR13: Система показывает понятные empty/not-found states: пустая Витрина не выглядит как серверная ошибка; несуществующие ссылки не раскрывают приватные данные; прямые URL на Скрытый товар или Черновик возвращают 404.

FR14: Продавец может настроить Telegram как единственный поддерживаемый MVP-канал CTA; без Telegram продавец видит предупреждение, публичный CTA disabled state, ссылка валидируется перед сохранением. WhatsApp/VK/альтернативные контакты остаются `Could`.

FR15: При нажатии CTA система открывает Telegram с предзаполненным сообщением, содержащим название товара, ссылку на Карточку товара, цену или “по запросу”; Покупатель может изменить сообщение, а при отказе deep link остаётся на Витрине и может скопировать текст.

FR16: Покупатель может нажать CTA из карточки в каталоге и из Карточки товара; CTA передаёт контекст выбранного товара, событие CTA click фиксируется до перехода в Telegram; отправка сообщения, чат и уведомления out of scope.

FR17: Продавец видит seller home dashboard с главным виджетом “просмотры магазина за сегодня”; главная метрика визуально доминирует, zero state предлагает поделиться ссылкой, “сегодня” считается в timezone Магазина, MVP default Europe/Moscow.

FR18: Система фиксирует базовые analytics events: Просмотр магазина, Просмотр товара и CTA click; события привязаны к Магазину/Товару, не считают покупку/отправку сообщения, исключают seller preview и известных bot/crawler visits.

FR19: Система определяет или принимает Источник трафика для Просмотра магазина и CTA click; поддерживает UTM/source labels, unknown source, precedence explicit source/UTM over referrer, и propagation source metadata from Витрина to Карточка товара and CTA click during session.

FR20: Продавец может увидеть базовую product-level analytics summary: просмотры и CTA clicks за текущий день и последние 7 дней; 30-дневный период fast-follow.

FR21: Все ключевые seller/buyer surfaces работают mobile-first: продавец может создать Магазин и Товар с телефона, покупатель может открыть Витрину/Карточку/CTA с телефона, desktop не ломает mobile logic, primary mobile viewport 360–430px, tap target минимум 44x44 CSS px.

FR22: Публичная Витрина и кабинет продавца используют спокойную монохромную визуальную систему с минимальным количеством декоративных элементов; UI не похож на маркетплейсную ленту, liquid glass не мешает читаемости, фото/CTA визуально доминируют, normal text стремится к WCAG AA contrast.

### NonFunctional Requirements

NFR1: Performance — Public Витрина and Карточка товара target P75 initial core content load under 2.5s on reasonable 4G.

NFR2: Availability — Public storefront pages target higher availability than seller admin surfaces; public storefront downtime is release-blocking for launch checks.

NFR3: Accessibility — Core flows use semantic labels, WCAG AA contrast where feasible, and 44x44 CSS px minimum tap targets for primary controls.

NFR4: Privacy — Analytics avoids unnecessary buyer personal data; no buyer identity is stored in MVP.

NFR5: Observability — Analytics events must be inspectable by event name, store_id, product_id, source, occurred_at, and exclusion reason where applicable.

NFR6: Data Integrity — Product publication state must be consistent; Черновик must not appear publicly by mistake.

### Additional Requirements

- Starter/stack seed: greenfield responsive web app using Node.js 24 LTS, Next.js 16 App Router, React 19.2, Tailwind CSS 4.x, shadcn/ui, Supabase hosted Postgres/Auth/Storage, `@supabase/supabase-js@2`, `@supabase/ssr`, and Vercel preview/staging/production deployments.
- Architecture paradigm: vertical-slice modular monolith; each product capability owns route segments, server actions/queries, domain services, and tests.
- Public storefront and seller admin must be separate route/module surfaces; public buyer routes never require buyer auth and seller preview analytics are excluded.
- Telegram is the only enabled MVP contact adapter; contact adapter seam may exist, but WhatsApp/VK/alternative contacts are disabled `Could`.
- CTA click must be recorded before external Telegram handoff; system records intent only, not sent message or purchase.
- Public product visibility must be enforced at repository/query boundary from lifecycle state; Draft/Hidden/Deleted products must not appear publicly.
- Optional import creates drafts only and retains import metadata if FR9 ships.
- Analytics must be an append-only observed-event ledger; dashboard summaries derive from canonical raw events.
- Source attribution is session-scoped; explicit source/UTM beats HTTP referrer and unknown is preserved.
- Auth applies only to seller/admin routes; buyers remain anonymous except anonymous analytics session IDs.
- Store slug is public store identity; old slug returns 404 in MVP.
- Product public URL is ID-stable and slug-decorated; hidden/deleted/nonexistent product URLs return public not-found.
- Product media files live in object storage; product owns ordered media references; first ordered media item is cover.
- Domain mutations go through server-side application services; client components cannot write inconsistent shapes directly to database.
- Events store UTC timestamps; dashboard day buckets compute in store timezone with MVP default `Europe/Moscow`.
- Supabase privilege boundary is explicit: browser uses anon credentials only; seller-scoped server work uses SSR/user clients with RLS; service role isolated to server-only admin/maintenance modules.
- Product media access follows product visibility through private product-media storage and server-generated signed URLs after authorization/visibility checks.
- Schema, RLS, storage policies, and seed reference data change only through timestamped SQL migrations under `supabase/migrations/`.
- Deployment envelope is Vercel + Supabase with local, preview, staging, and production separation; preview points only to staging Supabase, production only to production Supabase; secrets live in provider env vars.
- Seller dashboard top source ranks by public `store_view` count for the selected period; product/CTA source breakdown can live in detail screens.
- `is_publicly_viewable` and `activation_complete` are distinct: public link after valid slug + >=1 published product; activation complete after >=3 published products.
- Package pins must be confirmed after scaffold and reflected in Stack if starter defaults differ.
- Service-role import boundary should be enforced by lint/test once code exists.
- Signed media URL expiry/window should be set in media implementation stories.

### UX Design Requirements

UX-DR1: Implement DESIGN.md tokens as the visual contract: monochrome palette, Telegram accent, typography roles, spacing scale, radius scale, and component token map.

UX-DR2: Enforce load-bearing WCAG AA contrast pairs for normal text: ink on base/raised surfaces, inverse ink on inverse surface, inverse ink on Telegram accent, and ink on solid glass fallback.

UX-DR3: Implement Product card component with photo, title, price/“по запросу”, CTA, 2-column grid behavior on mobile, 44px+ tap target, and visual priority for product photo/CTA.

UX-DR4: Implement Store header component with photo/avatar, name, optional description/info; description absence collapses spacing cleanly.

UX-DR5: Implement Catalog view toggle with list/grid behavior, local persistence, accessible current-state announcement, and non-color-only active state.

UX-DR6: Implement Product detail media/gallery behavior: swipe/tap through photos, first photo as cover, quiet photo count indicator, screen-reader labels `Фото {n} из {total}: {product title}`, and previous/next control state labels.

UX-DR7: Implement Telegram CTA component using Telegram blue only where destination clarity matters, otherwise primary black button; label buyer primary as `Связаться в Telegram`.

UX-DR8: Implement Copy-message fallback component for failed/blocked Telegram deep link; buyer remains on storefront/detail and can copy prefilled message text.

UX-DR9: Implement Analytics summary widget and Analytics card components: today store views as dominant metric, product views, CTA clicks, top source, and screen-reader metric text such as “Просмотры магазина сегодня: 42. Лучший источник: Telegram.”

UX-DR10: Implement Product state control with visible Draft/Published/Hidden state and explicit publish action.

UX-DR11: Implement Slug editor with inline format/uniqueness validation and no toast-only error state.

UX-DR12: Implement Import mapper as mobile-simplified table-like flow for Excel/CSV mapping; creates drafts only.

UX-DR13: Implement Form field pattern with label above, helper/error below, field-level errors before page-level errors, and preserved local values on save failure.

UX-DR14: Implement Empty state pattern with one short explanation and one next action; no SaaS stock-art dependency.

UX-DR15: Implement State Patterns: first seller login, cold storefront load, cold dashboard load, incomplete profile, no published products, first product published, activation target not met, draft missing photo, product save failed, Telegram not configured, Telegram deep link failed, no analytics today, unknown source, seller preview, known bot/crawler exclusion, network offline.

UX-DR16: Implement seller mobile navigation as bottom nav or compact top nav with Home / Products / Analytics / Store; buyer surfaces do not show app-like navigation.

UX-DR17: Implement accessibility floor: 44x44 CSS px tap targets, visible focus order matching reading order, semantic CTA destination, disabled CTA semantics/`aria-disabled`, text-first errors and empty states, no color-only validation.

UX-DR18: Implement reduced motion and reduced transparency behavior: no motion-only information; glass panels fall back to solid raised surface with hairline border in high-contrast/reduced-transparency contexts.

UX-DR19: Implement responsive behavior: primary acceptance range 360–430px, 431–767px same IA with wider cards/media, 768px+ centered public storefront and optional two-column seller analytics.

UX-DR20: Implement Preview as buyer flow with seller-only preview indicator; preview views and CTA taps are not counted in analytics.

UX-DR21: Use mockups as visual references for public storefront and seller dashboard; spines win on conflict with mockups.

UX-DR22: Keep buyer registration prompts, chat UI, cart UI, order status UI, review UI, infinite catalog feed, and hover-only controls out of MVP UX.

### FR Coverage Map

FR1: Epic 1 — seller registration/login

FR2: Epic 1 — store profile editing

FR3: Epic 1 — editable public store slug

FR4: Epic 1 — store preview

FR5: Epic 2 — manual product creation

FR6: Epic 2 — product media management

FR7: Epic 2 — product lifecycle states

FR8: Epic 2 — product list management

FR9: Epic 5 — Excel/CSV import to drafts

FR10: Epic 3 — public storefront rendering

FR11: Epic 3 — catalog list/grid display

FR12: Epic 3 — product detail page

FR13: Epic 3 — empty and unavailable states

FR14: Epic 3 — Telegram configuration

FR15: Epic 3 — prefilled Telegram message

FR16: Epic 3 — CTA from catalog/detail

FR17: Epic 4 — seller home dashboard

FR18: Epic 4 — analytics events

FR19: Epic 4 — traffic source tracking

FR20: Epic 4 — product-level analytics summary

FR21: Epic 1 — mobile-first responsive surfaces

FR22: Epic 1 — minimal visual language

## Epic List

### Epic 1: Seller Store Setup & Mobile UX Foundation

Продавец может зарегистрироваться, создать базовый Магазин, настроить публичную ссылку, увидеть предпросмотр и работать в mobile-first интерфейсе с общей дизайн-системой.

**FRs covered:** FR1, FR2, FR3, FR4, FR21, FR22

### Epic 2: Product Catalog Management

Продавец может вручную создать и управлять небольшим каталогом товаров: фото, цена, описание, статусы, список товаров, публикация/скрытие/удаление.

**FRs covered:** FR5, FR6, FR7, FR8

### Epic 3: Public Storefront & Telegram Contact Loop

Покупатель может открыть публичную Витрину, посмотреть каталог/карточку товара и связаться с продавцом в Telegram с предзаполненным сообщением.

**FRs covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR16

### Epic 4: Seller Analytics & Source Insight

Продавец видит сегодняшние просмотры, просмотры товаров, CTA clicks и лучший источник трафика, чтобы понимать, что сработало.

**FRs covered:** FR17, FR18, FR19, FR20

### Epic 5: Conditional Fast Catalog Import

Продавец может импортировать Excel/CSV файл, получить Черновики товаров и быстро довести их до публикации.

**FRs covered:** FR9

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

### Story 1.1: Seller Sign-in and Mobile Admin Shell

As a seller,
I want to register or sign in and land in a protected mobile-first seller cabinet,
So that I can start creating my personal storefront from my phone.

**Requirements:** FR1, FR21, FR22, AD-1, AD-2, AD-9, AD-15, UX-DR16, UX-DR17, UX-DR19

**Acceptance Criteria:**

**Given** I am not authenticated
**When** I open any seller/admin route
**Then** I am redirected to seller sign-in
**And** public buyer storefront routes remain accessible without authentication.

**Given** I complete seller sign-in or registration successfully
**When** the session is created
**Then** I land on the seller home/admin shell
**And** my session is preserved between visits.

**Given** I am using a mobile viewport between 360–430px
**When** I view the seller admin shell
**Then** the layout is usable mobile-first
**And** primary navigation exposes Home / Products / Analytics / Store with tap targets at least 44x44 CSS px.

**Given** the shared app foundation from Story 1.0 exists
**When** seller/admin shell screens render
**Then** they use the shared mobile-first navigation and design primitives
**And** Story 1.1 does not introduce a separate competing visual system.

**Given** the implementation stores or checks seller identity
**When** seller-scoped data is accessed
**Then** access is constrained to authenticated seller/admin routes
**And** buyer routes do not require or expose seller authentication.

### Story 1.2: Create and Edit Store Profile

As a seller,
I want to create and edit my store profile,
So that buyers see who is selling the products and what the store is about.

**Requirements:** FR2, FR21, FR22, AD-13, UX-DR4, UX-DR13, UX-DR14, UX-DR17

**Acceptance Criteria:**

**Given** I am an authenticated seller without a store
**When** I open the Store section
**Then** I can create a store profile
**And** the store cannot be created without a required store name.

**Given** I am editing my store profile
**When** I add or change the store name, photo/avatar, optional description, or additional information
**Then** I can save the changes
**And** saved changes are reflected in the store profile data.

**Given** I leave optional description or additional information empty
**When** the store profile is displayed
**Then** the interface collapses empty optional areas cleanly
**And** no placeholder text is shown to buyers as real content.

**Given** profile saving fails because of validation or network error
**When** the error is shown
**Then** field-level errors appear near the relevant fields where possible
**And** entered values are preserved for correction.

**Given** I view the profile editor on a 360–430px mobile viewport
**When** I fill and save the form
**Then** labels, helper text, errors, and primary actions remain readable and tappable
**And** primary controls meet the 44x44 CSS px tap target requirement.

### Story 1.3: Configure Public Store Slug

As a seller,
I want to set and edit a unique public store slug,
So that I can share a clean personal storefront link in my social profiles.

**Requirements:** FR3, FR21, AD-10, UX-DR11, UX-DR13, UX-DR17

**Acceptance Criteria:**

**Given** I am editing my store settings
**When** I enter a public slug
**Then** the system validates format, length, reserved words, and uniqueness
**And** validation feedback is shown inline, not only as a toast.

**Given** the slug is valid and available
**When** I save it
**Then** the store receives a public URL based on that slug
**And** the seller can copy or share the link from the store settings area.

**Given** the slug is already taken or invalid
**When** I try to save it
**Then** the slug is not saved
**And** the interface explains what must be changed.

**Given** I change an existing slug
**When** the new slug is saved
**Then** the new public URL becomes the current store identity
**And** the old slug returns public 404 in MVP without redirect.

**Given** I view the slug editor on mobile
**When** validation or save state changes
**Then** the current state is clear through text and accessible state, not color alone
**And** the copy/share control remains tappable.

### Story 1.4: Preview Store as Buyer

As a seller,
I want to preview my storefront as a buyer would see it,
So that I can check my public presentation before sharing the link.

**Requirements:** FR4, FR21, FR22, AD-2, AD-5, AD-7, UX-DR20

**Acceptance Criteria:**

**Given** I am an authenticated seller with a store
**When** I open preview mode
**Then** I see the buyer-facing storefront layout for my store
**And** the preview uses the same structure as the public storefront.

**Given** my store has draft or hidden products
**When** I open buyer preview
**Then** unpublished products are not shown in the normal buyer view
**And** draft-only visibility is available only through an explicit seller draft context if implemented.

**Given** I am in preview mode
**When** the storefront is displayed
**Then** a seller-only preview indicator is visible
**And** the indicator is not part of the public buyer storefront.

**Given** I view or tap CTA elements in preview mode
**When** analytics events would normally be recorded
**Then** preview views and preview CTA taps are excluded from analytics.

**Given** the preview is opened on mobile
**When** I navigate between seller admin and preview
**Then** the flow is clear and reversible
**And** the preview remains usable at 360–430px viewport width.

## Epic 2: Product Catalog Management

Продавец может вручную создать и управлять небольшим каталогом товаров: фото, цена, описание, статусы, список товаров, публикация/скрытие/удаление.

### Story 2.1: Create Product Draft Manually

As a seller,
I want to manually create a product draft with core product information,
So that I can start building my storefront catalog without publishing incomplete products.

**Requirements:** FR5, FR7, FR21, NFR6, AD-5, AD-13, UX-DR10, UX-DR13, UX-DR14

**Acceptance Criteria:**

**Given** I am an authenticated seller with a store
**When** I open the Products section and choose to add a product
**Then** I can create a product with title, price or “по запросу”, description, availability status, and draft status
**And** the product is saved as Draft by default.

**Given** I am creating a product draft
**When** I leave required fields empty or enter invalid values
**Then** the product is not saved as a valid draft/published item where validation requires it
**And** field-level errors explain what must be corrected.

**Given** a product is saved as Draft
**When** a buyer opens the public storefront or direct product URL
**Then** the draft product is not visible publicly
**And** public direct access returns a not-found state without private data leakage.

**Given** I save a product draft successfully
**When** I return to the Products list
**Then** the product appears in my seller product list with Draft status
**And** I can reopen it for editing.

**Given** I use the product creation form on mobile
**When** I fill fields and save
**Then** labels, helper text, errors, and primary actions are readable and tappable at 360–430px
**And** unsaved field values are preserved if saving fails.

### Story 2.2: Manage Product Photos

As a seller,
I want to add, remove, and reorder product photos,
So that buyers can understand the product visually before contacting me.

**Requirements:** FR6, FR12, FR21, AD-12, AD-16, UX-DR6, UX-DR17

**Acceptance Criteria:**

**Given** I am editing a product
**When** I upload product photos
**Then** supported JPG, PNG, and WebP images can be attached
**And** unsupported formats show a clear UX error before publication.

**Given** a product has multiple photos
**When** I reorder them
**Then** the new order is saved
**And** the first ordered photo becomes the product cover.

**Given** I remove a product photo
**When** the product is saved
**Then** the removed photo is no longer shown in seller edit, public catalog card, or product detail
**And** remaining photos keep their saved order.

**Given** I try to publish a product
**When** it has no valid photos
**Then** publication is blocked
**And** the interface explains that a published product requires 1–10 photos.

**Given** product media is stored
**When** photos are accessed publicly
**Then** access follows product visibility rules
**And** draft, hidden, deleted, or unauthorized media is not exposed publicly.

**Given** I manage photos on mobile
**When** I add, remove, or reorder photos
**Then** the controls are usable at 360–430px
**And** all primary photo actions have accessible labels.

### Story 2.3: Edit Product and Manage Publication State

As a seller,
I want to edit a product and control whether it is Draft, Published, Hidden, or Deleted,
So that I decide exactly what buyers can see in my storefront.

**Requirements:** FR5, FR7, FR13, NFR6, AD-5, AD-13, AD-16, UX-DR10, UX-DR15

**Acceptance Criteria:**

**Given** I am editing an existing product
**When** I change title, price/“по запросу”, description, availability, or photos
**Then** I can save the changes
**And** the updated values are reflected in seller product data.

**Given** a product is Draft
**When** I publish it with all required publishable fields and 1–10 valid photos
**Then** the product becomes visible in the public storefront and public product URL
**And** the publish action is explicit.

**Given** a product is Published
**When** I hide it
**Then** the product is removed from public storefront/catalog visibility
**And** direct public URL access returns a not-found state.

**Given** a product is out of stock
**When** it remains Published
**Then** it stays visible publicly with its availability status
**And** the CTA remains available for buyer contact.

**Given** a product is deleted
**When** a buyer opens its public URL
**Then** the system returns public 404/not-found
**And** private product details are not leaked.

**Given** product state changes are saved
**When** public storefront queries run
**Then** visibility is enforced at repository/query boundary
**And** Draft, Hidden, and Deleted products cannot appear publicly by client-side filtering mistakes.

### Story 2.4: Seller Product List and Status Filters

As a seller,
I want to view and filter my product list,
So that I can quickly find products and continue editing my catalog.

**Requirements:** FR8, FR21, AD-13, UX-DR10, UX-DR14, UX-DR16, UX-DR17

**Acceptance Criteria:**

**Given** I am an authenticated seller with products
**When** I open the Products section
**Then** I see my own products only
**And** each item shows title, cover photo when available, price/“по запросу”, availability, and lifecycle status.

**Given** I have products in different states
**When** I filter by Draft, Published, Hidden, or Deleted/Archived where applicable
**Then** the list updates to show only matching products
**And** the active filter is clear through text/state, not color alone.

**Given** I select a product from the list
**When** I tap the product item or edit action
**Then** the product editor opens for that product
**And** I can continue editing without losing product state.

**Given** I have no products yet
**When** I open the Products section
**Then** I see an empty state with one short explanation
**And** the primary next action is to add a product.

**Given** I use the product list on mobile
**When** I scroll, filter, and open products
**Then** controls remain readable and tappable at 360–430px
**And** the list does not rely on hover-only controls.

## Epic 3: Public Storefront & Telegram Contact Loop

Покупатель может открыть публичную Витрину, посмотреть каталог/Карточку товара и связаться с продавцом в Telegram с предзаполненным сообщением.

### Story 3.1: Public Storefront by Slug

As a buyer,
I want to open a seller’s public storefront by its unique link,
So that I can see who the seller is and what products are available.

**Requirements:** FR10, FR13, FR21, FR22, NFR1, NFR2, AD-2, AD-5, AD-10, AD-20, UX-DR4, UX-DR14, UX-DR19

**Acceptance Criteria:**

**Given** a store has a valid public slug
**When** I open the public storefront URL
**Then** the storefront loads without requiring buyer authentication
**And** seller/admin navigation is not shown.

**Given** the store profile has a photo/avatar, name, optional description, and additional information
**When** the public storefront renders
**Then** the header shows available profile content
**And** missing optional description/additional information collapses cleanly.

**Given** the store has Published products
**When** the storefront product list renders
**Then** only Published products are shown
**And** Draft, Hidden, and Deleted products are excluded at query/repository boundary.

**Given** the store has no Published products
**When** I open the storefront
**Then** I see a friendly empty state
**And** the page does not look like a server error.

**Given** the slug does not exist or belongs to an unavailable public store
**When** I open the URL
**Then** I see a public not-found state
**And** private seller or product data is not leaked.

**Given** I open the storefront on a 360–430px mobile viewport
**When** the page renders
**Then** the header, product area, and primary actions are readable and tappable
**And** the visual style follows the minimal monochrome/liquid-glass MVP direction.

### Story 3.2: Buyer Catalog List/Grid View

As a buyer,
I want to browse products in list or grid view,
So that I can quickly scan the seller’s catalog in the format that feels easiest on my phone.

**Requirements:** FR11, FR16, FR21, FR22, AD-4, AD-5, UX-DR3, UX-DR5, UX-DR7, UX-DR17, UX-DR19

**Acceptance Criteria:**

**Given** a public storefront has Published products
**When** I open the catalog area
**Then** each product card shows cover photo, title, price or “по запросу”, and a contact CTA
**And** the product card can also be opened to view product details.

**Given** I switch between list and grid view
**When** the catalog layout changes
**Then** the same Published products remain visible
**And** the selected view can be preserved locally for the buyer’s browser.

**Given** I use grid view on mobile
**When** products are displayed
**Then** the layout shows two product cards per row where viewport width allows
**And** cards remain readable and tappable at 360–430px.

**Given** I use list view on mobile
**When** products are displayed
**Then** each product has enough space for photo, title, price, and CTA
**And** the CTA remains visually clear without crowding the card.

**Given** I use the catalog view toggle
**When** I change the selected view
**Then** the current state is communicated accessibly
**And** the active state is not indicated by color alone.

**Given** I tap the product CTA from the catalog card
**When** the contact flow starts
**Then** the selected product context is preserved for Telegram handoff
**And** the CTA click event can be recorded before leaving the site.

### Story 3.3: Public Product Detail Page

As a buyer,
I want to open a product detail page with photos, description, price, and contact CTA,
So that I can understand the product before messaging the seller.

**Requirements:** FR12, FR13, FR16, FR21, FR22, NFR1, AD-5, AD-11, AD-12, AD-16, UX-DR6, UX-DR7, UX-DR17

**Acceptance Criteria:**

**Given** I open a public URL for a Published product
**When** the product detail page renders
**Then** I see product photos, title, price or “по запросу”, description, availability status, and contact CTA
**And** buyer authentication is not required.

**Given** the product has multiple photos
**When** I browse the gallery
**Then** I can swipe or tap through photos
**And** the first ordered photo is shown as the initial/cover photo.

**Given** the gallery is used with assistive technology
**When** photos are announced
**Then** each photo has a label like “Фото {n} из {total}: {product title}”
**And** previous/next controls expose their state accessibly.

**Given** I open a direct URL for a Draft, Hidden, Deleted, or nonexistent product
**When** the page resolves visibility
**Then** I see a public not-found state
**And** private product data and media are not leaked.

**Given** I open the product detail page on mobile
**When** the first screen renders at 360–430px
**Then** the CTA is visible in the first viewport or fixed/sticky at the bottom
**And** photo, title, price, and CTA have clear visual priority.

**Given** I tap the product detail CTA
**When** the contact flow starts
**Then** the selected product context is preserved for Telegram handoff
**And** the CTA click event can be recorded before leaving the site.

### Story 3.4: Configure Telegram Contact Channel

As a seller,
I want to configure Telegram as my store’s contact channel,
So that buyers can contact me from product cards and product pages.

**Requirements:** FR14, FR21, AD-3, AD-13, UX-DR7, UX-DR13, UX-DR17

**Acceptance Criteria:**

**Given** I am an authenticated seller editing store/contact settings
**When** I enter a Telegram username or link
**Then** the system validates the supported Telegram format before saving
**And** invalid values show inline guidance.

**Given** a valid Telegram contact is saved
**When** a buyer views my public storefront or product detail
**Then** product CTAs are enabled
**And** the CTA destination is clearly labeled as Telegram.

**Given** no valid Telegram contact is configured
**When** a buyer views my public storefront or product detail
**Then** the public CTA appears in a disabled/unavailable state
**And** the seller sees a warning in admin explaining that Telegram must be configured.

**Given** Telegram is the only MVP contact channel
**When** contact settings are shown
**Then** WhatsApp, VK, internal chat, phone, and alternative contacts are not enabled as MVP channels
**And** any contact adapter seam does not expose disabled channels to buyers.

**Given** I use the Telegram settings on mobile
**When** I edit and save the contact value
**Then** the field, validation, and save action remain readable and tappable
**And** errors are communicated with text, not color alone.

### Story 3.5: Telegram Handoff with Prefilled Product Message

As a buyer,
I want the contact CTA to open Telegram with product context already prepared,
So that I can message the seller without manually copying product details.

**Requirements:** FR15, FR16, FR18, FR19, AD-3, AD-4, AD-8, UX-DR7, UX-DR8, UX-DR17

**Acceptance Criteria:**

**Given** a product CTA is enabled in the catalog card or product detail page
**When** I tap “Связаться в Telegram”
**Then** the system prepares a Telegram handoff to the seller’s configured Telegram contact
**And** the handoff includes a prefilled message with product title, product URL, and price or “по запросу”.

**Given** I tap a product CTA
**When** the Telegram handoff starts
**Then** the CTA click event is recorded before the external navigation attempt
**And** the event is associated with the store, product, source/session metadata where available, and timestamp.

**Given** Telegram opens successfully
**When** the prefilled message is shown
**Then** I can edit the message before sending
**And** the system does not claim that a message, purchase, or order was completed.

**Given** Telegram deep link is blocked, unavailable, or fails
**When** I remain on the storefront/product page
**Then** I see a copy-message fallback with the same prepared text
**And** I can copy the message manually.

**Given** I use the handoff on mobile
**When** I tap the CTA or use fallback copy
**Then** the interaction is clear, tappable, and destination-labeled
**And** the buyer is not prompted to register or use internal chat.

## Epic 4: Seller Analytics & Source Insight

Продавец видит сегодняшние просмотры, просмотры товаров, CTA clicks и лучший источник трафика, чтобы понимать, что сработало после публикации ссылки.

### Story 4.1: Record Store, Product, and CTA Analytics Events

As a seller,
I want storefront views, product views, and contact CTA clicks to be recorded,
So that I can later understand buyer interest in my store and products.

**Requirements:** FR18, NFR4, NFR5, AD-2, AD-4, AD-7, AD-14

**Acceptance Criteria:**

**Given** a buyer opens a public storefront
**When** the storefront view is eligible for analytics
**Then** a `store_view` event is appended
**And** it includes store_id, occurred_at UTC timestamp, anonymous/session identifier where available, source metadata where available, and event name.

**Given** a buyer opens a public product detail page
**When** the product view is eligible for analytics
**Then** a `product_view` event is appended
**And** it includes store_id, product_id, occurred_at UTC timestamp, anonymous/session identifier where available, source metadata where available, and event name.

**Given** a buyer taps an enabled product CTA
**When** the Telegram handoff starts
**Then** a `cta_click` event is appended before external navigation
**And** it includes store_id, product_id, occurred_at UTC timestamp, source/session metadata where available, and event name.

**Given** a seller views their own store in preview mode
**When** preview views or preview CTA taps occur
**Then** analytics events are not counted as public buyer events
**And** the exclusion reason is inspectable where applicable.

**Given** a known bot/crawler visit is detected
**When** it would otherwise create an analytics event
**Then** it is excluded from seller-facing metrics
**And** the exclusion reason is inspectable where applicable.

**Given** analytics events are stored
**When** dashboard summaries are calculated
**Then** summaries derive from the canonical append-only event ledger
**And** events are inspectable by event name, store_id, product_id, source, occurred_at, and exclusion reason where applicable.

### Story 4.2: Attribute Traffic Source Across Buyer Session

As a seller,
I want buyer visits and contact clicks to keep their traffic source,
So that I can understand whether Instagram, Telegram, direct links, or unknown sources bring interest.

**Requirements:** FR19, NFR4, NFR5, AD-8, AD-14

**Acceptance Criteria:**

**Given** a buyer opens a public storefront URL with explicit source or UTM parameters
**When** analytics source is resolved
**Then** the explicit source/UTM value is used
**And** it takes precedence over HTTP referrer.

**Given** a buyer opens a public storefront without explicit source/UTM
**When** an HTTP referrer is available
**Then** the system derives a source label from the referrer where possible
**And** otherwise stores the source as `unknown`.

**Given** a source is resolved on the storefront view
**When** the buyer navigates to a product detail page in the same session
**Then** the source metadata is propagated to product view analytics
**And** it is not lost during normal storefront → product navigation.

**Given** a buyer taps a product CTA in the same session
**When** the CTA click event is recorded
**Then** the source metadata is attached to the CTA click
**And** the event can be grouped by source in seller analytics.

**Given** a source cannot be confidently recognized
**When** analytics events are stored
**Then** the source is preserved as `unknown`
**And** unknown traffic is still counted rather than discarded.

**Given** source labels are shown to the seller
**When** they appear in dashboard or analytics screens
**Then** labels are human-readable
**And** missing/unknown source states are explained without implying an error.

### Story 4.3: Seller Home Analytics Widget

As a seller,
I want to see today’s key store analytics on my home dashboard,
So that I immediately understand whether my shared link is getting attention.

**Requirements:** FR17, FR19, FR20, FR21, NFR5, AD-14, AD-19, AD-20, UX-DR9, UX-DR14, UX-DR16

**Acceptance Criteria:**

**Given** I am an authenticated seller with a store
**When** I open the seller home dashboard
**Then** I see a primary analytics widget for “просмотры магазина за сегодня”
**And** this metric is visually dominant over secondary metrics.

**Given** analytics events exist for the current day
**When** the dashboard calculates today’s metrics
**Then** the day bucket is calculated in the store timezone
**And** MVP default timezone is `Europe/Moscow`.

**Given** there are product views and CTA clicks today
**When** the widget renders
**Then** it shows today’s store views, product views, CTA clicks, and top source where available
**And** top source is ranked by public `store_view` count for the selected period.

**Given** there are no analytics events today
**When** I open the dashboard
**Then** I see a zero state
**And** the zero state suggests sharing the store link as the next action.

**Given** the widget is read by assistive technology
**When** metrics are announced
**Then** the text includes clear metric labels such as “Просмотры магазина сегодня: 42. Лучший источник: Telegram.”
**And** numbers are not communicated by visuals alone.

**Given** I use the dashboard on mobile
**When** the widget renders at 360–430px
**Then** the metric cards are readable and tappable where interactive
**And** the layout stays calm and minimal without dense analytics clutter.

### Story 4.4: Product-Level Analytics Summary

As a seller,
I want to see product-level views and contact clicks,
So that I can understand which products attract buyer interest.

**Requirements:** FR18, FR20, FR21, NFR5, AD-7, AD-14, AD-19, UX-DR9, UX-DR17

**Acceptance Criteria:**

**Given** I am an authenticated seller viewing analytics
**When** product analytics are shown
**Then** I can see product views and CTA clicks for my products
**And** the summary includes today and the last 7 days.

**Given** a product has no views or CTA clicks in the selected period
**When** the product analytics row/card is shown
**Then** zero values are displayed clearly
**And** the product is not hidden merely because metrics are zero.

**Given** analytics events include product_id
**When** product summaries are calculated
**Then** `product_view` and `cta_click` events are grouped by product
**And** summaries derive from the canonical append-only event ledger.

**Given** seller preview or known bot/crawler events exist
**When** product analytics are calculated
**Then** excluded events are not included in seller-facing totals
**And** exclusion behavior is consistent with the home dashboard.

**Given** I open analytics on mobile
**When** product-level cards or rows render
**Then** product title, views, CTA clicks, and period are readable at 360–430px
**And** the UI avoids dense tables that are hard to scan on a phone.

**Given** a future 30-day period is not part of MVP
**When** period controls are shown
**Then** today and last 7 days are available
**And** 30-day analytics remains out of MVP or clearly marked as future/fast-follow if surfaced internally.

## Epic 5: Conditional Fast Catalog Import

Продавец может импортировать Excel/CSV файл, получить Черновики товаров и быстро довести их до публикации.

### Story 5.1: Import Excel/CSV Products as Drafts

As a seller,
I want to import an Excel or CSV file into product drafts,
So that I can move an existing small catalog into my storefront with minimal manual entry.

**Requirements:** FR9, FR21, AD-6, AD-13, AD-21, UX-DR12, UX-DR13, UX-DR14

**Release Classification:** Should / conditional. Include in first release only if it does not delay the core MVP loop: manual product → public storefront → Telegram CTA → analytics.

**Acceptance Criteria:**

**Given** I am an authenticated seller with a store
**When** I open product import
**Then** I can upload a supported Excel or CSV file
**And** the import flow clearly states that imported products will be created as Drafts only.

**Given** the uploaded file has recognizable product columns
**When** the system parses the file
**Then** it maps columns to product title, price/“по запросу”, description, availability, and optional metadata where possible
**And** I can review or adjust mapping before creating drafts.

**Given** rows are valid enough to import
**When** I confirm import
**Then** the system creates product Drafts with prefilled fields
**And** no product is published automatically.

**Given** some rows contain errors or missing required data
**When** import results are shown
**Then** the interface explains row-level errors
**And** valid rows can still become Drafts if the system can safely separate them.

**Given** imported drafts are created
**When** I open the Products list
**Then** the imported products appear with Draft status
**And** I can edit, add photos, and publish them through the normal product flow.

**Given** I use the import mapper on mobile
**When** I review columns and errors
**Then** the flow uses a mobile-simplified table-like layout
**And** primary actions remain readable and tappable at 360–430px.

**Given** screenshot/link recognition is considered
**When** MVP scope is evaluated
**Then** screenshot/link-based auto-recognition is not part of this story
**And** it remains future functionality outside MVP.
