---
name: Персональная витрина
status: final
sources:
  - ../../prds/prd-test01-2026-08-01/prd.md
  - ../../prds/prd-test01-2026-08-01/addendum.md
  - ../../prds/prd-test01-2026-08-01/validation-report.md
  - DECISIONS.md
  - RESEARCH.md
  - AUDIT.md
updated: 2026-08-07
---

# Персональная витрина — поведенческий контракт

## Foundation

Персональная витрина — один responsive web-продукт для продавца и покупателя. Основной язык интерфейса — русский. Обязательная тема этого этапа — светлая. Реализация наследует существующие Next.js, React, Tailwind и CVA primitives; новая UI-библиотека не требуется. Нативный `<dialog>`, Server Actions, same-origin Route Handler/XHR для media и текущий Supabase-контракт остаются основой.

`DESIGN.md` определяет внешний вид и токены. Этот документ определяет information architecture, поведение, состояния, взаимодействие, доступность и journeys. PRD сохраняет бизнес-границы:

- Покупателю не нужен аккаунт.
- Telegram — единственный MVP contact channel.
- Нет marketplace discovery, корзины, оплаты, доставки, внутреннего чата, заказов, отзывов и CRM.
- FR-9 Excel/CSV import остаётся `Should / conditional` и не задерживает manual core loop.
- Публично видны только Опубликованные товары; Черновики, Скрытые и удалённые товары не раскрываются.

Иллюстративные композиции:

- [`mockups/key-seller-dashboard-desktop.html`](mockups/key-seller-dashboard-desktop.html) — seller shell и operational dashboard;
- [`mockups/key-product-wizard-review.html`](mockups/key-product-wizard-review.html) — review шага 4 на desktop и 390px;
- [`mockups/key-product-media-dialog.html`](mockups/key-product-media-dialog.html) — media queue и destructive dialog;
- [`mockups/key-store-settings-preview.html`](mockups/key-store-settings-preview.html) — settings sections, preview и dirty state;
- [`mockups/key-public-storefront-product.html`](mockups/key-public-storefront-product.html) — публичная Карточка товара;
- [`mockups/storefront-mobile.html`](mockups/storefront-mobile.html) и [`mockups/seller-dashboard-mobile.html`](mockups/seller-dashboard-mobile.html) — ранние mobile composition references.

**Spines имеют приоритет над mockups.** Иллюстрации не задают transport, storage limits, semantic roles или бизнес-правила. Канонические лимиты: товарное изображение до 6 MiB, максимум 10; avatar до 2 MiB.

## Information Architecture

### Seller surfaces

| Surface | Вход | Назначение |
|---|---|---|
| Seller auth | Прямой URL / redirect protected route | Magic-link регистрация и вход; buyer auth отсутствует |
| Seller home dashboard | После входа | Setup health либо метрики за сегодня/7 дней, attention queue, главный action |
| Product list | Seller navigation / dashboard | Фильтры по lifecycle, поиск, responsive rows и переход к редактированию |
| Product create wizard | `Добавить товар` | Четыре шага создания, draft persistence, фото, review и явная публикация |
| Product editor | Product row / review `Изменить` | Секционное редактирование существующего товара и отдельный lifecycle control |
| Import drafts | Product list | Условный FR-9: file mapping, preview и создание только Черновиков |
| Analytics detail | Dashboard / navigation | Сегодня и 7 дней по Магазину, Товарам и источникам |
| Store settings | Navigation / setup task | Профиль, Публичная ссылка, Связь, О витрине; dirty state и preview |
| Preview as buyer | Dashboard / settings | Авторизованный просмотр сохранённой публичной структуры без analytics events |

### Buyer surfaces

| Surface | Вход | Назначение |
|---|---|---|
| Public storefront | `/:storeSlug` | Store header, list/grid каталог и CTA из карточки |
| Product detail | Карточка в каталоге / permalink | Галерея, title, price, availability, description и contextual Telegram CTA |
| Telegram handoff | CTA | Server-trusted message, analytics best-effort, external deep link |
| Copy-message fallback | Deep-link failure | Сохранить покупателя на странице и дать скопировать тот же message context |
| Empty store | Существующий Магазин без Опубликованных товаров | Объяснить отсутствие каталога без server-error framing |
| Not found | Неизвестный/старый slug или непубличный товар | Entity-specific 404 без утечки приватного состояния |

