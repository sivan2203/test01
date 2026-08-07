---
title: План реализации frontend UX/UI-редизайна test01
status: complete
date: 2026-08-07
baseline_commit: ffb39c5bdaa724fa238234d8b1f32cc7ca88da16
scope: frontend-and-local-app-routes
schema_changes: forbidden
deployment: excluded
---

# План реализации frontend UX/UI-редизайна

## 1. Результат и границы

Цель — заменить текущую glass/mobile-column оболочку на светлый neo-Swiss editorial-tech интерфейс, одновременно доведя до рабочего состояния четыре критических UX-потока: seller navigation, app-native feedback, создание товара в четыре шага и надёжная пофайловая загрузка фотографий. Публичная витрина становится редакционной, seller-кабинет — плотным рабочим инструментом.

План не меняет schema, migrations, RLS, storage policies или бизнес-модель. Не выполняются deployment, production-доступ, внешняя отправка Telegram-сообщений, `db reset`, удаление существующих данных и destructive Git-операции.

## 2. Управляющие источники

Реализация обязана читать источники в таком порядке:

1. [DECISIONS.md](DECISIONS.md) — принятые решения и разрешение конфликтов.
2. [EXPERIENCE.md](EXPERIENCE.md) — поведенческий контракт.
3. [DESIGN.md](DESIGN.md) — визуальный контракт.
4. [AUDIT.md](AUDIT.md) — baseline и дефекты.
5. [RESEARCH.md](RESEARCH.md) — доказательная база.
6. [Architecture spine](../../architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md) — backend/security границы.
7. Канонические key-state макеты:
   - [seller dashboard](mockups/key-seller-dashboard-desktop.html);
   - [product wizard review](mockups/key-product-wizard-review.html);
   - [media queue и dialog](mockups/key-product-media-dialog.html);
   - [store settings и preview](mockups/key-store-settings-preview.html);
   - [public product](mockups/key-public-storefront-product.html).

### Правила разрешения конфликтов

- `DECISIONS.md` и существующие бизнес-инварианты важнее демонстрационного текста HTML-макетов.
- Акцент — `#FF488B`, даже если key-state HTML использует близкий демонстрационный оттенок.
- Товарное фото — JPG/PNG/WebP, максимум **6 MiB**, максимум 10; значение 10 MB в макете не переносится.
- Avatar — максимум **2 MiB**; значение 5 MB в макете не переносится.
- Макет публичного товара показывает иллюстративные facts/related content. Поля, которых нет в текущей модели, не создаются и не имитируются.
- Первая media-позиция остаётся backend-обложкой; команда «Сделать обложкой» лишь выражает этот инвариант в UI.

## 3. Общая последовательность

```text
I0 baseline/docs
 → I1 tokens/fonts/shell
 → I2 feedback/dialog/states
 → I3 media queue на существующем edit flow
 → I4 четырёхшаговый create wizard
 → I5 store settings
 → I6 seller workspace
 → I7 public storefront
 → I8 boundaries/responsive/a11y
 → I9 regression + browser proof
```

Каждая итерация должна завершаться работающим вертикальным срезом, `npm run lint`, `npm run typecheck` и ручной проверкой затронутого маршрута. Полный `npm run check` обязателен после I4, I7 и I9.

## I0. Зафиксировать baseline и правила Next.js 16

**Зависимости:** нет.

**Точные пути и действия**

- `AGENTS.md` — перечитать запрет опоры на старые знания Next.js.
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` — проверить актуальные layout/page conventions.
- `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md` — error/not-found contract.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md` — image pipeline.
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` — font loading.
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — action boundaries.
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` — client boundary.
- `package.json`, `next.config.ts`, `.env.example` — подтвердить версии, scripts и локальные переменные без вывода секретов.
- `screenshots/before/` — сохранить как неизменяемый baseline; будущие доказательства писать в `screenshots/after/`.

**Acceptance**

- Baseline commit, локальные URL и ограничения media записаны в рабочем отчёте реализации.
- Не запущен второй dev server и не выполнен `db reset`.
- До первого изменения кода прочитаны все релевантные Next 16 guides выше.

**Verification**

