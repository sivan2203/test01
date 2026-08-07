---
title: UX-исследование редизайна test01
date: 2026-08-07
status: complete
language: ru
---

# UX-исследование редизайна test01

## Назначение

Этот документ фиксирует доказательную базу для обновления UX test01. Он не заменяет `DESIGN.md` и `EXPERIENCE.md`: те остаются контрактами внешнего вида и поведения, а здесь объясняется, почему приняты конкретные решения.

Исследование отвечает на практические проблемы текущей реализации: одноэкранное создание товара, разорванный сценарий добавления фотографий, отсутствие per-file progress/retry, слабый seller dashboard, длинная форма настроек магазина, псевдомодальные подтверждения удаления, узкая desktop-компоновка и неполная поддержка состояний ошибок/загрузки.

## Объём и метод

Дата среза: **2026-08-07**.

Проверены текущие seller surfaces и базовые стили, в частности:

- `src/features/product/product-form.tsx` и `src/app/(seller)/seller/(admin)/products/new/page.tsx`;
- `src/features/product/product-media-manager.tsx` и `src/features/product/product-state-control.tsx`;
- `src/features/store/store-profile-form.tsx`;
- `src/app/(seller)/seller/(admin)/layout.tsx` и dashboard page;
- `src/app/globals.css`.

Источники разделены по уровню доказательности:

1. **Нормативы и первичные технические источники:** WCAG/WAI-ARIA/W3C, MDN, официальная документация Supabase.
2. **Руководства зрелых дизайн-систем:** GOV.UK, USWDS, Shopify, Cloudscape, Carbon. Это не нормативы, но проверенные operational patterns.
3. **Визуальное вдохновение:** Linear, Vercel Geist, Carbon Grid и референс Optimus. Они задают эстетическое направление, но не могут отменять требования доступности и поведения.

## Паттерн → конкретная проблема test01

