---
title: 'Полный браузерный E2E-прогон и исправление дефектов MVP'
type: 'bugfix'
created: '2026-08-07'
status: 'done'
review_loop_iteration: 0
baseline_commit: '1ec3a44d32746e3edcbcfe6b6f820e52c291c7ed'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Реализованные истории помечены `done`, но весь MVP не доказан сквозным браузерным прогоном на реальном локальном Supabase. Любой найденный сбой должен быть диагностирован и исправлен, а не только внесён в отчёт.

**Approach:** Пройти acceptance criteria всех 19 историй как новый продавец и анонимный покупатель, используя локальные Postgres/Auth/Storage/Mailpit. Для каждого дефекта исправить первопричину в соответствующем vertical slice, добавить подходящую регрессионную проверку и повторить пользовательский сценарий.

## Boundaries & Constraints

**Always:** Использовать локальный Supabase и реальные server actions/RLS; сохранять разделение seller/public, published-only видимость, draft-only import и append-only analytics; проверять основной viewport 360–430 px и desktop; хранить тестовые данные под отдельным E2E-пользователем; считать сценарий пройденным только по наблюдаемому UI и состоянию данных.

**Ask First:** Необратимый сброс локальной БД с потерей чужих данных; отправка сообщения во внешний Telegram; изменение согласованных MVP-инвариантов или добавление post-MVP функций.

**Never:** Ослаблять RLS или использовать service role для обычных seller/public операций; подменять Supabase моками в браузерном прогоне; скрывать ошибки вместо исправления; считать непроверенный, заблокированный или частично работающий сценарий успешным.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Passwordless auth | Новый seller email | Письмо в Mailpit, callback, защищённый кабинет | Повторный OTP отклоняется; можно запросить новый |
| Store setup | Профиль, slug, Telegram | Канонические данные и публичная пустая витрина | Inline-ошибки без потери сохранённых данных |
| Product lifecycle | Draft с/без фото, publish/hide/delete | Только published виден покупателю | Невалидный transition блокируется и объясняется |
| Product media | JPG/PNG/WebP, несколько фото | Загрузка, порядок, cover, удаление, signed reads | Неверный тип/размер отклоняется без порчи товара |
| Import | Валидный и частично невалидный CSV/XLSX | Preview/mapping, partial success, только drafts | Ошибки строк видимы и повторяемы |
| Buyer flow | Store/catalog/detail/list/grid/CTA | Анонимный доступ, корректные карточки и handoff | 404 не раскрывает draft/hidden/deleted |
| Analytics | Store/product/CTA с source | Корректные today/7-day агрегаты и top source | Preview/admin/bot не учитываются |
| Responsive/a11y | 360–430 px, desktop, keyboard | Нет потери функций; корректный focus/ARIA/tap targets | Ошибки фиксируются до повторного прогона |

</frozen-after-approval>

## Code Map

- `src/app/(seller)/seller` — seller routes, auth shell, store/products/import/analytics screens.
- `src/app/(public)/[storeSlug]` — public storefront and product detail boundaries.
- `src/features/seller-auth`, `src/features/store` — passwordless auth, profile, slug, preview and public queries.
- `src/features/product`, `src/features/import` — CRUD, lifecycle, media and draft import.
- `src/features/contact`, `src/features/analytics` — Telegram handoff, event ingestion, attribution and summaries.
- `supabase/migrations` — schema, grants, RLS, storage and RPC contracts.
- `scripts/*.test.mjs`, `scripts/smoke-foundation.mjs` — regression and structural checks.
- `eslint.config.mjs` — static-analysis scope; currently includes generated `supabase/.temp` code.

## Tasks & Acceptance