- `git status --short --branch` — пользовательские/параллельные изменения распознаны и не перезаписываются.
- `npx supabase status` — локальные DB/Auth/Storage/API доступны.
- `npm run check` — baseline проходит до редизайна.

**Риск:** локальный email rate limit 2/час. **Снижение:** использовать уже активную сессию и Inbucket; не запрашивать magic link без необходимости.

## I1. Tokens, fonts, primitives и seller navigation

**Зависимости:** I0.

**Точные пути и действия**

- `src/app/fonts.ts` — новый единый экспорт Onest и JetBrains Mono через поддерживаемый `next/font`; без runtime CDN, с системными fallback.
- `src/app/layout.tsx` — применить font variables, русский metadata baseline и глобальный skip-link target.
- `src/app/globals.css` — заменить auto-dark/glass tokens на канонические light semantic tokens: paper/surface/ink/muted/border/accent/success/warning/destructive/focus; добавить 8 px spacing foundation, safe-area и reduced-motion правила; определить отсутствующие `surface-muted` и `destructive` utilities.
- `src/components/ui/button.tsx` — привести primary/secondary/ghost/destructive к радиусам 6–10 px, 44 px touch floor и единому focus-visible.
- `src/components/design-system/surface.tsx` и `src/components/design-system/index.ts` — заменить GlassPanel на нейтральные `Surface`/`Section`; временный alias допустим только до миграции всех call sites.
- `src/components/ui/status-badge.tsx` — новый компактный pill только для статусов.
- `src/components/ui/field.tsx` — новый label/helper/error contract с `aria-invalid`/`aria-describedby`.
- `src/components/seller/seller-navigation.tsx` — новый client-компонент с `usePathname`, русскими подписями и `aria-current="page"`.
- `src/components/seller/seller-shell.tsx` — новый desktop sidebar/mobile bottom bar shell.
- `src/app/(seller)/seller/(admin)/layout.tsx` — перейти на seller shell; зарезервировать место под mobile bar и safe area.
- `src/app/(seller)/seller/sign-in/page.tsx`, `src/features/seller-auth/sign-in-form.tsx`, `src/app/page.tsx` — мигрировать на новый визуальный фундамент и убрать smoke/английский copy.

**Acceptance**

- Светлая тема стабильна независимо от системной dark mode; glass/blur не является глобальным языком.
- На desktop ≥1280 px seller navigation — sidebar; на 320–430 px — нижняя навигация без перекрытия контента.
- Активный пункт локализован и имеет `aria-current`; все controls имеют видимый focus и цель ≥44×44 px.
- Onest корректно показывает контрольную кириллицу; mono используется только для metadata/ID/метрик.

**Verification**

- `rg -n "backdrop-blur|rounded-\[?2[0-9]px|Home|Products|Analytics|Store" src` — нет прежнего shell-языка в мигрированных местах.
- Browser: `/seller`, `/seller/sign-in`, `/` на 360, 390, 430 и 1440 px; keyboard-only navigation.
- Contrast check для accent/white, ink/paper, muted/paper и focus ring — WCAG 2.2 AA.

**Риски:** font build может зависеть от сети; глобальная смена tokens может сломать немигрированные экраны. **Снижение:** сохранить fallback, вводить semantic tokens совместимо, снимать after-скриншоты на каждом route.

## I2. App-native feedback, native dialog и системные состояния

**Зависимости:** I1.

**Точные пути и действия**

- `src/components/ui/dialog.tsx` — новый wrapper над native `<dialog>.showModal()` с inert background/top layer, initial focus на «Отмена», Escape, close и возвратом фокуса в trigger.
- `src/components/ui/alert.tsx` — contextual alert variants с текстовой семантикой, не цветом одним.
- `src/components/ui/error-summary.tsx` — focusable summary со ссылками на ошибочные поля.
- `src/components/ui/status-message.tsx` — polite status для success/background completion; alert только для срочной ошибки.
- `src/components/ui/skeleton.tsx` и `src/components/ui/empty-state.tsx` — структурные loading/first-use/filter-empty primitives.
- `src/features/product/product-state-control.tsx` — заменить inline `aria-modal="false"` подтверждения общим Dialog.
- `src/features/product/product-media-manager.tsx` — заменить подтверждение удаления тем же Dialog.
- `src/features/product/product-form.tsx`, `src/features/store/store-profile-form.tsx`, `src/features/seller-auth/sign-in-form.tsx` — подключить Field/ErrorSummary/StatusMessage без потери введённых значений.

