baseline_commit: e746942
---

# Story 3.3: Публичная страница товара

Status: done

## Story

Как покупатель,
я хочу открыть страницу товара с фотографиями, описанием, ценой и CTA для связи,
чтобы понять товар перед обращением к продавцу.

**Requirements:** FR-12, FR-13, FR-16, FR-21, FR-22, NFR-1, AD-5, AD-11, AD-12, AD-16, UX-DR6, UX-DR7, UX-DR17

## Acceptance Criteria

### AC1 — buyer-safe опубликованный товар

**Given** существует опубликованный товар магазина
**When** покупатель открывает /[storeSlug]/products/[productId]
**Then** страница доступна без авторизации покупателя и показывает фотографии, название, цену или «по запросу», описание, статус наличия и CTA связи
**And** данные получены через существующий public query boundary и не содержат store_id, seller_id, storage_path, byte_size или других приватных полей.

### AC2 — стабильный URL и переход из каталога

**Given** покупатель нажимает опубликованную карточку в каталоге
**When** открывается detail page
**Then** маршрут использует текущий storeSlug и неизменяемый UUID productId
**And** изменение названия товара не ломает ссылку
**And** обратная ссылка возвращает на публичную витрину того же магазина.

### AC3 — галерея

**Given** у опубликованного товара несколько фотографий
**When** покупатель листает или переключает галерею
**Then** фотографии можно просматривать свайпом/горизонтальной прокруткой и доступными кнопками предыдущая/следующая
**And** первым показывается медиафайл с минимальным sortOrder/isCover
**And** смена фотографии не меняет товар, цену, наличие или CTA.

### AC4 — доступность галереи

**Given** галерея используется с клавиатурой или assistive technology
**When** фотографии и controls озвучиваются
**Then** каждая фотография имеет label вида «Фото {n} из {total}: {название товара}»
**And** controls имеют понятные labels предыдущей/следующей фотографии и disabled/end state
**And** primary tap targets имеют минимум 44×44 CSS px, видимый focus и не зависят только от цвета.

### AC5 — privacy-safe not-found

**Given** покупатель открывает URL товара с Draft, Hidden, Deleted, неверным UUID или несуществующим товаром
**When** public query boundary разрешает страницу
**Then** показывается публичное состояние not-found с HTTP 404 для непотокового ответа
**And** private product rows и media не отображаются и не попадают в error text, metadata или browser console.

### AC6 — mobile-first CTA и product hierarchy

**Given** страница открыта на viewport 360–430px
**When** первый экран отрисован
**Then** фотография, название, цена и статус имеют ясный визуальный приоритет
**And** CTA виден в первом viewport либо доступен в sticky/near-detail зоне
**And** CTA использует существующий contact seam с storeSlug/productId, но эта story не утверждает отправку сообщения, успешный handoff или завершённую покупку.

### AC7 — состояния и регрессии

**Given** публичная витрина, preview и detail route используют общие buyer-safe boundaries
**When** detail page загружает пустые/отсутствующие media, store error или preview context
**Then** отсутствие одной фотографии показывает безопасный fallback и не раскрывает storage path
**And** error/not-found остаются различимыми
**And** существующие Story 3.1/3.2 storefront, catalog, empty state и seller preview не регрессируют.

## Tasks / Subtasks

