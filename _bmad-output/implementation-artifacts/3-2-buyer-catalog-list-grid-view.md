baseline_commit: ea4688b923afef31cc5d4d652a75214f807b19c4
---

# Story 3.2: Buyer Catalog List/Grid View

Status: done

## Story

Как покупатель,
я хочу просматривать товары магазина списком или сеткой,
чтобы быстро сканировать небольшой каталог в удобном для телефона формате.

## Acceptance Criteria

### AC1 — buyer-safe карточка опубликованного товара

**Given** публичная витрина содержит опубликованные товары
**When** покупатель открывает область каталога
**Then** каждая карточка показывает обложку товара, название, цену или «по запросу» и CTA для связи
**And** товарная карточка имеет понятную ссылку/действие для открытия product detail по стабильному URL-контракту
**And** в каталоге сохраняются только Published DTO, полученные из существующего public query boundary
**And** карточка не показывает `store_id`, `seller_id`, `storage_path`, `byte_size` или другие приватные поля.

### AC2 — переключение list/grid без изменения состава

**Given** каталог содержит опубликованные товары
**When** покупатель переключает list/grid
**Then** видимые товары и их порядок остаются теми же
**And** переключатель имеет одно явно выбранное состояние
**And** выбранный режим сохраняется локально для браузера и восстанавливается при повторном открытии совместимой публичной витрины
**And** отсутствие, повреждение или недоступность `localStorage` не ломает SSR/hydration и использует безопасный default.

### AC3 — grid на мобильном

**Given** выбран grid view
**When** покупатель открывает каталог на viewport 360–430px
**Then** там, где ширина позволяет, отображаются две карточки в ряд
**And** фото, название, цена и CTA остаются читаемыми
**And** карточки не требуют горизонтального скролла и primary tap targets имеют минимум 44×44 CSS px.

### AC4 — list на мобильном

**Given** выбран list view
**When** покупатель открывает каталог на viewport 360–430px
**Then** каждой карточке хватает места для фото, названия, цены и CTA
**And** CTA не скучен с текстом и остаётся визуально различимым
**And** layout не зависит от hover и работает клавиатурой/сенсорным вводом.

### AC5 — доступный toggle и CTA contract

**Given** покупатель использует catalog view toggle или CTA карточки
**When** он меняет режим или начинает контактный flow
**Then** текущий режим объявляется доступно как list/grid
**And** active state не сообщается только цветом
**And** CTA имеет label `Связаться`/`Связаться в Telegram` согласно contact seam и destination semantics
**And** выбранный `storeSlug` и `productId` передаются в contact seam так, чтобы последующая story могла зафиксировать CTA click до внешнего handoff
**And** story не утверждает, что сообщение отправлено или сделка завершена.

### AC6 — visual and state regression

**Given** публичная витрина использует header, empty state и seller preview из Story 3.1
**When** каталог переводится на новый interactive rendering
**Then** store header, empty/not-found/error states и preview indicator/return action остаются без регрессий
**And** стиль остаётся спокойным monochrome/liquid-glass без marketplace-like ленты
**And** Telegram blue используется только для destination clarity, а обычный текст сохраняет WCAG AA-oriented contrast.

## Tasks / Subtasks

