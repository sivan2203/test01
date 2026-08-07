---
title: UX/UI-аудит test01
status: complete
audit_date: 2026-08-07
audited_commit: ffb39c5bdaa724fa238234d8b1f32cc7ca88da16
branch: main
---

# UX/UI-аудит test01

## Резюме

Приложение функционально зрелее своей визуальной оболочки: ключевые seller- и buyer-сценарии уже реализованы, бизнес-ограничения защищены на сервере и в Supabase, а предыдущий полный browser E2E-прогон подтверждает прохождение 19 сценариев без ошибок консоли. Главный разрыв находится не в функциональности, а в структуре опыта: кабинет продавца выглядит как набор длинных стеклянных форм, создание товара не соответствует требуемому пошаговому сценарию, загрузка фото не даёт пользователю видимой обратной связи, а desktop-компоновка расходует большую часть экрана впустую.

Два блокера редизайна имеют приоритет P0:

1. Загрузка фотографий не показывает выбранные файлы, локальные превью, прогресс и индивидуальные ошибки; конфигурационный лимит Server Actions также конфликтует с разрешённым продуктовым лимитом.
2. Создание товара реализовано одной длинной формой вместо управляемого сценария «детали → фото → проверка и публикация».

Текущие скриншоты сняты при системной тёмной теме: CSS автоматически переключает палитру через `prefers-color-scheme`. Это важно считать частью baseline, но не целевым направлением. Для редизайна принят запрос на тёплую почти белую основу, более плотный seller workspace и редакционную, а не glass-card, композицию публичной витрины.

## 1. Объём и метод аудита

Аудит охватывает:

- маршруты App Router и основные seller/buyer-потоки;
- фактические компоненты, стили, токены и состояния интерфейса;
- desktop и mobile baseline на работающем локальном приложении;
- доступность: клавиатура, фокус, семантика ошибок, контраст, диалоги, motion и touch targets;
- локальную среду Next.js/Supabase без изменения данных;
- тестовый инвентарь и существующий E2E-отчёт;
- бизнес-инварианты, которые редизайн не должен нарушить.

Метод:

1. Статический разбор `src/app`, `src/features`, `src/components`, глобальных стилей, конфигурации Next.js и Supabase.
2. Проверка запущенного приложения на `http://localhost:3000` и локального Supabase.
3. Визуальный разбор baseline-скриншотов desktop и mobile.
4. Сопоставление фактической реализации с существующими `DESIGN.md`, `EXPERIENCE.md` и browser E2E-отчётом.
5. Read-only проверка локальной БД и запуск тестов, не входящих в основной `npm run check`.

Аудит не менял исходный код, схему, данные или конфигурацию приложения.

## 2. Baseline: Git, среда и данные

### Git

- В момент начала аудита рабочее дерево было чистым.
- Ветка: `main`, upstream: `origin/main`.
- Коммит: `ffb39c5bdaa724fa238234d8b1f32cc7ca88da16` — `fix: harden and verify storefront e2e flows`.
- Исходная разница: `+0 / -0`, без staged, tracked и untracked изменений.
- Появившиеся позднее файлы в каталоге UX-артефактов созданы параллельной работой текущего процесса; они не являются исходными пользовательскими изменениями. Исходный код приложения на baseline не менялся.

### Локальная среда

| Компонент | Состояние baseline |
|---|---|
| Next.js | Уже запущен; `http://localhost:3000` отвечает `200` |
| Node.js | `v24.13.1` |
| npm | `11.8.0` |
| Next.js | `16.2.12` |
| React | `19.2.4` |
| Tailwind CSS | `4.3.3` |
| Supabase API | `http://127.0.0.1:54321` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Supabase Inbucket | `http://127.0.0.1:54324` |
| PostgreSQL | `127.0.0.1:54322` |

Core-сервисы Database/Auth/Storage/API были healthy. Контейнер Vector перезапускался из-за недоступности Docker logs source; для проверенных пользовательских потоков это не блокер.