Seller navigation: desktop sidebar при достаточной ширине; mobile bottom navigation `Сводка / Товары / Аналитика / Магазин`. Активный route отмечен `aria-current="page"`. Settings используют вторичную section navigation, но не отдельный onboarding wizard. Buyer surfaces не показывают app navigation.

Публичная доступность начинается после первого Опубликованного товара. Activation success по SM-1/SM-2 остаётся отдельной метрикой: три Опубликованных товара.

## Трассировка UJ и FR

### User journeys

| ID | Имя из PRD | Покрытие |
|---|---|---|
| UJ-1 | Анна запускает витрину для handmade-товаров за один мобильный сеанс | Key Flow UJ-1; settings, product wizard, media queue, publish success |
| UJ-2 | Игорь переносит существующий каталог из Excel в черновики | Key Flow UJ-2; только если FR-9 входит в release |
| UJ-3 | Мария переходит из Telegram-поста и пишет продавцу о товаре | Key Flow UJ-3; storefront, detail, Telegram handoff и fallback |
| UJ-4 | Продавец проверяет, что сработало сегодня | Key Flow UJ-4; dashboard, zero state и analytics detail |
| UJ-5 | Анна смотрит свою витрину глазами покупателя | Key Flow UJ-5; preview ownership и analytics exclusion |

### Functional requirements

| ID и имя из PRD | UX surface / контракт |
|---|---|
| FR-1: Seller registration and login | Seller auth, сохранённая seller session и protected-route return |
| FR-2: Store profile editing | `settings-editor`: Профиль и О витрине |
| FR-3: Editable public store link | `slug-editor`, uniqueness feedback и предупреждение, что старый slug даст 404 |
| FR-4: Store preview | Preview as buyer; сохранённые данные, ownership, без публичной аналитики |
| FR-5: Manual product creation | `product-wizard`, draft и явный publish |
| FR-6: Product media management | `media-queue`, 1–10 фото для публикации, cover/reorder/delete/retry |
| FR-7: Product lifecycle states | `product-state-control`: Черновик, Опубликованный, Скрытый, delete 404 |
| FR-8: Product list management | Filtered responsive `data-row` list/table |
| FR-9: Excel/CSV import to drafts | Условный `import-mapper`; только Черновики и построчные результаты |
| FR-10: Public storefront rendering | Storefront без buyer auth; только Опубликованные товары |
| FR-11: Catalog display modes | `catalog-view-toggle`; list/grid сохраняется локально |
| FR-12: Product detail page | `product-detail-media`, полный description и mobile-visible CTA |
| FR-13: Empty and unavailable states | Entity-specific empty, disabled и 404 patterns |
| FR-14: Messenger configuration | Settings section Связь; только валидный Telegram username |
| FR-15: Prefilled product-context message | Server-trusted title, price/`по запросу` и product link; editable in Telegram |
| FR-16: CTA from catalog and product detail | Один product context на CTA; event до handoff, fallback при сбое |
| FR-17: Seller home dashboard | Главная метрика сегодня, zero state, top source при наличии данных |
| FR-18: Basic analytics events | Store view, product view, CTA click; preview/bots исключены |
| FR-19: Traffic source tracking | UTM/source precedence, `unknown`, session propagation |
| FR-20: Product-level analytics summary | Сегодня и 7 дней; views и CTA clicks без обещания purchase data |
| FR-21: Mobile-first responsive surfaces | Полные flows на 320–430px, 44×44 targets, intentional desktop |
| FR-22: Minimal visual language | `DESIGN.md`: warm near-white, graphite, pink, no glass/cardification |

## Voice and Tone

Microcopy спокойный, конкретный и честный. Brand posture живёт в `DESIGN.md`; интерфейс говорит о факте, причине и следующем действии.

| Do | Don't |
|---|---|
| `Черновик сохранён.` | `Успешно! Всё получилось 🎉` |
| `Не удалось загрузить фото. Файл сохранён — повторите.` | `Upload failed.` |
| `По этим фильтрам товаров нет.` + `Сбросить фильтры` | `Ничего не найдено.` без recovery |
| `Контакт продавца пока не настроен.` | Невалидная Telegram-ссылка |
| `Старая ссылка перестанет работать.` | Скрыто менять slug без последствия в copy |
| `Сегодня просмотров пока нет. Поделитесь ссылкой.` | `Ваша аналитика пуста.` |
| `Откроем Telegram с названием, ценой и ссылкой.` | `Начать сделку` или обещание отправленного сообщения |