**Acceptance**

- Нет вызовов `alert`, `confirm`, `prompt`; modal используется только для необратимых решений.
- При открытом dialog Tab не уходит в фон, Escape закрывает отменяемый dialog, после закрытия focus возвращается в trigger.
- Destructive action не получает initial focus.
- Inline error связан с полем; multi-error submit фокусирует summary; success не перехватывает focus.

**Verification**

- `rg -n "window\.(alert|confirm|prompt)|aria-modal=\"false\"" src` — 0 результатов.
- Browser keyboard pass: delete photo, hide/delete product, validation errors формы.
- Screen-reader inspection: dialog name/description, status announcements и error links.

**Риск:** native dialog hydration/focus race. **Снижение:** imperative API вызывается только после mount, close path идемпотентен, trigger ref проверяется.

## I3. Пофайловая media queue в существующем edit flow

**Зависимости:** I2. Эта итерация сначала доказывает upload UX на `/seller/products/:id/edit`, затем I4 переиспользует его в wizard.

**Точные пути и действия**

- `src/features/product/product-media-upload-queue.tsx` — новый client queue: object-URL preview сразу после выбора, client preflight, `queued/uploading/processing/success/error`, progress, cancel/remove и retry только неудавшегося файла; освобождать object URLs.
- `src/features/product/product-media-manager.tsx` — оркестрировать сохранённые media и локальную очередь; file picker и drop zone равноправны.
- `src/app/api/seller/products/[productId]/media/route.ts` — новый same-origin POST по одному файлу; auth, generic ownership failure, server validation и typed JSON response. Это app route, не schema change.
- `src/features/product/media-upload-service.ts` — новый server-only single-file service, извлечённый из action: signature/type/size/count validation, Storage upload, metadata insert и cleanup orphan object при частичной server failure.
- `src/features/product/media-actions.ts` — оставить reorder/remove и перевести legacy upload вызов на общий service либо удалить batch path после миграции всех callers.
- `src/features/product/media-schema.ts` — единый источник client/server констант: max 10, 6 MiB, JPG/PNG/WebP.
- `src/features/product/media-queries.ts` — вернуть обновлённую media-модель после success без ослабления signed-read/ownership.
- `src/features/product/product-media-manager.tsx` и `src/features/product/media-actions.ts` — явная «Сделать обложкой» перемещает item в позицию 0; reorder имеет всегда доступные «Выше/ниже», drag только опционален.
- `scripts/product-media-upload-queue.test.mjs` — новый contract тест single-file route, limits, partial failure, cover/reorder и отсутствие schema changes.

**Acceptance**

- Thumbnail появляется до network request; имя, размер и состояние видны для каждого файла.
- Файлы загружаются последовательно (`concurrency = 1`); XHR сообщает browser→route progress, после 100% UI честно показывает отдельное server-processing состояние.
- Ошибка одного файла не удаляет соседние `File` и успешные результаты; retry не открывает picker повторно.
- Невалидный файл отклоняется локально и сервером; capacity учитывает сохранённые + queued позиции.
- Обложка явна, но в БД остаётся первой media-позицией; keyboard/touch reorder полностью функционален.
- Server Action `7mb` больше не ограничивает multi-file batch, потому что transport — один файл на request; глобальный лимит не повышается.

**Verification**

- Contract test: valid JPG/PNG/WebP, bad MIME/signature, >6 MiB, 11-й файл, unauthorized/foreign product, storage/metadata partial failure.
- Browser throttling: mixed queue `success/error/queued`, retry, cancel, reorder, cover, reload persistence.
- Read-only DB/Storage check: нет orphan после моделируемой metadata failure; порядок непрерывен.

**Риски:** XHR progress заканчивается до Storage write. **Снижение:** отдельный `processing` state, последовательная client queue и повторный server capacity check; no new dependency.

## I4. Четырёхшаговый мастер создания товара

**Зависимости:** I3.

**Точные пути и действия**