Supabase CLI не установлен глобально и отсутствует как локальная зависимость. Для воспроизводимости следует использовать `npx supabase ...`.

### Переменные и локальные данные

- `.env.local` содержит локальный Supabase URL, publishable key и `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- `SUPABASE_SERVICE_ROLE_KEY` не сохранён в `.env.local`, хотя описан в `.env.example`. Чистый перезапуск без внешне унаследованной переменной отключит server-side ingestion аналитики.
- Read-only baseline БД: 3 магазина, 7 товаров (3 draft, 3 published, 1 deleted), 7 media-записей и 11 analytics-событий.
- В `supabase/config.toml` включён seed `./seed.sql`, но файла `supabase/seed.sql` нет. Слепой `db reset` небезопасен и не входит в рабочий процесс редизайна.
- Локальный лимит email для magic link — 2 письма в час; повторные auth-прогоны могут упереться в rate limit.

## 3. Карта маршрутов и потоков

### Маршруты

| Маршрут | Роль | Назначение и заметные состояния |
|---|---|---|
| `/` | общий | Техническая стартовая заглушка; смешанный язык, нет ясного входа в продукт |
| `/seller/sign-in` | seller | Вход по magic link; pending, success и error сообщения |
| `/auth/callback` | seller | Обмен auth-кода и возврат в кабинет |
| `/seller` | seller | Dashboard; first-run без магазина или аналитическая сводка |
| `/seller/products` | seller | Список, фильтры, empty и load-error |
| `/seller/products/new` | seller | Создание draft одной длинной формой |
| `/seller/products/:productId/edit` | seller | Поля, медиа и lifecycle товара |
| `/seller/products/import` | seller | Разбор файла, mapping, preview и результат импорта |
| `/seller/analytics` | seller | Сводка аналитики, empty и error |
| `/seller/store` | seller | Настройки магазина, аватар, slug и Telegram |
| `/seller/store/preview` | seller | Авторизованный preview на сохранённых данных, без аналитики |
| `/:storeSlug` | buyer | Публичная витрина, grid/list, empty/error/not-found |
| `/:storeSlug/products/:productId` | buyer | Галерея, данные товара и Telegram CTA |
| API routes | system | Analytics ingestion, contact handoff и preview-related endpoints |

### Seller flow

```text
magic link → auth callback → dashboard
  ├─ нет магазина → профиль магазина
  └─ магазин есть → товары / аналитика / настройки

новый товар → сохранить draft → edit
  → добавить фото → опубликовать / скрыть / удалить
  → preview → публичная витрина → аналитика

альтернатива: импорт → mapping → preview строк → создание draft-товаров
```

### Buyer flow

```text
/:storeSlug → grid/list каталога
  → карточка товара → detail + gallery
  → Telegram CTA → server-trusted handoff
  → deep link; при сбое открытия доступно копирование сообщения
