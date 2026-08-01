---
name: Персональная витрина
description: Mobile-first minimal storefront system for small social sellers; monochrome, calm, product-first, with liquid-glass depth used sparingly.
status: draft
sources:
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\prd.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\addendum.md
  - C:\Work\projects\test01\_bmad-output\planning-artifacts\prds\prd-test01-2026-08-01\validation-report.md
updated: 2026-08-01
colors:
  surface-base: '#F7F7F5'
  surface-raised: '#FFFFFF'
  surface-glass: 'rgba(255,255,255,0.72)'
  surface-inverse: '#111111'
  ink-primary: '#111111'
  ink-secondary: '#5F5F5B'
  ink-tertiary: '#8B8B86'
  ink-inverse: '#FFFFFF'
  border-hairline: '#E2E2DE'
  border-strong: '#C8C8C2'
  accent-telegram: '#229ED9'
  success-soft: '#EDF7EF'
  warning-soft: '#F8F2E6'
  danger: '#B42318'
typography:
  display:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 32px
    fontWeight: '650'
    lineHeight: '1.12'
    letterSpacing: '-0.03em'
  title:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 22px
    fontWeight: '650'
    lineHeight: '1.2'
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 14px
    fontWeight: '550'
    lineHeight: '1.35'
  meta:
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.35'
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '7': 32px
  '8': 40px
  margin-mobile: 16px
  gutter-mobile: 12px
  section-gap: 28px
components:
  button-primary:
    background: '{colors.surface-inverse}'
    foreground: '{colors.ink-inverse}'
    radius: '{rounded.full}'
    min-height: 48px
  button-telegram:
    background: '{colors.accent-telegram}'
    foreground: '{colors.ink-inverse}'
    radius: '{rounded.full}'
    min-height: 48px
  product-card:
    background: '{colors.surface-raised}'
    border: '{colors.border-hairline}'
    radius: '{rounded.lg}'
  glass-panel:
    background: '{colors.surface-glass}'
    border: '{colors.border-hairline}'
    radius: '{rounded.xl}'
  store-header:
    background: '{colors.surface-glass}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.xl}'
  catalog-view-toggle:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    active-background: '{colors.surface-inverse}'
    active-foreground: '{colors.ink-inverse}'
    radius: '{rounded.full}'
  product-detail-media:
    background: '{colors.surface-raised}'
    radius: '{rounded.lg}'
  copy-message-fallback:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.lg}'
  analytics-summary-widget:
    background: '{colors.surface-glass}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.xl}'
  analytics-card:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-hairline}'
    radius: '{rounded.lg}'
  product-state-control:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.full}'
  slug-editor:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-hairline}'
    radius: '{rounded.md}'
  import-mapper:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-hairline}'
    radius: '{rounded.lg}'
  form-field:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border-hairline}'
    radius: '{rounded.md}'
  empty-state:
    background: '{colors.surface-base}'
    foreground: '{colors.ink-primary}'
    radius: '{rounded.lg}'
---

# Персональная витрина — DESIGN.md

## Brand & Style

Персональная витрина ощущается как аккуратная ссылка в профиле, которая внезапно стала полезной: не маркетплейс, не тяжёлый e-commerce кабинет, не конструктор с сотней настроек. Это спокойная, продуктовая, почти редакторская поверхность для маленького продавца.

Визуальный принцип: товар и CTA важнее интерфейса. Интерфейс должен исчезать, пока покупатель смотрит фотографии, цену и описание. Для продавца дизайн должен давать ощущение “я быстро собрал витрину, она выглядит достойно, можно публиковать”.

Liquid glass используется как тонкий слой глубины на шапках, sticky panels и dashboard cards. Это не декоративная тема и не повод снижать читаемость.

## Colors

Палитра почти монохромная:

- **Stone Base (`#F7F7F5`)** — основной фон. Не чисто белый, чтобы страница не выглядела как пустая админка.
- **White Raised (`#FFFFFF`)** — карточки товаров, поля, панели.
- **Soft Glass (`rgba(255,255,255,0.72)`)** — полупрозрачный слой для sticky CTA, dashboard summary и верхних панелей.
- **Ink (`#111111`)** — основной текст и главные действия.
- **Muted Ink (`#5F5F5B`, `#8B8B86`)** — вторичный текст, описания, метаданные.
- **Hairline (`#E2E2DE`)** — границы карточек и разделители.
- **Telegram Blue (`#229ED9`)** — только для Telegram handoff affordance; не использовать как общий брендовый акцент.

Load-bearing contrast pairs must meet WCAG AA for normal text:

