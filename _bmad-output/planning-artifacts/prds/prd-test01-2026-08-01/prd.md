---
title: "PRD: mobile-first персональная витрина для малых продавцов"
status: draft
created: 2026-08-01
updated: 2026-08-01
---

# PRD: mobile-first персональная витрина для малых продавцов

*Working public name for MVP: "Персональная витрина".*

## 0. Document Purpose

Этот PRD описывает MVP продукта "Персональная витрина" для PM, UX, architecture, epics/stories и будущей реализации. Документ построен вокруг пользовательских journeys, glossary-anchored терминов, feature groups и стабильных Functional Requirements с ID `FR-N`. Он основан на product brief, addendum и market research, а не заменяет их.

Исходные артефакты:

- `C:\Work\projects\test01\_bmad-output\planning-artifacts\briefs\brief-test01-2026-08-01\brief.md`
- `C:\Work\projects\test01\_bmad-output\planning-artifacts\briefs\brief-test01-2026-08-01\addendum.md`
- `C:\Work\projects\test01\_bmad-output\planning-artifacts\research\market-personal-storefront-social-sellers-research-2026-08-01.md`

## 1. Vision

Персональная витрина — это mobile-first сервис для малых продавцов, которые уже продают через социальные сети и мессенджеры, но не хотят начинать с маркетплейса или полноценной e-commerce платформы. Продавец создает простой магазин по одной ссылке, публикует товары или услуги, размещает ссылку в профиле и получает обращения в привычный мессенджер.

Ключевая позиция продукта: это не "облегченный маркетплейс", а "витрина до магазина" — конверсионный слой между социальной сетью и мессенджером продавца. MVP помогает покупателю быстро понять ассортимент, цену и контекст товара, а продавцу — не отвечать на одни и те же базовые вопросы вручную.

MVP должен выиграть не шириной функций, а скоростью первого результата: продавец за короткий мобильный сеанс оформляет витрину, публикует несколько товаров, делится ссылкой и видит сегодняшние просмотры. Первый запуск ориентирован на рынок Россия/СНГ. Оплаты, доставка, внутренний чат, отзывы, рейтинги, CRM и расширенная кастомизация не входят в MVP.

## 2. Target User

### 2.1 Jobs To Be Done

**Для продавца:**

- Когда я продаю через соцсети, я хочу дать покупателям одну аккуратную ссылку на актуальный каталог, чтобы не пересылать товары и цены вручную.
- Когда покупатель пишет мне, я хочу сразу понимать, какой товар его заинтересовал, чтобы быстрее ответить и не уточнять контекст.
- Когда я публикую ссылку в разных каналах, я хочу видеть хотя бы базовый отклик, чтобы понимать, что сработало.
- Когда у меня уже есть товары в таблице или старом каталоге, я хочу быстро перенести их в новую витрину, чтобы не заводить всё заново.

**Для покупателя:**

- Когда я перехожу из соцсети по ссылке продавца, я хочу быстро увидеть товары, цены и фотографии, чтобы решить, стоит ли писать продавцу.
- Когда мне уже интересен товар, я хочу нажать "Связаться" и попасть в Telegram продавца без регистрации.

### 2.2 Non-Users (v1)

- Средние и крупные магазины с сотнями или тысячами SKU.
- Продавцы, которым сразу нужны оплата, доставка, склад, фискализация и CRM.
- Маркетплейс-продавцы, которым важнее трафик площадки, чем собственная социальная аудитория.
- Покупатели, которым нужен аккаунт, история заказов, гарантии, отзывы и dispute flow внутри платформы.

### 2.3 Key User Journeys

- **UJ-1. Анна запускает витрину для handmade-товаров за один мобильный сеанс.**
  - **Persona + context:** Анна продает светильники ручной работы через Instagram и Telegram, ассортимент — 18 товаров.
  - **Entry state:** Анна зарегистрирована как продавец, открывает приложение с телефона.
  - **Path:** Анна заполняет название магазина, фото, краткое описание, выбирает username ссылки, добавляет 3 ключевых товара с фото/ценой/описанием, нажимает "Опубликовать".
  - **Climax:** система показывает опубликованную ссылку магазина и кнопку "Посмотреть как покупатель".
  - **Resolution:** Анна копирует ссылку в соцсети и возвращается позже к аналитике.
  - **Edge case:** если выбранный username занят, система предлагает изменить его без потери введенных данных.