Кнопка называет действие: `Сохранить`, `Повторить загрузку`, `Опубликовать товар`, `Удалить фотографию`. Pending label остаётся глагольным: `Сохраняем…`, `Загружаем…`; duplicate submit недоступен.

## Component Patterns

Визуальные правила находятся в `DESIGN.md.Components`.

| Компонент | Где | Поведенческий контракт |
|---|---|---|
| `button` | Везде | Primary на surface один. Pending блокирует повторный submit и сохраняет ширину. Disabled имеет доступную причину рядом или в description. Uses `{components.button}`. |
| `icon-button` | Rows, gallery, queue | Имеет accessible name, 44×44 target и видимый disabled state; действие не зависит от hover. Uses `{components.icon-button}`. |
| `seller-shell` | Все seller routes | Содержит skip link, navigation и один `main`; сохраняет route context при loading/error. Uses `{components.seller-shell}`. |
| `seller-navigation` | Seller shell | Русские labels, active `aria-current="page"`; desktop sidebar и mobile bottom bar являются одной IA. Uses `{components.seller-navigation}`. |
| `page-header` | Route top | Один `h1`, context и до одного primary action; status не подменяет заголовок. Uses `{components.page-header}`. |
| `section` | Settings, dashboard, detail | Группирует только связанные элементы; heading участвует в outline. Uses `{components.section}`. |
| `toolbar` | Products, analytics | Search/filter/actions; обновление results объявляется, filter state доступен с клавиатуры. Uses `{components.toolbar}`. |
| `data-row` | Products, analytics, import | Главная ссылка открывает сущность; lifecycle/action menu — отдельные controls. Mobile row сохраняет тот же reading order. Uses `{components.data-row}`. |
| `status-badge` | Lifecycle, availability, files | Текстом сообщает состояние; semantic color — дополнительный сигнал. Uses `{components.status-badge}`. |
| `metric-group` | Dashboard/analytics | Главное число = store views today; вторичные rows = product views, CTA clicks, top source. Не обещает purchase/message sent. Uses `{components.metric-group}`. |
| `attention-list` | Dashboard | Показывает только actionable items: incomplete setup, no photo, availability. Один recovery action на строку. Uses `{components.attention-list}`. |
| `form-field` | Все формы | Label, input, helper/error связаны через IDs; server error не очищает value. Validation выполняется на Continue/Submit, не во время обычного ввода. Uses `{components.form-field}`. |
| `slug-editor` | Публичная ссылка | Client format check + debounced availability hint, но сервер решает uniqueness. Смена сохранённого slug требует объяснения 404 старой ссылки и подтверждения. Uses `{components.slug-editor}`. |
| `error-summary` | Multi-field submit failure | Получает focus, перечисляет те же сообщения, что у fields, и ведёт к каждому полю. Uses `{components.error-summary}`. |
| `feedback-banner` | Route/section error, offline | Сообщает что произошло, что сохранено и какое recovery действие доступно. Не используется для краткого success. Uses `{components.feedback-banner}`. |
| `toast` | Noncritical success | Короткий polite status; не содержит единственный путь к данным или recovery. Uses `{components.toast}`. |
| `native-dialog` | Delete, подтверждение смены публичного URL | Открывается `showModal()`, фон inert, Tab остаётся внутри, Escape закрывает, focus возвращается trigger. Для destructive action initial focus — `Отмена`. Modal stack максимум один. Uses `{components.native-dialog}`. |
| `product-wizard` | Создание товара | Шаги `Основное → Продажа → Фото → Проверка`. Back/Continue сохраняют state; draft создаётся не позднее входа на Фото для `productId`. Review содержит buyer-like preview и `Изменить`. Uses `{components.product-wizard}`. |
| `step-indicator` | Product wizard | Информационный, не заменяет Back/Continue и не является произвольной навигацией. Current item имеет `aria-current="step"`; mobile сообщает `Шаг n из 4`. Uses `{components.step-indicator}`. |
| `media-queue` | Wizard Фото / product editor | Immediate object-URL preview; local type/size/count validation; per-file `queued/uploading/processing/success/error`; retry не теряет соседей. XHR отправляет один файл одним same-origin Route Handler request и показывает реальный browser→route byte progress. После 100% item переходит в `processing`, пока общий server service повторно проверяет signature/type/size/ownership и сохраняет metadata. Upload выполняется последовательно (`concurrency = 1`), потому что текущий order RPC требует безопасной очередности. Fake progress запрещён. Cover = position 0; drag optional, Up/Down обязательны. Uses `{components.media-queue}`. |
| `settings-editor` | Store settings/setup | Sections `Профиль / Публичная ссылка / Связь / О витрине`. Desktop inline preview отражает local form state и отмечает unsaved; mobile preview — отдельная команда. Save/Discard bar существует только при dirty state. Uses `{components.settings-editor}`. |
| `store-header` | Storefront/preview | Avatar, title, optional descriptions; пустые поля схлопываются. Preview indicator seller-only. Uses `{components.store-header}`. |
| `catalog-view-toggle` | Storefront | List/grid имеет `aria-pressed`; выбор сохраняется локально и не меняет состав товаров. Uses `{components.catalog-view-toggle}`. |
| `product-card` | Catalog | Card link открывает detail; отдельный CTA запускает handoff именно этого товара. В grid/list доступны одинаковые данные. Uses `{components.product-card}`. |
| `product-detail-media` | Product detail/preview | Swipe + видимые Previous/Next; counter и thumbnail selection; cover первая. Position объявляется как `Фото n из total: title`. Uses `{components.product-detail-media}`. |
| `telegram-cta` | Catalog/detail | Запрашивает server-trusted handoff, фиксирует CTA best-effort до внешнего перехода и не блокируется ошибкой analytics. Uses `{components.telegram-cta}`. |
| `copy-message-fallback` | Handoff failure | Остаётся на текущем товаре, показывает тот же server-trusted message и `Скопировать текст сообщения`; альтернативные контакты не добавляются. Uses `{components.copy-message-fallback}`. |
| `skeleton` | Cold route/data load | Повторяет конечную структуру, container получает `aria-busy`; декоративные shapes скрыты от screen reader. Uses `{components.skeleton}`. |
| `empty-state` | Dashboard/list/storefront/search | Различает first-use, no data и no results; объясняет причину и даёт один следующий action. Uses `{components.empty-state}`. |
| `import-mapper` | Conditional FR-9 | File → mapping → row preview → drafts; частичная ошибка не отменяет успешные rows. Не публикует автоматически. Uses `{components.import-mapper}`. |
| `product-state-control` | Product editor/list | Save fields не меняет lifecycle. Publish/hide/delete — отдельные команды; publish guard проверяет обязательные data и 1–10 valid photos. Uses `{components.product-state-control}`. |