**Execution:**
- [x] `eslint.config.mjs` — исключить только генерируемые локальным Supabase temp-артефакты и восстановить чистый `npm run lint`.
- [x] `_bmad-output/implementation-artifacts/1-*.md` — пройти auth/store/slug/preview AC; исправить и повторить каждый сбой.
- [x] `_bmad-output/implementation-artifacts/2-*.md` — пройти product CRUD/media/lifecycle/list/filter AC с реальными файлами и состояниями.
- [x] `_bmad-output/implementation-artifacts/3-*.md` — пройти storefront/catalog/detail/Telegram AC как анонимный buyer.
- [x] `_bmad-output/implementation-artifacts/4-*.md` — доказать события, атрибуцию и seller aggregates по состоянию БД и UI.
- [x] `_bmad-output/implementation-artifacts/5-1-import-excel-csv-products-as-drafts.md` — проверить CSV/XLSX mapping, partial success и draft-only результат.
- [x] `src/**`, `supabase/migrations/**`, `scripts/**` — для найденных дефектов внести минимальные архитектурно корректные исправления и регрессионные тесты.
- [x] `_bmad-output/implementation-artifacts/full-browser-e2e-report.md` — сохранить матрицу pass/fail, исправления и финальные доказательства.

**Acceptance Criteria:**
- Given чистый локальный стек, when выполняется `npm run check`, then lint, typecheck, build, 57+ contract tests и smoke завершаются успешно.
- Given новый seller и анонимный buyer, when пройдены AC всех 19 story-файлов, then каждый сценарий имеет финальный `pass` и воспроизводимое доказательство.
- Given найденный дефект, when применено исправление, then исходный сценарий и соседние границы повторно проходят без ослабления RLS и архитектурных инвариантов.
- Given mobile и desktop проверки, when используются клавиатура и основные CTA, then все функции доступны, состояния различимы, а консоль не содержит необработанных ошибок приложения.

## Spec Change Log

- 2026-08-07: adversarial review replaced broad Data API grants with guarded RPC/column ACLs, hardened JWT parsing, and added Escape/focus restoration.

## Design Notes

Браузерный прогон является источником истины для пользовательского поведения; SQL/contract проверки подтверждают RLS, события и данные, которые нельзя надёжно доказать только визуально. Исправления группируются по первопричине, а не по экрану, чтобы не маскировать общий дефект несколькими UI-обходами.

## Verification

**Commands:**
- `npm.cmd run check` — полный preflight проходит после запуска/остановки dev-сервера в безопасной последовательности.
- `npx.cmd --yes supabase@latest status` — локальные API, DB, Auth, Storage, Studio и Mailpit доступны.
- `git diff --check` — отсутствуют whitespace-ошибки.

**Manual checks:**
- Трассируемая browser-матрица всех story AC на mobile и desktop содержит только финальные `pass`.
- Публичные запросы не раскрывают draft/hidden/deleted; preview не меняет buyer analytics; Telegram message содержит актуальный title/price/product URL.

## Suggested Review Order

**Security boundaries**

- Начните с hardening: private RLS helpers, guarded media insert и узкие ACL.
  [`20260806224520_harden_seller_data_api_access.sql:176`](../../supabase/migrations/20260806224520_harden_seller_data_api_access.sql#L176)

- Seller upload теперь записывает metadata только через invariant-preserving RPC.
  [`media-actions.ts:175`](../../src/features/product/media-actions.ts#L175)

- Product edit отправляет только пользовательские поля, не identity/lifecycle колонки.
  [`actions.ts:121`](../../src/features/product/actions.ts#L121)

- Analytics предпочитает JSON claim и безопасно переживает malformed payload.
  [`20260806222049_fix_analytics_service_role_claim.sql:39`](../../supabase/migrations/20260806222049_fix_analytics_service_role_claim.sql#L39)

**Confirmation UX**

- Photo delete использует in-app alertdialog, Escape и возврат фокуса.
  [`product-media-manager.tsx:52`](../../src/features/product/product-media-manager.tsx#L52)

- Product delete следует тому же доступному destructive-confirm паттерну.
  [`product-state-control.tsx:79`](../../src/features/product/product-state-control.tsx#L79)

**Resilience and evidence**

- Пустой cover-result больше не вызывает ошибочный Storage signing request.
  [`media-queries.ts:184`](../../src/features/product/media-queries.ts#L184)

- Контракт фиксирует запрет прямых media/system-column мутаций.
  [`data-api-grants.test.mjs:8`](../../scripts/data-api-grants.test.mjs#L8)

- Полная browser-матрица и SQL/UI доказательства собраны в отчёте.
  [`full-browser-e2e-report.md:1`](full-browser-e2e-report.md#L1)