- **UJ-2. Игорь переносит существующий каталог из Excel в черновики.** *(conditional: applies if FR-9 ships in first release)*
  - **Persona + context:** Игорь ведет маленький магазин одежды и уже хранит товары в таблице.
  - **Entry state:** Игорь в кабинете продавца, у него есть файл Excel/CSV.
  - **Path:** Игорь загружает файл, сопоставляет колонки, видит созданные черновики, открывает карточки с недостающими данными, добавляет фотографии и публикует выбранные товары.
  - **Climax:** каталог не нужно вводить вручную с нуля; товары ждут ручной проверки перед публикацией.
  - **Resolution:** опубликованные товары появляются в витрине, непроверенные остаются в черновиках.
  - **Edge case:** если файл не распознан, система объясняет проблему и дает шаблон таблицы.

- **UJ-3. Мария переходит из Telegram-поста и пишет продавцу о товаре.**
  - **Persona + context:** Мария увидела пост о платье в Telegram-канале продавца.
  - **Entry state:** Мария не зарегистрирована и открывает публичную витрину с телефона.
  - **Path:** Мария видит шапку магазина, переключает каталог в сетку, открывает карточку платья, смотрит фотографии и цену, нажимает "Связаться".
  - **Climax:** открывается Telegram продавца с предзаполненным сообщением, где есть название товара и ссылка на карточку.
  - **Resolution:** диалог продолжается вне сервиса; в сервисе фиксируется CTA click.
  - **Edge case:** если Telegram deep link недоступен, Покупатель остается на Витрине и может скопировать предзаполненный текст сообщения. Альтернативные контакты продавца не входят в MVP и остаются `Could`.

- **UJ-4. Продавец проверяет, что сработало сегодня.**
  - **Persona + context:** Анна вечером хочет понять, были ли просмотры после публикации ссылки.
  - **Entry state:** Анна открывает кабинет продавца.
  - **Path:** на домашнем экране она видит просмотры магазина за сегодня, просмотры товаров, клики "Связаться" и лучший источник трафика.
  - **Climax:** Анна понимает, какой товар и канал дали интерес.
  - **Resolution:** Анна решает повторно опубликовать ссылку или обновить карточку товара.
  - **Edge case:** если данных за день нет, система показывает нулевое состояние и предлагает поделиться ссылкой.

- **UJ-5. Анна смотрит свою витрину глазами покупателя.**
  - **Persona + context:** Анна хочет убедиться, что магазин выглядит аккуратно перед публикацией.
  - **Entry state:** Анна находится в кабинете.
  - **Path:** нажимает "Предпросмотр", видит публичную страницу магазина, открывает карточку товара, проверяет CTA.
  - **Climax:** Анна убеждается, что покупатель увидит актуальный каталог.
  - **Resolution:** Анна возвращается к редактированию или копирует ссылку.

## 3. Glossary

- **Продавец** — зарегистрированный пользователь, который создает и управляет Магазином.
- **Покупатель** — публичный посетитель Витрины; в MVP не имеет аккаунта.
- **Магазин** — профиль продавца с публичной Витриной, уникальной ссылкой, описанием и Товарами.
- **Витрина** — публичная mobile-first страница Магазина, доступная по ссылке.
- **Товар** — продаваемая позиция или услуга с названием, ценой, описанием, фотографиями, статусом публикации и статусом наличия.
- **Карточка товара** — детальная публичная страница Товара.
- **Карточка в каталоге** — компактное представление Товара в каталоге Витрины; не является Карточкой товара.
- **Черновик** — Товар, сохраненный в кабинете продавца, но не опубликованный в Витрине.
- **Опубликованный товар** — Товар, видимый покупателям в Витрине.
- **Скрытый товар** — Товар, сохраненный в кабинете продавца, но скрытый из публичной Витрины.
- **CTA "Связаться"** — кнопка, которая открывает Telegram продавца с предзаполненным сообщением.
- **Мессенджер** — внешний канал связи продавца с покупателем. MVP поддерживает только Telegram. WhatsApp, VK, несколько активных мессенджеров и альтернативные контакты продавца рассматриваются как `Could`.
- **Статус наличия** — простое состояние Товара: "в наличии" или "нет в наличии"; это не складской учет.
- **Предзаполненное сообщение** — текст, который открывается в Мессенджере и содержит контекст Товара.
- **Источник трафика** — канал или ссылка, по которой Покупатель пришел в Витрину.
- **Просмотр магазина** — событие открытия публичной Витрины.
- **Просмотр товара** — событие открытия Карточки товара.
- **CTA click** — событие нажатия CTA "Связаться"; в MVP это верхняя граница измеримой конверсии.
- **Release classification** — статус требования для release planning: `Must for MVP`, `Should / conditional`, `Could`, `Fast-follow`.

