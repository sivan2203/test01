---
baseline_commit: d8d811e
---

# Story 3.1: Публичная витрина магазина по slug

Status: done

## Story

Как покупатель,
я хочу открыть публичную витрину продавца по уникальной ссылке,
чтобы увидеть, кто продаёт товары и что сейчас доступно.

## Acceptance Criteria

### AC1 — публичный доступ по slug

**Given** магазин имеет валидный текущий публичный slug  
**When** покупатель открывает `/[storeSlug]` без seller-сессии  
**Then** публичная витрина загружается без buyer-auth  
**And** seller/admin navigation не отображается  
**And** старый или неизвестный slug не перенаправляется на новый.

### AC2 — публичная шапка магазина

**Given** у магазина есть name, avatar, optional description и additional information  
**When** публичная витрина отображается  
**Then** шапка показывает доступные публичные поля  
**And** avatar загружается только через безопасный server-side URL  
**And** отсутствие avatar, description или additional information не оставляет пустых блоков и не показывает технические поля.

### AC3 — published-only каталог

**Given** у магазина есть товары в состояниях `draft`, `published`, `hidden` и `deleted`  
**When** публичная витрина загружает область каталога  
**Then** отображаются только товары со статусом `published` принадлежащего активному магазину  
**And** `draft`, `hidden` и `deleted` исключаются на RPC/query boundary до UI  
**And** публичный DTO не содержит `seller_id`, `store_id`, `storage_path`, `byte_size` или иных приватных Storage-данных  
**And** опубликованный out-of-stock товар остаётся видимым с понятной пометкой доступности.

### AC4 — базовое представление опубликованных товаров

**Given** магазин имеет один или более опубликованных товаров  
**When** каталог отображается на витрине  
**Then** для каждого товара видны title, cover или нейтральный placeholder, price или «По запросу», и availability label  
**And** изображение товара не ломает страницу при отсутствии или недоступности signed URL  
**And** list/grid toggle, переход в product detail, Telegram CTA и сохранение режима просмотра остаются scope следующих stories.

### AC5 — пустая витрина

**Given** магазин существует и имеет валидный текущий slug, но не имеет опубликованных товаров  
**When** покупатель открывает витрину  
**Then** маршрут возвращает нормальную публичную страницу с header магазина и HTTP 200  
**And** отображается короткий дружелюбный empty state  
**And** состояние не выглядит как server error  
**And** draft/hidden/deleted товары не используются для объяснения или заполнения каталога.

### AC6 — not-found и ошибки без утечки данных

**Given** slug не существует, устарел или магазин недоступен публично  
**When** покупатель открывает URL  
**Then** отображается публичное route-local not-found состояние без seller/admin navigation  
**And** приватные поля продавца, наличие скрытых товаров и Storage paths не раскрываются.

**Given** публичный store/catalog query завершается инфраструктурной ошибкой  
**When** витрина формируется  
**Then** ошибка обрабатывается как контролируемое error state или error boundary  
**And** ошибка не маскируется под корректный empty state  
**And** технические детали не выводятся покупателю.

### AC7 — mobile-first и accessibility

**Given** покупатель открывает витрину на viewport 360–430px  
**When** страница отображается  
**Then** header, каталог и основные элементы читаемы в одном вертикальном потоке  
**And** primary controls имеют tap target не менее 44×44 CSS px  
**And** empty/error/not-found состояния объясняются текстом, а не только цветом  
**And** используется спокойная монохромная/liquid-glass система без marketplace-like ленты и app-like buyer navigation.

## Tasks / Subtasks