```

Покупатель не создаёт аккаунт. Preview продавца требует ownership и не должен увеличивать публичную аналитику.

## 4. Что уже работает хорошо

- App Router и feature-модули имеют понятные границы; UI не смешан напрямую с низкоуровневым Supabase-клиентом.
- Seller ownership, публичность только опубликованных товаров и ключевые переходы статусов защищены на сервере/RLS, а не только интерфейсом.
- Ошибки форм в основном сохраняют введённые скалярные значения.
- Публичная галерея поддерживает свайп, предыдущий/следующий кадр, миниатюры и индикатор позиции.
- Режим grid/list каталога сохраняется локально, а переключатели имеют `aria-pressed`.
- Большинство интерактивных целей выдерживает минимум 44 px.
- Empty и load-error разведены для товаров, медиа и аналитики; отсутствие данных не маскирует техническую ошибку.
- Публичная витрина имеет retry при ошибке и отдельное not-found состояние магазина.
- Lifecycle-подтверждения уже не используют `window.alert`, `window.confirm` или `window.prompt`; реализованы Escape и возврат фокуса к инициатору.
- Telegram CTA отключается при неполной настройке, а fallback позволяет скопировать сообщение.
- Импорт покрывает разбор, mapping, preview и построчный итог с частичными ошибками.
- Предыдущий полный browser E2E-отчёт фиксирует прохождение 19 сценариев на desktop и `390×844`, отсутствие browser console errors и успешный `npm run check` с 62 тестами.

## 5. Приоритетные находки

### UX-01 — выбранные фотографии фактически невидимы до отправки

**Приоритет:** P0 / блокер основного seller-сценария.

**Доказательство:** в `product-media-manager.tsx` файловый input скрыт и не имеет `onChange`; UI обновляется только после batch-submit. На скриншоте после выбора файл не появился, счётчик остался `0 из 10`, а empty state — на месте: [выбранный файл без обратной связи](screenshots/before/product-media-selected.png). См. также [media-раздел до загрузки](screenshots/before/product-edit-media-desktop.png) и [состояние после сохранения](screenshots/before/product-media-saved.png).

**Воспроизведение:** открыть edit товара → нажать добавление фото → выбрать допустимый файл → не отправлять форму.

**Влияние:** пользователь не знает, был ли файл выбран, какой именно файл будет загружен и можно ли продолжать. Ошибка одного файла отклоняет весь batch, а выбранные `File` теряются после server action error. Отсутствуют локальные превью, пофайловая валидация, прогресс, статус, retry и явное назначение обложки.

Дополнительный технический риск: `next.config.ts` ограничивает Server Action body размером `7mb`, в то время как продукт допускает до 10 файлов по 6 MiB. Валидный по продуктовым правилам batch может быть отклонён до выполнения action.

**Рекомендация:** сделать управляемую очередь файлов с локальными превью и стабильными локальными ID; валидировать каждый файл до отправки; показывать индивидуальные status/progress/error/retry; сохранять очередь при ошибке; дать явную команду «Сделать обложкой» и доступную клавиатурную сортировку. Загрузку выполнять напрямую в Storage либо контролируемо по одному/небольшими batch, согласовав transport limits с бизнес-лимитами.

### UX-02 — создание товара не является пошаговым сценарием

**Приоритет:** P0 / ключевое требование редизайна.

**Доказательство:** `/seller/products/new` отображает одну длинную форму; после insert draft сервер сразу переводит пользователя в edit. Baseline: [desktop](screenshots/before/product-create-desktop.png), [mobile viewport](screenshots/before/product-create-mobile-390-viewport.png).

**Воспроизведение:** открыть «Новый товар» и пройти страницу сверху вниз.

**Влияние:** отсутствуют stepper, явные Back/Continue, отдельный этап фотографий, финальная проверка и осознанное решение «Сохранить черновик» либо «Опубликовать». На mobile пользователь получает длинный скролл и слабое чувство прогресса.

**Рекомендация:** ввести wizard `Детали → Фотографии → Проверка`. После валидного шага деталей создать/обновить draft, чтобы получить ID для media; шаг фото должен использовать очередь из UX-01; на review показать buyer-like preview, readiness публикации и две явные конечные команды. Переход назад не должен терять данные.

### UX-03 — настройки магазина собраны в одну перегруженную форму

**Приоритет:** P1.

**Доказательство:** avatar, имя, описание, slug, Telegram, preview и share actions находятся в одном вертикальном блоке: [desktop](screenshots/before/store-settings-desktop.png), [mobile viewport](screenshots/before/store-settings-mobile-390-viewport.png).

**Воспроизведение:** открыть `/seller/store`, особенно на ширине 390 px.

**Влияние:** низкая сканируемость, длинный mobile scroll, слабая локальность ошибок. Выбранный avatar не получает мгновенного preview и требует повторного выбора после field error. Уникальность slug проверяется только на submit; изменение сохранённого slug не объясняет, что старый публичный URL сразу перестанет работать.

**Рекомендация:** разделить страницу на логические секции `Профиль`, `Адрес витрины`, `Контакты`, `Публикация и ссылки`; добавить локальный avatar preview и пофайловую ошибку; валидировать slug с debounce и серверным подтверждением; перед изменением существующего slug показать последствия и явное подтверждение. На desktop использовать рабочую двухколоночную композицию с компактным preview/sidebar.

### UX-04 — подтверждения доступны частично, но не являются полноценными диалогами

**Приоритет:** P1 / accessibility.

**Доказательство:** product lifecycle и media delete используют inline `role="alertdialog"` с `aria-modal="false"`. Escape и возврат фокуса реализованы, но общего Dialog-примитива, focus trap и inert/скрытия фонового контента нет.

**Воспроизведение:** открыть подтверждение скрытия/удаления и пройти интерфейс только Tab/Shift+Tab.

**Влияние:** фокус может уйти в фон; поведение разных подтверждений трудно удерживать консистентным. Обратная связь разрознена между `<p role="alert">`, inline success и локальными сообщениями; toast/alert primitives отсутствуют.

**Рекомендация:** создать единый доступный Dialog с focus trap, initial focus, Escape, return focus и блокировкой фона. Ввести единые Alert и Toast правила: field error рядом с полем, page error в контексте, toast только для короткого необязательного подтверждения.

### UX-05 — отсутствует route-level loading и skeleton feedback

**Приоритет:** P1.

**Доказательство:** в App Router нет `loading.tsx`; pending отображается только внутри action-кнопок. Динамические публичные страницы выполняют последовательные запросы без промежуточного layout-preserving состояния.

**Воспроизведение:** открыть seller/public route на throttled connection или при холодном server render.

**Влияние:** переход выглядит зависшим, возможны резкие layout shifts, а пользователь не понимает, что контент загружается.

**Рекомендация:** добавить route-level skeletons для dashboard, products, store settings, storefront и product detail; сохранять геометрию конечной страницы; использовать `aria-busy` и не озвучивать декоративные skeleton-элементы.

### UX-06 — desktop workspace слишком узкий, mobile-проверка неполна

**Приоритет:** P1.

**Доказательство:** seller dashboard и публичная витрина занимают узкую центральную колонку с большим незадействованным пространством: [seller dashboard](screenshots/before/seller-dashboard-desktop.png), [storefront](screenshots/before/storefront-desktop.png). Breakpoint-логика в основном ограничена 640/768 px. Baseline mobile снят на 390 px, но нет системной проверки 360 и 430 px. Fixed bottom navigation и sticky CTA не учитывают `env(safe-area-inset-bottom)`.

**Воспроизведение:** открыть dashboard/storefront на широком desktop; затем long form/detail на 360–430 px и устройстве с home indicator.

**Влияние:** seller-кабинет ощущается как mobile-макет, растянутый на desktop; аналитика и управление не используют доступную площадь. На узких и safe-area устройствах нижние действия могут перекрывать контент.

**Рекомендация:** спроектировать desktop shell с rail/sidebar и рабочей сеткой; использовать таблицы/списки там, где важна плотность; публичную витрину разложить как редакционную страницу. Проверить 360, 390, 430, 768, 1024, 1280 и 1440 px. Добавить нижний padding с safe-area для fixed/sticky controls.

### A11Y-01 — фокус, ошибки и контраст реализованы непоследовательно

**Приоритет:** P1.

**Доказательство:** seller navigation использует английские `Home / Products / Analytics / Store` и не отмечает активный маршрут через `aria-current`; большинство field errors не связано с input через `aria-invalid` и `aria-describedby`; часть полей меняет только border, без сильного `focus-visible`; отсутствует skip link. В коде широко используются `text-foreground/50` и `/55`, потенциально не проходящие WCAG AA на светлой поверхности. Reduced motion не покрывает все transitions.

**Воспроизведение:** пройти sign-in, product form и store form клавиатурой и screen reader; проверить светлую тему контрастомера.

**Влияние:** клавиатурные и screen-reader пользователи получают слабую ориентацию и не всегда понимают связь ошибки с полем. Светлый редизайн может дополнительно снизить контраст вторичного текста.

**Рекомендация:** локализовать навигацию, добавить `aria-current="page"`, skip link, единый focus ring, программную связь ошибок, announcement итогов и контраст не ниже WCAG 2.2 AA. Для motion создать системный reduced-motion override, а не только отключение blur.

### DS-01 — визуальный язык перегружен glass cards и pill-формами

**Приоритет:** P1 / системная причина визуального долга.

**Доказательство:** единственные общие UI-примитивы — Button и GlassPanel; найдено 35 использований GlassPanel, 26 `rounded-2xl`, 17 `rounded-full` и 18 backdrop blur. Baseline seller: [dashboard](screenshots/before/seller-dashboard-desktop.png), [create](screenshots/before/product-create-desktop.png); buyer: [storefront](screenshots/before/storefront-desktop.png), [product detail mobile](screenshots/before/product-detail-mobile-390-viewport.png).

**Воспроизведение:** последовательно открыть seller routes и публичную витрину.

**Влияние:** все уровни и действия выглядят одинаково «карточными», иерархия ослаблена. Избыточные радиусы и pills увеличивают визуальный шум; seller workspace теряет плотность, а публичная витрина — редакционную выразительность.

**Рекомендация:** расширить дизайн-систему на PageShell, Section, Toolbar, Field, Alert, Dialog, Toast, Skeleton, DataRow/Table и MediaQueue. Сократить glass до редких акцентов, уменьшить радиусы, применять pills только к статусам/фильтрам и разделить визуальные правила seller и buyer поверх общей токенной основы.

### DS-02 — документация и реальные токены расходятся; две utility-класса не компилируются

**Приоритет:** P1.

**Доказательство:** текущий `DESIGN.md` имеет статус draft и описывает Inter и Telegram `#229ED9`, тогда как код использует Arial и `#0877ad`. Объявленный mono token не используется. `bg-surface-muted` и `text-destructive` встречаются в JSX, но соответствующие theme tokens/utilities отсутствуют в собранном CSS.