## State Patterns

### Surface states

| Surface / состояние | Treatment и recovery |
|---|---|
| Seller auth pending | Кнопка `Отправляем ссылку…`; email остаётся видимым, повтор недоступен до завершения |
| Seller auth success/error | Success сообщает следующий шаг; error сохраняет email и даёт повтор без смены auth-модели |
| First seller login | Setup health + `Создать витрину`; аналитический chrome не изображает несуществующие данные |
| Dashboard cold load | Structure-matched `skeleton`; navigation и `h1` стабильны |
| No analytics today | Ноль как честное значение + `Поделиться ссылкой`; не error |
| Dashboard refresh error | Не подменять ошибку нулевыми метриками; показать contextual warning и локальный retry |
| Product list first-use | `Добавьте первый товар` + один CTA |
| Product filter empty | `По этим фильтрам товаров нет` + `Сбросить фильтры`; не first-use copy |
| Product list load error | Local banner + `Повторить`; не показывать empty вместо ошибки |
| Wizard draft | Draft state и время сохранения видимы; создание draft не публикует товар |
| Wizard validation failure | Inline errors + focused `error-summary`; текущий шаг остаётся открыт, values сохранены |
| Wizard save failure | Values и current step сохранены; retry только текущей mutation |
| Product draft missing photo | Draft разрешён; publish disabled с объяснением `Добавьте хотя бы одно фото` |
| File rejected locally | Unsupported type, >6 MiB или превышение 10 не входит в upload queue; valid соседние files сохраняются |
| File `queued` | Thumbnail виден сразу; text status `В очереди` |
| File `uploading` | Реальный determinate browser→route byte progress; общий count показывает завершённые items `N из M` |
| File `processing` | Передано 100%; text status `Обрабатываем…`, пока сервер проверяет и сохраняет файл; не изображать этот этап как дополнительный byte-percent |
| File `success` | Text status `Загружено`, item persisted, общий count обновлён |
| File `error` | File object и thumbnail сохранены; причина + `Повторить`; успешные соседние files не повторяются |
| Saved photo delete | `native-dialog` с thumbnail/name; после confirm очередь и cover пересчитываются, focus возвращается в логичный соседний control |
| Dirty settings | Save/Discard bar; navigation away предупреждает только при реальной потере unsaved state |
| Slug taken/invalid | Inline error у `slug-editor`; другие settings values не теряются |
| Saved slug change | До commit показать, что old URL вернёт 404; cancel возвращает focus и сохраняет form state |
| Store profile incomplete | Dashboard attention item ведёт прямо в незаполненную section |
| Storefront cold load | Store header/product geometry skeleton; без spinner-only page |
| No published products | Public empty store message; route остаётся 200 |
| Missing store / product | Разные 404 copy; не раскрывать draft/hidden/foreign entity |
| Telegram not configured | Disabled CTA с текстом причины; seller получает setup task |
| Telegram handoff error | `copy-message-fallback`; покупатель остаётся на том же product context |
| Seller preview | Visible seller-only preview indicator; views и CTA не пишутся как public analytics |
| Offline seller mutation | Сохранить текущий view/form; banner сообщает, что publish/upload ждёт соединения, и даёт retry |
| Conditional import partial success | Успешные rows становятся Черновиками, ошибочные rows остаются с локальной причиной |