- [x] Task 1: Создать публичный dynamic route (AC: #1, #2, #5, #7)
  - [x] Добавить src/app/(public)/[storeSlug]/products/[productId]/page.tsx как async Server Component.
  - [x] Использовать params: Promise<{ storeSlug: string; productId: string }> и await params по локальной версии Next.js 16.
  - [x] Сохранить dynamic = "force-dynamic": visibility и signed URL TTL request-sensitive.
  - [x] Вызвать getPublicProductForStore(storeSlug, productId); not_found передать в notFound(), error превратить в контролируемую ошибку родительского public error boundary.
  - [x] Не читать product/store напрямую из browser component и не импортировать seller queries, service-role client или admin UI.

- [x] Task 2: Реализовать buyer-safe detail composition (AC: #1, #2, #6, #7)
  - [x] Добавить feature-local detail component в src/features/product/ или расширить существующий public feature seam, сохранив вертикальное разделение route/features/components.
  - [x] Переиспользовать PublicProduct, getProductPriceLabel, ProductMedia, PublicStorefrontImage, Button и design-system GlassPanel; не копировать price, lifecycle или media DTO mapping.
  - [x] Показать title, canonical price label, availability (В наличии/Нет в наличии), description и contact CTA.
  - [x] CTA оставить честным до Story 3.4/3.5: disabled/unavailable state, если Telegram ещё не настроен; передать data-contact-store-slug и data-contact-product-id для следующего contact/analytics seam.
  - [x] Добавить ссылку обратно на /[storeSlug] через next/link; обычную навигацию не реализовывать через useRouter.

- [x] Task 3: Реализовать gallery без новой зависимости (AC: #3, #4, #7)
  - [x] Использовать существующий ProductMedia order: cover/первый sortOrder — начальный кадр.
  - [x] Разрешить touch swipe/горизонтальную прокрутку и явные accessible previous/next controls; не делать hover-only interaction.
  - [x] Для каждого media использовать signed url только из PublicProduct.media; raw storage path в client props не передавать.
  - [x] Использовать PublicStorefrontImage или эквивалентный существующий fallback; ошибка одной картинки не должна раскрывать private data или ломать весь detail layout.
  - [x] Вынести только состояние активного media/кнопок в минимальный Client Component; page/data loading должны остаться server-side.

- [x] Task 4: Сохранить mobile/accessibility/visual contract (AC: #4, #6, #7)
  - [x] Проектировать mobile-first для 360–430px, с базовыми полями около 16px и readable wrapping длинных title/price/description.
  - [x] Обеспечить минимум 44×44 CSS px для CTA/gallery controls, keyboard focus и семантические labels.
  - [x] Использовать monochrome/liquid-glass язык проекта; Telegram blue допустим только для destination clarity, без marketplace-like ленты.
  - [x] Не добавлять buyer navigation, auth prompt, chat, cart, order, review, search или infinite feed.

- [x] Task 5: Добавить source/build smoke guardrails (AC: #1–#7)
  - [x] Расширить scripts/smoke-foundation.mjs проверками detail route, getPublicProductForStore, notFound(), stable UUID URL, public media boundary, accessibility labels и отсутствия service-role/seller imports.
  - [x] Проверить, что draft/hidden/deleted не фильтруются только в UI и что detail query остаётся published-only.
  - [x] Запустить npm.cmd run check: lint, next typegen, typecheck, production build и smoke.
  - [x] Не выдавать source-level smoke за runtime Supabase/RLS integration tests; отсутствие integration harness остаётся известным ограничением репозитория.

## Dev Notes

### Scope and boundaries

Эта story добавляет только публичную страницу detail для уже опубликованного товара, доступную из карточки каталога и по прямому stable URL. Telegram configuration относится к Story 3.4, глубокая ссылка/prefilled message/fallback copy — к Story 3.5, а product-view/CTA analytics ingestion — к Epic 4.

Не создавать новую миграцию, новый UI framework, product slug identity, buyer auth, Telegram service, analytics API, cart/order/review flow или отдельный public route namespace, если текущие контракты не требуют этого.

### Existing contracts to reuse

- src/features/store/public-catalog.ts уже является server-only boundary и экспортирует PublicProduct, PublicProductResult, getPublicProductForStore.
- getPublicProductForStore вызывает get_public_product_for_store(store_slug, target_product_id), который возвращает только status = 'published', затем добавляет signed media через getPublishedProductMediaForCatalog.
- src/features/store/public-catalog-view.tsx уже формирует canonical detail href через getPublicProductDetailHref(storeSlug, productId). Detail route обязан совпадать с /[storeSlug]/products/[productId] и не заменять UUID title-slug.
- src/features/store/public-storefront-image.tsx — существующий client fallback для signed URL; не дублировать его без необходимости.
- src/features/product/schema.ts#getProductPriceLabel — единственный источник формата цены (₽ или «по запросу»).
- src/features/product/media-schema.ts и src/features/product/media-queries.ts определяют ProductMedia, cover/order и private product-media signed URL boundary.
- src/components/ui/button.tsx уже задаёт min-h-11 min-w-11, focus ring и variants; использовать его вместо собственного button primitive.
- Родительские src/app/(public)/[storeSlug]/not-found.tsx и error.tsx являются public-safe boundaries и должны обслуживать nested detail route без seller/admin navigation.

### Architecture guardrails

- AD-2/AD-9: public buyer route не требует auth и не импортирует seller/admin surface.
- AD-5: product visibility определяется только lifecycle state на repository/RPC boundary. Draft, hidden и deleted не должны быть доступны прямым URL, preview, media или CTA context.
- AD-11: public URL содержит immutable product UUID; декоративный title slug не является identity. Старые/изменённые store slugs не редиректятся в MVP.
- AD-12: product owns ordered media references; первый ordered item — cover.
- AD-15/AD-16: browser/client получает только buyer-safe signed URLs; service-role остаётся в изолированном server-only maintenance code, unsigned private media URLs запрещены.
- AD-20: valid store route с нулём published products остаётся HTTP 200 empty state; это не означает, что draft/hidden product detail доступен.
- AD-4/AD-8: CTA/event ordering и source propagation реализуются последующими contact/analytics seams; не заявлять, что этот экран отправил сообщение или зафиксировал completed deal.

### Data and failure behavior

1. Route получает и нормализует storeSlug/productId через getPublicProductForStore.
2. not_found покрывает invalid UUID, неизвестный store, mismatch store/product и любой непубличный lifecycle state; вызвать notFound() без детализации причины.
3. error остаётся контролируемой server error; не рендерить частичный private row и не логировать полный error object в browser.
4. Media rows уже фильтруются published-only RPC и получают signed URLs server-side. Если signed URL отсутствует, показать fallback; не передавать storage_path, byte_size или seller ownership fields в React props.
5. Не добавлять use cache, static generation или ISR без отдельного решения об invalidation lifecycle и signed URL TTL; текущий force-dynamic намеренный.

### UX and content contract

- Product-first composition: gallery → title/price/availability → full description → CTA, с back-to-store link без app-like buyer nav.
- Описание может быть пустым согласно product contract; не показывать пустой label. Если текст сворачивается, обязателен явный control раскрытия, но базовая реализация должна показывать description полностью.
- Для gallery alt/accessible label использовать контекст «Фото {n} из {total}: {product title}». Controls должны озвучивать previous/next и disabled/end state.
- CTA должен быть destination-explicit («Связаться в Telegram») после настройки Telegram; до Story 3.4 допустим честный disabled state «Контакт продавца пока не настроен». Не использовать текст «заказать», «купить» или «сообщение отправлено».
- При out_of_stock товар остаётся видимым, статус показывается, а CTA не должен автоматически исчезать: продавец может обсудить сроки/альтернативы.
- Цвет не является единственным сигналом; focus, labels, state text и borders должны оставаться понятными при reduced motion/прозрачности.

### File structure

Ожидаемые изменения:

    src/app/(public)/[storeSlug]/products/[productId]/page.tsx  # NEW
    src/features/product/public-product-detail.tsx              # NEW, если нужен server composition
    src/features/product/public-product-gallery.tsx             # NEW minimal client state, если нужен
    src/features/store/public-catalog.ts                        # UPDATE только при конкретном contract gap
    src/features/store/public-storefront-image.tsx              # UPDATE только для общего fallback regression
    scripts/smoke-foundation.mjs                                # UPDATE

Не создавать второй /store/[slug], modal вместо stable route, client-side data fetching для product, дублирующий PublicProduct DTO или прямой Supabase call из Client Component.

### Next.js 16 and browser API requirements

- Local AGENTS.md требует читать version-specific docs под node_modules/next/dist/docs/ перед кодом; для этой story использованы dynamic routes, linking, server/client components и not-found docs.
- Dynamic route params являются Promise: const { storeSlug, productId } = await params.
- Pages/layouts/server data loading остаются Server Components по умолчанию; use client нужен только для gallery active state, swipe/buttons и browser-only behavior.
- next/link используется для catalog/detail/back links. useRouter не нужен для обычного перехода.
- notFound() завершает route rendering и использует ближайший not-found.tsx; не ловить этот sentinel как обычную ошибку.
- Если будет добавлена dynamic metadata, она должна экспортироваться из Server Component через generateMetadata, повторно использовать product query осторожно и не обходить visibility boundary. Metadata не является обязательной частью этой story.
- Не переходить на next/image для signed remote URLs без проверки next.config.ts/remotePatterns: текущий PublicStorefrontImage специально работает с raw signed URL и fallback.

### Previous story intelligence

Story 3.2 (e746942, feat: complete buyer catalog list grid story) установила следующие обязательные паттерны:

- каталог использует buyer-safe PublicCatalogItem из public query, а не raw Supabase rows;
- карточка уже передаёт stable storeSlug/productId и ведёт через next/link на detail URL;
- cover выбирается из isCover с fallback на первый media item;
- цена форматируется только через getProductPriceLabel;
- PublicStorefrontImage нужен для signed URL failure и placeholder/fallback;
- catalog view toggle — маленький Client Component, но route/store/catalog data остаются server-side;
- Button обеспечивает 44px target и focus semantics;
- smoke/source checks полезны для границ, но не заменяют runtime Supabase/RLS tests;
- existing lint warning в src/features/product/product-media-manager.tsx допускается только если остаётся тем же pre-existing warning.

Story 3.1 и deferred work также фиксируют: private product-media bucket, batch signing, отсутствие seller preview analytics, различие empty/not-found/error и отсутствие atomic snapshot/runtime integration harness. Не расширять эту story на уже отложенные проблемы.

### Library and version constraints

- Node.js >=24 <25
- Next.js 16.2.12, React/React DOM 19.2.4
- Tailwind CSS 4.x
- @supabase/ssr ^0.12.4, @supabase/supabase-js ^2.111.0
- No dependency upgrade unless a verified build issue requires it.

### Testing checklist

- npm.cmd run check passes.
- Valid published UUID renders product detail without buyer auth.
- Invalid UUID, nonexistent product, old/invalid store slug, draft, hidden and deleted product all reach public not-found without private leakage.
- Product query remains published-only and does not expose raw storage/ownership fields.
- First ordered media is initial; multiple media can be swiped/changed; missing/broken media shows fallback.
- Gallery labels include position and product title; previous/next controls are keyboard reachable, have disabled/end state and 44px targets.
- Full title/description, price/request label and availability render without horizontal overflow at 360–430px.
- CTA has honest configured/unconfigured semantics and preserves store/product context without claiming handoff success.
- Existing /[storeSlug], catalog grid/list, empty state and seller preview remain intact.
- Smoke checks cover route and public boundary; runtime RLS/storage behavior remains a deferred integration-test investment.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3-Public-Product-Detail-Page]
- [Source: _bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-12-Product-detail-page]
- [Source: _bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-13-Empty-and-unavailable-states]
- [Source: _bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#Cross-cutting-NFRs]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-11]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-12]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Layout--Spacing]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Components]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns]
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor]
- [Source: _bmad-output/implementation-artifacts/3-2-buyer-catalog-list-grid-view.md#Dev-Notes]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md]
- [Source: AGENTS.md]
- [Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md]
- [Source: node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md]
- [Source: node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md]
- [Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md]
- [External: https://nextjs.org/docs/app/getting-started/layouts-and-pages]
- [External: https://nextjs.org/docs/app/api-reference/functions/not-found]
- [External: https://nextjs.org/docs/app/api-reference/functions/generate-metadata]

### Project Structure Notes

- Public route belongs under src/app/(public)/[storeSlug]/products/[productId]; this matches the architecture structural seed and keeps buyer/admin surfaces separate.
- Public domain/query code belongs in src/features/store and src/features/product; shared visual primitives remain under src/components.
- No project-context.md exists; repository-specific rules are from AGENTS.md, package scripts, current code and referenced BMad artifacts.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Implementation Plan

- Добавить request-time public product route, который использует существующий published-only getPublicProductForStore и notFound/error boundaries.
- Собрать buyer-safe detail surface вокруг существующих PublicProduct, canonical price helper, signed media DTO, design-system panel и 44px Button.
- Вынести gallery interaction в минимальный Client Component с ordered media, swipe/tap navigation, fallback image и accessible labels.
- Добавить контактный CTA seam с store/product context без Telegram handoff или analytics ingestion до следующих stories.
- Усилить source/build smoke checks и завершить npm.cmd run check.

### Debug Log References

- Workflow customization resolved with python; python3 and uv are unavailable in this environment.
- Read full sprint-status.yaml; first backlog story selected as 3-3-public-product-detail-page.
- Analyzed Epic 3, Story 3.2, PRD FR-12/FR-13/NFRs, architecture AD-5/AD-11/AD-12/AD-15/AD-16/AD-20, UX detail/gallery/accessibility guidance, current public query/media/UI boundaries, git history and local Next.js 16 docs.
- Verified current baseline commit is e746942; no existing Story 3.3 implementation file was present before this document.
- Added red smoke assertions first; npm.cmd run smoke failed on the intentionally missing detail route.
- Implemented the route, detail composition, gallery, contact CTA seam and smoke guardrails; no new dependency or migration was required.

### Completion Notes List

- Implemented public product detail at /[storeSlug]/products/[productId] as a force-dynamic Server Component route.
- Reused getPublicProductForStore, PublicProduct, canonical price formatting, private signed media DTOs and parent public not-found/error boundaries.
- Added mobile-first product detail composition with full description, availability, stable back link, sticky contact CTA and buyer-safe context attributes.
- Added gallery with ordered cover selection, touch swipe, previous/next controls, thumbnail selection, 44px targets, accessible position labels and signed-image fallback.
- Added shared public contact CTA component for the detail surface; Telegram configuration, external handoff and analytics remain outside this story.
- Verification passed: npm.cmd run check (lint, Next typegen/typecheck, production build and smoke). Lint retains the pre-existing no-img-element warning in product-media-manager.tsx; Node retains the existing module-type warning during smoke.

### File List

- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/3-3-public-product-detail-page.md
- scripts/smoke-foundation.mjs
- src/app/(public)/[storeSlug]/products/[productId]/page.tsx
- src/features/store/public-contact-cta.tsx
- src/features/store/public-product-detail.tsx
- src/features/store/public-product-gallery.tsx

### Change Log

- 2026-08-01: Created comprehensive implementation story for the public product detail page.
- 2026-08-02: Implemented Story 3.3, added public detail route/gallery/contact seam and smoke guardrails; verified with npm.cmd run check and marked story review.

### Review Findings

- [x] [Review][Patch] [High] Gallery can crash after navigating from a product with more media to one with fewer media — `src/features/store/public-product-gallery.tsx:22,38,72`. `activeIndex` persists while `media` changes, so `activeMedia` can become undefined before `activeMedia.url` is read; fixed by clamping the render index.
- [x] [Review][Patch] [Medium] Signed-URL failures remove media slots instead of rendering their fallback — `src/app/(public)/[storeSlug]/products/[productId]/page.tsx:14`, `src/features/product/media-queries.ts:250-255`. The public media boundary now preserves ordered failed slots with an empty URL so the existing fallback renders.
- [x] [Review][Patch] [Low] Thumbnail container uses `role="list"` without `listitem` descendants — `src/features/store/public-product-gallery.tsx:101-105`. Fixed by using a grouping role for the direct button children.
- [x] [Review][Patch] [Low] Gallery swipe detection ignores vertical movement and lacks `touchcancel` cleanup — `src/features/store/public-product-gallery.tsx:23,44-57`. Fixed by comparing horizontal and vertical deltas and clearing both touch coordinates on cancellation.
- [x] [Review][Defer] Configured contact CTA handoff and destination-specific accessible labeling — `src/features/store/public-contact-cta.tsx:18-30` — deferred, pre-existing scope boundary for Stories 3.4/3.5; the current story intentionally leaves Telegram handoff unimplemented and renders the unconfigured CTA disabled.
- [x] [Review][Defer] Runtime/browser coverage for route, not-found/error, and signed-media failure paths — `scripts/smoke-foundation.mjs:748-781` — deferred, pre-existing repository limitation; the project has source-level smoke checks but no runtime Supabase/integration harness.
- [x] [Review][Defer] Consolidation of the catalog-local contact CTA with the new shared CTA — `src/features/store/public-catalog-view.tsx:54-83` — deferred, pre-existing duplicate outside Story 3.3’s detail-page scope; address during the Telegram contact-loop work.