**Воспроизведение:** проверить computed styles элементов с этими классами и сопоставить `globals.css` с `DESIGN.md`.

**Влияние:** часть состояний получает не тот фон/цвет, а документация не может быть источником истины. Это повышает риск визуальных регрессий при редизайне.

**Рекомендация:** до массовой миграции зафиксировать канонические semantic tokens, удалить или связать дубли, добавить `surface-muted` и `destructive`, затем проверить build output и contrast matrix.

### ROUTE-01 — boundary-состояния и стартовая страница не согласованы

**Приоритет:** P2.

**Доказательство:** `/` остаётся технической заглушкой; seller routes не имеют собственных `loading`, `error` и `not-found`; отсутствующий публичный product получает магазинный текст «Витрина не найдена», а отсутствующий seller product — стандартный Next 404.

**Воспроизведение:** открыть `/`, несуществующий buyer product и несуществующий seller product.

**Влияние:** пользователь не понимает, где оказался и как восстановиться; ошибки разных сущностей сообщаются неверно.

**Рекомендация:** определить роль `/`; добавить route-specific `error.tsx`, `not-found.tsx` и recovery actions; различать отсутствующий магазин и товар; сохранить единый shell и путь назад.

### PERF-01 — публичные изображения не используют image pipeline

**Приоритет:** P2.