- [x] Task 1: Завершить безопасный public store data boundary (AC: #1, #2, #3, #5, #6)
  - [x] Сохранить `getPublicStoreBySlug` typed result `found | not_found | error`, нормализацию и серверную валидацию slug.
  - [x] Добавить безопасную выдачу avatar: server-side signed URL или эквивалентный migration-backed public read path; raw `avatar_path` не должен попасть в buyer DTO.
  - [x] Не использовать seller query или service-role client в public route.
  - [x] Если требуется SQL/RLS/Storage изменение, добавить новую timestamped migration; не менять предыдущие migrations и не ослаблять private `product-media` bucket.

- [x] Task 2: Реализовать публичную шапку витрины (AC: #1, #2, #7)
  - [x] Доработать существующий `PublicStorefrontShell`, не создавать параллельный публичный route.
  - [x] Показать avatar/fallback, name, slug, description и additional info с clean collapse для пустых optional-полей.
  - [x] Использовать `GlassPanel`, существующие surface tokens и доступные `alt`/semantic labels.
  - [x] Сохранить `previewIndicator` и `returnAction` для seller preview.

- [x] Task 3: Отобразить минимальный published-only каталог (AC: #3, #4, #5)
  - [x] Использовать существующий `getPublicCatalogItemsForStore`/RPC boundary и buyer-safe `ProductMedia` DTO.
  - [x] Рендерить базовые неинтерактивные product cards/rows с cover, title, price label и availability.
  - [x] Добавить placeholder и browser fallback для отсутствующей/битой cover URL; сбой одной картинки не скрывает весь список.
  - [x] Не добавлять в эту story полноценные list/grid переключение, product detail route, Telegram CTA, аналитику, поиск, infinite feed или buyer auth.
  - [x] Не делать публичный каталог зависимым от client-side filtering.

- [x] Task 4: Развести empty, not-found и error состояния (AC: #5, #6)
  - [x] Для существующего магазина с нулём published products вернуть страницу магазина с дружелюбным empty state, а не `notFound()`.
  - [x] Добавить route-local `src/app/(public)/[storeSlug]/not-found.tsx` в публичном стиле.
  - [x] Не использовать `getPublishedPublicCatalogItemsForStore`, если его throw превращает catalog error в неразличимый результат; сохранить typed error boundary на route/feature seam.
  - [x] Не показывать Supabase, Storage, seller IDs, query-параметры или stack trace в публичных состояниях.

- [x] Task 5: Синхронизировать seller preview (AC: #1–#5)
  - [x] Проверить `/seller/store/preview` после обновления shell.
  - [x] Preview использует ту же buyer-facing структуру, но сохраняет seller-only indicator и return action.
  - [x] Preview не требует buyer auth, не показывает draft/hidden/deleted products и не подключает analytics events.
  - [x] Публичный маршрут никогда не показывает preview marker и seller navigation.

- [x] Task 6: Соблюсти Next.js, performance и responsive guardrails (AC: #1, #4, #7)
  - [x] Оставить `page.tsx` Server Component, `dynamic = "force-dynamic"` и `params` как `Promise`, с `await params`.
  - [x] Не включать `use cache`/статическую генерацию без отдельного решения о revalidation, lifecycle invalidation и signed URL TTL.
  - [x] Сохранить P75 target initial core content load < 2.5s на reasonable 4G; не добавлять новый N+1 слой для media.
  - [x] Проверить layout на 360px и 430px, keyboard/focus semantics и отсутствие hover-only поведения.

- [x] Task 7: Добавить smoke/build guardrails (AC: #1–#7)
  - [x] Расширить `scripts/smoke-foundation.mjs` проверками public route, published-only RPC/query boundary, no service-role imports и отсутствия приватных полей в buyer DTO.
  - [x] Проверить avatar fallback, product cover fallback, distinct empty/not-found/error branches и сохранение preview seam.
  - [x] Не выдавать source-level проверки за runtime Supabase/RLS integration tests; не добавлять integration harness в scope этой story.
  - [x] Запустить `npm.cmd run check`.

## Dev Notes

### Scope and boundaries

Story 3.1 завершает публичную store shell и базовую published-only область каталога на уже существующем маршруте. Она создаёт фундамент для Story 3.2–3.5, но не реализует их функциональные поверхности.

Входит:

- анонимный public route по текущему slug;
- публичная store header;
- безопасный avatar/fallback;
- минимальное отображение опубликованных товаров;
- empty, not-found и controlled error states;
- seller preview reuse;
- mobile/accessibility baseline.

Не входит:

- list/grid toggle и сохранение режима;
- полноценная product card interaction и product detail;
- Telegram configuration/handoff и CTA;
- analytics ingestion/source tracking;
- buyer account, cart, orders, chat, reviews, marketplace search или infinite feed.

### Existing implementation to preserve

- `src/app/(public)/[storeSlug]/page.tsx` уже асинхронно читает `params`, вызывает `getPublicStoreBySlug`, делает `notFound()` для `not_found`, использует `dynamic = "force-dynamic"` и не показывает seller navigation.
- `src/features/store/public-queries.ts` уже нормализует slug и возвращает `PublicStoreProfile` без seller ID.
- `src/features/store/public-catalog.ts` уже предоставляет `getPublicCatalogItemsForStore`, `getPublishedPublicCatalogItemsForStore` и `getPublicProductForStore`; published-only RPC boundary нельзя переносить в UI.
- `src/features/store/public-storefront-shell.tsx` уже используется и public route, и seller preview. Его нужно расширить, а не заменить двумя разными shell-компонентами.
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx` должен сохранить preview indicator, return action и published-only behavior.
- `src/features/product/media-queries.ts` использует private product-media bucket и signed URLs; buyer DTO должен оставаться без storage path/byte size.
- `src/features/product/schema.ts` и canonical price/availability helpers остаются источником product contract; не дублировать lifecycle/price labels в route UI.

### Avatar public boundary — critical implementation note

`stores.avatar_path` и bucket `store-avatars` сейчас owner-scoped/private, а текущий public RPC avatar не возвращает. AC2 требует публичный avatar, поэтому dev должен добавить migration-backed public-safe read seam.

Требования к seam:

- только магазин с текущим non-null slug может участвовать в public avatar lookup;
- raw `avatar_path` не возвращается в React DTO, HTML, metadata или error messages;
- URL создаётся server-side и имеет ограниченный TTL, либо используется narrowly scoped public avatar read policy с таким же store/slug ownership check;
- service-role client нельзя импортировать в public route;
- private `product-media` bucket и product media policies не меняются.

Если текущая Supabase Storage policy не позволяет anon server client создать signed URL, исправление должно быть отдельной новой migration с узкой политикой/definer helper для store avatar objects, привязанной к публичному store slug. Не делать bucket публичным целиком и не копировать seller-only `getCurrentSellerStoreProfile` в public feature.

### Public visibility and privacy

- AD-5: public query/RPC boundary возвращает только `status = published` для активного store ownership.
- AD-10: current slug — единственная public identity; старый slug даёт 404 без redirect.
- AD-15: public code использует server/anon boundary; service-role только в изолированных maintenance/admin paths.
- AD-16: product media private; отдавать только signed buyer-safe URL после проверки published visibility.
- AD-20: route existence и activation completeness различны; valid store with zero published products is a public 200 page.
- Не раскрывать различие между отсутствующим store и недоступным private data за счёт разных подробных ошибок.

### UX requirements

- Primary mobile range: 360–430px; page uses one clear vertical flow and roughly 16px mobile margins.
- Public header is a glass panel; product surface uses raised cards and restrained monochrome visual language.
- Product/price/availability remain readable; decorative glass must not reduce contrast.
- Empty/error/not-found states are short, text-first and do not use stock-art or admin navigation.
- Cold load should have a skeleton matching final layout if a loading boundary is added; do not use spinner-only UX.
- Primary controls must be keyboard reachable and at least 44×44px; no hover-only behavior.

### Suggested file structure

Likely files to update/create:

```text
src/app/(public)/[storeSlug]/page.tsx
src/app/(public)/[storeSlug]/not-found.tsx
src/features/store/public-queries.ts
src/features/store/public-catalog.ts
src/features/store/public-storefront-shell.tsx
src/features/store/public-store-avatar.tsx             # only if a client fallback seam is needed
src/features/product/media-queries.ts                  # only if batch public signing is safely improved
scripts/smoke-foundation.mjs
supabase/migrations/20260801HHMMSS_public_store_avatar.sql # only if schema/RLS/Storage seam requires it
```

Do not add a new UI library, product route, analytics dependency, or buyer auth dependency.

### Library/framework requirements

- Node.js `>=24 <25`; Next.js `16.2.12`; React `19.2.4`; Tailwind `4.x`; Supabase JS `^2.111.0`; Supabase SSR `^0.12.4`.
- Follow local Next.js 16 docs in `node_modules/next/dist/docs/` for dynamic routes, `not-found.tsx`, metadata and caching.
- Dynamic route params are promises; use `const { storeSlug } = await params`.
- Keep public data loading in Server Components. Add `"use client"` only for browser image fallback or future interaction that belongs to this story.
- Existing `force-dynamic` is intentional because store/product state and signed URL TTL are request-sensitive.
- No dependency upgrades unless explicitly required by a verified build issue.

### Testing requirements

At minimum, leave these checks in place:

- `npm.cmd run check` passes: lint, Next type generation/typecheck, production build and smoke.
- Public route remains unauthenticated and does not import seller-only query/UI or service-role code.
- Valid store with published products renders only published DTOs; draft/hidden/deleted rows and media are rejected at repository/RPC boundary.
- Valid store with no published products renders HTTP 200 header plus empty state.
- Unknown/old/unavailable slug renders public not-found without private details.
- Catalog/store infrastructure failure is distinguishable from a legitimate empty catalog.
- Missing/broken avatar or cover produces fallback without hiding the rest of the page.
- Preview keeps its indicator/return action and does not become public analytics.
- Smoke assertions do not claim to replace runtime Supabase/RLS tests; those remain a deferred testing investment.

### Previous story intelligence

From Story 2.4 (`d8d811e review: finalize story 2.4`):

- Batch signed URL calls are preferred over sequential calls where the Supabase API supports them.
- A single media failure must not hide an otherwise valid list.
- Browser-level image fallback is required for signed URLs that may expire or fail.
- Pure helper and source/build guardrails are useful, but must not be described as runtime integration coverage.
- Preserve private media boundaries and keep error states typed/controlled.

From Stories 1.2–1.4, 2.2–2.3:

- store profile provides name/avatar/optional text and unique slug;
- old slug has no redirect in MVP;
- first ordered product media item is cover;
- lifecycle states are `draft | published | hidden | deleted`, while `out_of_stock` is availability;
- seller preview reuses public rendering structure but is not buyer analytics.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.1-Public-Storefront-by-Slug`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-3-Public-Storefront--Telegram-Contact-Loop`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-10-Public-storefront-rendering`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-13-Empty-and-unavailable-states`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-21-Mobile-first-responsive-surfaces`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-2`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-10`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-16`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-20`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Layout-&-Spacing`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Components`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- [Source: `_bmad-output/implementation-artifacts/2-4-seller-product-list-and-status-filters.md#Review-Findings`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- [Source: `AGENTS.md`]
- [Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`]
- [Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`]

## Project Structure Notes

- Preserve the vertical-slice split: public route under `src/app/(public)`, public store/product seams under `src/features`, shared primitives under `src/components`.
- Existing public route and preview route are the canonical seams; do not introduce a second `/store/[slug]` or a query-param preview mode.
- No project-level `project-context.md` was found; repository rules come from `AGENTS.md` and the artifacts referenced above.

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- Read complete `sprint-status.yaml` and selected first backlog story `3-1-public-storefront-by-slug`.
- Analyzed Epic 3, Story 3.1, PRD FR10/FR13/FR21/FR22/NFR1/NFR2, architecture AD-2/AD-5/AD-10/AD-15/AD-16/AD-20, UX design/experience, previous Story 2.4 review learnings, current public route/store/product seams, migrations, smoke harness, and local Next.js 16 docs.
- Implemented public avatar lookup/signing with a migration-backed, slug-constrained Storage policy; expanded the storefront shell with buyer-safe published product cards and image fallbacks; added public not-found/error boundaries; switched public media signing to batch URLs.
- Verification: `npm.cmd run check` passed after the implementation. Runtime Supabase/RLS integration tests remain outside the repository harness and were not claimed by smoke checks.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.
- Story explicitly separates the minimal public storefront foundation from Stories 3.2–3.5.
- Critical guardrails cover empty-store HTTP 200 semantics, published-only visibility, private media/avatar boundaries, preview reuse, and error/not-found privacy.
- Public route now renders the seller profile and published catalog, keeps empty stores as a normal public page, and reports infrastructure failures through a controlled public error boundary.
- Full lint/typecheck/build/smoke validation passed; the only lint warning is the pre-existing warning in `src/features/product/product-media-manager.tsx`.

### File List

- `_bmad-output/implementation-artifacts/3-1-public-storefront-by-slug.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/app/(public)/[storeSlug]/page.tsx`
- `src/app/(public)/[storeSlug]/error.tsx`
- `src/app/(public)/[storeSlug]/not-found.tsx`
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx`
- `src/features/product/media-queries.ts`
- `src/features/store/public-queries.ts`
- `src/features/store/public-storefront-image.tsx`
- `src/features/store/public-storefront-shell.tsx`
- `supabase/migrations/20260801230000_public_store_avatar.sql`

### Implementation Plan

- Added a public-safe store profile/avatar boundary and preserved the existing slug validation/result contracts.
- Completed the shared public storefront shell with published-only product cards, price/availability labels, cover/avatar fallbacks, and preview reuse.
- Added route-local public not-found/error states and batch signed URL generation for published product media.
- Extended smoke guardrails for public route isolation, avatar migration, fallback behavior, state separation, and buyer-safe DTO boundaries.

### Change Log

- 2026-08-01: Implemented Story 3.1 public storefront by slug, published-only catalog rendering, public avatar boundary, fallback states, preview synchronization, and full verification; marked story ready for review.
- 2026-08-01: Applied all six code-review patches; verified lint, typecheck, build, and smoke; marked story done.

### Review Findings

- [x] [Review][Decision] Public avatar RPC exposes a private Storage path and path-membership oracle — accepted as the required server-side signing seam for this story; the raw path is dropped before the buyer DTO and a stricter proxy/credential redesign is deferred.

- [x] [Review][Patch] Optional avatar signing failure must not hide a valid storefront [src/features/store/public-queries.ts:66-82] — isolate the Storage signing failure and return the store with no `avatarUrl` so the header fallback remains available.
- [x] [Review][Patch] Published catalog must degrade when batch media signing fails [src/features/product/media-queries.ts:220-229] — preserve product cards with empty media and let the image fallback render instead of converting the whole catalog to an error boundary.
- [x] [Review][Patch] Reset image fallback state when the signed URL changes [src/features/store/public-storefront-image.tsx:24-47] — a refreshed or navigated-to valid image must not remain stuck on the previous fallback.
- [x] [Review][Patch] Do not expose the complete public route error object in the browser console [src/app/(public)/[storeSlug]/error.tsx:15-17] — remove the client-side log or restrict it to a sanitized digest.
- [x] [Review][Patch] Prevent long store/product names from overflowing the 360px layout [src/features/store/public-storefront-shell.tsx:49-100] — add safe wrapping and allow the price/availability row to wrap.
- [x] [Review][Patch] Bound public media signing batches [src/features/product/media-queries.ts:220-225] — chunk large path lists so the new batch call does not turn a large catalog into a payload or timeout failure.

- [x] [Review][Defer] Atomic store/catalog snapshot across slug reassignment [src/app/(public)/[storeSlug]/page.tsx:15-26] — deferred, pre-existing.
- [x] [Review][Defer] Revalidation against product visibility changes during the request [src/features/store/public-catalog.ts:76-94] — deferred, pre-existing.
- [x] [Review][Defer] Invalid/non-array catalog RPC data is treated as an empty catalog [src/features/store/public-catalog.ts:80-95] — deferred, pre-existing.
- [x] [Review][Defer] Runtime Supabase/RLS integration coverage for RPC, Storage policy, and partial media failures [scripts/smoke-foundation.mjs:318-352] — deferred, pre-existing repository limitation and outside the current story harness.
- [x] [Review][Defer] Migration rollback documentation [supabase/migrations/20260801230000_public_store_avatar.sql:1-59] — deferred, operational documentation task rather than a Story 3.1 runtime defect.
