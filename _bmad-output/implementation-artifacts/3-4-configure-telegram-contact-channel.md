baseline_commit: 21179bb
---

# Story 3.4: Настройка Telegram-контакта

Status: done

## Story

Как продавец,
я хочу настроить Telegram как канал связи магазина,
чтобы покупатели могли связаться со мной из карточек товаров и страниц товаров.

**Requirements:** FR-14, FR-21, AD-3, AD-13, UX-DR7, UX-DR13, UX-DR17

## Acceptance Criteria

### AC1 — seller-only настройка и валидация

**Given** я вошёл в кабинет продавца и редактирую настройки магазина/контактов
**When** я ввожу Telegram username или ссылку на публичный Telegram-профиль
**Then** система нормализует значение к username без `@` и проверяет его на сервере до сохранения
**And** невалидное значение получает текстовую inline-ошибку, а сохранённое значение не изменяется.

Поддерживаемые варианты ввода:

- `username`;
- `@username`;
- HTTPS-ссылка `https://t.me/username`, `https://telegram.me/username` или `https://telegram.dog/username` с необязательным завершающим `/`.

После нормализации в БД хранится только canonical username. Ссылки с query/hash, дополнительными path-сегментами, `tg://` URI, другими хостами, пробелами, кириллицей и username с недопустимыми символами отклоняются. Пустое значение разрешено как способ очистить контакт.

### AC2 — сохранённый контакт включает публичные CTA

**Given** у магазина сохранён валидный Telegram username
**When** покупатель открывает публичную витрину, каталог или страницу опубликованного товара
**Then** product CTA находится в enabled-состоянии
**And** destination явно обозначен как Telegram, например `Связаться в Telegram`.

Эта story только включает и маркирует CTA. Переход во внешний Telegram, подготовка текста сообщения и запись `cta_click` являются scope Story 3.5 и Epic 4.

### AC3 — отсутствие контакта отображается честно

**Given** у магазина нет сохранённого валидного Telegram username
**When** покупатель открывает публичную витрину, каталог или страницу опубликованного товара
**Then** CTA отображается в disabled/unavailable-состоянии с текстом `Контакт продавца пока не настроен`
**And** seller admin показывает предупреждение, что для связи нужно настроить Telegram.

Публичный DTO передаёт только безопасное состояние конфигурации (`contactConfigured` и, если нужен будущему handoff, canonical public username); не передавать raw Supabase rows, seller id, service-role данные или внутренние storage-поля.

### AC4 — Telegram — единственный MVP-адаптер

**Given** Telegram является единственным включённым MVP-каналом
**When** seller открывает настройки контакта или buyer видит CTA
**Then** WhatsApp, VK, телефон, внутренний чат и альтернативные контакты не появляются как рабочие каналы
**And** код использует contact adapter seam, где единственным валидным MVP-значением является `telegram`.

Не добавлять проверку существования username через Telegram API: локальная проверка формата является границей этой story, а успешность открытия/отправки сообщения не наблюдаема сервисом.

### AC5 — mobile-first и accessibility

**Given** seller редактирует Telegram на viewport 360–430px
**When** он вводит, исправляет и сохраняет значение
**Then** label, helper/error text и save action остаются читаемыми и tappable
**And** поле и кнопка имеют минимум 44×44 CSS px, видимый focus и не зависят только от цвета
**And** ошибка и состояние сохранения объявляются текстом через существующие `role="alert"`/`role="status"` паттерны.

### AC6 — регрессии и границы данных

**Given** контакт сохранён, очищен или изменён
**When** seller/admin, public storefront, catalog, detail и seller preview загружаются снова
**Then** все эти поверхности показывают согласованное состояние Telegram
**And** preview не считается public buyer analytics
**And** изменение контакта не меняет visibility/lifecycle продуктов, store slug, product URL или media access.

## Tasks / Subtasks

