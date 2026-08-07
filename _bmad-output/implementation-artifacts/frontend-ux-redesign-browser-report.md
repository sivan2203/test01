# Browser validation — frontend UX/UI-редизайн test01

Дата: 2026-08-07

Baseline: `ffb39c5bdaa724fa238234d8b1f32cc7ca88da16`

Target: финальный uncommitted snapshot после accessibility и browser fix-pass

## Итог

Критические seller и buyer потоки прошли в in-app Chromium против реальных локальных Next.js и Supabase. На проверенных мобильных ширинах горизонтального page overflow нет, один `h1` и route metadata сохраняются, dialog/wizard/media recovery не теряют состояние. Console после финального прохода: `0` warnings и `0` errors приложения.

Это не сертификат полного соответствия WCAG 2.2 AA: accessibility tree и фактический browser focus проверены, но отдельный проход физическим screen reader и буквальное browser zoom 400% не выполнялись. Ограничения перечислены ниже.

## Среда и границы

- Production build Next.js запускался локально на `http://localhost:3001`; локальные Postgres/Auth/Storage предоставлял Supabase.
- Seller: `seller@example.com`; витрина: `Студия 01`, slug `studio-01`, Telegram `test_seller`.
- Исходный товар: `Настольная лампа 01` (`864a3e1d-77d7-42dc-9274-79a1112cddbd`).
- Изолированные локальные fixtures: опубликованный `UX-проверка лампы 07.08` (`666b74ad-e3bb-49a4-85b7-00aab91a44b9`) и draft `UX-проверка идемпотентности 07.08` (`fdf3b383-1180-8dfb-8d8b-36eb66f5183e`).
- Production, deploy, schema/migrations и внешние сообщения не затрагивались; Telegram CTA не активировался.
- После проверки production server на `3001` остановлен. Разрешённые локальные тестовые товары оставлены как воспроизводимые fixtures; временная дополнительная media запись удалена, draft возвращён к одной фотографии.

## Автоматические проверки финального snapshot

| Проверка | Результат |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run test:contracts` | pass — 105/105, 27 файлов |
| `npm run smoke` | pass |
| `npm run check` | pass — все проверки выше единым запуском |

## Reflow и viewport matrix

Во всех строках ниже `documentElement.scrollWidth === documentElement.clientWidth`, основной landmark содержит ровно один `h1`, а root не имеет принудительного `min-width`.

| Поверхность | Ширины CSS px | Результат |
|---|---|---|
| Public storefront | 320, 360, 390, 412, 430, 1440 | pass; grid/list и длинный контент не создают page overflow |
| Public product detail | 320, 360, 390, 412, 430, 1440 | pass; gallery и sticky CTA остаются внутри viewport |
| Seller dashboard | 320, 390, 430, 1440 | pass; mobile navigation не перекрывает основной контент |
| Store settings | 320, 390, 430, 1440 | pass; form, dirty bar и preview reflow корректны |
| Product wizard | 320, 390, 430, 1440 | pass; stepper, fields, review и actions не переполняются |
| Import / analytics | 320, 390, 430, 1440 | pass; mapping/preview/metrics читаемы без horizontal page scroll |

Ширины 768/1024 и буквальное переключение browser zoom не были отдельными runtime-точками текущего финального прохода. Проверка на 320 CSS px покрывает нормативную reflow-геометрию, эквивалентную ширине 1280 px при 400%, но не выдаётся за тест самого механизма zoom.

## Сценарии и наблюдаемое evidence

### Seller shell, metadata и route structure

- Проверены dashboard, store settings, import, analytics и wizard; mobile bottom navigation и desktop sidebar корректно переключаются.
- Заголовки документа entity-aware: `Обзор · Персональная витрина`, `Настройки магазина · Персональная витрина`, `Студия 01 · Персональная витрина`, `UX-проверка лампы 07.08 — Студия 01 · Персональная витрина`.
- На финальных маршрутах `main[tabindex="-1"]`, один `h1`, логичные landmarks и русские доступные имена.

### Product wizard и browser history

- Данные сохраняются между шагами; draft ID детерминирован и повтор намерения не создаёт второй draft.
- При browser Back/Forward к `Проверка` текущий snapshot повторно валидируется. С title из одного пробела переход возвращает к `Основное`, фокусирует `ErrorSummary`, URL остаётся согласован с шагом.
- Пока media queue занята, навигация не уводит от progress/error состояния.

### Media queue

- `invalid-image.png` отклонён до очереди: показан alert/live status, queue item и бесполезный `Retry` не появились.
- Для реального network failure локальный server был временно остановлен после выбора валидного `lamp-detail.png`. Файл остался в queue с доступной командой Retry.
- После восстановления server Retry сработал без повторного file picker: upload завершился, status объявил успех, Retry исчез.
- Дополнительная запись затем удалена через app-native dialog. Начальный фокус был на `Отмена`, после success фокус вернулся к `H2#product-media-heading` через fallback focus.
- `Content-Length`, стабильный `uploadId`, последовательность `concurrency = 1`, over-capacity/reorder/cover и idempotent retry дополнительно закреплены contract tests.