**Доказательство:** публичные media-компоненты используют обычный `<img>`; предыдущий browser-отчёт также фиксирует соответствующее предупреждение.

**Воспроизведение:** открыть storefront/detail и проверить console/build diagnostics и загрузку изображений.

**Влияние:** неоптимальные размеры и декодирование ухудшают LCP и расход трафика, особенно на mobile.

**Рекомендация:** внедрить согласованный image component/pipeline с корректными `sizes`, aspect ratio, responsive variants, lazy loading ниже fold и приоритетом только для hero/cover.

### TEST-01 — основной check не включает часть контрактных тестов и не проверяет UI автоматически

**Приоритет:** P1 для безопасной реализации редизайна.

**Доказательство:** `npm run check` запускает 18 из 22 test-файлов. В него не входят `contact-contract`, `preview-contract`, `telegram-handoff` и `telegram-request`. Дополнительный запуск этих 10 тестов прошёл успешно, но вывел `MODULE_TYPELESS_PACKAGE_JSON` warnings. Playwright, axe и component-test framework отсутствуют.

**Воспроизведение:** сопоставить scripts в `package.json` со списком `*.test.*`; проверить зависимости и CI scripts.

**Влияние:** критический Telegram/contact контракт и preview могут регрессировать вне стандартного check; UI, responsive и accessibility зависят от ручной проверки.

