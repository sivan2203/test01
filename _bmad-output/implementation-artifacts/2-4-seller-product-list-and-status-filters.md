---
baseline_commit: 6e54522b11a98559ce8ce5b2a0996b80cc33de4b
---

# Story 2.4: Seller Product List and Status Filters

Status: done

## Story

Как продавец,
я хочу видеть список своих товаров и фильтровать его по статусу,
чтобы быстро находить товар и продолжать его редактирование.

## Acceptance Criteria

### AC1 — Собственный список товаров

**Given** авторизованный продавец открыл `/seller/products`
**When** список загружается
**Then** в нём отображаются только товары магазина текущего продавца
**And** каждый обычный элемент списка показывает название, обложку при наличии, цену или «по запросу», наличие и lifecycle-статус.

### AC2 — Фильтры по lifecycle-статусу

**Given** у продавца есть товары в разных состояниях
**When** он выбирает фильтр «Все», «Черновики», «Опубликованные», «Скрытые» или «Архив»
**Then** выбранный фильтр передаётся в URL и обрабатывается на сервере
**And** список содержит только соответствующие товары
**And** активное состояние фильтра понятно по тексту/семантическому состоянию, а не только по цвету.

### AC3 — Переход в редактор

**Given** продавец видит draft, published или hidden товар
**When** он нажимает на карточку или действие редактирования
**Then** открывается редактор именно этого товара
**And** переход не позволяет подменить `store_id`, владельца или product ID данными клиента.

**Given** продавец открыл архивный deleted товар
**When** он видит его в фильтре «Архив»
**Then** карточка сообщает, что товар удалён/архивирован
**And** обычный редактор для него не открывается.

### AC4 — Пустые состояния

**Given** у продавца нет товаров
**When** он открывает раздел Products
**Then** отображается короткое понятное объяснение
**And** основное действие ведёт на добавление товара.

**Given** товары есть, но выбранный фильтр не дал результатов
**When** список отрисован
**Then** отображается отдельное понятное состояние «В этом фильтре пока нет товаров»
**And** основной список не маскируется под серверную ошибку.

### AC5 — Mobile-first и доступность

**Given** продавец использует список на viewport 360–430px
**When** он прокручивает список, выбирает фильтры и открывает товар
**Then** контент остаётся одноколоночным и читаемым
**And** основные controls имеют tap target не менее 44×44 CSS px
**And** фильтры, карточки и статусы доступны с клавиатуры и не зависят от hover-only поведения.

## Tasks / Subtasks

