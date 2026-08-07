---
name: Персональная витрина
description: Светлая neo-Swiss editorial-tech система для персональной витрины и плотного кабинета малого продавца.
status: final
sources:
  - ../../prds/prd-test01-2026-08-01/prd.md
  - ../../prds/prd-test01-2026-08-01/addendum.md
  - ../../prds/prd-test01-2026-08-01/validation-report.md
  - DECISIONS.md
  - RESEARCH.md
  - AUDIT.md
updated: 2026-08-07
colors:
  surface-base: '#F5F3EE'
  surface-raised: '#FBFAF7'
  surface-muted: '#ECE9E2'
  surface-inverse: '#171716'
  ink-primary: '#171716'
  ink-secondary: '#5E5D57'
  ink-disabled: '#706F69'
  ink-inverse: '#FFFFFF'
  border-hairline: '#D8D5CE'
  border-strong: '#88857E'
  accent-cobalt: '#2457E6'
  on-accent: '#FFFFFF'
  success: '#1E6B48'
  success-surface: '#EAF3ED'
  warning: '#7A570D'
  warning-surface: '#F5EEDF'
  danger: '#A4352B'
  danger-surface: '#F7E8E6'
typography:
  public-display:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '0.98'
    letterSpacing: '-0.045em'
  public-display-mobile:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.02'
    letterSpacing: '-0.035em'
  page-title:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 32px
    fontWeight: '680'
    lineHeight: '1.12'
    letterSpacing: '-0.03em'
  section-title:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 20px
    fontWeight: '650'
    lineHeight: '1.2'
    letterSpacing: '-0.015em'
  body:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.55'
  body-compact:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.45'
  label:
    fontFamily: 'Onest Variable, Onest, "Segoe UI", Arial, sans-serif'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.35'
  meta-mono:
    fontFamily: 'JetBrains Mono, "SFMono-Regular", Consolas, monospace'
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0.03em'
  metric-display:
    fontFamily: 'JetBrains Mono, "SFMono-Regular", Consolas, monospace'
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: '-0.04em'
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  full: 9999px
spacing:
  half: 4px
  '1': 8px
  '2': 16px
  '3': 24px
  '4': 32px
  '5': 40px
  '6': 48px
  '8': 64px
  mobile-gutter: 16px
  tablet-gutter: 24px
  desktop-gutter: 40px
  section-gap: 32px
components:
  button:
    primary-background: '{colors.accent-cobalt}'
    primary-foreground: '{colors.on-accent}'
    secondary-background: '{colors.surface-raised}'
    secondary-foreground: '{colors.ink-primary}'
    destructive-foreground: '{colors.danger}'
    radius: '{rounded.md}'
    min-height: 44px
  icon-button:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-hairline}'
    radius: '{rounded.sm}'
    size: 44px
  seller-shell:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-hairline}'
  seller-navigation:
    background: '{colors.surface-muted}'
    active-foreground: '{colors.ink-primary}'
    active-marker: '{colors.accent-cobalt}'
    divider: '{colors.border-hairline}'
  page-header:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-strong}'
  section:
    background: '{colors.surface-base}'
    divider: '{colors.border-hairline}'
  toolbar:
    background: '{colors.surface-base}'
    divider: '{colors.border-strong}'
  data-row:
    background: '{colors.surface-base}'
    divider: '{colors.border-hairline}'
    focus-marker: '{colors.accent-cobalt}'
  status-badge:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-secondary}'
    border: '{colors.border-strong}'
    radius: '{rounded.full}'
  metric-group:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-hairline}'
  attention-list:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    marker: '{colors.accent-cobalt}'
    divider: '{colors.border-hairline}'
  form-field:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    focus: '{colors.accent-cobalt}'
    error: '{colors.danger}'
    radius: '{rounded.md}'
  slug-editor:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    focus: '{colors.accent-cobalt}'
    radius: '{rounded.md}'
  error-summary:
    background: '{colors.danger-surface}'
    foreground: '{colors.danger}'
    border: '{colors.danger}'
    radius: '{rounded.sm}'
  feedback-banner:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    radius: '{rounded.sm}'
  toast:
    background: '{colors.surface-inverse}'
    foreground: '{colors.ink-inverse}'
    radius: '{rounded.md}'
  native-dialog:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    radius: '{rounded.lg}'
  product-wizard:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-hairline}'
  step-indicator:
    foreground: '{colors.ink-secondary}'
    current-foreground: '{colors.ink-primary}'
    marker: '{colors.accent-cobalt}'
    divider: '{colors.border-strong}'
  media-queue:
    background: '{colors.surface-base}'
    item-background: '{colors.surface-base}'
    divider: '{colors.border-hairline}'
    progress: '{colors.accent-cobalt}'
    radius: '{rounded.md}'
  settings-editor:
    background: '{colors.surface-base}'
    preview-background: '{colors.surface-raised}'
    savebar-background: '{colors.surface-inverse}'
    savebar-foreground: '{colors.ink-inverse}'
    divider: '{colors.border-hairline}'
    radius: '{rounded.lg}'
  store-header:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    accent: '{colors.accent-cobalt}'
    divider: '{colors.border-strong}'
  catalog-view-toggle:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-secondary}'
    active-foreground: '{colors.ink-primary}'
    active-marker: '{colors.accent-cobalt}'
  product-card:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-hairline}'
    radius: '{rounded.sm}'
  product-detail-media:
    background: '{colors.surface-muted}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.md}'
  telegram-cta:
    background: '{colors.accent-cobalt}'
    foreground: '{colors.on-accent}'
    radius: '{rounded.md}'
    min-height: 48px
  copy-message-fallback:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    radius: '{rounded.md}'
  skeleton:
    background: '{colors.surface-muted}'
    radius: '{rounded.sm}'
  empty-state:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-hairline}'
  import-mapper:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    divider: '{colors.border-hairline}'
  product-state-control:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-strong}'
    radius: '{rounded.sm}'