### Feedback taxonomy

| Сигнал | Когда | Семантика / focus |
|---|---|---|
| Inline field error | Ошибка одного значения | `aria-invalid`, `aria-describedby`; focus не перемещается во время ввода |
| `error-summary` | Submit/Continue с несколькими ошибками | `role="alert"` или эквивалентная объявляемая область; программный focus и links к fields |
| `feedback-banner` | Route/section load error, offline, permission/unavailable | Контекстный alert/status с recovery; modal не используется |
| Polite status | Upload milestones, processing, batch count, save/reorder complete | `role="status"`; объявлять значимые изменения один раз без переноса focus |
| `toast` | Короткий noncritical success | Polite, auto-dismiss только если сообщение не нужно для действия |
| `native-dialog` | Необратимое или link-breaking решение | Focus containment, Escape, Cancel initial focus, return focus |
| `skeleton` | Initial structure load | `aria-busy` на container; shapes `aria-hidden`, после load объявить готовый region при необходимости |

## Interaction Primitives

- Tap/click — основной input; никакого hover-only action.
- Browser Back и видимая `Назад` в wizard сохраняют текущие данные. Stepper не кликабелен как произвольный shortcut.
- Product fields autosave только как Черновик и только с ясным status. Publish, hide, delete и смена сохранённого slug требуют явного действия.
- File picker и dropzone эквивалентны. Выбор сразу создаёт preview; object URLs освобождаются при remove/unmount.
- Единственное нормативное определение upload transport, progress и последовательности находится в контракте `media-queue` раздела Component Patterns выше; interaction layer не переопределяет его.
- Drag reorder допускается как ускорение на desktop. Кнопки `Выше/ниже` или `Переместить на позицию` доступны клавиатуре и touch всегда; после действия polite status сообщает новую позицию.
- Удаление local queued file до сохранения не требует modal; удаление persisted photo/product требует `native-dialog`.
- Modal stack не превышает один уровень. Browser-native `alert`, `confirm`, `prompt` запрещены.
- Gallery поддерживает swipe, buttons и thumbnail selection; конец списка не зацикливается без явного решения.
- Telegram handoff использует текущий product context. Analytics failure не блокирует deep link или copy fallback.
- Banned в MVP: infinite feed, cart, checkout, order status, internal chat, buyer login, reviews и alternative contact UI.