**Рекомендация:** включить все тесты в единый check, убрать module-type warnings и добавить минимальный browser smoke-набор для auth shell, wizard, photo queue, publish, storefront, Telegram handoff и accessibility scan.

## 6. Desktop, mobile и accessibility coverage

### Матрица baseline

| Область | Desktop | Mobile | Вывод |
|---|---|---|---|
| Главная | [скриншот](screenshots/before/home-desktop.png) | нет | Заглушка, продуктовая роль не определена |
| Sign-in | [скриншот](screenshots/before/sign-in-desktop.png) | косвенно покрыт прежним E2E | Функционально ясен, требует системной визуальной миграции |
| Seller dashboard | [скриншот](screenshots/before/seller-dashboard-desktop.png) | нет отдельного baseline | Слишком узкий и разреженный на desktop |
| Products empty | [скриншот](screenshots/before/products-empty-desktop.png) | нет | Empty state есть; нужно встроить в новый shell |
| Product create | [desktop](screenshots/before/product-create-desktop.png) | [viewport 390](screenshots/before/product-create-mobile-390-viewport.png), [full-page](screenshots/before/product-create-mobile-390.png) | Длинная форма вместо wizard |
| Product media | [до загрузки](screenshots/before/product-edit-media-desktop.png), [selected](screenshots/before/product-media-selected.png), [saved](screenshots/before/product-media-saved.png) | нет | Критический разрыв feedback до submit |
| Store settings | [desktop](screenshots/before/store-settings-desktop.png) | [viewport 390](screenshots/before/store-settings-mobile-390-viewport.png), [full-page](screenshots/before/store-settings-mobile-390.png) | Перегруженная длинная форма; fixed nav требует safe-area проверки |
| Storefront | [скриншот](screenshots/before/storefront-desktop.png) | прежний E2E на 390 | Узкая glass-композиция, много пустого desktop-пространства |
| Product detail | [desktop](screenshots/before/product-detail-desktop.png) | [viewport 390](screenshots/before/product-detail-mobile-390-viewport.png), [full-page](screenshots/before/product-detail-mobile-390.png) | Галерея и CTA понятны; sticky CTA требует safe-area/overlap теста |

### Обязательные размеры для следующей проверки

- `360×800`: минимальный поддерживаемый узкий Android viewport.
- `390×844`: текущая контрольная точка.
- `430×932`: широкий современный mobile.
- `768×1024`: tablet portrait.
- `1024×768`: tablet/compact desktop.
- `1280×800` и `1440×900`: seller desktop workspace.

### Accessibility acceptance baseline

- Полный сценарий доступен клавиатурой без ловушек и ухода фокуса за модальный слой.
- На каждом route есть один логичный `h1`, skip link и предсказуемый порядок landmarks.
- Active navigation программно обозначена.
- Ошибки связаны с полями и озвучиваются один раз; фокус переводится в summary только при submit failure.
- Контраст текста/контролов соответствует WCAG 2.2 AA в выбранной светлой теме.
- Все touch targets не меньше 44×44 px и не перекрываются fixed/sticky элементами.
- `prefers-reduced-motion` отключает необязательное движение и плавный scroll.
- Skeletons не создают речевой шум; busy-регионы обозначены семантически.

## 7. Покрытие состояний