---

# Персональная витрина — визуальный контракт

## Brand & Style

Персональная витрина — не маркетплейс и не тяжёлый e-commerce кабинет. Это спокойный переход от социальной публикации к понятному товару и разговору с продавцом. Внешний язык — **neo-Swiss editorial-tech**: строгая сетка, ясная типографическая иерархия, тёплая бумажная поверхность, тонкие правила и один кобальтовый сигнал действия.

Публичная часть и кабинет используют общие токены, но разную плотность:

- **Витрина покупателя** редакционная: крупное название, большие фотографии, спокойный ритм и один очевидный CTA.
- **Кабинет продавца** операционный: компактные строки, видимые статусы, sidebar на desktop, минимум контейнеров и один главный action на поверхности.

`#2457E6` обозначает действие, фокус и активное положение. Он не служит декором. Telegram не создаёт вторую синюю палитру: назначение действия сообщают текст и иконка.

Liquid glass, декоративный blur, градиенты, неон, cardification и pill-everywhere не входят в язык системы. Светлая тема обязательна; автоматическое переключение в недизайненную dark theme запрещено.

## Colors

- **Warm Paper (`{colors.surface-base}`)** — основной холст seller и buyer surfaces.
- **Raised Paper (`{colors.surface-raised}`)** — inputs, dialog, preview frame и поверхности, которым нужен небольшой тональный отрыв.
- **Muted Paper (`{colors.surface-muted}`)** — navigation rail, skeleton и редкие вторичные зоны; не фон для каждой секции.
- **Graphite (`{colors.ink-primary}`)** — заголовки, основной текст и structural rules.
- **Secondary Ink (`{colors.ink-secondary}`)** — пояснения и метаданные. `{colors.ink-disabled}` применяется к действительно недоступным контролам и placeholder-тексту с контрастом не ниже 4.5:1, но не к обычному body copy.
- **Cobalt (`{colors.accent-cobalt}`)** — primary action, focus, active navigation и текущий шаг.
- **Semantic colors** — `{colors.success}`, `{colors.warning}`, `{colors.danger}` всегда сопровождаются текстом или иконкой. Мягкие semantic surfaces не превращаются в цветные карточки.

Load-bearing contrast pairs:

- `{colors.ink-primary}` и `{colors.ink-secondary}` на `{colors.surface-base}` или `{colors.surface-raised}` должны проходить WCAG 2.2 AA для normal text;
- `{colors.on-accent}` на `{colors.accent-cobalt}` — не ниже 4.5:1;
- `{colors.accent-cobalt}` на `{colors.surface-base}` — не ниже 4.5:1 для текста и активных markers;
- focus, borders контролов и semantic icons — не ниже 3:1 к соседней поверхности.

Запрещено сообщать состояние только цветом, использовать слабый opacity для нужного текста и вводить отдельные brand colors для Telegram, аналитики или категорий товара.

## Typography

Основной шрифт — self-hosted **Onest Variable** с Cyrillic + Latin. Рабочие веса: 400, 500, 600, 650–700. Fallback сохраняет размер и читаемость при загрузке. **JetBrains Mono** используется только для ID, коротких статусов, номера шага, времени и метрик.