- [x] Task 1: Расширить серверный контракт seller product list (AC: #1, #2, #3)
  - [x] Добавить тип безопасного фильтра списка: `all | draft | published | hidden | deleted` и pure parser для неизвестных/пустых query-значений с безопасным fallback.
  - [x] Изменить `getSellerProducts` так, чтобы фильтр применялся в Supabase query на сервере в пределах текущего seller store; `all` показывает non-deleted товары, `deleted` — только архивные товары.
  - [x] Сохранить сортировку по `updated_at desc`, typed result/error boundaries и текущий redirect для unauthenticated/store-not-found.
  - [x] Не принимать от клиента `seller_id`, `store_id` или полный product object; фильтр — единственный пользовательский параметр списка.

- [x] Task 2: Добавить безопасные обложки в seller list (AC: #1, #3, #5)
  - [x] Получать только первую ordered media row (`sort_order = 0`) для товаров текущего продавца батчевым server-side запросом или эквивалентным решением без N+1, если это совместимо с текущими Supabase seams.
  - [x] Преобразовывать `storage_path` в короткоживущий signed URL только после seller ownership/RLS проверки; не отдавать path, byte size или Storage metadata в UI DTO.
  - [x] Для отсутствующей/недоступной обложки использовать нейтральный текстовый placeholder; archived/deleted cards не должны раскрывать приватные media.
  - [x] Не импортировать service-role client и не менять публичные catalog/media boundaries.

- [x] Task 3: Обновить страницу `/seller/products` (AC: #1–#5)
  - [x] Принять Next.js 16 `searchParams` как Promise и нормализовать `status` на сервере; сохранить `dynamic = "force-dynamic"` и auth redirect.
  - [x] Добавить компактную группу фильтров/ссылок с URL state, `aria-current` или эквивалентным семантическим признаком активного фильтра, видимой текстовой подписью и touch-friendly размерами.
  - [x] Отобразить в карточке cover image/placeholder, title, price label, availability и lifecycle label; использовать существующие `GlassPanel`, `buttonVariants`, `cn` и монохромные surface-паттерны.
  - [x] Для draft/published/hidden сохранить переход на `/seller/products/{productId}/edit`; для deleted/архива показать read-only состояние без ссылки на обычный editor.
  - [x] Развести empty state для полностью пустого каталога и empty state для активного фильтра; не добавлять поиск, bulk actions, drag-and-drop или новые UI-зависимости.

- [x] Task 4: Авторизовать поведение тестами и smoke guardrails (AC: #1–#5)
  - [x] Добавить pure coverage для parser фильтра, применяемых status-веток и DTO/placeholder mapping в существующий `scripts/smoke-foundation.mjs` либо в совместимый с репозиторием тестовый seam; не добавлять test dependency без необходимости.
  - [x] Проверить source/build guardrails: seller-only query boundary, no service-role imports, no client-controlled ownership/status/path, private signed cover URLs, archive cards without editor link, and all filter URLs/routes built.
  - [x] Проверить unauthorized seller/product isolation at the query seam where runtime Supabase tests are available; не подменять это клиентской фильтрацией.

## Dev Notes

### Scope and boundaries

- Story реализует только seller product list и status filters. Public storefront/catalog, product detail, Telegram, analytics, import, payments, orders и buyer auth не входят в scope.
- Lifecycle уже определён: `draft`, `published`, `hidden`, `deleted`; `out_of_stock` — availability, а не lifecycle. Published out-of-stock товар остаётся видимым в публичном каталоге.
- Deleted — terminal soft-deleted state. Его можно показать отдельным read-only архивным фильтром, но нельзя возвращать в обычный редактор или выдавать его media. Не реализовывать restore/revive.

### Existing implementation to preserve

- `src/app/(seller)/seller/(admin)/products/page.tsx` уже делает auth redirect, обрабатывает `store_not_found`/`error`, показывает add-product CTA и строит route-bound editor links. Расширять эту страницу, не создавать параллельный route.
- `src/features/product/queries.ts` уже получает текущий store через seller auth и ограничивает rows `store_id`; сохранить `isProductId`, typed result unions, `mapProductRow` и `updated_at` ordering.
- `src/features/product/media-queries.ts` уже ограничивает seller media через authenticated SSR client и создаёт signed URLs. Переиспользовать его seams или вынести batch cover helper в этот vertical slice; не читать `storage.objects` напрямую.
- `src/features/product/schema.ts` содержит `ProductStatus`, availability и `getProductPriceLabel`; не дублировать status/price contract в route UI.
- `src/features/product/lifecycle.ts` содержит canonical status labels; не создавать второй набор lifecycle labels.
- `src/features/product/[...]` editor route intentionally excludes deleted products via `getSellerProductById`; archive card must respect this behavior.

### Architecture guardrails

- Vertical slice остаётся в `src/features/product`; seller route остаётся под `src/app/(seller)/seller/(admin)/products`.
- Seller reads use the SSR/user Supabase client with RLS. Service-role client запрещён в обычном product code, route UI и client components.
- Ownership и lifecycle filtering должны быть применены в repository/query boundary, не только после загрузки в React.
- Schema/RLS/storage changes принадлежат timestamped migration в `supabase/migrations/`. Для этой story миграция не предполагается: существующие `products_select_own` и lifecycle guards должны быть сохранены. Если проверка выявит реальный schema gap, исправление должно быть отдельной migration с rollback note.
- Не редактировать предыдущие migrations и не ослаблять private bucket/signed URL boundary.

### UX requirements

- Seller navigation: Home / Products / Analytics / Store; текущий navigation shell не ломать.
- Фильтры должны быть понятны без цвета: видимый label, active state через `aria-current="page"`/`aria-pressed` или эквивалент, нормальный focus ring.
- Карточка должна быть tappable целиком для editable states, но archive item не должен обещать редактирование.
- 360–430px: one-column layout, no hover-only affordance, controls минимум 44×44 CSS px.
- Empty state: одно короткое объяснение и одно основное действие `Добавить товар`; filtered-empty state не должен выглядеть как server error.
- Использовать существующие calm monochrome/liquid-glass primitives; не добавлять marketplace-like badges, gradients или новую UI library.

### Testing and validation

- В репозитории нет отдельного unit-test runner; обязательная команда — `npm.cmd run check` (lint, Next typegen/typecheck, production build, smoke).
- Smoke harness запускается после build и уже импортирует pure `.ts` helpers в Node 24; расширять его детерминированными проверками, не делая фиктивные network calls.
- Минимум должны быть проверены: `all`, каждый lifecycle filter, unknown status fallback, own-store isolation, archive read-only behavior, cover placeholder, signed URL boundary, mobile/semantic filter markup и отсутствие публичных изменений.
- Existing lint warning `@next/next/no-img-element` в `product-media-manager.tsx` может сохраняться; новые предупреждения не добавлять без необходимости.

### Required local Next.js guidance

- Перед кодом прочитать: `node_modules/next/dist/docs/01-app/02-guides/forms.md`, `server-actions.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` согласно `AGENTS.md`.
- Next.js 16 route props use promises: page `searchParams`/`params` must be awaited before use.
- Для этой read-only filter flow предпочтительны ordinary server-rendered links and query params; Server Action/useActionState не добавлять без mutation requirement.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-2.4-Seller-Product-List-and-Status-Filters`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-8-Product-list-management`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#Product-data-contract`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-12`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Information-Architecture`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- [Source: `_bmad-output/implementation-artifacts/2-3-edit-product-and-manage-publication-state.md#Previous-Story-Intelligence`]
- [Source: `src/app/(seller)/seller/(admin)/products/page.tsx`]
- [Source: `src/features/product/queries.ts`]
- [Source: `src/features/product/media-queries.ts`]
- [Source: `src/features/product/schema.ts`]
- [Source: `src/features/product/lifecycle.ts`]
- [Source: `supabase/migrations/20260801183000_create_products.sql`]
- [Source: `supabase/migrations/20260801200000_create_product_media.sql`]
- [Source: `supabase/migrations/20260801213000_add_product_lifecycle_guards.sql`]
- [Source: `scripts/smoke-foundation.mjs`]
- [Source: `node_modules/next/dist/docs/01-app/02-guides/forms.md`]
- [Source: `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`]
- [Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`]
- [Source: https://nextjs.org/docs/app/guides/forms]
- [Source: https://nextjs.org/docs/app/guides/updating-data]
- [Source: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-segments]
- [Source: https://supabase.com/docs/guides/database/postgres/row-level-security]
- [Source: https://supabase.com/docs/reference/javascript/file-buckets-remove]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Прочитаны полный sprint status, Epic 2/Story 2.4, PRD FR8, architecture spine, UX Experience/Design, completed Story 2.3, текущие product/media seams, migrations, smoke harness, package scripts и Next.js 16 local docs.
- Проверены актуальные официальные рекомендации Next.js Forms/dynamic params и Supabase RLS/Storage boundaries; для Story 2.4 зависимости обновлять не требуется.

### Completion Notes List

- Контекстный story-файл создан для последовательной реализации server-side filtering, private cover media, read-only archive и mobile-first seller UX.
- Ultimate context engine analysis completed — comprehensive developer guide created.
- Добавлен typed `SellerProductListFilter` с безопасным URL parser и server-side status query: `all` исключает deleted, `deleted` показывает только архив.
- Добавлен batch seller cover lookup с `sort_order = 0` и signed URLs; deleted media не раскрывается, отсутствующая обложка получает текстовый placeholder.
- Обновлена seller Products page: URL-фильтры, семантический active state, карточки с cover/title/price/availability/status, read-only archive и раздельные empty states.
- Добавлены smoke checks для фильтров, source/build boundaries, private media и отсутствия service-role/client-controlled ownership paths.
- Проверка `npm.cmd run check` прошла: lint (1 существующее предупреждение `no-img-element` в `product-media-manager.tsx`), typecheck, build и smoke.
- Все 5 patch findings из code review исправлены; deferred findings сохранены в `deferred-work.md`.
- Повторная проверка после review patches: `npm.cmd run check` проходит; остаётся только исходное предупреждение `no-img-element` в `product-media-manager.tsx`.

### File List

- `_bmad-output/implementation-artifacts/2-4-seller-product-list-and-status-filters.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/app/(seller)/seller/(admin)/products/page.tsx`
- `src/features/product/media-queries.ts`
- `src/features/product/product-cover.tsx`
- `src/features/product/product-list.ts`
- `src/features/product/queries.ts`

### Implementation Plan

- Сначала расширить typed query seam и pure filter parser, затем добавить batch signed cover DTO, после этого обновить server-rendered seller page и smoke guardrails.
- Реализовать и проверять каждую задачу по red-green-refactor; не переходить дальше при failing checks.
- Все четыре задачи завершены; production build подтвердил, что `/seller/products` остаётся динамическим seller route и все существующие маршруты собираются.

### Change Log

- 2026-08-01: Создан контекстный story-файл Story 2.4; sprint status переведён из `backlog` в `ready-for-dev`.
- 2026-08-01: Реализованы server-side product status filters, private batch cover lookup, mobile seller list/archive UI и smoke guardrails; Story 2.4 переведена в `review`.
- 2026-08-01: Исправлены 5 code-review findings: batch signed URLs, best-effort cover errors, broken-image fallback и расширенное smoke coverage; Story 2.4 переведена в `done`.

### Review Findings

- [x] [Review][Patch] Batch signed cover URLs instead of sequential Storage requests [src/features/product/media-queries.ts:181-184] — заменено на один `createSignedUrls` batch-запрос с сопоставлением результатов по media row.
- [x] [Review][Patch] Cover lookup failure must not hide a valid product list [src/app/(seller)/seller/(admin)/products/page.tsx:131-147] — media errors теперь дают non-blocking notice и список без обложек; `unauthenticated` редиректит на sign-in, `store_not_found` имеет отдельное recovery state.
- [x] [Review][Patch] Add browser-side fallback for broken or expired cover images [src/features/product/product-cover.tsx:1-35] — новый client component переключается на нейтральный placeholder через `onError`.
- [x] [Review][Patch] Expand smoke coverage beyond source-string checks [scripts/smoke-foundation.mjs:127-142,481-505,772-798] — добавлена pure card-state mapping coverage, product-cover fallback guard и проверки archive/edit/status branches.
- [x] [Review][Patch] Cover repeated-query parser input in smoke tests [scripts/smoke-foundation.mjs:127-138] — добавлены single-array и conflicting-array cases; конфликтующие повторные параметры безопасно сводятся к `all`.
- [x] [Review][Defer] Add bounded pagination for the seller product list [src/features/product/queries.ts:121-135] — список был unbounded до Story 2.4; pagination/limit требует отдельного UX/API решения и не входит в текущий acceptance contract.
- [x] [Review][Defer] Add runtime RLS integration tests for cross-seller product and media isolation [scripts/smoke-foundation.mjs:772-798] — текущий репозиторий не содержит runtime Supabase integration harness/fixtures; source smoke guards остаются проверкой границ до появления такого harness.
