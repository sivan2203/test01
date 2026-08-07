---
title: 'Полный frontend UX/UI-редизайн test01'
type: 'feature'
created: '2026-08-07'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'ffb39c5bdaa724fa238234d8b1f32cc7ca88da16'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DECISIONS.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/IMPLEMENTATION_PLAN.md'
---

<frozen-after-approval reason="пользователь заранее утвердил автономную реализацию без checkpoint; intent менять нельзя">

## Intent

**Problem:** Рабочий MVP скрыт за узкой glass-оболочкой: seller desktop не использует пространство, создание товара разорвано, выбранные фото невидимы до отправки, feedback и route states непоследовательны.

**Approach:** Внедрить светлую neo-Swiss editorial-tech систему, плотный seller shell и редакционную public surface; вертикально перестроить feedback, четырёхшаговый product wizard, пофайловую media queue и sectioned store settings, не меняя продуктовый/backend-контракт.

## Boundaries & Constraints

**Always:** Сохранять seller ownership/RLS; анонимно показывать только `published`; draft сохранять без фото, publish разрешать только с 1–10 JPG/PNG/WebP ≤6 MiB; первая media-позиция остаётся cover; lifecycle-команды явны. Buyer остаётся без аккаунта, контакт — Telegram-only, сообщение строится сервером из title/price/URL и не отправляется автоматически; analytics best-effort, preview owner-only и без событий. UI русский, WCAG 2.2 AA accessibility floor, 44×44 px, 320–430 и 1280+; Next 16 guides из `node_modules/next/dist/docs` читаются до кода.

**Ask First:** Любое изменение бизнес-инварианта, schema/RLS/storage policy, новая dependency, production/deploy, внешняя отправка или необратимая операция. В остальных случаях выполнять автономно без checkpoint.

**Never:** Трогать `supabase/migrations/**`, production data/credentials, deploy, `db reset`, существующие пользовательские fixtures, destructive Git; ослаблять ownership, переносить service role в client, вводить buyer auth/payment/chat/marketplace, отправлять Telegram-сообщение, использовать browser `alert/confirm/prompt`, drag-only reorder или терять соседние файлы при upload error.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Wizard | Основное → Продажа → Фото → Проверка | Draft создаётся до фото; Back/Edit сохраняют данные; save/publish раздельны | Summary + inline errors; draft не становится public |
| Media queue | Mixed valid/invalid, network failure | Immediate previews; per-file queue/progress/retry; explicit cover/reorder | Ошибка локальна; успешные и queued файлы сохраняются |
| Store settings | Unsaved profile/slug/avatar | Секции, dirty Save/Discard, desktop live preview | Ошибка не очищает values/File; смена slug объясняет старый 404 |
| Destructive action | Delete/hide trigger | Native modal, inert background, focus на Cancel, Escape/return focus | Mutation error остаётся contextual |
| Public buyer | Published store/product, Telegram CTA | Editorial responsive UI, accessible gallery, trusted handoff | Draft/hidden/deleted → 404; analytics failure не блокирует CTA |
| Route state | Slow/error/empty/not-found | Разные skeleton/first-use/filter-empty/retry/entity copy | Retry локален и сохраняет введённое |

</frozen-after-approval>

## Code Map