## 4. Features

### 4.1 Seller Account and Store Profile

**Description:** Продавец регистрируется, создает Магазин, оформляет публичную шапку Витрины и получает уникальную ссылку. Покупательский аккаунт отсутствует в MVP.

**Functional Requirements:**

#### FR-1: Seller registration and login

Продавец может зарегистрироваться и войти в кабинет продавца.

**Consequences (testable):**

- Продавец не может создать Магазин без регистрации.
- Сессия продавца сохраняется между посещениями; конкретная длительность сессии задается в architecture/security decisions.
- Покупатель не видит экран регистрации при просмотре Витрины или нажатии CTA.

#### FR-2: Store profile editing

Продавец может заполнить и редактировать название Магазина, фото/аватар, краткое описание и дополнительную информацию.

**Consequences (testable):**

- Название Магазина обязательно.
- Описание Магазина необязательно.
- Изменения профиля отображаются в публичной Витрине после сохранения.

#### FR-3: Editable public store link

Продавец может задать и изменить уникальный публичный slug/username Магазина.

**Consequences (testable):**

- Система не позволяет сохранить занятый или невалидный slug.
- Slug допускает только латинские буквы нижнего регистра, цифры и дефис; длина 3-32 символа; slug не может начинаться или заканчиваться дефисом.
- Зарезервированные slug (`admin`, `api`, `login`, `signup`, `support`, `help`) недоступны для продавцов.
- Изменение slug не удаляет Магазин и Товары.
- Старая ссылка после смены slug возвращает 404 без редиректа в MVP.

#### FR-4: Store preview

Продавец может открыть предпросмотр своей Витрины в режиме покупателя.

**Consequences (testable):**

- Предпросмотр показывает ту же структуру, что публичная Витрина.
- Неопубликованные Товары не отображаются в предпросмотре, если не включен специальный режим черновика.

### 4.2 Catalog and Product Management

**Description:** Продавец управляет небольшим каталогом Товаров: создает, редактирует, публикует, скрывает и удаляет позиции. Основной UX должен быть удобен на мобильном экране.

**Functional Requirements:**

#### FR-5: Manual product creation

Продавец может вручную создать Товар с названием, ценой, описанием и фотографиями. Realizes UJ-1.

**Consequences (testable):**

- Название Товара обязательно.
- Название Товара: 2-80 символов.
- Цена может быть числом или состоянием "по запросу".
- Для рынка Россия/СНГ валюта MVP — RUB.
- Товар поддерживает Статус наличия: "в наличии" или "нет в наличии".
- Описание необязательно; максимум 2 000 символов.
- Товар можно сохранить как Черновик без публикации.

#### FR-6: Product media management

Продавец может добавить, удалить и переупорядочить фотографии Товара.

**Consequences (testable):**

- В карточке товара первая фотография используется как обложка в каталоге.
- Товар без фотографии может быть сохранен как Черновик.
- Опубликованный товар должен иметь минимум одну фотографию.
- MVP поддерживает до 10 фотографий на Товар.
- Поддерживаемые форматы: JPG, PNG, WebP; максимальный размер исходного файла задается architecture, но UX должен заранее показывать ошибку для неподдерживаемого формата.

#### FR-7: Product lifecycle states

Продавец может перевести Товар между состояниями Черновик, Опубликованный товар и Скрытый товар.

**Consequences (testable):**