- `src/features/product/product-create-wizard.tsx` — новый client orchestrator шагов `Основное → Продажа → Фото → Проверка`.
- `src/features/product/product-wizard-state.ts` — reducer/history contract, dirty data и стабильные step IDs; browser Back/«Назад» не очищают значения.
- `src/features/product/product-wizard-stepper.tsx` — desktop labels и mobile «Шаг n из 4»; `aria-current="step"`, не кликабельное меню.
- `src/features/product/product-fields.tsx` — переиспользуемые поля для wizard и обычного editor.
- `src/features/product/product-review.tsx` — buyer-like review, section summary и «Изменить» к конкретному шагу.
- `src/features/product/product-form.tsx` — оставить секционным editor существующего товара, переиспользуя `ProductFields`.
- `src/features/product/schema.ts`, `src/features/product/form-state.ts` — step validators как проекции существующего полного контракта; не ослаблять server validation.
- `src/features/product/actions.ts` — создать draft после валидных шагов 1–2 и вернуть `productId` без обязательного redirect; не писать placeholder-данные; lifecycle actions остаются явными.
- `src/app/(seller)/seller/(admin)/products/new/page.tsx` — заменить single form на wizard и загрузить owned draft при продолжении.
- `src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx` — сохранить регулярное редактирование секционным, не превращать его в обязательный wizard.

**Acceptance**

- Каждый Continue валидирует только текущий шаг; summary и inline errors совпадают и сохраняют данные.
- До фото draft уже существует, остаётся `draft` и анонимно не виден; никаких placeholder price/title не создаётся.
- Back, browser Back и «Изменить» сохраняют введённое; refresh после создания draft восстанавливает server-saved данные.
- Review показывает только реально существующие поля/media; доступны «Сохранить черновик» и «Опубликовать».
- Publish по-прежнему требует 1–10 фото; save не публикует, переход шага не меняет lifecycle.

**Verification**

- `scripts/product-wizard-contract.test.mjs` — новый contract для step projection, draft timing, navigation state и explicit publish.
- Browser: happy path, errors каждого шага, exit as draft, browser Back, reload после шага 3, publish guard без фото и publish с фото.
- Anonymous request к draft permalink — 404.

**Риски:** duplicate drafts от повторной отправки и потеря state до первого server save. **Снижение:** pending lock/idempotent client transition, draft ID сохраняется сразу после шага 2, history меняется только после успешной валидации.

## I5. Sectioned store settings, dirty save и live preview

**Зависимости:** I2; может начаться параллельно I4 после стабилизации primitives.

**Точные пути и действия**

