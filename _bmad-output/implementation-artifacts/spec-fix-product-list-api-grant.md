---
title: "Восстановить доступ к списку товаров"
type: "bugfix"
created: "2026-08-02"
status: "done"
review_loop_iteration: 0
context: []
baseline_commit: "5cfab2ea086cb01a26b2819f5dd0ba7809667163"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Проблема:** После создания магазина раздел `/seller/products` показывает ошибку загрузки. Таблица `public.products` защищена RLS-политикой владельца, но при отключённой автоматической публикации таблиц в Data API роль `authenticated` не имеет права `SELECT`.

**Подход:** Добавить отдельную версионированную миграцию с минимальным правом чтения `public.products` для авторизованного продавца. RLS продолжит ограничивать список товарами его магазина.

## Boundaries & Constraints

**Always:** Создать новую миграцию через Supabase CLI; дать только `SELECT` на `public.products` роли `authenticated`; сохранить текущие RLS-политики `products_select_own`, `products_insert_own` и `products_update_own`; применить и проверить изменение только в локальной базе.

**Ask First:** Применение миграции к облачному проекту; добавление `INSERT`, `UPDATE` или `DELETE` для товаров; любые права для `product_media`, Storage или других таблиц.

**Never:** Отключать или ослаблять RLS; выдавать права `anon`, `public` или service role; включать глобальную автоматическую публикацию таблиц; переписывать ранее применённые миграции.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Список без товаров | Авторизованный владелец магазина, товаров нет | Запрос списка успешен, UI показывает штатное пустое состояние | Не показывать ошибку загрузки |
| Список владельца | Авторизованный продавец с товарами | Возвращаются только товары его магазина | RLS фильтрует строки |
| Чужие товары | Другой авторизованный продавец | Товары другого магазина не возвращаются | RLS ограничивает доступ |
| Гость | Нет авторизации | Нет доступа к таблице `products` | Право `SELECT` не выдаётся `anon` |

</frozen-after-approval>

## Code Map

- `src/features/product/queries.ts` — `getSellerProducts()` читает товары после проверки магазина.
- `src/app/(seller)/seller/(admin)/products/page.tsx` — показывает текущую ошибку, если запрос списка завершился неуспешно.
- `supabase/migrations/20260801183000_create_products.sql` — таблица и существующие owner-scoped RLS-политики без grant.
- `supabase/migrations/` — место новой миграции с минимальным правом чтения.

## Tasks & Acceptance

**Execution:**

- [x] `supabase/migrations/` — сгенерировать через CLI новую миграцию с `GRANT SELECT ON TABLE public.products TO authenticated` — открыть список товаров через Data API, не ослабляя RLS.
- [x] Локальная Supabase-база — применить миграцию и проверить grants/policies — подтвердить минимальный объём доступа.
- [x] `src/` — выполнить адресную проверку lint и TypeScript — убедиться, что проектный код остаётся корректным.

**Acceptance Criteria:**

- Given локальная Supabase-база запущена и продавец вошёл в систему, when он открывает `/seller/products`, then вместо ошибки загрузки получает список своих товаров или штатное пустое состояние.
- Given продавец A и магазин продавца B, when продавец A выполняет чтение `products`, then RLS не возвращает товары B.
- Given анонимный клиент, when он пытается прочитать `public.products`, then право таблицы отсутствует.
- Given история миграций, when фикс применён, then новая миграция добавлена без изменения уже применённых файлов.

## Spec Change Log

## Design Notes

Права таблицы и RLS — независимые уровни. `GRANT SELECT` позволяет Data API выполнить запрос, а существующая политика `products_select_own` остаётся проверкой владения через магазин. Операции записи и таблица медиа не участвуют в загрузке данного экрана и намеренно не включены.

## Verification

**Commands:**

- `supabase migration up --local` — ожидается применение только новой миграции к локальной БД.
- `supabase db lint --local` — ожидается отсутствие ошибок схемы.
- `npm exec eslint src` — ожидаются ноль ошибок.
- `npm run typecheck` — ожидается успешная проверка типов.

**Manual checks:**

- Обновить `/seller/products` в авторизованной локальной сессии; ожидается пустой список или товары, без сообщения об ошибке загрузки.

## Suggested Review Order

- Открывает продавцу только путь чтения, оставляя проверку строк существующему RLS.
  [`20260802181149_grant_product_list_api_access.sql:3`](../../supabase/migrations/20260802181149_grant_product_list_api_access.sql#L3)