- Черновик не виден Покупателю.
- Скрытый товар не виден в публичной Витрине, но остается в кабинете.
- Публикация требует явного действия продавца.
- Удаление Товара убирает его из кабинета и публичных поверхностей; прямой URL удаленного Товара возвращает 404.
- Товар со Статусом наличия "нет в наличии" остается видимым в Витрине, но CTA "Связаться" остается доступным, потому что продавец может обсудить сроки или альтернативы.

#### FR-8: Product list management

Продавец может просматривать список своих Товаров, фильтровать по статусу и открывать редактирование.

**Consequences (testable):**

- Список различает Опубликованные, Черновики и Скрытые товары.
- Продавец может быстро перейти к редактированию выбранного Товара.

#### FR-9: Excel/CSV import to drafts

Продавец может импортировать Excel/CSV файл, чтобы система создала Черновики Товаров с предзаполненными полями. Это `Should` для MVP: сильная activation feature, но не hard blocker для первого релиза.

**Consequences (testable):**

- Импорт не публикует Товары автоматически.
- Продавец видит результат импорта как Черновики.
- Система поддерживает минимум один шаблон файла или ручное сопоставление колонок.
- Ошибки импорта объясняются понятным сообщением.
- Release gate: FR-9 входит в first release только если команда может реализовать загрузку файла, сопоставление колонок и создание Черновиков без задержки core loop `manual product -> storefront -> CTA -> analytics`.

#### Product data contract

| Field | Required for Черновик | Required for Опубликованный товар | Notes |
|---|---:|---:|---|
| title | yes | yes | 2-80 characters |
| price | no | yes | numeric RUB or "по запросу" |
| availability_status | no | yes | "в наличии" or "нет в наличии"; default "в наличии" |
| description | no | no | max 2 000 characters |
| photos | no | yes | 1-10 images for published products |
| publication_status | yes | yes | Черновик / Опубликованный товар / Скрытый товар |
| sort_order | no | no | default newest published first; manual ordering can be fast-follow |

### 4.3 Public Storefront and Product Detail

**Description:** Покупатель открывает Витрину по ссылке, видит шапку Магазина и каталог Товаров, может открыть Карточку товара или сразу нажать CTA "Связаться".

**Functional Requirements:**

#### FR-10: Public storefront rendering

Система показывает публичную Витрину Магазина по уникальной ссылке.

**Consequences (testable):**

- Витрина доступна без авторизации покупателя.
- В шапке отображаются фото/аватар, название, дополнительная информация и необязательное описание.
- Неопубликованные и Скрытые товары не отображаются.

#### FR-11: Catalog display modes

Покупатель может просматривать каталог Товаров списком или сеткой по два товара в ряд на мобильном экране.

**Consequences (testable):**

- Карточка в каталоге показывает фотографию, название, цену и CTA "Связаться".
- Переключение вида не меняет состав Товаров.
- Выбранный режим можно сохранять локально на устройстве.

#### FR-12: Product detail page

Покупатель может открыть Карточку товара с фотографиями, названием, ценой, описанием и CTA "Связаться".

**Consequences (testable):**

- Фотографии можно пролистывать.
- Описание отображается полностью на Карточке товара; если UX применяет свернутый текст, должна быть явная кнопка раскрытия.
- CTA доступен в первом экране на мобильных viewport шириной 360-430px или закреплен в нижней зоне.

#### FR-13: Empty and unavailable states

Система показывает понятные состояния, если Магазин существует, но в нем нет опубликованных Товаров, или если ссылка не найдена.

**Consequences (testable):**

- Пустая Витрина не выглядит как ошибка сервера.
- Несуществующая ссылка не раскрывает приватные данные.
- Прямая ссылка на Скрытый товар возвращает 404 для Покупателя.
- Прямая ссылка на Черновик возвращает 404 для Покупателя.

#### Public visibility and link behavior