- `src/features/store/store-profile-form.tsx` — controlled editor с секциями `Профиль`, `Публичная ссылка`, `Связь`, `О витрине`; единый submit contract.
- `src/features/store/store-settings-nav.tsx` — desktop section rail/mobile tabs с текущей секцией.
- `src/features/store/store-live-preview.tsx` — buyer-like preview из локальных unsaved values; sticky справа на desktop, отдельная full-screen команда на mobile.
- `src/features/store/store-dirty-bar.tsx` — появляется только при отличии от initial snapshot; `Отменить` восстанавливает snapshot, `Сохранить` показывает pending/success/error.
- `src/features/store/actions.ts`, `src/features/store/form-state.ts`, `src/features/store/schema.ts` — сохранить серверную canonicalization и uniqueness; добавить безопасную проверку доступности slug без раскрытия чужих данных.
- `src/features/store/avatar.ts` — client/server max 2 MiB, локальный preview и cleanup object URL; выбранный File не очищается при unrelated field error.
- `src/app/(seller)/seller/(admin)/store/page.tsx` — двухколоночный desktop workspace и та же система для first-run.
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx` — сохранить persisted-data preview, ownership и отсутствие analytics.

**Acceptance**

- Dirty bar отсутствует до изменения и после success/discard; ошибки не сбрасывают поля/avatar.
- Live preview отражает локальные name/avatar/description, но не пишет БД и analytics.
- Перед изменением сохранённого slug объясняется немедленный 404 старого URL; сервер остаётся финальным арбитром uniqueness.
- Mobile не имеет горизонтального scroll и не держит сжатый desktop preview рядом с формой.

**Verification**

- Browser: create first store, edit each section, discard, failed submit, avatar error, slug collision/change warning, desktop/mobile preview.
- SQL read-only: один store per seller; старый slug 404, новый доступен; preview не добавляет analytics.

**Риски:** controlled File нельзя восстановить после unmount; unsaved preview могут принять за опубликованные данные. **Снижение:** не размонтировать editor при section switch, маркировать preview «Несохранённые изменения», persisted preview оставить отдельным route.

## I6. Seller dashboard, catalog, analytics и import visual layer

**Зависимости:** I1–I2; I4 нужен для финального CTA flow.

**Точные пути и действия**

- `src/features/seller-dashboard/dashboard-data.ts` — новый read model из существующих store/product/media/analytics queries; без materialized view/schema.
- `src/features/seller-dashboard/seller-dashboard-view.tsx` — один главный CTA, setup health, attention tasks, метрики 7/30 дней и последние товары.
- `src/app/(seller)/seller/(admin)/page.tsx` — operational home и раздельные first-run/error/empty состояния.
- `src/features/seller-dashboard/seller-dashboard-view.tsx`, `src/features/analytics/product-analytics-view.tsx`, `src/app/(seller)/seller/(admin)/analytics/page.tsx` — плотные rows/keylines вместо glass cards, сохраняя расчёты.
- `src/app/(seller)/seller/(admin)/products/page.tsx`, `src/features/product/product-cover.tsx` — широкая desktop таблица/list и stacked mobile rows; текущие status filters и archived rules сохраняются.
- `src/features/import/import-product-flow.tsx`, `src/app/(seller)/seller/(admin)/products/import/page.tsx` — только визуальная миграция существующих parse/mapping/preview/result состояний.

**Acceptance**

- Home отвечает «что происходит / что требует внимания / что делать дальше» и имеет один primary CTA.
- Product list использует доступную desktop ширину; mobile не рендерит горизонтальную таблицу.
- Analytics/import вычисления, partial success и draft-only import не изменены.
- First-use и filter-empty имеют разные copy/actions.

**Verification**

- Existing analytics/import/product-list contracts проходят без изменения ожидаемой бизнес-логики.
- Browser: no store, empty catalog, filter-empty, populated dashboard, analytics empty/error/data, import partial failure на 390/1440.

**Риск:** dashboard attention может потребовать новых данных. **Снижение:** вычислять только из существующих queries; недоступную рекомендацию не показывать, schema не расширять.

## I7. Editorial public storefront и product detail

**Зависимости:** I1 и I6 visual language; backend public/contact contract неизменен.

**Точные пути и действия**

- `src/features/store/public-storefront-shell.tsx` — редакционная store identity, широкий desktop layout и компактный mobile header.
- `src/features/store/public-catalog-view.tsx` — grid/list без cardification; сохранить localStorage preference и `aria-pressed`.
- `src/features/store/public-storefront-image.tsx`, `src/features/product/product-cover.tsx` — согласовать responsive image behavior, aspect ratio и `sizes` по актуальному Next 16 guide.
- `src/features/store/public-product-detail.tsx` — editorial detail только на доступных product fields; CTA явно называет текущий товар.
- `src/features/store/public-product-gallery.tsx` — сохранить swipe, prev/next, thumbnails, position announcements; добавить полный keyboard/focus/reduced-motion pass.
- `src/features/store/public-contact-cta.tsx` — общий black primary, Telegram label/icon, disabled/fallback states; server-trusted message contract не менять.
- `src/app/(public)/[storeSlug]/page.tsx`, `src/app/(public)/[storeSlug]/products/[productId]/page.tsx` — сохранить published-only queries, attribution и preview analytics exclusion.
- `src/app/page.tsx` — завершить чистый технический вход без smoke-test copy и без выдуманного marketplace discovery.

**Acceptance**

- Public desktop использует доступную ширину, product/media доминируют; glass/pill-card language отсутствует.
- Аноним видит только published; buyer account не появляется.
- Telegram CTA содержит trusted title/price/URL, не отправляет сообщение автоматически и остаётся доступен через copy fallback.
- Preview требует ownership и не пишет analytics.
- Не добавлены material/height/shipping или related-data поля, если их нет в текущем read model.

**Verification**

- Browser anonymous: storefront grid/list persistence, detail gallery, disabled Telegram, preview/copy handoff без внешней отправки.
- Read-only event check: store/product views и CTA соблюдают attribution; preview не учитывается.
- Browser console/network: нет image warnings, layout shift и необработанных ошибок.

**Риск:** signed Storage URLs и `next/image` remote policy могут конфликтовать. **Снижение:** проверить актуальный Next image contract; не ослаблять URL/security policy и не менять storage schema ради оптимизации.

## I8. Route boundaries, responsive и accessibility hardening

**Зависимости:** I1–I7.

**Точные пути и действия**

- `src/app/(seller)/seller/(admin)/loading.tsx` — structure-matched seller skeleton.
- `src/app/(seller)/seller/(admin)/error.tsx` — seller recovery boundary.
- `src/app/(seller)/seller/(admin)/not-found.tsx` — корректный seller entity copy и возврат к списку.
- `src/app/(public)/[storeSlug]/loading.tsx` — storefront skeleton.
- `src/app/(public)/[storeSlug]/error.tsx`, `src/app/(public)/[storeSlug]/not-found.tsx` — разделить unavailable и store-not-found.
- `src/app/(public)/[storeSlug]/products/[productId]/loading.tsx` — product structure skeleton.
- `src/app/(public)/[storeSlug]/products/[productId]/error.tsx`, `src/app/(public)/[storeSlug]/products/[productId]/not-found.tsx` — product-specific recovery/copy.
- `src/app/globals.css` и все sticky/fixed components — safe-area, scroll-padding, focus-not-obscured, reflow и reduced-motion hardening.
- `src/components/design-system/surface.tsx` и all call sites — удалить последний compatibility `GlassPanel` alias после `rg` count 0.

**Acceptance**

- Loading, first-use, filter-empty, error, unavailable и not-found визуально/семантически различаются.
- Нет horizontal scroll на 320/360/390/412/430; на эквивалентной 400% reflow-ширине основной контент не теряет функцию.
- Один `h1`, skip link, landmarks, логичный tab order, видимый focus, 44×44 targets, AA contrast.
- Sticky/bottom UI не закрывает focus и учитывает safe area; reduced-motion отключает transform/shimmer/smooth scroll.

**Verification**

- Browser matrix: 320, 360, 390, 412, 430 и desktop 1440; keyboard focus, загруженные reduced-motion/forced-colors правила и slow/failing network. Literal zoom/preference emulation документируются отдельно, если browser tool их не предоставляет.
- Automated accessibility scan, если доступный runner уже установлен; иначе browser accessibility tree + contrast/reflow checklist без добавления dependency.
- `rg -n "GlassPanel|backdrop-blur|text-foreground/(40|50|55)" src` — 0 необоснованных legacy применений.

**Риск:** общий boundary может скрыть точный recovery path. **Снижение:** product/store-specific boundaries ближе к сущности, generic seller boundary только для неизвестной ошибки.

## I9. Regression, полный browser proof и after evidence

**Зависимости:** I0–I8.

**Точные пути и действия**

- `package.json` — включить в `test:contracts` пропущенные `contact-contract`, `preview-contract`, `telegram-handoff` и `telegram-request`; сохранить полный `check`.
- `scripts/design-system-contract.test.mjs`, `scripts/product-media-upload-queue.test.mjs`, `scripts/product-wizard-contract.test.mjs`, `scripts/store-settings-contract.test.mjs`, `scripts/ux-boundaries-contract.test.mjs` — пять узких regression-контрактов; итоговый inventory — 27 test files.
- `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/screenshots/after/` — сохранить сопоставимые desktop/mobile after screenshots.
- `_bmad-output/implementation-artifacts/frontend-ux-redesign-browser-report.md` — записать route/viewport/state matrix, console/network findings, test data и итог.

**Acceptance**

- Все существующие и новые contract tests входят в стандартный check и проходят.
- Критические seller/buyer потоки пройдены в реальном локальном Supabase, без mocks, deployment и внешних сообщений.
- До/после доказательства покрывают shell, wizard, media mixed queue, store dirty preview, dashboard, storefront и product detail.
- Browser console не содержит необработанных ошибок; network failures имеют локальный retry и не теряют данные.

**Verification commands**

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:contracts
npm run smoke
npm run check
npx supabase db lint --local --schema public,private --fail-on error
npx supabase migration list --local
git diff --check
```