| Состояние | Текущее покрытие | Пробел |
|---|---|---|
| Empty | Нет магазина, товары/фильтр, public catalog, media, analytics | Визуальная иерархия неунифицирована |
| Pending | Тексты на кнопках auth/save/media/lifecycle/import/contact | Нет route loading, skeleton и пофайлового media progress |
| Success | Inline для auth/save/media/lifecycle/import/copy | Нет единого паттерна; create уходит редиректом без review/success context |
| Field error | Есть в основных формах | Не везде связана через `aria-describedby`; avatar/file state теряется |
| Page/load error | Есть на публичном route и в отдельных seller sections | Нет seller route-level error boundaries |
| Not found | Есть для магазина | Product/store semantics смешаны; seller получает стандартный 404 |
| Destructive confirm | Inline alertdialog, Escape, focus return | Нет modal semantics, trap и inert background |
| Disabled/unavailable | Telegram CTA и часть lifecycle | Нужны единые причины/подсказки и системный disabled style |
| Offline/retry | Частично публичный retry | Нет системной retry-модели для upload и seller mutations |

## 8. Supabase, auth и backend-ограничения для UX

1. **Auth остаётся magic-link.** `signInWithOtp` использует `shouldCreateUser: true`; callback обменивает код, а proxy защищает `/seller/**`, кроме sign-in. Редизайн не должен добавлять парольный или buyer-auth сценарий без отдельного продуктового решения.
2. **Локальный email rate limit низкий.** При ручных тестах использовать Inbucket и минимизировать повторные запросы magic link.
3. **Seller данные требуют ownership.** UI не должен подменять серверные проверки оптимистическими предположениями; forbidden/not-found следует сообщать без утечки существования чужих сущностей.
4. **Публичная витрина показывает только published.** Preview продавца использует сохранённые данные, требует auth/ownership и не пишет аналитику.
5. **Analytics зависит от service role.** Ключ должен оставаться только server-side. Если он не задан, contact handoff всё равно не должен блокироваться: запись аналитики best-effort.
6. **Storage-правила — часть UX.** Товар: JPG/PNG/WebP, до 6 MiB на файл и максимум 10 изображений; avatar — до 2 MiB. Клиентская подсказка не заменяет server signature/type validation.
7. **Не выполнять `db reset` для визуальной работы.** Seed-файл отсутствует, а локальные данные являются ценным тестовым baseline.

Рекомендуемый воспроизводимый запуск:

```powershell
npm ci
npx supabase start
npx supabase status
npm run dev
npm run check
npx supabase db lint --local --schema public,private --fail-on error
npx supabase migration list --local
```

## 9. Тестовый инвентарь

### Что есть

- Unit/contract тесты для auth, store, products, media, lifecycle, import, analytics, public catalog и Telegram/contact частей.
- `npm run check`: lint/type/build-related проверки и 62 теста в текущем основном наборе.
- Предыдущий ручной browser E2E-отчёт: 19/19 сценариев, desktop + `390×844`, 0 browser console errors.
- Дополнительно проверенные, но не включённые в основной script, 10 тестов из четырёх файлов — проходят.
- Supabase db lint и migration list доступны через `npx supabase`.

### Чего нет

- Автоматизированного browser E2E runner.
- Автоматизированного axe/WCAG smoke.
- Component-level interaction/visual tests.
- Скриншотной регрессии на целевых ширинах.
- Проверки media queue до отправки, upload retry и восстановления выбранных файлов.
- Стандартного check, включающего все test-файлы.

### Минимальный regression pack редизайна

1. Magic link request/callback/protected-route redirect.
2. First-run создание магазина и изменение профиля/slug.
3. Wizard товара: back/forward, сохранение данных, draft, review.
4. Media: допустимые/недопустимые файлы, mixed batch, progress, retry, reorder, cover, delete.
5. Publish guard: нельзя без фото; можно с 1–10 фото.
6. Public leakage: draft/hidden/deleted не видны анонимно.
7. Grid/list persistence и product permalink.
8. Telegram handoff, canonical username, copy fallback и неблокирующая analytics failure.
9. Preview ownership и отсутствие analytics.
10. Keyboard-only, focus trap, screen-reader errors и automated accessibility smoke.
11. Responsive pass на 360/390/430/768/1024/1280/1440.