| Entity/state | Public catalog | Direct public URL | Seller preview | Analytics |
|---|---|---|---|---|
| Магазин with published products | visible | 200 | visible | public views counted |
| Магазин with no published products | empty state | 200 | visible | public views counted |
| Missing Магазин slug | n/a | 404 | n/a | not counted |
| Old Магазин slug after change | n/a | 404 | n/a | not counted |
| Опубликованный товар | visible | 200 | visible | public views counted |
| Черновик | hidden | 404 | visible only in seller draft context | not counted as public view |
| Скрытый товар | hidden | 404 | visible in seller admin context | not counted as public view |
| Deleted Товар | hidden | 404 | hidden | not counted |

### 4.4 Messenger Contact CTA

**Description:** CTA "Связаться" переводит Покупателя в Telegram продавца. Сервис не строит внутренний чат и не требует аккаунт покупателя.

**Functional Requirements:**

#### FR-14: Messenger configuration

Продавец может настроить Telegram как единственный поддерживаемый MVP-канал для CTA. WhatsApp, VK, несколько активных мессенджеров и альтернативные контакты продавца остаются `Could`.

**Consequences (testable):**

- Без настроенного Telegram продавец видит предупреждение в кабинете.
- CTA не должен вести в невалидную ссылку.
- Публичная Витрина с ненастроенным Telegram показывает CTA disabled state с текстом "Контакт продавца пока не настроен".
- Telegram username/link validation happens before saving.

#### FR-15: Prefilled product-context message

При нажатии CTA система открывает Telegram с Предзаполненным сообщением.

**Consequences (testable):**

- Сообщение содержит название Товара.
- Сообщение содержит ссылку на Карточку товара.
- Сообщение содержит цену или состояние "по запросу" на момент нажатия CTA.
- Покупатель может изменить сообщение перед отправкой в Telegram.
- Handoff открывается через Telegram web/app deep link; если deep link не открывается, Покупатель остается на Витрине и может скопировать текст сообщения.

#### FR-16: CTA from catalog and product detail

Покупатель может нажать CTA из карточки в каталоге и из Карточки товара.

**Consequences (testable):**

- CTA из каталога передает контекст выбранного Товара.
- CTA из Карточки товара передает контекст того же Товара.
- Событие CTA click фиксируется до перехода в Telegram.

**Out of Scope:**

- Подтверждение факта отправки сообщения.
- Хранение переписки.
- Уведомления о новых сообщениях.
- Несколько активных мессенджеров одновременно в MVP.
- WhatsApp, VK и альтернативные контакты продавца остаются `Could`.

### 4.5 Seller Dashboard and Analytics

**Description:** Кабинет продавца показывает сегодняшнее состояние Витрины: просмотры Магазина как главную метрику, а также просмотры Товаров, CTA clicks и источники трафика.

**Functional Requirements:**

#### FR-17: Seller home dashboard

Продавец видит домашний экран с главным виджетом "просмотры магазина за сегодня".

**Consequences (testable):**

- Главная метрика отображается крупнее вторичных метрик.
- Если просмотров нет, система показывает нулевое состояние и подсказку поделиться ссылкой.
- "Сегодня" считается в часовом поясе Магазина; для MVP по умолчанию используется Europe/Moscow.

#### FR-18: Basic analytics events

Система фиксирует Просмотр магазина, Просмотр товара и CTA click.

**Consequences (testable):**

- События привязаны к Магазину.
- Просмотр товара привязан к Товару.
- CTA click привязан к Товару и Магазину.
- Система не считает покупку или отправку сообщения без интеграции.
- События из seller preview не считаются публичной аналитикой.
- Явно распознанные bot/crawler visits не считаются публичной аналитикой.

#### FR-19: Traffic source tracking

Система определяет или принимает Источник трафика для Просмотра магазина и CTA click.

**Consequences (testable):**

- Система поддерживает источник через UTM/метку ссылки.
- Если источник неизвестен, событие помечается как "unknown".
- Отдельные короткие ссылки по каналам — `Should`; базовая поддержка источников через UTM/source labels обязательна.
- Attribution precedence: explicit `source` label or UTM source wins over HTTP referrer; if both absent, source is `unknown`.
- Source metadata propagates from Витрина to Карточка товара and CTA click during the same session.

#### FR-20: Product-level analytics summary

Продавец может увидеть базовую аналитику по Товарам: просмотры и CTA clicks.

**Consequences (testable):**

- Данные доступны за текущий день и последние 7 дней.
- 30-дневный период остается fast-follow.