**Browser matrix**

1. Seller sign-in shell без повторной внешней отправки; использовать локальную активную сессию/Inbucket.
2. First-run store и store edit: dirty/discard/failure/avatar/slug/live preview.
3. Product wizard: Back/error/draft/reload/media/review/publish.
4. Media mixed queue: invalid/success/error/retry/cancel/cover/reorder.
5. Seller dashboard/products/analytics/import: first-use, empty, filter-empty, data и error.
6. Anonymous storefront/detail: grid/list/gallery/404/Telegram preview-copy; не открывать отправку сообщения.
7. Keyboard focus/accessibility tree/CSSOM reduced-motion на 320–430 и 1440; отдельно фиксировать ограничения physical screen reader и literal zoom/emulation.

**Риск:** browser validation может изменить локальные fixtures. **Снижение:** создавать только изолированные тестовые drafts с узнаваемым префиксом; не удалять и не перезаписывать исходные магазины/товары.

## 4. Сквозные риски и стоп-условия

| Риск | Мера |
|---|---|
| Ослабление RLS ради UI | Запрещено; owner/public queries и generic not-found сохраняются |
| Новая UI/upload dependency | Не добавлять; native dialog, React, XHR и текущий Supabase API достаточны |
| Schema/storage policy migration | Запрещено в этом scope |
| Потеря form/File state | Controlled state, local retry, server snapshot после draft save, object URL cleanup |
| Неверный progress | Разделять network progress и server processing, не показывать выдуманный процент |
| Prototype copy расходится с контрактом | DECISIONS + `media-schema.ts`/`avatar.ts` имеют приоритет |
| Публичная утечка draft/hidden/deleted | Анонимные regression tests и существующие RLS/public query paths |
| Preview портит аналитику | Сохранить authorized preview gate и отсутствие beacon |
| Service role уходит в client | Запрещено; analytics ingestion остаётся server-only |
| Редизайн ломает import/analytics | Visual-only migration и существующие contracts до/после каждого slice |
| Параллельные изменения в worktree | Не перезаписывать; перечитывать `git status` и diff перед каждым patch |