| Паттерн | Проблема в test01 | Принятое решение | Основание |
|---|---|---|---|
| Многошаговая форма | Создание товара сейчас является одной формой; фото и публикация появляются уже после первого сохранения и ощущаются другим сценарием | Четыре шага: **Основное → Продажа → Фото → Проверка**. Stepper сообщает прогресс, а переход выполняют отдельные «Назад» и «Продолжить» | [W3C Multi-page Forms](https://www.w3.org/WAI/tutorials/forms/multi-page/), [USWDS Step Indicator](https://designsystem.digital.gov/components/step-indicator/), [GOV.UK Question Pages](https://design-system.service.gov.uk/patterns/question-pages/) |
| Check answers перед commit | Нет единого момента проверки карточки глазами продавца перед публикацией | Финальный buyer-like preview, сводка по секциям и доступные ссылки «Изменить», возвращающие на нужный шаг | [GOV.UK Check Answers](https://design-system.service.gov.uk/patterns/check-answers/) |
| Immediate local preview | Выбранные фото не становятся видимыми сразу; браузерный input отделён от уже сохранённой медиатеки | После выбора сразу показывать thumbnail через object URL, проверять тип/размер/лимит до загрузки и освобождать URL при удалении | [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications), [Cloudscape File Upload](https://cloudscape.design/components/file-upload/) |
| Per-file state и recovery | Загрузка выполняется общей пачкой; нет прогресса, индивидуальной ошибки и повтора без повторного выбора | Для каждого файла: `queued`, `uploading`, `success`, `error`; видимые progress/retry/cancel. Ошибка одного файла не очищает остальные | [Cloudscape File Token Group](https://cloudscape.design/components/file-token-group/), [MDN XMLHttpRequest upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) |
| Явная обложка | Обложкой неявно считается первое фото, но отдельной команды нет | Команда «Сделать обложкой» и badge «Обложка»; внутренне действие может перемещать фото на первую позицию | [Shopify product media](https://help.shopify.com/en/manual/products/product-media/add-media) |
| Reorder с эквивалентом без drag | Текущие стрелки функциональны, но модель порядка слабо выражена; drag-only был бы недоступен части пользователей | Drag на desktop как ускорение плюс всегда доступные «Выше/ниже» или «Переместить на позицию» для клавиатуры и touch | [WCAG Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [Technique G219](https://www.w3.org/WAI/WCAG22/Techniques/general/G219) |
| Operational seller home | Dashboard почти не объясняет, что требует внимания и что делать дальше | Один главный CTA «Добавить товар», setup health, задачи внимания, метрики 7/30 дней и последние товары | [Shopify Homepage template](https://shopify.dev/docs/api/app-home/patterns/templates/homepage), [Shopify App Home UX](https://shopify.dev/docs/apps/design/user-experience/app-home-page) |
| Sectioned settings + dirty state | Настройки магазина — длинная вертикальная форма без ясных групп и защиты несохранённых изменений | Разделы «Профиль», «Публичная ссылка», «Связь», «О витрине»; desktop live preview справа; Save/Discard bar только при dirty state | [Shopify Settings template](https://shopify.dev/docs/api/app-home/patterns/templates/settings), [Shopify Forms](https://shopify.dev/docs/apps/design/user-experience/forms), [Shopify Save Bar](https://shopify.dev/docs/api/app-home/apis/user-interface-and-interactions/save-bar-api) |
| Responsive navigation | Seller shell остаётся узким и использует нижнюю pill-навигацию даже на большом экране; подписи не локализованы | Desktop sidebar, mobile bottom navigation с safe area, русские короткие подписи и `aria-current` у активного пункта | [Shopify Layout](https://shopify.dev/docs/apps/design/layout), [Shopify Navigation](https://shopify.dev/docs/apps/design/navigation) |
| Настоящий modal dialog | Подтверждения удаления размечены как `alertdialog`, но имеют `aria-modal="false"`; фон остаётся интерактивным, destructive action получает initial focus | Нативный `<dialog>` через `showModal()`: inert background, focus containment, Escape, возврат фокуса в trigger; initial focus — «Отмена» | [WAI-ARIA Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [W3C Technique H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102), [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) |
| Разные empty/error/loading states | Обычные статусы, успехи и ошибки визуально и семантически смешиваются; retry и различие first-use/filter-empty выражены слабо | Отдельные состояния: first-use + CTA, filter-empty + reset, contextual error + retry, structure-matched skeleton, mutation pending и success status | [Carbon Empty States](https://carbondesignsystem.com/patterns/empty-states-pattern/), [Carbon Loading](https://carbondesignsystem.com/patterns/loading-pattern/), [Cloudscape Errors](https://cloudscape.design/patterns/general/errors/) |
| Error summary + inline errors | Сообщения об ошибках не всегда связаны с полем и могут использовать `role="alert"` для несрочных событий | После submit/Continue — focusable summary со ссылками на поля и совпадающие inline-сообщения; значения не теряются | [GOV.UK Error Summary](https://design-system.service.gov.uk/components/error-summary/), [W3C Form Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) |

## Принятые решения

### Создание товара

- Шаг 1 «Основное»: название и описание.
- Шаг 2 «Продажа»: цена и наличие.
- Шаг 3 «Фото»: выбор, immediate preview, загрузка, обложка и порядок.
- Шаг 4 «Проверка»: buyer-like preview, сводка, «Изменить», «Сохранить черновик» и «Опубликовать».
- На desktop stepper показывает короткие названия; на 360–430 px используется компактное «Шаг 2 из 4» без переполнения.
- Stepper не является навигационным меню. Текущий шаг имеет программное обозначение, каждый экран — собственный `h1`.
- «Продолжить» валидирует текущий шаг. Browser Back и кнопка «Назад» не должны терять введённые данные.
- Редактирование уже созданного товара может оставаться секционным редактором: обязательный wizard нужен для первого создания, а не для каждой регулярной правки.

### Фотографии

- File picker и drag-and-drop равноправны; drag не является единственным способом.
- Ограничения JPG/PNG/WebP, 6 MB и максимум 10 фото видны до выбора и повторяются рядом с ошибкой.
- Каждый файл остаётся отдельным объектом интерфейса с thumbnail, названием/размером, состоянием, progress и recovery action.
- При ошибке сохраняются ещё не загруженные `File` и уже успешные результаты; пользователь повторяет только неудавшийся файл.
- Обложка задаётся явно, но backend-инвариант «первое фото = обложка» сохраняется.
- На мобильной сети одновременно отправляются не более 2–3 файлов.

### Seller dashboard, каталог и настройки

- Home отвечает на три вопроса: что происходит, что требует внимания, какое следующее действие.
- Главный CTA один — «Добавить товар». Setup checklist охватывает профиль, slug, Telegram и первый опубликованный товар.
- Product index на desktop использует более широкий список/таблицу с фильтрами и действиями, на mobile — stacked rows/cards без горизонтальной таблицы.
- Настройки магазина не превращаются в wizard: это повторяемая задача, поэтому используются логические секции, dirty-state bar и live preview.
- На desktop seller navigation переходит в sidebar; mobile bottom bar учитывает safe area и не закрывает контент или фокус.

### Диалоги и сообщения

- Modal используется только для решений, требующих прерывания: удаление товара/фото и другие необратимые изменения.
- Ошибки загрузки и сохранения показываются около источника проблемы, не в modal.
- `role="status"`/polite live region используется для progress и успеха; `role="alert"` — только для срочной ошибки, требующей немедленного внимания.
- Toast сообщает короткий неcritical success, но не заменяет видимое обновление данных на экране.

## Отклонённые и условные паттерны

| Паттерн | Статус | Причина |
|---|---|---|
| Полный stepper с четырьмя длинными подписями на mobile | Отклонён | Съедает ширину и ухудшает reflow; используется компактный счётчик шага |
| Wizard для регулярных настроек магазина | Отклонён | Затрудняет быстрый переход к одной настройке; предпочтительны секции и dirty state |
| Drag-only reorder | Отклонён | Не соответствует WCAG 2.2 Dragging Movements и плохо работает с клавиатурой/touch |
| Modal для ошибок API или загрузки | Отклонён | Ошибка должна быть contextual и давать retry рядом с источником |
| Uppy Dashboard как обязательная зависимость | Не принято | Его UX полезен как референс per-file progress/retry, но собственная реализация должна сначала доказать необходимость зависимости; см. [Uppy Dashboard](https://uppy.io/docs/dashboard/) |
| Supabase TUS/resumable upload | **Условно** | [Supabase рекомендует resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) для нестабильной сети, progress и resume, но смена транспорта затрагивает backend/auth/storage flow. До принятия нужен spike: signed/authenticated upload, RLS и ownership, запись media metadata, cleanup orphan files, reorder/cover invariant, retry после обрыва и E2E на throttled mobile network. Без доказательства backend не менять |
| Instrument Sans для русского UI | Отклонён | Официальные metadata перечисляют Latin/Latin Extended, но не Cyrillic: [Google Fonts metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentsans/METADATA.pb) |
| Liquid glass, blur и pill-контейнеры как основной язык | Отклонён | Снижают информационную плотность и противоречат выбранной neo-Swiss/editorial-tech иерархии; допустимы только редкие функциональные исключения |
| Автоматический dark mode без отдельной проработки | Отклонён на этот этап | Тёплая светлая палитра является намеренным направлением; dark theme требует самостоятельных токенов, контрастных пар и QA |

## Accessibility floor и responsive-правила

Нормативная база — [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

- **Reflow:** проверка на 360, 390, 412 и 430 px, а также при эквиваленте 320 CSS px/400% zoom; без горизонтального scrolling основного контента. Основание: [Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **Target size:** WCAG AA требует минимум 24×24 CSS px с оговорёнными исключениями; продуктовый floor test01 — 44×44 px для touch-контролов. Основание: [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
- **Sticky/fixed UI:** bottom navigation и action bars резервируют место в layout, используют `scroll-padding` и не закрывают focused control. Основание: [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Techniques/failures/F110).
- **Safe area:** mobile bottom bar использует `padding-bottom: calc(base + env(safe-area-inset-bottom))`; см. [MDN `env()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env).
- **Keyboard:** последовательность Tab совпадает с визуальным чтением; reorder и все действия wizard доступны без pointer gestures.
- **Focus:** видимый focus indicator не полагается на цвет фона и имеет достаточный контраст с соседними цветами.
- **Color:** active, error, success и cover состояния обозначаются не только цветом, но и текстом/иконкой. Основание: [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color) и [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).
- **Validation:** поле получает `aria-invalid` и `aria-describedby`; summary получает фокус после неуспешного submit и ведёт к ошибочному полю. Основание: [Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification).
- **Status messages:** загрузка, успешное сохранение и изменение порядка объявляются без переноса фокуса. Основание: [Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
- **Dialog:** `showModal()` обеспечивает top layer и inert background; Escape закрывает отменяемый dialog, а после закрытия фокус возвращается в кнопку открытия. Destructive action не получает initial focus.
- **Reduced motion:** нормальные transitions ограничены короткой обратной связью примерно 120–180 ms. При `prefers-reduced-motion: reduce` отключаются transform-анимации, smooth scroll и shimmer; determinate upload progress остаётся функциональным. Основание: [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).

## Кириллическая типографика

Принято использовать **Onest Variable** как основной UI/display sans. Это геометрический humanist grotesk, рассчитанный на экраны; версия 2.000 от 2026-08-03 расширила кириллицу, а официальные Google Fonts metadata подтверждают Cyrillic/Cyrillic Extended и variable weight 100–900: [репозиторий Onest](https://github.com/simpals/onest), [metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/onest/METADATA.pb).

**JetBrains Mono** используется только для ID, нумерации шагов, коротких статусов и числовых метрик, но не для длинного текста: [официальная страница JetBrains Mono](https://www.jetbrains.com/lp/mono/).

Технические правила:

- self-hosted/local WOFF2 без runtime-запросов к внешнему font CDN;
- только необходимые Cyrillic + Latin subsets и диапазоны weight;
- `font-display: swap` и близкий по метрикам системный fallback;
- не использовать synthetic italics, если выбранный файл их не содержит;
- не применять агрессивный uppercase tracking к кириллице;
- QA-строка включает `Ё/ё, Й/й, Д, Л, Ж, Щ, Ц`, ₽, длинные названия магазина, Telegram username и tabular analytics numbers.

Рекомендации по загрузке шрифтов: [web.dev Font best practices](https://web.dev/articles/font-best-practices), [MDN `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40font-face/font-display).

## Визуальное вдохновение — не стандарт

Ни один источник в этом разделе не является основанием для семантики, keyboard behavior или доступности.

- [Optimus](https://v0-optimus-delta.vercel.app/) — источник редакционного масштаба, номерных секций, строгой сетки и developer-metadata мотива. Не переносить marquee, огромные пустоты, бледный текст и scroll effects в seller admin.
- [Linear: Behind the latest design refresh, 2026-03-12](https://linear.app/now/behind-the-latest-design-refresh) — главный контент доминирует, навигация отступает, декоративные treatment и лишние иконки сокращаются, тёплый gray сохраняет чёткость.
- [Vercel Geist](https://vercel.com/geist/introduction), [Colors](https://vercel.com/geist/colors), [Typography](https://vercel.com/geist/typography) — ясные роли background/border/text и mono для metadata. Это не выбор кириллического шрифта.
- [Carbon 2x Grid](https://carbondesignsystem.com/elements/2x-grid/overview/) — 8 px foundation, responsive columns, keylines и плотное выравнивание operational content.

Принятое эстетическое направление: тёплый near-white фон, графитовый текст, один contrast-tested кобальтовый accent, 8 px spacing grid, тонкие правила, минимальные тени и радиусы порядка 6–10 px. Pills остаются для фильтров и статусов. Публичная витрина может использовать более крупную editorial type scale; seller admin сохраняет компактную плотность и приоритет операций.

## Критерий применения исследования

Паттерн считается реализованным не по внешнему сходству с референсом, а когда решена соответствующая проблема test01 и подтверждены keyboard, screen-reader, 360–430 px, reduced-motion, failure/retry и data-preservation сценарии. При конфликте эстетического референса с нормативом или поведенческим контрактом приоритет имеют WCAG/WAI-ARIA и `EXPERIENCE.md`.