| Роль | Токен | Применение |
|---|---|---|
| Публичный display | `{typography.public-display}` / `{typography.public-display-mobile}` | Название товара или магазина; одна доминанта на экран |
| Заголовок страницы | `{typography.page-title}` | Seller route `h1`, заголовок настроек и wizard |
| Заголовок секции | `{typography.section-title}` | Логические блоки, attention queue, review sections |
| Основной текст | `{typography.body}` | Описание товара и покупательский контент |
| Плотный UI | `{typography.body-compact}` / `{typography.label}` | Формы, таблицы, navigation, действия |
| Метаданные | `{typography.meta-mono}` | ID, шаги, source, status, дата |
| Главная метрика | `{typography.metric-display}` | Одно ведущее число dashboard; не декоративная статистика |

Кириллица не получает агрессивный uppercase tracking. Верхний регистр допустим только для коротких mono labels; длинные labels остаются в sentence case. Не использовать synthetic italic. Перед выпуском проверить `Ё/ё, Й/й, Д, Л, Ж, Щ, Ц`, ₽, длинные названия магазина, Telegram username и tabular numbers.

## Layout & Spacing

Основа — 8px grid: `{spacing.1}` для тесно связанных элементов, `{spacing.2}` для поля и helper, `{spacing.3}` между группами, `{spacing.4}` между секциями. Значение `{spacing.half}` допустимо только для hairline alignment и тесных metadata pairs.

### Кабинет продавца

- 320–430px: одна колонка, `{spacing.mobile-gutter}`, bottom navigation и sticky actions с зарезервированным пространством.
- 768–1023px: одна или две колонки по задаче; data table превращается в stacked rows до появления достаточной ширины.
- 1024px+: постоянный sidebar около 216–232px и fluid workspace.
- 1280px+: dashboard использует summary + attention columns и широкий product index; контент не зажимается в mobile-like `max-w-md`.

### Публичная витрина

- На mobile фотография и CTA находятся в первом логическом экране; grid каталога допускает две компактные карточки в ряд.
- На desktop product detail использует editorial split: identity/context, большая media-зона и детали/CTA. Empty columns допустимы только как осмысленная композиция, не как следствие узкого max-width.
- Sticky CTA и navigation добавляют `env(safe-area-inset-bottom)` к базовому padding и не закрывают контент.

Иллюстративные key screens:

- [`mockups/key-seller-dashboard-desktop.html`](mockups/key-seller-dashboard-desktop.html) — desktop shell, метрики, attention queue и product rows;
- [`mockups/key-product-wizard-review.html`](mockups/key-product-wizard-review.html) — desktop/mobile review шага 4;
- [`mockups/key-product-media-dialog.html`](mockups/key-product-media-dialog.html) — media queue и destructive dialog;
- [`mockups/key-store-settings-preview.html`](mockups/key-store-settings-preview.html) — sectioned settings, live preview и dirty save bar;
- [`mockups/key-public-storefront-product.html`](mockups/key-public-storefront-product.html) — editorial product detail на desktop и 390px.

Ранние [`mockups/storefront-mobile.html`](mockups/storefront-mobile.html) и [`mockups/seller-dashboard-mobile.html`](mockups/seller-dashboard-mobile.html) сохраняют только исходную content hierarchy; их glass/pill treatment заменён этим контрактом. **Spines имеют приоритет над всеми mockups.** В частности, канонический accent — `#2457E6`, лимит товарного фото — 6 MiB, аватара — 2 MiB, даже если иллюстрация показывает другое значение.

## Elevation & Depth

Иерархия строится типографикой, свободным пространством, тональным сдвигом и линиями. Большинство surfaces находится на одном физическом уровне.

- Default: без тени, разделение через `{colors.border-hairline}`.
- Sticky save bar: небольшой tonal inverse и одна тихая ambient shadow, только чтобы отделить плавающий action от формы.
- Native dialog: единственная явно поднятая поверхность; backdrop затемняет и делает фон inert.
- Hover не поднимает строки и карточки; он меняет background/border без layout shift.

Запрещены glass blur, glow, многослойная shadow ladder и тени как замена структуре.

## Shapes

- `{rounded.xs}` — мелкие structural details.
- `{rounded.sm}` — thumbnails, icon buttons, badges с прямоугольным характером.
- `{rounded.md}` — inputs, buttons, media и compact controls.
- `{rounded.lg}` — dialog, preview frame и редкая составная поверхность.
- `{rounded.full}` — только status/filter badges и круглые индикаторы; primary buttons не pills.

Контейнеры не превышают 10px radius. Фотографии следуют radius своего media container и сохраняют исходное соотношение сторон.

## Components