Стоп и запрос отдельного разрешения требуются только при необходимости изменить business invariant, schema/RLS/storage policy, добавить dependency, работать с production, deploy, отправить внешнее сообщение или выполнить необратимую операцию. Внутри зафиксированного frontend/local scope работа автономна и не требует checkpoint.

## 5. Definition of Done

- Реализованы I1–I8 и пройден I9.
- В коде нет глобального glass language, auto-dark override, английской seller navigation и технического smoke copy.
- Wizard, media retry, store dirty/live preview и app-native dialog доказаны happy/error/recovery сценариями.
- Все бизнес-инварианты из AUDIT сохранены; `supabase/migrations/**` не изменён.
- `npm run check`, db lint, migration list и `git diff --check` успешны.
- Browser matrix пройдена на реальном локальном Supabase, after screenshots и отчёт записаны.

## 6. Completion log

- I0 — baseline, Next.js 16 guides и local-only boundaries зафиксированы.
- I1–I2 — светлый token/font foundation, seller shell, primitives, feedback и native dialog внедрены.
- I3–I4 — последовательная idempotent media queue и четырёхшаговый wizard с history/recovery завершены.
- I5 — sectioned store settings, dirty Save/Discard, live/mobile preview и slug guard завершены.
- I6–I7 — seller workspace, import/analytics и editorial public storefront/product detail мигрированы без изменения бизнес-логики.
- I8 — route boundaries, 320 px reflow, focus/safe-area, reduced-motion/forced-colors и доступные semantics усилены.
- I9 — `npm run check` pass, 105/105 contracts, DB/migration/diff gates pass, browser matrix/console/network recovery и свежие after screenshots записаны.
- Итоговые evidence: `_bmad-output/implementation-artifacts/frontend-ux-redesign-browser-report.md`, `frontend-ux-redesign-code-review.md`, `review-accessibility-mobile.md`, `validation-report.md` и `validation-report.html`.