- `{colors.ink-primary}` on `{colors.surface-base}`;
- `{colors.ink-primary}` on `{colors.surface-raised}`;
- `{colors.ink-inverse}` on `{colors.surface-inverse}`;
- `{colors.ink-inverse}` on `{colors.accent-telegram}`;
- `{colors.ink-primary}` on solid fallback for `{colors.surface-glass}`.

Запрет: цветные бейджи ради оживления, маркетплейсные красные скидки, градиентные hero-блоки, агрессивные тени.

## Typography

Один sans-serif стек: Inter/system. Он поддерживает и аккуратный consumer-facing вид, и практичный seller dashboard.

- `display` — только для крупных empty states и коротких hero-сообщений.
- `title` — названия магазина, товаров, основных экранов.
- `body` — описания товаров, поясняющий текст, формы.
- `label` — поля, действия, compact nav.
- `meta` — цена в карточке рядом с label, source labels, analytics captions.

Цены не должны превращаться в агрессивный e-commerce элемент. Цена заметная, но не “скидочная”.

## Layout & Spacing

Mobile-first диапазон MVP: 360–430px. Базовая сетка — один столбец, внутренние поля `16px`, расстояние между связанными элементами `8–12px`, между секциями `24–32px`.

Публичная витрина:

- шапка магазина сверху;
- необязательное описание;
- переключатель list/grid;
- каталог товаров;
- sticky или near-card CTA, если контекст не теряется.

Reference: [`mockups/storefront-mobile.html`](mockups/storefront-mobile.html) illustrates the public store header, grid catalog, product cards, and Telegram CTA rhythm.

Кабинет продавца:

- home dashboard первым показывает сегодняшнее состояние;
- primary action всегда один;
- списки товаров не должны выглядеть как таблица на мобильном.

Reference: [`mockups/seller-dashboard-mobile.html`](mockups/seller-dashboard-mobile.html) illustrates the seller home analytics hierarchy and bottom navigation. Spines win on conflict with mockups.

## Elevation & Depth

Иерархия строится тоном, spacing и стеклянными панелями, не тяжёлыми тенями. Разрешены:

- hairline border;
- very soft ambient shadow: `0 16px 40px rgba(17,17,17,0.06)`;
- blur behind glass panels only where текст остаётся читаемым.
- solid fallback for glass panels: use `{colors.surface-raised}` with `{colors.border-hairline}` when reduced transparency, low contrast mode, or rendering context makes blur unreliable.

Запрет: карточки, похожие на банковские промо-блоки; shadow ladder из 4–5 уровней.

## Shapes

Форма мягкая, но не игрушечная:

- `sm` для input и chips;
- `md` для compact cards;
- `lg` для product cards;
- `xl` для glass panels;
- `full` только для главных кнопок и small pills.

Фотографии товара повторяют радиус контейнера. Если фото квадратное, контейнер не должен “ломать” его в декоративную форму.

## Components

- **Product card** — фото, название, цена/“по запросу”, CTA. В grid-режиме 2 карточки в ряд; CTA может быть compact, но tap target не меньше 44px.
- **Product detail media** — фото-карусель или вертикальный просмотр; индикатор количества фото тихий, не ярче CTA.
- **Telegram CTA** — primary seller-contact action. Может использовать `{colors.accent-telegram}`, если это помогает распознать handoff; иначе primary black button допустим.
- **Glass panel** — dashboard summary, sticky public CTA, store header overlay. Использовать только при достаточном contrast.
- **Store header** — uses `store-header`; photo/avatar, name, optional description. If description is empty, spacing collapses without placeholder.
- **Catalog view toggle** — uses `catalog-view-toggle`; active state is visually clear without relying only on color.
- **Analytics summary widget** — uses `analytics-summary-widget`; today's store views dominate, top source appears as secondary context.
- **Analytics card** — uses `analytics-card`; число, короткая подпись, delta/source context только если это не превращает карточку в отчёт.
- **Product state control** — uses `product-state-control`; draft/published/hidden state is visible in seller surfaces.
- **Slug editor** — uses `slug-editor`; validation state appears inline, not as a toast-only error.
- **Import mapper** — uses `import-mapper`; table-like data stays simplified for mobile.
- **Form field** — label сверху, helper/error снизу, сохранение явно подтверждается.
- **Empty state** — короткий текст + один следующий шаг. Никаких иллюстраций, которые выглядят как SaaS stock art.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Давать товару и CTA визуальный приоритет | Делать интерфейс похожим на маркетплейсную ленту |
| Использовать монохром и Telegram blue только по делу | Украшать экран случайными цветами |
| Делать first-run коротким и уверенным | Показывать продавцу “панель управления бизнесом” до первой публикации |
| Сохранять читаемость поверх glass panels | Использовать blur ради эффекта |
| Держать mobile layout как основной | Проектировать desktop, а потом сжимать |