| Компонент | Визуальный контракт |
|---|---|
| `button` | Primary — `{colors.accent-cobalt}`/`{colors.on-accent}`; secondary — raised/transparent с strong border; destructive — danger text/border. Высота не меньше 44px, radius `{rounded.md}`. |
| `icon-button` | 44×44px, видимая рамка, однозначная иконка; destructive variant использует danger вместе с accessible label. |
| `seller-shell` | Warm Paper, fluid workspace, hairline boundaries; не помещать весь route в одну карточку. |
| `seller-navigation` | Muted rail на desktop, solid bottom bar на mobile; active state = cobalt marker + stronger text, не залитая pill. |
| `page-header` | Один `h1`, короткий mono context и не более одного primary action; нижняя strong rule. |
| `section` | Заголовок + content, отделённые spacing/rule; background card только если секция действительно отдельный объект. |
| `toolbar` | Filters, search и actions в одной строке; на mobile переносится без горизонтального overflow. |
| `data-row` | Hairline rows, thumbnail + title как главная ячейка; hover/focus тональный, actions не hover-only. |
| `status-badge` | Compact pill допускается только для `Черновик`, `Опубликован`, `Скрыт`, availability и file status; всегда текстовый label. |
| `metric-group` | Одно dominant number, остальные метрики — rows; без декоративной карточки на каждое число. |
| `attention-list` | Strong top rule, нумерованные rows, один recovery link на row; cobalt только на action/count. |
| `form-field` | Label сверху, helper/error снизу, raised input, 1px border; focus ring cobalt, error border + text. |
| `slug-editor` | URL prefix и editable segment визуально разделены; availability/status находится рядом, warning о смене URL — до сохранения. |
| `error-summary` | Danger surface с левой/верхней rule, заголовком и ссылками к полям; не toast. |
| `feedback-banner` | Page/section message с коротким заголовком, причиной и следующим действием; semantic color не является единственным сигналом. |
| `toast` | Небольшая inverse surface для краткого noncritical success; не используется для единственного сообщения об ошибке. |
| `native-dialog` | Raised Paper, max radius `{rounded.lg}`, ясный title/body/actions; default focus визуально остаётся на отмене для destructive action. |
| `product-wizard` | Один шаг на main surface, постоянные Back/Continue и отдельный draft action; review — разделённые rows, не набор cards. |
| `step-indicator` | Desktop — четыре segments на rule; mobile — `Шаг n из 4` + короткая progress line. Current state виден текстом и cobalt marker. |
| `media-queue` | Dropzone с dashed border; каждый файл — row с thumbnail, metadata, реальным determinate byte-progress, отдельным `Обрабатываем…` после 100%, retry и reorder controls; общий batch count показывает `N из M`. |
| `settings-editor` | Desktop: section navigation + form + sticky live preview. Dirty save bar inverse. Mobile: секции stack/route, preview отдельной командой. |
| `store-header` | Редакционная шапка без glass overlay: mark/avatar, название, optional description и thin rule. |
| `catalog-view-toggle` | List/grid как compact segmented text controls; active marker и `aria-pressed`, не декоративная capsule. |
| `product-card` | Изображение доминирует; title/price/CTA следуют в reading order. Разделитель вместо тяжёлой card shadow. |
| `product-detail-media` | Большая media area, position counter и видимые controls; controls контрастны на конкретной фотографии. |
| `telegram-cta` | Общий cobalt primary style, короткий видимый label `Связаться о товаре`; accessible name добавляет товар и destination: `Связаться о товаре «…» в Telegram`. Назначение определяется текстом, не отдельным оттенком синего. |
| `copy-message-fallback` | Solid bordered panel с readonly message и action `Скопировать текст сообщения`. |
| `skeleton` | Повторяет геометрию будущего контента, neutral muted surface, без градиента; при reduced motion статичен. |
| `empty-state` | Встраивается вместо пустой структуры: короткий заголовок, причина и один следующий action; без stock illustration. |
| `import-mapper` | Spreadsheet-like rows и column mapping с hairline grid; ошибки строки локальны; оформление не обещает обязательность FR-9. |
| `product-state-control` | Lifecycle actions отделены от fields, текущий статус читаем текстом; publish — primary только когда guard выполнен. |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Строить иерархию grid, type и rules | Оборачивать каждый блок в rounded card |
| Использовать cobalt для action, focus и active state | Рассыпать cobalt по декоративным подписям и фонам |
| Давать публичным фото и названию editorial scale | Делать seller admin таким же крупным и разреженным |
| Показывать статусы текстом, иконкой и semantic color | Кодировать success/error одним цветом |
| Оставлять 6–10px radius и прямоугольный характер | Делать все кнопки, поля и navigation pills |
| Использовать thin rules и tonal surfaces | Возвращать glass, blur, gradients или тяжёлые shadows |
| Сохранять русскую типографику и короткие mono labels | Использовать Instrument Sans без Cyrillic или длинный tracked uppercase |
| Считать mockups иллюстрациями композиции | Копировать из mockup лимит, accent или поведение, противоречащие spine или PRD |