- [x] Task 1: Зафиксировать buyer catalog view model и повторно использовать published-only boundary (AC: #1, #6)
  - [x] Сохранить `getPublicCatalogItemsForStore` и `PublicCatalogItem` как единственный источник каталожных данных; не переносить lifecycle filtering в UI.
  - [x] Использовать `getProductPriceLabel`, `ProductMedia.isCover` и существующий `PublicStorefrontImage`; добавить только нужные buyer-safe presentation helpers.
  - [x] Проверить, что порядок элементов из public query одинаков в list и grid, а DTO не расширяется приватными Storage/ownership полями.
  - [x] Не добавлять новый UI framework, analytics dependency, buyer auth, search, pagination или infinite feed.

- [x] Task 2: Реализовать доступный Catalog view toggle с локальным сохранением (AC: #2, #5)
  - [x] Создать feature-local Client Component для состояния `list | grid`; Server Component page/shell продолжает получать данные на сервере.
  - [x] Рендерить одинаковый initial output до hydration; читать/писать `localStorage` только после mount и безопасно обрабатывать `SecurityError`, отсутствующий storage и невалидное значение.
  - [x] Выбрать grid как default на mobile, когда есть фото; не менять состав/порядок товаров при переключении.
  - [x] Использовать semantic buttons/toggle semantics, видимый non-color-only active state, `aria-pressed` или эквивалентное объявление текущего режима и focus-visible styles.
  - [x] Ключ хранения должен быть стабильным и версионированным; режим не должен неожиданно протекать между несвязанными приложениями.

- [x] Task 3: Собрать reusable buyer ProductCard для grid и list (AC: #1, #3, #4, #6)
  - [x] В grid использовать две карточки в ряд на 360–430px с достаточными внутренними отступами; на более широких экранах сохранить читаемый max-width публичной витрины.
  - [x] В list расположить cover, title, price и CTA без crowding; fallback cover не скрывает карточку при отсутствующем/битом signed URL.
  - [x] Показывать price через canonical `getProductPriceLabel`, включая «по запросу»; availability можно показывать в subdued text, но не заменять им обязательные поля AC.
  - [x] Открытие карточки вести через `next/link` на будущий стабильный product detail URL с `storeSlug` и immutable `productId`; не создавать detail UX этой story.
  - [x] Проверить semantic heading/link/button structure, alt/fallback label, клавиатурный порядок и tap targets 44px+; не использовать hover-only controls.

- [x] Task 4: Подключить CTA карточки к contact seam без преждевременного handoff (AC: #1, #5)
  - [x] Переиспользовать или создать узкий buyer-facing contact CTA seam, который принимает store/product context и не импортирует seller/admin или service-role код.
  - [x] CTA из каждой карточки должен передавать текущий store slug и product ID; Telegram configuration, message generation, event persistence и external navigation реализуются в Story 3.4–3.5, если отсутствуют в baseline.
  - [x] Если контакт продавца не настроен, использовать явный disabled/unavailable state с текстом `Контакт продавца пока не настроен`, не имитируя успешный handoff.
  - [x] Не считать клик отправленным сообщением, покупкой или заказом; не добавлять client-side analytics beacon вне утверждённого analytics seam.

- [x] Task 5: Интегрировать catalog в existing public storefront и preview (AC: #2, #6)
  - [x] Доработать `PublicStorefrontShell`, не создавать второй public route или отдельную параллельную store shell.
  - [x] Сохранить `src/app/(public)/[storeSlug]/page.tsx` как async Server Component с `dynamic = "force-dynamic"` и `params: Promise`, не добавляя client-only data fetching.
  - [x] Preview должен использовать ту же buyer catalog composition, сохранив preview indicator/return action и исключение seller preview из analytics.
  - [x] Empty, not-found и controlled error branches Story 3.1 должны остаться различимыми и buyer-safe.

- [x] Task 6: Добавить тестовые и smoke guardrails (AC: #1–#6)
  - [x] Добавить unit/helper tests для view mode parsing, default, persistence fallback и deterministic list/grid item order, если в проекте появится test harness; иначе расширить существующий source-level smoke в том же стиле.
  - [x] Проверить smoke assertions на наличие toggle, list/grid rendering, `localStorage` guard, `next/link` detail URL, canonical price helper, CTA context и отсутствие service-role/seller imports в public surface.
  - [x] Проверить published-only boundary и regression preview/empty/not-found/error; source-level checks не выдавать за runtime Supabase/RLS integration tests.
  - [x] Запустить `npm.cmd run check`: lint, `next typegen`, typecheck, production build и smoke.

## Dev Notes

### Scope and boundaries

Эта story делает публичный каталог интерактивным и сканируемым. Она не реализует полноценную страницу товара (Story 3.3), настройку Telegram (Story 3.4), Telegram deep link/prefilled message или fallback copy (Story 3.5), аналитику/source tracking (Epic 4), buyer account, chat, cart, orders, reviews, search или infinite feed.

Стабильный URL-контракт для detail: `/[storeSlug]/products/[productId]`, где `productId` — immutable UUID; title не используется как identity. Если target route ещё не существует, карточка всё равно должна быть оформлена через этот контракт для следующей story, а developer не должен подменять его client-side modal/detail implementation.

### Existing implementation to preserve

- `src/app/(public)/[storeSlug]/page.tsx` получает store/catalog на сервере, вызывает `notFound()` для `not_found`, оставляет `force-dynamic` и не показывает seller navigation.
- `src/features/store/public-catalog.ts` возвращает `PublicCatalogItem` из published-only RPC и batch-signed media; не вытаскивать raw storage path в buyer DTO.
- `src/features/store/public-storefront-shell.tsx` сейчас рендерит store header, catalog container, empty state и preview return action для public route и seller preview. Расширить этот seam, не дублировать его.
- `src/features/store/public-storefront-image.tsx` уже даёт client-side fallback для signed URL; одиночная ошибка изображения не должна скрывать каталог.
- `src/features/product/schema.ts` является canonical source для `getProductPriceLabel`, price modes и availability; не копировать форматирование цены в карточке.
- `src/components/ui/button.tsx` уже задаёт min 44px tap target и primary/secondary/telegram variants; использовать его или сохранить эквивалентные focus/size invariants.
- `src/features/product/media-queries.ts` использует private `product-media` bucket и server-side signed URLs. Не ослаблять bucket/RLS и не вводить публичные unsigned media URLs.

### Architecture guardrails

- AD-1/AD-2: responsive web, public buyer route отдельно от seller admin; buyer не требует auth.
- AD-4: CTA event/handoff ordering belongs to approved contact/analytics seam; не придумывать отправку сообщения и не связывать UI-клик с purchase.
- AD-5/AD-11: visibility enforced at repository/RPC boundary; published product public URL is ID-stable.
- AD-13/AD-15: domain mutations and privileged data access server-side; public/client code never imports service-role client.
- AD-16: product media visibility follows product visibility; signed buyer-safe URLs only.
- AD-20: valid store with zero published products remains HTTP 200 with empty state.

### UX requirements

- Primary viewport 360–430px; mobile is source of truth, desktop may widen but cannot change semantics.
- Grid default on mobile when product photos exist; list/grid choice persists per browser/device.
- Catalog card: photo, title, price/«по запросу», compact contact CTA; product and CTA have visual priority over decoration.
- Buyer CTA labels: compact `Связаться`, destination-explicit `Связаться в Telegram`; unavailable state `Контакт продавца пока не настроен`.
- Toggle announces current state as list/grid; active state is not color-only. Text-first empty/error states and visible focus remain required.
- Use minimal monochrome palette, Telegram blue only for handoff clarity, solid raised fallback when glass/transparency is unreliable or reduced.

### Next.js 16 / browser API requirements

- Keep route/page/server data loading in Server Components. The interactive toggle is the smallest possible Client Component because state, event handlers and `localStorage` are browser-only.
- Dynamic route params use `Promise<{ storeSlug: string }>` and `await params` per local Next.js 16 docs.
- Use `next/link` for product detail navigation; do not use `useRouter` for ordinary card links.
- Avoid hydration mismatch: server and first client render must match; only apply persisted mode after mount, or use a CSS-safe default that does not change semantic content.
- Do not introduce `use cache` or static generation without a separate decision about public lifecycle invalidation and signed URL TTL.

### Testing requirements

- Mandatory command: `npm.cmd run check`.
- Verify same product IDs/order in both modes and no draft/hidden/deleted item can appear through UI filtering mistakes.
- Verify default mode and persisted mode behavior with valid, invalid, missing, and throwing storage implementations; no browser-only API access during server render.
- Verify toggle keyboard/focus semantics, `aria-pressed`/current-state announcement, 44px controls and non-color-only active styling.
- Verify card link uses current `storeSlug` + UUID product ID, cover fallback works, canonical price labels render, and unavailable CTA is honest.
- Verify public route/preview still preserve Story 3.1 state branches and public privilege boundary.

### Latest technical notes

- Next.js App Router pages/layouts are Server Components by default; Client Components are appropriate for state, event handlers and browser APIs such as `localStorage`. The initial server/client render must remain identical to avoid hydration issues.
- Use the local project guide under `node_modules/next/dist/docs/01-app/01-getting-started/` as the version-specific source of truth for dynamic params and linking.
- React `useEffect` is the browser synchronization point for `localStorage`; it does not run on the server, so storage reads must not be in initial server render.
- Tailwind CSS v4 supports responsive `grid-cols-2` utilities; preserve the project’s existing CSS-token approach rather than adding a new styling dependency.

### Suggested file structure

Likely files (confirm against current code before editing):

```text
src/features/store/public-storefront-shell.tsx          # UPDATE composition
src/features/store/public-catalog-view.tsx              # NEW client toggle/catalog view, if split is useful
src/features/store/public-product-card.tsx              # NEW reusable buyer card, if split is useful
src/features/contact/public-contact-cta.tsx             # UPDATE/NEW narrow context seam only if needed
scripts/smoke-foundation.mjs                            # UPDATE source/build guardrails
```

Do not create product detail page, Telegram settings, Telegram deep-link service, analytics ingestion, schema migrations, or new dependencies unless a concrete existing contract requires it and the task explicitly maps to this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.2-Buyer-Catalog-ListGrid-View`]
- [Source: `_bmad-output/planning-artifacts/epics.md#FR11-Catalog-listgrid-display`]
- [Source: `_bmad-output/planning-artifacts/epics.md#UX-DR3-Product-card`]
- [Source: `_bmad-output/planning-artifacts/epics.md#UX-DR5-Catalog-view-toggle`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#Components`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Component-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#Accessibility-Floor`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-2`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-4`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-5`]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md#AD-11`]
- [Source: `_bmad-output/implementation-artifacts/3-1-public-storefront-by-slug.md#Dev-Notes`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md#Creating-a-dynamic-segment`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md#Linking-between-pages`]
- [Source: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md#When-to-use-Client-Components`]
- [External: https://nextjs.org/docs/app/getting-started/server-and-client-components]
- [External: https://react.dev/reference/react/useEffect]
- [External: https://tailwindcss.com/docs/grid-template-columns]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Implementation Plan

- Сохранить server-side public catalog query и передать buyer-safe DTO в минимальный Client Component.
- Реализовать `grid | list` как локальное состояние с hydration-safe default, versioned `localStorage` key и fallback при storage errors.
- Вынести карточку в тот же feature-slice: canonical price/media helpers, stable detail href, disabled contact CTA с store/product data attributes.
- Обновить existing storefront shell и source-level smoke guardrails; не затрагивать product detail, Telegram handoff или analytics ingestion.

### Debug Log References

### Completion Notes List

- Контекст проекта, Epic 3, PRD, архитектура, UX, предыдущая Story 3.1, git history и version-specific Next.js docs проанализированы; story подготовлена к реализации.
- Реализован buyer catalog view с grid/list режимами, versioned localStorage persistence, hydration-safe восстановлением и доступным toggle.
- Добавлены buyer-safe product cards с canonical price labels, cover fallback, stable `/[storeSlug]/products/[productId]` links и mobile-first grid/list layouts.
- Добавлен disabled contact CTA seam с `storeSlug`/`productId` context до реализации Telegram configuration/handoff в следующих stories.
- `npm.cmd run check` пройден: lint (только существующее предупреждение `no-img-element` в product media manager), typecheck, production build и smoke.
- Code review завершён ручным triage без actionable findings; автоматические Blind Hunter, Edge Case Hunter и Acceptance Auditor не запустились из-за внешнего `403 Forbidden`.

### File List

- `_bmad-output/implementation-artifacts/3-2-buyer-catalog-list-grid-view.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `scripts/smoke-foundation.mjs`
- `src/features/store/public-catalog-view.tsx`
- `src/features/store/public-storefront-shell.tsx`

### Change Log

- 2026-08-01: Создана comprehensive implementation story для buyer catalog list/grid view.
- 2026-08-01: Реализован buyer catalog list/grid view, smoke guardrails и переведено в review после полного check.
- 2026-08-01: Выполнен code review и story переведена в done; actionable findings отсутствуют.
