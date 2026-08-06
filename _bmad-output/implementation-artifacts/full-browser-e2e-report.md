# Полный браузерный E2E-отчёт

Дата: 2026-08-07

Среда: локальные Next.js, Supabase, Postgres, Auth, Storage и Mailpit

Тестовый seller: `codex-e2e@test.local`

Публичная витрина: `/codex-e2e-0807-0029`

## Итог

Все 19 story-сценариев завершены со статусом `pass`. Проверки выполнены через UI в in-app browser с реальными server actions, RLS, Storage, magic link из Mailpit и состоянием локальной БД. Внешнее Telegram-сообщение не отправлялось.

## Матрица сценариев

| Story | Статус | Наблюдаемое доказательство |
|---|---|---|
| 1-0 Foundation | pass | Локальный стек отвечает; production build, contracts и smoke проходят. |
| 1-1 Seller sign-in | pass | Magic link запрошен, получен в Mailpit и подтверждён; повторно использованный OTP отклонён. |
| 1-2 Store profile | pass | Созданы и отредактированы имя, описание, доп. информация, Telegram и PNG-аватар. |
| 1-3 Public slug | pass | Валидация reserved/invalid работает; новый slug открывается, старый сразу возвращает 404; исходный slug восстановлен. |
| 1-4 Buyer preview | pass | Preview показывает seller-плашку, опубликованный каталог и не добавляет analytics events. |
| 2-1 Manual draft | pass | Required title и числовая цена проверены; draft создан и сохранён. |
| 2-2 Product photos | pass | Неверная сигнатура отклонена; PNG upload, reorder, cover, remove и last-photo guard работают. |
| 2-3 Product lifecycle | pass | Published out-of-stock товар редактируется; hide/republish работают; delete переводит тестовый draft в архив. |
| 2-4 List and filters | pass | All/draft/published/hidden/deleted фильтры, empty states, cover и архивная карточка работают. |
| 3-1 Public storefront | pass | Профиль и только published товар видимы; draft/hidden/deleted и неизвестный slug дают 404/пустое состояние. |
| 3-2 List/grid | pass | Переключение и сохранение выбранного вида после reload подтверждены. |
| 3-3 Product detail | pass | Две фотографии, prev/next/thumbnail, title, price, stock и description корректны. |
| 3-4 Telegram channel | pass | Canonical username сохраняется; при пустом username CTA disabled с понятной причиной. |
| 3-5 Telegram handoff | pass | Открыт `t.me/codex_e2e_shop` с актуальными title, price и product URL; fallback copy-text показан. |
| 4-1 Analytics events | pass | В БД записаны `store_view`, `product_view`, `cta_click`; seller UI показывает агрегаты. |
| 4-2 Attribution | pass | `source=telegram` проходит storefront → detail → CTA; preview не считается, crawler имеет `excluded_reason=crawler`. |
| 4-3 Seller home analytics | pass | Home показывает store/product/CTA counts и top source. |
| 4-4 Product analytics | pass | Today и last-7-days показывают 1 view и 1 CTA у опубликованного товара, нули у drafts. |
| 5-1 CSV/XLSX import | pass | CSV partial success: 2 drafts + 1 rejected row; XLSX first-sheet mapping: 1 draft, second sheet ignored. |

## Исправленные первопричины

1. Generated `supabase/.temp/**` исключён из ESLint без исключения постоянных миграций.
2. Seller media reads восстановлены, а insert/delete перенесены в guarded RPC; прямые мутации таблицы закрыты.
3. Product UPDATE ограничен только user-editable колонками; identity/lifecycle колонки недоступны напрямую.
4. RLS helpers перенесены в неэкспонируемую схему `private`; публичные helper-RPC отозваны.
5. Analytics ingestion читает текущий JSON JWT claim, безопасно обрабатывает malformed JSON и сохраняет legacy fallback.
6. Пустой список seller covers больше не вызывает `createSignedUrls([])` и ложную ошибку.
7. Photo и product deletion используют in-app `alertdialog`, поддерживают Cancel/Escape и возвращают фокус на trigger.

## Security-доказательства

Итоговые ACL локальной БД:

- `product_media`: SELECT = true, INSERT = false, DELETE = false для `authenticated`;
- `products.title`: UPDATE = true;
- `products.status` и `products.id`: UPDATE = false;
- `public.product_media_published(text)`: EXECUTE = false для `anon`;
- `public.insert_product_media(...)`: EXECUTE = true для `authenticated`.

Валидный browser upload/remove после hardening повторно прошёл. Аналитика повторно записала событие после safe-claims миграции; malformed JSON claims проверены внутри транзакции с `ROLLBACK`.

## Responsive и доступность

- Проверен viewport 390×844 и desktop.
- Горизонтального переполнения нет; основные кнопки имеют высоту 44–48 px.
- Галерея имеет region/group/pressed semantics и различимые labels.
- Оба destructive confirmation имеют label/description, autofocus, Cancel и Escape.
- После Escape фокус возвращается на исходную кнопку; native JavaScript dialog отсутствует.
- Browser console после финального прогона: 0 errors/warnings приложения.

## Файлы проверки

- `_bmad-output/e2e-fixtures/lamp-cover.png`
- `_bmad-output/e2e-fixtures/lamp-detail.png`
- `_bmad-output/e2e-fixtures/invalid-image.png`
- `_bmad-output/e2e-fixtures/products-partial.csv`
- `_bmad-output/e2e-fixtures/products-valid.xlsx`

## Автоматическая регрессия

- `npm.cmd run check` — pass: lint, typecheck, production build, 62 contract tests, smoke.
- `supabase db lint --local --schema public,private --fail-on error` — 0 schema errors.
- `supabase migration list --local` — локальная история синхронизирована до hardening migration.
- `git diff --check` — whitespace errors отсутствуют.

Неблокирующие предупреждения: существующее правило `@next/next/no-img-element` для signed product image и Node `MODULE_TYPELESS_PACKAGE_JSON`; ошибок нет.