#### Analytics event catalog

| Event | Exact trigger | Required properties | Optional properties | Excluded contexts | Attribution / time window |
|---|---|---|---|---|---|
| Просмотр магазина | Public Витрина renders for Покупатель | store_id, store_slug, occurred_at, session_id, source, user_agent_type | referrer, utm_source, utm_medium, utm_campaign | seller preview, admin views, known bots/crawlers | Europe/Moscow day boundary by default; source label/UTM overrides referrer |
| Просмотр товара | Public Карточка товара renders for Покупатель | store_id, product_id, occurred_at, session_id, source | referrer, utm fields, catalog_view_mode | seller preview, admin views, known bots/crawlers, hidden/draft/deleted products | inherits source from session when available |
| CTA click | Покупатель taps CTA "Связаться" before messenger handoff | store_id, product_id, messenger_type, occurred_at, session_id, source | product_price_snapshot, product_availability_snapshot, handoff_url_type | seller preview, admin views, invalid/disabled CTA | inherits source from session; counted even if external messenger send is unknown |

Deduplication: repeated `Просмотр магазина` or `Просмотр товара` events from the same session within 30 seconds may be collapsed for dashboard counts. CTA clicks are counted per tap, but obvious double taps within 3 seconds may be collapsed.

### 4.6 Mobile-First UX, Aesthetic, and Platform

**Description:** Продукт проектируется mobile-first для продавца и покупателя. Дизайн минималистичный, современный, монохромный, с аккуратным мотивом liquid glass.

**Functional Requirements:**

#### FR-21: Mobile-first responsive surfaces

Все ключевые пользовательские surfaces работают на мобильном viewport.

**Consequences (testable):**

- Продавец может создать Магазин и Товар с телефона.
- Покупатель может открыть Витрину, Карточку товара и CTA с телефона.
- Desktop layout не должен ломать мобильную логику.
- Primary supported mobile viewport range for MVP: 360-430px width.
- Minimum tap target for primary controls: 44x44 CSS px.

#### FR-22: Minimal visual language

Публичная Витрина и кабинет продавца используют спокойную монохромную визуальную систему с минимальным количеством декоративных элементов.

**Consequences (testable):**

- Интерфейс не должен выглядеть как маркетплейсная лента или тяжелый e-commerce кабинет.
- Liquid glass используется как визуальный акцент, а не как помеха читаемости.
- Текст, цены и CTA остаются читаемыми на мобильных экранах.
- Product photos and CTA remain visually dominant over decorative effects.
- Text contrast should meet WCAG AA for normal text where feasible in the chosen palette.

## 5. Non-Goals (Explicit)

- Не строим маркетплейс и не агрегируем продавцов в общий каталог.
- Не строим внутренний чат в MVP.
- Не создаем аккаунт покупателя в MVP.
- Не принимаем оплату и не управляем доставкой.
- Не делаем заказы, корзину, статусы заказов и фискализацию.
- Не делаем рейтинги, отзывы и подтверждение сделки.
- Не делаем CRM, dispute flow, жалобы и расследование инцидентов.
- Не делаем AI-импорт из скриншотов и ссылок в MVP.
- Не оптимизируем продукт под магазины с сотнями SKU.
- Не делаем платную кастомизацию в MVP.

## 6. MVP Scope

### 6.1 In Scope

- Seller account.
- Store profile.
- Editable unique store link.
- Manual product CRUD.
- Product photos, title, price, description.
- Simple availability status: in stock / out of stock.
- Draft, publish, hide, delete product states.
- Public mobile storefront.
- Product catalog list/grid.
- Product detail page.
- CTA to external Messenger with prefilled product-context message.
- Seller dashboard with today's store views.
- Basic analytics: store views, product views, CTA clicks.
- Traffic source tracking through required UTM/source labels.
- Store preview as buyer.
- Minimal monochrome/liquid-glass visual direction.

### 6.2 Should / Could Include if Feasible

- **Should / conditional:** Excel/CSV import into Черновики, gated by release capacity.
- **Should / conditional:** Separate source links by channel.
- **Could:** Additional messenger/contact channels — WhatsApp, VK, multiple active messengers, and alternative seller contacts.
- **Fast-follow:** 30-day analytics period.