- [x] Task 1: Создать единый Telegram contact domain contract (AC: #1, #4)
  - [x] Добавить feature-local модуль в `src/features/contact/` для нормализации и server/client-safe валидации Telegram input.
  - [x] Свести `username`, `@username` и поддерживаемые HTTPS-ссылки к одному canonical username без `@`.
  - [x] Разделить pure validation/normalization от Supabase и Server Action; покрыть accepted/rejected формы source-level smoke checks или доступными unit-проверками.
  - [x] Не выполнять сетевую проверку существования username и не добавлять Telegram SDK/новую зависимость.

- [x] Task 2: Добавить schema migration и Supabase RPC contract (AC: #1, #2, #3, #6)
  - [x] Создать timestamp-prefixed migration в `supabase/migrations/` с nullable `public.stores.telegram_username`.
  - [x] Добавить DB check, согласованный с domain validator, чтобы прямой authenticated POST/API не мог сохранить недопустимый username.
  - [x] Сохранить существующие stores и разрешить `NULL` для магазинов, созданных до этой story.
  - [x] Обновить `get_public_store_by_slug` так, чтобы public query мог получить безопасный Telegram contact state/username; сохранить `anon`/`authenticated` grants и `security definer`/`search_path = public` guardrails.
  - [x] Добавить rollback note в migration/story: удалить новую колонку и восстановить предыдущую сигнатуру/реализацию RPC после проверки зависимостей.

- [x] Task 3: Расширить seller store read/write flow (AC: #1, #3, #5, #6)
  - [x] Расширить `SellerStoreProfile`, form values/state и initial state полем Telegram.
  - [x] Добавить поле Telegram в существующий `src/app/(seller)/seller/(admin)/store/page.tsx` / `src/features/store/store-profile-form.tsx`, не создавать отдельный competing settings screen.
  - [x] В `src/features/store/actions.ts` принимать только FormData, валидировать canonical value на сервере, проверять auth через существующий SSR Supabase client и обновлять только текущий seller-owned store.
  - [x] Обрабатывать invalid input без частичного сохранения; очищать контакт только явным пустым значением; сохранить остальные profile fields при ошибке.
  - [x] Показывать helper, inline error, disabled pending state и success status в существующем form-state стиле.
  - [x] Revalidate seller store/admin и текущую public store path после успешного изменения; не раскрывать username в ошибках и не импортировать service-role client.

- [x] Task 4: Протянуть безопасный contact state через public surfaces (AC: #2, #3, #4, #6)
  - [x] Расширить `PublicStoreProfile`/buyer-facing store contract так, чтобы storefront и preview знали `contactConfigured`.
  - [x] Расширить `PublicCatalogItem`/`PublicProduct` только настолько, насколько нужно CTA и следующей Story 3.5; не дублировать raw database mapping.
  - [x] Для detail route использовать существующий public store/product boundary; не читать store/product напрямую из Client Component и не обходить published-only query.
  - [x] Пропустить состояние через `PublicStorefrontShell`, `PublicCatalogView`, `PublicProductDetail` и `PublicProductContactCta`.
  - [x] Консолидировать catalog-local CTA в `src/features/store/public-catalog-view.tsx` с shared `src/features/store/public-contact-cta.tsx`; не оставлять два расходящихся disabled/enabled поведения.
  - [x] Сохранить public not-found/error, draft/hidden/deleted exclusion, signed media privacy, current storeSlug/productId data attributes и seller preview indicator.

- [x] Task 5: Зафиксировать contact adapter boundary (AC: #2, #3, #4)
  - [x] Описать в `src/features/contact/README.md` или feature-local contract, что enabled adapter value — только `telegram`.
  - [x] Enabled CTA в этой story не должен самостоятельно открывать Telegram, генерировать message или записывать analytics; оставить существующий seam для Story 3.5.
  - [x] Disabled CTA должен использовать настоящую `disabled`/`aria-disabled` семантику и сообщать причину текстом.

- [x] Task 6: Добавить регрессионные проверки и проверить сборку (AC: #1–#6)
  - [x] Обновить `scripts/smoke-foundation.mjs` для migration/validator/form/public DTO/shared CTA boundaries.
  - [x] Проверить accepted input, rejected input, clear value, seller-only mutation, configured/unconfigured public CTA, catalog/detail parity и preview no-analytics boundary.
  - [x] Выполнить `npm.cmd run check` (lint, `next typegen`, typecheck, production build, smoke).
  - [x] Не считать source smoke заменой runtime Supabase/RLS integration harness: если реальный Supabase недоступен, зафиксировать это как ограничение проверки.

## Dev Notes

### Контекст эпика и зависимости

Epic 3 строит цепочку `public storefront → catalog → product detail → Telegram contact loop`. Stories 3.1–3.3 уже реализовали buyer-safe storefront/catalog/detail и намеренно оставили contact CTA без handoff. Story 3.4 должна сделать configured/unconfigured state настоящим источником истины перед реализацией handoff в Story 3.5.

Предыдущая story 3.3 зафиксировала важные решения:

- публичные страницы используют `getPublicProductForStore`, `PublicProduct` и published-only boundary;
- `src/features/store/public-contact-cta.tsx` уже является shared seam для detail CTA, но catalog пока содержит локальную копию — её нужно консолидировать;
- detail route остаётся Server Component, а browser interactivity ограничивается небольшими Client Components;
- текущий CTA хранит `data-contact-store-slug` и `data-contact-product-id`, но не должен заявлять успешный handoff;
- runtime Supabase/RLS/browser integration tests отсутствуют; `scripts/smoke-foundation.mjs` — существующий lightweight guardrail.

### Текущее состояние файлов, которые надо переиспользовать

- `src/app/(seller)/seller/(admin)/store/page.tsx` — seller profile screen; текст уже говорит, что Telegram настраивается следующими шагами.
- `src/features/store/store-profile-form.tsx` — Client Component на `useActionState`, с inline `FieldError`, status message, 44px-ish inputs и общей кнопкой сохранения.
- `src/features/store/actions.ts` — `use server` action `saveStoreProfile`; уже проверяет auth, валидирует profile, upsert-ит seller-owned `stores`, работает с `revalidatePath` и не использует service-role.
- `src/features/store/schema.ts` — чистые profile/slug validators; не смешивать Telegram validation со slug rules.
- `src/features/store/queries.ts` — seller read model из RLS-защищённой `stores` таблицы.
- `src/features/store/public-queries.ts` — server-only public store RPC + signed avatar; public DTO не должен возвращать приватные поля.
- `src/features/store/public-catalog.ts` — server-only published catalog/product queries; mapping должен оставаться единым.
- `src/features/store/public-catalog-view.tsx` — catalog-local CTA и grid/list UI; убрать локальную копию CTA после расширения shared seam.
- `src/features/store/public-contact-cta.tsx` — текущий shared CTA с `contactConfigured = false` default; сохранить честный disabled state и добавить enabled behavior только как presentational state.
- `src/features/store/public-product-detail.tsx` — detail CTA получает `storeSlug/productId`; не встраивать в него Supabase calls.
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx` — seller preview получает seller profile и public catalog; передать contact state, сохранив no-analytics semantics.
- `supabase/migrations/20260801143000_create_stores.sql` — базовая `stores` schema/RLS/storage policy.
- `supabase/migrations/20260801160000_add_store_slug.sql` — public store RPC; его контракт надо обновить новой migration, не редактировать старую migration.
- `scripts/smoke-foundation.mjs` — source-level checks; расширять точечно.

### Архитектурные guardrails

- **AD-3:** contact channel моделируется как adapter seam, но единственное MVP-значение — `telegram`; не добавлять WhatsApp/VK/phone/internal chat.
- **AD-9:** buyers anonymous; Telegram username — публичный contact destination, но seller auth применяется к mutation.
- **AD-13:** любые store/contact mutations идут через server action/domain service; Client Component не пишет в Supabase.
- **AD-15:** browser использует только public anon credentials; seller writes — SSR user client + RLS; service-role client не импортировать.
- **AD-17:** колонка, check constraint, RPC и grants — только через timestamped SQL migration в `supabase/migrations/`.
- **AD-2:** seller admin и public storefront остаются разными surfaces; public UI не импортирует admin form/query.
- **AD-5/AD-16:** изменение Telegram не может ослабить published-only product visibility или signed private media boundary.
- **AD-20:** public store route остаётся доступным для valid slug даже при zero published products; contact state не должен влиять на route availability.

### Данные и публичный контракт

Рекомендуемая shape после этой story:

```ts
type SellerStoreProfile = {
  // existing seller fields
  telegramUsername: string;
};

type PublicStoreProfile = {
  // existing buyer-safe fields
  contactConfigured: boolean;
  telegramUsername?: string; // public destination only, canonical, no @
};
```

Если для текущего query слоя безопаснее передать только `contactConfigured`, не добавлять второй параллельный DTO: Story 3.5 может получать canonical username server-side через contact route/service. В любом варианте публичный контракт должен быть единым для catalog и detail, а raw `stores` row — не покидать server boundary.

DB contract:

- `stores.telegram_username` nullable text;
- `NULL` означает disabled/unconfigured CTA;
- non-null хранит только canonical username без `@` и URL;
- DB check и TypeScript validator должны reject invalid formats независимо друг от друга;
- username availability/existence не проверяется Telegram API;
- existing `stores` RLS policies already scope seller ownership and remain in force.

### Telegram handoff preparation boundary

Официальный Telegram deep-link contract поддерживает public username links вида `https://t.me/<username>?text=<draft_text>`. Эта story не строит handoff URL; при реализации Story 3.5 использовать `URL`/`URLSearchParams` для UTF-8 encoding, не конкатенацию строк, и записывать CTA intent до external navigation. Ссылка должна строиться из canonical username, product title, product URL и canonical price/request label.

### UI и accessibility

- Primary buyer label: `Связаться в Telegram`; catalog compact label может оставаться `Связаться`, если destination доступен через accessible name/description.
- Disabled label: `Контакт продавца пока не настроен`.
- Seller helper text должен явно объяснять accepted input и canonical storage, но не перегружать mobile form.
- Поле — label сверху, helper/error снизу, error text-first; не использовать toast-only validation.
- Telegram blue `#229ED9` допустим только как destination affordance; сохранять contrast pair `{colors.ink-inverse}` on `{colors.accent-telegram}`.
- `Button`/input target не ниже 44×44 CSS px; visible focus order соответствует чтению; reduced motion/transparency fallbacks сохраняются.

### File structure requirements

Ожидаемые изменения (уточнить по существующим паттернам, не создавать дубли):

    supabase/migrations/<timestamp>_add_store_telegram_contact.sql  # NEW
    src/features/contact/telegram.ts                               # NEW, pure normalize/validate
    src/features/contact/README.md                                  # UPDATE contract, если нужен
    src/features/store/schema.ts                                   # UPDATE only if shared form schema needs type bridge
    src/features/store/form-state.ts                               # UPDATE
    src/features/store/queries.ts                                  # UPDATE seller DTO
    src/features/store/actions.ts                                  # UPDATE server mutation
    src/features/store/store-profile-form.tsx                       # UPDATE seller field
    src/features/store/public-queries.ts                            # UPDATE public-safe contact state
    src/features/store/public-catalog.ts                            # UPDATE shared public DTO/query mapping if needed
    src/features/store/public-catalog-view.tsx                      # UPDATE use shared CTA
    src/features/store/public-contact-cta.tsx                       # UPDATE configured/unconfigured presentation
    src/features/store/public-product-detail.tsx                    # UPDATE pass contact state
    src/app/(public)/[storeSlug]/page.tsx                           # UPDATE pass public contact state
    src/app/(public)/[storeSlug]/products/[productId]/page.tsx      # UPDATE load/pass store contact state if needed
    src/app/(seller)/seller/(admin)/store/preview/page.tsx          # UPDATE preview contact state
    scripts/smoke-foundation.mjs                                    # UPDATE source guardrails

Do not create a second store settings route, a client-side Supabase mutation, a separate catalog CTA implementation, a Telegram API dependency, a service-role import, or a handoff/analytics implementation that belongs to later stories.

### Testing requirements

Minimum checks:

- `npm.cmd run check` passes; preserve any known pre-existing lint warning only if it remains unchanged.
- Validator accepts raw username, optional `@`, supported HTTPS profile links and empty clear value.
- Validator rejects malformed host/path, query/hash, extra path, whitespace, invalid characters, and oversized/undersized username.
- Server action rejects unauthenticated requests and invalid values; invalid submission leaves prior store/contact state unchanged.
- Migration is timestamped, nullable-safe for existing rows, has RLS-compatible write path, grants the public RPC correctly, and includes rollback note.
- Seller form shows saved value, inline validation, pending state, success state and clear-contact behavior at 360–430px.
- Public storefront/catalog/detail all agree on enabled vs disabled CTA; no contact configuration does not make store/product not-found.
- Seller preview mirrors CTA state but does not add analytics events.
- Catalog and detail use the shared CTA; CTA keeps `storeSlug/productId` context but does not open Telegram or claim message/order completion.
- Source smoke checks verify no WhatsApp/VK/internal-chat channels and no service-role/client import in public contact surfaces.

Runtime Supabase/RLS, real Telegram client opening, deep-link failure fallback and CTA analytics timing remain follow-up coverage for Story 3.5/Epic 4; do not fake these checks as implemented by source assertions.

### Previous story intelligence

From Story 3.3 and its review:

- shared contact CTA exists specifically so this story can complete its configured/unconfigured contract;
- catalog-local CTA duplication was explicitly deferred to the Telegram contact-loop work — this is that work;
- the product detail route uses `dynamic = "force-dynamic"`, async server params and buyer-safe query boundaries;
- missing/broken media must continue to render fallback without exposing storage paths;
- existing public not-found/error distinctions and seller preview analytics exclusion are regression-sensitive;
- `npm.cmd run check` was the successful verification path.

### Git intelligence

Current baseline is commit `21179bb` (`сторя 3.3 завершена`). Recent implementation follows vertical slices, source-level smoke guardrails, no new dependencies unless required, and story documents that record exact files/AC mapping. Preserve those conventions.

### Library and version requirements

- Node.js `>=24 <25`
- Next.js `16.2.12` App Router
- React/React DOM `19.2.4`
- Tailwind CSS `4.x`
- `@supabase/ssr ^0.12.4`
- `@supabase/supabase-js ^2.111.0`
- No dependency upgrade is needed for this story.

Next.js 16 specifics from the local bundled docs:

- seller form remains a Client Component only because it uses `useActionState` and browser interaction;
- the imported `saveStoreProfile` Server Action remains server-only and must authenticate/authorize on every direct POST;
- public pages and server queries remain Server Components/server-only modules;
- revalidation belongs after successful mutation, before any redirect/control-flow exit.

### Project Structure Notes

- Feature ownership remains vertical-slice: contact rules under `src/features/contact`, store mutation/query under `src/features/store`, shared button under existing design-system/UI.
- Public route files under `src/app/(public)` must never import seller admin query/form modules.
- No `project-context.md` exists; repository-specific guidance comes from `AGENTS.md`, package scripts, current source, and BMad artifacts.
- The repository is currently on `main` with the latest story implementation committed; this workflow creates the story artifact and updates sprint tracking only.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.4-Configure-Telegram-Contact-Channel`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.5-Telegram-Handoff-with-Prefilled-Product-Message`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-14-Telegram-contact-configuration`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-15-Prefilled-Telegram-message`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md#FR-16-Contact-CTA-from-catalog-and-detail`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-3`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-13`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-15`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-17`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#Telegram-handoff`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Components`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#State-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- [Source: `_bmad-output/implementation-artifacts/3-3-public-product-detail-page.md#Previous-story-intelligence`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- [Source: `AGENTS.md`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`]
- [Source: `node_modules/next/dist/docs/01-app/02-guides/forms.md`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`]
- [Source: `package.json`]
- [Source: `supabase/migrations/20260801143000_create_stores.sql`]
- [Source: `supabase/migrations/20260801160000_add_store_slug.sql`]
- [Source: `supabase/migrations/20260801183000_create_products.sql`]
- [Source: `supabase/migrations/20260801213000_add_product_lifecycle_guards.sql`]
- [External: https://core.telegram.org/api/links — public username links and `?text=` draft text]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Completion Notes List

- Ultimate context-engine analysis completed for Story 3.4.
- Story is ready for development; Telegram handoff and analytics remain explicitly out of scope.
- Workflow customization resolver could not run because `python3` is unavailable; base customization was read manually and had no activation/post-completion steps.
- Added a pure Telegram username validator/normalizer for bare usernames, optional `@`, supported HTTPS profile links, and explicit clearing.
- Added nullable `stores.telegram_username` migration, canonical database check, and buyer-safe public RPC return field while preserving existing grants and security-definer guardrails.
- Extended seller profile read/write state and form with server-side validation, inline error/helper, pending/success states, and public revalidation.
- Propagated `contactConfigured` through storefront, catalog, product detail, and seller preview; catalog now uses the shared CTA and no handoff/analytics behavior was added.
- Added unit/source regression checks. `node --test scripts/contact-contract.test.mjs` and `npm.cmd run check` pass; runtime Supabase/RLS integration remains outside this repository's available harness.

### File List

- `_bmad-output/implementation-artifacts/3-4-configure-telegram-contact-channel.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/contact-contract.test.mjs`
- `scripts/smoke-foundation.mjs`
- `supabase/migrations/20260802090000_add_store_telegram_contact.sql`
- `src/features/contact/README.md`
- `src/features/contact/telegram.ts`
- `src/features/store/actions.ts`
- `src/features/store/form-state.ts`
- `src/features/store/public-catalog-view.tsx`
- `src/features/store/public-contact-cta.tsx`
- `src/features/store/public-product-detail.tsx`
- `src/features/store/public-queries.ts`
- `src/features/store/public-storefront-shell.tsx`
- `src/features/store/queries.ts`
- `src/features/store/schema.ts`
- `src/features/store/store-profile-form.tsx`
- `src/app/(public)/[storeSlug]/products/[productId]/page.tsx`
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx`

### Change Log

- 2026-08-02: Created comprehensive implementation story for Telegram contact configuration.
- 2026-08-02: Implemented Telegram contact configuration and marked all story tasks complete; validation passed and status moved to review.

### Review Findings

- [x] [Review][Patch] `maxLength={32}` блокировал валидные HTTPS-ссылки и username максимальной длины; ограничение убрано, canonical username проверяется после нормализации [src/features/store/store-profile-form.tsx:231].
- [x] [Review][Patch] URL-нормализация принимала запрещённые формы вроде пустого query/hash, dot-segments и backslash-пути; добавлена строгая проверка исходной формы ссылки [src/features/contact/telegram.ts:5-30].
- [x] [Review][Patch] При валидном avatar и невалидном Telegram не показывалось предупреждение о повторном выборе файла; проверка avatar reselect теперь учитывает все field errors [src/features/store/actions.ts:69-97].
- [x] [Review][Patch] После объединения CTA в общий компонент в каталоге был потерян `w-full`; класс восстановлен на catalog CTA [src/features/store/public-catalog-view.tsx:110-120].
- [x] [Review][Patch] Telegram-поле не связывало inline error с input и не выставляло `aria-invalid`; добавлены error id, `aria-describedby` и `aria-invalid` [src/features/store/store-profile-form.tsx:226-247].
- [x] [Review][Patch] Focus Telegram-поля обозначался только сменой цвета border; добавлен видимый focus ring [src/features/store/store-profile-form.tsx:227].
- [x] [Review][Patch] После сохранения `@username` или URL uncontrolled input мог показывать исходное значение; перед отправкой valid input теперь приводится к canonical username [src/features/store/store-profile-form.tsx:61-78].
- [x] [Review][Patch] В seller admin не было явного предупреждения о недоступности контакта при незаполненном Telegram; добавлен status warning [src/features/store/store-profile-form.tsx:239-247].
- [x] [Review][Patch] Отсутствующее поле `telegramUsername` в прямом FormData трактовалось как явная очистка; теперь такая отправка отклоняется, а очистка возможна только явным пустым значением [src/features/store/actions.ts:51-83].