## 10. Бизнес-инварианты, которые необходимо сохранить

- Один магазин на продавца; `stores.seller_id` остаётся уникальным.
- Все seller mutations требуют аутентификации и ownership; RLS и server checks остаются источником истины.
- Анонимному покупателю доступны только опубликованные товары; draft, hidden и deleted не должны утекать через UI, API, preview или cache.
- Черновик можно сохранить без фотографий; для публикации требуется от 1 до 10 валидных фотографий.
- Сохранение полей не меняет lifecycle неявно; publish/hide/delete остаются отдельными осознанными командами.
- Первая фотография по сортировке является обложкой, даже если UI добавит явную команду её назначения.
- Товарные изображения: только JPG/PNG/WebP, проверка содержимого/signature, до 6 MiB каждое, максимум 10. Avatar — до 2 MiB.
- Контакт только через Telegram; username канонизируется, внешнее сообщение не отправляется автоматически.
- Telegram-сообщение строится из доверенных серверных title, price и product URL; пользовательский клиент не может подменить эти поля.
- Analytics перед handoff выполняется best-effort и не блокирует переход/копирование.
- Seller preview требует auth/ownership, использует сохранённые данные и не считается публичным просмотром.
- Сохраняются правила attribution/source/session и исключения crawler/bot traffic.
- Импорт создаёт только drafts и возвращает построчные результаты при частичном успехе.
- Service-role остаётся строго server-side; существующие RLS, hardened RPC и storage policies не ослабляются ради UX.
- Изменение slug немедленно делает старый URL недействительным; UI обязан объяснить это до сохранения.
- Buyer account не вводится.
- Product permalink сохраняет стабильный ID товара.
- Локальные тестовые данные не уничтожаются и не пересоздаются без отдельного согласования.

## 11. Приоритетный план устранения

### P0 — до визуальной полировки

1. Исправить архитектуру media upload: локальная очередь, preview, пофайловые ошибки/progress/retry, cover/reorder и согласованные transport limits.
2. Перестроить `/seller/products/new` в трёхшаговый wizard с сохранённым draft между шагами и review перед публикацией.

### P1 — каркас и системные состояния

3. Зафиксировать semantic tokens и светлое целевое направление; устранить отсутствующие `surface-muted`/`destructive` utilities и расхождение документации с кодом.
4. Построить новый seller shell: локализованная navigation, active state, плотная desktop-сетка и безопасная mobile navigation.
5. Ввести общие Field, Alert, Dialog, Toast, Skeleton, Section/Toolbar и DataRow/Table primitives.
6. Разделить store settings на секции; добавить avatar preview, async slug validation и предупреждение о смене URL.
7. Добавить route loading/error/not-found boundaries и корректные recovery actions.
8. Закрыть accessibility gaps: focus ring/trap, skip link, field associations, контраст, reduced motion и safe areas.
9. Включить все contract tests в стандартный check и добавить browser/a11y smoke для критических потоков.

### P2 — выразительность и производительность

10. Пересобрать публичную витрину как редакционную композицию без повсеместных glass cards и избыточных pills.
11. Определить продуктовую роль `/` и привести boundary-copy к сущности/контексту.
12. Перевести публичные изображения на оптимизированный responsive pipeline.

## 12. Критерий готовности редизайна к реализации

Редизайн можно считать готовым к безопасной реализации, когда:

- P0 media и wizard решения описаны на уровне состояний, данных и ошибок, а не только макетов;
- дизайн-система задаёт канонические tokens и компоненты для seller/buyer контекстов;
- для каждого критического route определены loading, empty, error, success и not-found;
- mobile решения проверены минимум на 360/390/430 px, desktop — на 1280/1440 px;
- accessibility acceptance criteria включены в stories и regression pack;
- все перечисленные бизнес-инварианты имеют трассировку в implementation plan и тестах.