### 6.3 Out of Scope for MVP

- Internal chat — deferred because it creates accounts, notifications, moderation, storage, safety, and support obligations.
- Payments and delivery — deferred because they change the product from storefront/contact to transaction platform.
- Reviews/ratings — deferred until there is a credible confirmation mechanism.
- AI import — deferred because source quality and extraction confidence are high-complexity.
- Advanced recommendations — deferred until enough behavioral data exists.
- Paid customization — deferred until the core storefront loop proves value.

## 7. Success Metrics

**Primary**

- **SM-1:** Time to first published storefront — median seller can publish a store with 3 products within 10 minutes. Validates FR-1, FR-2, FR-5, FR-7, FR-10.
- **SM-2:** Activation rate — at least 60% of registered sellers publish 3+ products. Validates FR-5, FR-7, FR-10.
- **SM-3:** Contact intent rate — at least 30% of active storefronts receive one or more CTA clicks within 7 days of publication. Validates FR-14, FR-15, FR-16, FR-18.

**Secondary**

- **SM-4:** Storefront views per seller per week, segmented by source where available. Validates FR-10, FR-17, FR-18, FR-19.
- **SM-5:** Product views to CTA click rate. Validates FR-12, FR-16, FR-18, FR-20.
- **SM-6:** Seller return to dashboard — seller opens dashboard after publishing. Validates FR-17, FR-20.
- **SM-7:** Import usefulness — percentage of imported draft products that are reviewed and published, if FR-9 ships in first release. Validates FR-9.

### Metric definitions

| Metric | Formula | Cohort / denominator | Exclusions |
|---|---|---|---|
| SM-1 | median time from seller registration to first Магазин with 3 Опубликованных товара | sellers who start store setup in the measurement period | test accounts, internal QA, sellers using seeded demo data |
| SM-2 | sellers with 3+ Опубликованных товара / registered sellers | sellers registered in the measurement period | test accounts, deleted stores |
| SM-3 | active storefronts with >=1 CTA click within 7 days / active storefronts | Магазины with >=1 Опубликованный товар and public link available | seller preview, known bots/crawlers, disabled CTA stores |
| SM-4 | weekly public Просмотр магазина count per seller | active storefronts | seller preview, known bots/crawlers |
| SM-5 | CTA clicks / Просмотр товара | product detail sessions | seller preview, known bots/crawlers |
| SM-6 | sellers who open dashboard after publishing / sellers who publish storefront | publishing sellers | test accounts |
| SM-7 | imported Черновики published / imported Черновики created | FR-9 users only | failed imports, test files |

**Counter-metrics (do not optimize blindly)**

- **SM-C1:** CTA click volume without seller satisfaction — high clicks are not enough if messages are low-quality or confusing.
- **SM-C2:** Number of features shipped — do not optimize feature count over time to first storefront.
- **SM-C3:** Storefront visual customization depth — do not optimize customization before core activation and contact loop.
- **SM-C4:** Total views without source/contact context — views alone can become vanity analytics.

## 8. Cross-Cutting NFRs

- **Performance:** Public Витрина and Карточка товара target P75 initial core content load under 2.5s on reasonable 4G.
- **Availability:** Public storefront pages should target higher availability than seller admin surfaces; exact SLA is set by architecture, but public storefront downtime is release-blocking for launch checks.
- **Accessibility:** Core flows use semantic labels, WCAG AA contrast where feasible, and 44x44 CSS px minimum tap targets for primary controls.
- **Privacy:** Analytics should avoid collecting unnecessary personal data from Покупателей.
- **Observability:** Analytics events must be inspectable by event name, store_id, product_id, source, occurred_at, and exclusion reason where applicable.
- **Data Integrity:** Product publication state must be consistent; Черновик must not appear publicly by mistake.

## 9. Constraints and Guardrails

### 9.1 Privacy and Analytics Guardrails

- Track only the events needed for MVP analytics.
- Do not imply that CTA click equals sent message or purchase.
- Store source data in a way that can represent "unknown".
- No buyer identity is stored in MVP.

### 9.2 Trust and Safety Guardrails