### Store settings, dirty state и preview

- Строка из 500 непрерывных символов переносится и в live preview, и на public storefront; page и dialog overflow отсутствует.
- Mobile preview открывается с фокусом на заголовке, а не в конце длинного содержимого.
- Discard восстанавливает сохранённый snapshot и фокусирует `H2#store-settings-profile-title`.
- Попытка уйти с dirty form открывает `Уйти без сохранения?`; начальный фокус — `Остаться`. Cancel сохраняет URL/value и возвращает фокус к nav trigger; подтверждённый discard затем разрешает переход.
- На 320 px сфокусированное поле дополнительной информации не перекрыто dirty bar или bottom navigation: `field bottom = 434`, `dirty bar top = 688`, `navigation top = 843`; `scroll-padding-block-end = 224px`.

### Public storefront и product detail

- Grid/list переключатель сообщает selected state через `aria-pressed`; выбранный list сохраняется после reload, затем fixture возвращён в grid.
- Активная gallery thumbnail имеет `aria-pressed` и видимый checkmark, то есть состояние различимо не только цветом.
- Видимый CTA — `Связаться о товаре`; accessible name включает название товара и Telegram. CTA целиком внутри mobile viewport и не активировался.

### Import

- Через реальный file chooser выбран локальный `products-import.csv`, без submit. UI подтвердил чтение двух строк и показал mapping/preview без overflow.

## Accessibility evidence

- Browser accessibility snapshot подтвердил логичную heading hierarchy, именованные regions, buttons, alerts и status messages на dashboard, settings, storefront, product, wizard и import.
- Реальный browser focus проверен для validation summary, dirty-navigation dialog, mobile preview, media delete dialog и post-action fallback.
- CSSOM финального build содержит активные правила `prefers-reduced-motion`, `forced-colors`, safe-area и `scroll-padding-block-end`; состояния дополнены текстом/semantics, а не одним цветом.
- Skip link и focusable main подтверждены структурно. Обёртка browser automation не смогла надёжно воспроизвести именно `Tab` → `Enter` для skip-link, поэтому его буквальная keyboard activation не заявляется как runtime-pass.
- Отдельный physical screen-reader session не запускался; `prefers-reduced-motion` не эмулировался инструментом. Эти пункты остаются ограничениями evidence, а не найденными дефектами кода.

## Console и network

- Финальный `dev.logs` после чистого route pass: `[]` для warning/error.
- Преднамеренный upload network failure локализован одной queue item; соседнее состояние и `File` сохранены, retry завершился успешно.
- Необработанных request errors после восстановления server нет.

## Свежие after screenshots

- `screenshots/after/production-dashboard-desktop-1440.png`
- `screenshots/after/production-settings-mobile-390.png`
- `screenshots/after/production-storefront-mobile-390.png`
- `screenshots/after/production-storefront-desktop-1440.png`
- `screenshots/after/production-product-mobile-390.png`
- `screenshots/after/production-wizard-review-desktop-1440.png`
- `screenshots/after/production-analytics-mobile-390.png`

Все перечисленные production screenshots сняты после финального build и визуально проверены. Суффикс `390` соответствует выставленному mobile profile browser tool; точная reflow-геометрия 320/360/390/412/430 дополнительно проверялась через runtime viewport и DOM measurements, а не выводилась из размеров PNG.

## Вывод

Browser acceptance для заявленного frontend/local scope — pass с явно зафиксированными AT/zoom-инструментальными ограничениями. Неразрешённых runtime code defects, console errors, horizontal overflow или потери данных в проверенных recovery paths не обнаружено.
