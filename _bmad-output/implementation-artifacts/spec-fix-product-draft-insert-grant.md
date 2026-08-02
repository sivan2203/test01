---
title: "Восстановить сохранение черновика товара"
type: "bugfix"
created: "2026-08-02"
status: "done"
review_loop_iteration: 0
context: []
baseline_commit: "4541fc057a527546e679aad3a59e696764456cec"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Проблема:** На странице создания товара заполненная форма возвращает «Не удалось сохранить товар». `createProductDraft` создаёт строку в `public.products`, но роль `authenticated` имеет право чтения, а права `INSERT` не имеет.

**Подход:** Добавить отдельную миграцию с единственным недостающим правом `INSERT` на `public.products` для авторизованных пользователей. Существующая RLS-политика продолжит разрешать только черновик в магазине текущего продавца.

## Boundaries & Constraints

**Always:** Сгенерировать новую миграцию через Supabase CLI; выдать только `INSERT` на `public.products` роли `authenticated`; сохранить RLS и `products_insert_own`; применить и проверить изменение только в локальной Supabase-базе.

**Ask First:** Применение миграции к облачному проекту; добавление `UPDATE`/`DELETE`; доступ к `product_media` или Storage; изменение состава кнопок формы.

**Never:** Ослаблять RLS или выдавать доступ `anon`, `public` либо service role; менять существующие миграции; перемещать публикацию на экран создания — она требует сохранённого товара и фотографий.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Создание черновика | Авторизованный продавец с магазином отправляет валидную форму | Создаётся товар со статусом `draft`, затем открывается его страница редактирования | RLS проверяет владельца магазина |
| Чужой магазин | Продавец подменяет `store_id` в запросе | Вставка отклоняется политикой | Чужой товар не создаётся |
| Гость | Нет сессии | Нет права создавать товары | Серверное действие возвращает запрос на вход |
| Отмена до сохранения | Продавец выбирает «К списку товаров» | Переход без создания записи | Черновик не создаётся |

</frozen-after-approval>

## Code Map

- `src/features/product/actions.ts` — `createProductDraft()` вставляет draft и получает его идентификатор.
- `src/features/product/product-form.tsx` — кнопка «Сохранить черновик» и ссылка возврата к списку.
- `src/app/(seller)/seller/(admin)/products/new/page.tsx` — объясняет двухшаговый путь: черновик, затем фото и публикация.
- `supabase/migrations/20260801183000_create_products.sql` — таблица, RLS и базовая insert-политика.
- `supabase/migrations/20260802181149_grant_product_list_api_access.sql` — уже добавленное `SELECT`, нужное ответу вставки.

## Tasks & Acceptance

**Execution:**

- [x] `supabase/migrations/` — создать через CLI миграцию с `GRANT INSERT ON TABLE public.products TO authenticated` — разрешить только сохранение черновика через Data API.
- [x] `supabase/migrations/20260802184006_grant_import_batches_policy_read.sql` — разрешить RLS-политике товаров читать только собственные import batches — устранить блокировку проверки provenance без выдачи прав записи.
- [x] Локальная Supabase-база — применить миграции и транзакционно проверить создание от имени продавца — подтвердить разрешённый сценарий без сохранения тестовых данных.
- [x] `src/` — выполнить адресные lint и TypeScript-проверки — подтвердить отсутствие ошибок проектного кода.

**Acceptance Criteria:**

- Given продавец вошёл в систему и имеет магазин, when он сохраняет валидный новый товар, then создаётся его черновик и открывается редактирование товара.
- Given авторизованный продавец, when он пытается создать товар не в своём магазине, then `products_insert_own` отклоняет операцию.
- Given анонимный клиент, when он пытается вставить строку в `public.products`, then право таблицы отсутствует.
- Given локальная история миграций, when фикс применён, then добавлена новая миграция без переписывания предыдущих.

## Spec Change Log

- During transactional verification, the existing `products_insert_own` policy required table-level `SELECT` on `import_batches` even for a manual draft with no import provenance. The human approved a follow-up migration granting only that read privilege; the existing owner-scoped RLS policy remains the row boundary, and no write privilege was added.

## Design Notes

`INSERT` — единственное отсутствующее право для первого сохранения. `SELECT` уже выдан для списка и для `.select("id").single()` после вставки; UUID генерируется в базе, поэтому права на sequence не нужны. Публикация выполняется позднее отдельной RPC после добавления фотографий.

## Verification

**Commands:**

- `supabase migration up --local` — ожидается применение новой миграции только к локальной базе.
- `supabase db lint --local` — ожидаются ноль ошибок схемы.
- `npm exec eslint src` — ожидаются ноль ошибок.
- `npm run typecheck` — ожидается успешная проверка типов.

**Manual checks:**

- Сохранить валидный товар на `/seller/products/new`; ожидается переход на `/seller/products/{id}/edit` без сообщения об ошибке.

## Suggested Review Order

**Черновик товара**

- Открывает только создание черновика; строку всё ещё ограничивает owner-scoped RLS.
  [`20260802183536_grant_product_draft_insert_access.sql:3`](../../supabase/migrations/20260802183536_grant_product_draft_insert_access.sql#L3)

**Проверка provenance в RLS**

- Даёт политике доступ к собственным import batches без каких-либо прав записи.
  [`20260802184006_grant_import_batches_policy_read.sql:3`](../../supabase/migrations/20260802184006_grant_import_batches_policy_read.sql#L3)