- Since there is no internal chat or transaction, the platform cannot investigate deals in MVP.
- Public storefronts should not display unpublished product data.
- Seller profile fields should be designed to reduce obvious spam/abuse risk, even if full moderation is post-MVP.

### 9.3 Business Guardrails

- Free MVP is acceptable for validation. Monetization begins post-MVP through customization, extended analytics, trust blocks, or transaction modules.
- Do not introduce features that require support-heavy operations before product-market signal.

## 10. Information Architecture

### First-run seller flow

1. Seller signs up or logs in.
2. Empty dashboard shows primary CTA "Создать витрину".
3. Seller creates Магазин profile: name, photo/avatar, optional description, slug.
4. Seller adds first Товар manually or enters Import drafts flow if FR-9 ships.
5. Seller saves Товар as Черновик or publishes it.
6. After first Опубликованный товар, system shows success screen with public link, "Посмотреть как покупатель", and "Добавить товар".
7. Dashboard shifts from setup state to analytics state after Магазин has at least one Опубликованный товар.

### Seller surfaces

- Login / registration.
- Seller home dashboard.
- Store profile editor.
- Product list.
- Product create/edit.
- Import drafts flow [Should / conditional].
- Analytics detail.
- Store preview.

### Buyer surfaces

- Public storefront.
- Product detail page.
- Messenger handoff.
- Not found / empty store states.

## 11. Monetization

Monetization is out of MVP implementation scope. The likely post-MVP monetization direction is paid customization of Витрина and catalog presentation, with possible later expansion into extended analytics, trust blocks, payment/delivery modules, or transaction tools.

[NOTE FOR PM] Before adding paid customization, validate whether sellers value customization more than import, analytics, trust, or payments.

## 12. Risks and Mitigations

- **Risk:** Product feels like "just a page with products."  
  **Mitigation:** Make analytics, product-context CTA, and fast setup central.
- **Risk:** Seller setup friction kills activation.  
  **Mitigation:** Prioritize first published storefront, simple product creation, duplication, and import experiments.
- **Risk:** Competitors are good enough.  
  **Mitigation:** Own a narrower promise: product-first storefront link to contextual messenger conversation.
- **Risk:** Messenger choice is wrong for the first market.  
  **Mitigation:** Telegram remains the only accepted MVP messenger. Validate actual usage in interviews to decide whether WhatsApp, VK, or alternative contacts move from `Could` into MVP or fast-follow.
- **Risk:** No post-click visibility.  
  **Mitigation:** Treat CTA click as MVP conversion and label it honestly.
- **Risk:** Lack of reviews reduces buyer trust.  
  **Mitigation:** Invest in seller identity, product information quality, and polished storefront presentation.

## 13. Open Questions

No phase-blocking open questions remain after the accepted MVP decision package on 2026-08-01.

Non-blocking follow-ups:

1. Validate the name "Персональная витрина" before public launch.
2. Confirm through seller interviews whether Excel/CSV import is required in first release or can ship as fast-follow.
3. Re-check whether WhatsApp, VK, or alternative seller contacts should move from `Could` to MVP after launch-market interviews.

## 14. Assumptions Index

No phase-blocking assumptions remain after the PRD update pass on 2026-08-01. Prior assumptions about product photos, local catalog view persistence, CTA visibility, and performance target have been converted into normative MVP requirements.

## 15. Release Classification

| Requirement / scope item | Classification | Notes |
|---|---|---|
| FR-1 to FR-8 | Must for MVP | Core seller account, store profile, manual catalog management |
| FR-9 Excel/CSV import | Should / conditional | Include only if it does not delay manual core loop |
| FR-10 to FR-18 | Must for MVP | Public storefront, product detail, messenger CTA, base analytics |
| FR-19 source tracking via UTM/source labels | Must for MVP | Generated short links are `Should` |
| FR-20 today + 7 day analytics | Must for MVP | 30-day analytics is fast-follow |
| FR-21 to FR-22 | Must for MVP | Mobile-first and visual baseline |
| WhatsApp, VK, multiple active messengers, alternative seller contacts | Could | Revisit after Russia/CIS interviews |
| AI import, payments, delivery, reviews, ratings, CRM | Out of scope for MVP | Preserved in addendum as future directions |