- `src/app/globals.css`, `src/app/layout.tsx`, `src/app/fonts.ts` — tokens, light theme, typography, focus/safe-area/reduced-motion.
- `src/components/ui/**`, `src/components/design-system/**`, `src/components/seller/**` — primitives, native Dialog, feedback и responsive seller shell.
- `src/features/product/**`, `src/app/(seller)/seller/(admin)/products/**` — wizard, editor, lifecycle и media queue.
- `src/app/api/seller/products/[productId]/media/route.ts` — authenticated single-file upload transport; no schema change.
- `src/features/store/**`, `src/app/(seller)/seller/(admin)/store/**` — sectioned settings, dirty state, live/persisted preview и public UI.
- `src/features/analytics/**`, `src/features/import/**`, seller/public pages — dashboard и визуальная миграция сохранённых flows.
- `mockups/key-*.html` в UX workspace — key states; `DECISIONS.md` разрешает расхождения copy/tokens.
- `package.json`, `scripts/*.test.mjs` — полный contract check и новые UX regressions.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/**`, `src/components/**` — tokens/fonts/primitives, русский sidebar/mobile nav, feedback и route boundaries.
- [x] `src/features/product/**`, seller product pages, seller media API route — immediate-preview queue и четырёхшаговый wizard; существующий edit остаётся секционным.
- [x] `src/features/store/**`, seller store pages — sections, dirty Save/Discard, avatar/slug recovery и live preview.
- [x] seller dashboard/products/analytics/import и `src/features/store/public-*` — dense operational seller UI и editorial public UI без новой бизнес-логики.
- [x] `package.json`, `scripts/*.test.mjs` — все 27 contract-файлов включены; local browser matrix и after evidence записаны.

**Acceptance Criteria:**
- Given desktop/mobile seller routes, when пользователь навигирует клавиатурой, then active route, focus, safe area и reflow корректны без glass/cardification.
- Given mixed photo queue, when один upload падает, then остальные состояния/Files сохраняются, retry работает без picker, cover остаётся media position 0.
- Given wizard review, when выбран save или publish, then lifecycle меняется только явно и public visibility соблюдает guards.
- Given dirty store editor, when save/discard/error, then UI и live preview отражают правильный snapshot без ложной аналитики.
- Given anonymous buyer/owner preview, when открыты storefront/detail/CTA, then published-only, attribution, trusted Telegram payload и preview exclusion сохранены.
- Given завершённый slice, when выполнены проверки, then schema/migrations не изменены, console чиста, WCAG/responsive matrix и все contracts проходят.

## Spec Change Log

- 2026-08-07 — intent и business boundaries заморожены; реализация завершена без schema/dependency/deploy изменений.
- 2026-08-07 — review iteration 1: устранены findings по 320 px reflow, media rejection, focus obstruction/fallback, long-word wrapping, wizard history, headings, metadata, gallery и CTA semantics.
- 2026-08-07 — финальная browser/static evidence записана; статус изменён на `complete`.

## Design Notes

Канон: Onest + ограниченный JetBrains Mono, near-white/graphite, accent `#2457E6`, 8 px grid, radius 6–10 px, минимум теней; pills только для status/filter. Иллюстративные 10 MB photo, 5 MB avatar и отсутствующие data fields из HTML не реализуются: действуют 6 MiB, 2 MiB и текущая модель.

## Verification

**Commands:**
- `npm run check` — pass: lint, typecheck, production build, 105/105 contract tests (27 файлов) и smoke.
- `npx supabase db lint --local --schema public,private --fail-on error` — pass, `No schema errors found`.
- `npx supabase migration list --local` — pass, 20/20 local/remote migration versions совпадают.
- `git diff --check` — pass; `git diff --name-only -- supabase/migrations` пуст.

**Manual checks:**
- Реальный локальный Supabase; exact reflow 320/360/390/412/430 и desktop 1440; seller/public routes, keyboard focus, dialogs, dirty state, wizard history, long text, file chooser и slow/failing upload/retry.
- Accessibility tree и загруженные CSSOM rules для reduced-motion/forced-colors/safe-area проверены. Физический screen reader, literal 400% browser zoom и preference emulation не запускались; формальный WCAG certificate не заявляется.
- Telegram проверен до CTA/payload boundary без внешней отправки; production не затрагивался. Разрешённые локальные UX fixtures перечислены в browser report.
- Evidence: `frontend-ux-redesign-browser-report.md`, `frontend-ux-redesign-code-review.md` и UX-workspace `validation-report.md`/`.html`.

## Suggested Review Order

**UX-контракт и решения**

- Визуальный spine задаёт язык, токены, композицию и responsive-границы.
  [`DESIGN.md:256`](../planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#L256)

- Поведенческий spine связывает journeys, состояния, компоненты и accessibility floor.
  [`EXPERIENCE.md:14`](../planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md#L14)

- Финальное решение фиксирует idempotency, transport и безопасную wizard-навигацию.
  [`DECISIONS.md:73`](../planning-artifacts/ux-designs/ux-test01-2026-08-01/DECISIONS.md#L73)

**Визуальный фундамент и shell**

- Глобальные tokens управляют reflow, focus reserve, motion и forced colors.
  [`globals.css:3`](../../src/app/globals.css#L3)

- Seller shell разделяет desktop sidebar и safe-area mobile navigation.
  [`seller-shell.tsx:12`](../../src/components/seller/seller-shell.tsx#L12)

- Native dialog централизует initial, return и fallback focus.
  [`dialog.tsx:19`](../../src/components/ui/dialog.tsx#L19)

**Создание товара и media transport**

- Четырёхшаговый controlled wizard синхронизирует state, history, validation и lifecycle.
  [`product-create-wizard.tsx:106`](../../src/features/product/product-create-wizard.tsx#L106)

- Пофайловая очередь сохраняет File, честный progress и локальный retry.
  [`product-media-upload-queue.tsx:128`](../../src/features/product/product-media-upload-queue.tsx#L128)

- Route Handler валидирует Content-Length и стабильный uploadId до mutation.
  [`route.ts:61`](../../src/app/api/seller/products/%5BproductId%5D/media/route.ts#L61)

- Server service переиспользует результат retry и сохраняет media invariants.
  [`media-upload-service.ts:324`](../../src/features/product/media-upload-service.ts#L324)

**Настройки магазина и public experience**

- Controlled editor объединяет sections, dirty guard, preview и focus recovery.
  [`store-profile-form.tsx:64`](../../src/features/store/store-profile-form.tsx#L64)

- Public catalog обеспечивает grid/list persistence и editorial reflow.
  [`public-catalog-view.tsx:148`](../../src/features/store/public-catalog-view.tsx#L148)

- Product detail собирает gallery, facts и trusted Telegram handoff.
  [`public-product-detail.tsx:17`](../../src/features/store/public-product-detail.tsx#L17)

- Gallery сообщает позицию и selected state семантикой и маркером.
  [`public-product-gallery.tsx:14`](../../src/features/store/public-product-gallery.tsx#L14)

- CTA сохраняет короткий label-in-name и не отправляет сообщение автоматически.
  [`public-contact-cta.tsx:35`](../../src/features/store/public-contact-cta.tsx#L35)

**Seller workspace**

- Dashboard превращает существующие данные в компактный operational home.
  [`seller-dashboard-view.tsx:27`](../../src/features/seller-dashboard/seller-dashboard-view.tsx#L27)

- Import сохраняет parsing/mapping contracts под новой визуальной системой.
  [`import-product-flow.tsx:51`](../../src/features/import/import-product-flow.tsx#L51)

**Регрессии и доказательства**

- Стандартный check включает 27 contract-файлов, build и smoke.
  [`package.json:16`](../../package.json#L16)

- Wizard contracts закрепляют reducer, history, validation и idempotency.
  [`product-wizard-contract.test.mjs:278`](../../scripts/product-wizard-contract.test.mjs#L278)

- Boundary contracts удерживают focus fallback и route-state semantics.
  [`ux-boundaries-contract.test.mjs:68`](../../scripts/ux-boundaries-contract.test.mjs#L68)

- Browser report фиксирует реальные viewport, focus, network и console evidence.
  [`frontend-ux-redesign-browser-report.md:1`](frontend-ux-redesign-browser-report.md#L1)

- Validation synthesis сводит rubric и независимый accessibility review.
  [`validation-report.md:6`](../planning-artifacts/ux-designs/ux-test01-2026-08-01/validation-report.md#L6)