## Accessibility Floor

- WCAG 2.2 AA для seller и buyer core flows.
- На каждом route один логичный `h1`, skip link к `main`, landmarks и document title с текущей сущностью.
- Tab order совпадает с visual order. Active seller navigation использует `aria-current="page"`; wizard — `aria-current="step"`.
- Все primary и icon touch targets не меньше 44×44 CSS px.
- Reflow без horizontal page scroll при 320 CSS px/400% zoom; обязательные device checks — 320, 360, 390, 412 и 430px.
- Visible focus использует `{colors.accent-pink}` и не закрывается sticky navigation/savebar. Layout резервирует высоту fixed controls и применяет scroll padding.
- Mobile fixed surfaces используют `padding-bottom: calc(base + env(safe-area-inset-bottom))`.
- `form-field` связывает label/helper/error; `error-summary` получает focus только после failed Continue/Submit и не дублирует screen-reader announcement бесконечно.
- `native-dialog`: `showModal()`, inert background, Tab/Shift+Tab внутри, Escape, видимая Cancel, return focus. Destructive action не получает initial focus.
- `media-queue`: input имеет label/constraints; file status и общий count доступны без цвета; screen reader получает milestones и переход `100% → Обрабатываем → Загружено`, а не каждый progress tick.
- Reorder доступен без drag; после перемещения объявляются номер фото, прежняя и новая позиция.
- Gallery image label: `Фото {n} из {total}: {product title}`; controls сообщают previous/next и disabled/end state.
- Status, availability, cover и errors не передаются только цветом.
- Skeleton не создаёт речевой шум; loading container использует `aria-busy`.
- При `prefers-reduced-motion: reduce` отключаются transform transitions, smooth scroll и shimmer. Determinate progress обновляет ширину без декоративной анимации; `processing` всегда имеет текстовый status.
- Public CTA на mobile не перекрывает description/facts и остаётся reachable при zoom и virtual keyboard.

## Responsive & Platform

| Viewport | Seller behavior | Buyer behavior |
|---|---|---|
| 320–430px | Одна колонка; bottom navigation; compact `Шаг n из 4`; media rows stack; settings preview отдельной командой; safe-area action bars | Две catalog cards в grid, list alternative; media сверху; contextual CTA в первом экране или safe sticky zone |
| 431–767px | Та же IA, больше whitespace; toolbar переносится; table остаётся rows | Более широкие cards/media, без desktop-only identity rail |
| 768–1023px | Bottom/top compact navigation по доступной ширине; dashboard и settings могут использовать две колонки без fixed preview | Storefront centered/fluid; product detail может стать split, если reading order сохраняется |
| 1024–1279px | Постоянный sidebar; full-width rows/table; settings form + preview при достаточной ширине | Editorial split; gallery controls видимы без hover |
| 1280px+ | Dashboard summary + attention columns, wide product index, max рабочей области около 1440–1600px | Large media + details; related products ниже, не marketplace feed |

Responsive web не имитирует native app и не добавляет PWA prompts в MVP. Mobile navigation и desktop sidebar — разные представления одной IA, а не разные продукты.

## Inspiration & Anti-patterns

Визуальные источники описаны в `RESEARCH.md` и не являются поведенческими стандартами.

- Из Linear берётся дисциплина внимания: главный content доминирует, navigation отступает.
- Из Vercel Geist и Carbon Grid берутся роли surface/border/text, tight alignment и 8px foundation.
- Из Optimus берутся numbered sections и editorial-tech tension, но не marquee, pale copy, excessive whitespace или scroll effects.
- Из link-in-bio tools сохраняется одна публичная ссылка; из classifieds — direct product-to-contact path; из social analytics — только наблюдаемые events.

Отклонено: marketplace feed, store-builder blocks, decorative analytics charts, click-through stepper, drag-only reorder, error modal, fake progress, automatic dark theme, glassmorphism, buyer account и internal chat.

## Key Flows

### UJ-1 — Анна запускает витрину для handmade-товаров за один мобильный сеанс

1. Анна входит по magic link с телефона.
2. Setup dashboard предлагает `Создать витрину`.
3. В settings sections она заполняет название, avatar, описание, slug и Telegram; занятый slug исправляется inline без потери полей.
4. Анна нажимает `Добавить товар` и проходит `Основное`, затем `Продажа`.
5. Перед шагом `Фото` система сохраняет Черновик и получает `productId`.
6. Анна выбирает фотографии; previews появляются сразу. Один неудачный файл остаётся в очереди, Анна нажимает `Повторить`, затем явно выбирает обложку.
7. На `Проверке` Анна видит buyer-like preview, возвращается через `Изменить` при необходимости и нажимает `Опубликовать товар`.
8. После первого Опубликованного товара система показывает public link, `Посмотреть как покупатель` и `Добавить товар`.
9. Анна повторяет короткий product flow до трёх товаров — activation threshold, не условие публичности.
10. **Climax:** Анна открывает опубликованную ссылку и видит готовую к распространению Витрину с тремя товарами.

Failure: save/upload/network error сохраняет form values, queue и Черновик; recovery относится только к неудавшемуся шагу/файлу.

### UJ-2 — Игорь переносит существующий каталог из Excel в черновики

Этот flow действует только если FR-9 включён в release.

1. Игорь открывает `Товары → Импорт` и выбирает Excel/CSV.
2. Система распознаёт или просит сопоставить колонки.
3. Игорь проверяет row preview; unsupported optional fields не блокируют остальные строки.
4. Система создаёт только Черновики и показывает построчный результат.
5. Игорь открывает incomplete drafts, добавляет фотографии и вручную публикует выбранные товары.
6. **Climax:** существующий каталог превращён в проверяемые Черновики без ручного повторного ввода.

Failure: нераспознанный файл получает понятную причину и шаблон; частичная row error не откатывает успешные drafts.

### UJ-3 — Мария переходит из Telegram-поста и пишет продавцу о товаре

1. Мария открывает public store link из Telegram без регистрации.
2. Она видит store header и каталог, переключает list/grid при желании.
3. Мария открывает Карточку товара и просматривает фото, цену, availability и description.
4. Она нажимает `Связаться о товаре`; accessible name уточняет товар и Telegram.
5. Сервер строит message из доверенных title, price/`по запросу` и permalink; CTA event записывается best-effort.
6. Telegram открывается с редактируемым предзаполненным сообщением.
7. **Climax:** Мария может отправить продавцу точный товарный контекст без повторного ввода.

Failure: deep link не открылся — Мария остаётся на Карточке товара и копирует тот же текст; alternative contacts не появляются.

### UJ-4 — Продавец проверяет, что сработало сегодня

1. Анна вечером открывает seller dashboard.
2. Главное число показывает Просмотры магазина за сегодня по Europe/Moscow.
3. Вторичные rows показывают product views, CTA clicks и лучший источник при наличии source data.
4. Анна открывает analytics detail за сегодня или 7 дней и видит product-level summary.
5. Attention queue показывает только задачи, которые можно исправить сейчас.
6. **Climax:** Анна понимает, какой товар и источник дали интерес, и решает обновить карточку или снова поделиться ссылкой.

Empty/failure: без данных dashboard показывает честный zero state; при refresh error не изображает нули как успешную загрузку и предлагает retry.

### UJ-5 — Анна смотрит свою витрину глазами покупателя

1. Анна открывает `Предпросмотр` из dashboard или settings.
2. Preview требует seller auth/ownership и показывает сохранённую публичную структуру с seller-only indicator.
3. Она открывает товар, проверяет gallery, description, price, availability и Telegram CTA state.
4. Preview actions не создают public view или CTA analytics events.
5. Анна возвращается к нужной settings/product section либо копирует public link.
6. **Climax:** Анна доверяет публичной ссылке, потому что увидела её в реальном buyer reading order.

Failure: найденная проблема возвращает Анну в соответствующий editor; unsaved settings не теряются без предупреждения.

## Неблокирующие implementation decisions

- TUS не требуется текущему UX; актуальный transport целиком задаётся единственным контрактом `media-queue` в Component Patterns.
- Точный формат product permalink остаётся архитектурным контрактом; UX требует стабильную ссылку в Telegram message и entity-specific 404.
- Роль root `/` не определена PRD: реализация должна убрать smoke-test presentation, но выбор landing или redirect не должен расширять MVP.
- FR-9 release decision остаётся PM/release gate; UX готов для conditional surface, но не делает import обязательным.
