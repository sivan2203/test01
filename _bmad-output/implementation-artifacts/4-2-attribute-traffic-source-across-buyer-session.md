---
baseline_commit: da483c35fe01b4cb96eadf542c59a1e347207b96
---

# Story 4.2: Attribute Traffic Source Across Buyer Session

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,
I want buyer visits and contact clicks to keep their traffic source,
so that I can understand whether Instagram, Telegram, direct links, or unknown sources bring interest.

## Acceptance Criteria

1. **Явный источник имеет приоритет (FR19, NFR4, NFR5, AD-8)**
   - **Given** покупатель открывает публичную витрину или карточку товара с параметрами `source` и/или `utm_source`
   - **When** источник атрибуции разрешается
   - **Then** используется `source`, если он непустой; иначе используется `utm_source`
   - **And** явный источник имеет приоритет над сохранённым источником сессии и HTTP referrer
   - **And** источник нормализуется в безопасный lowercase stable key; невалидное значение становится `unknown`, а не сохраняется как URL или произвольный текст.

2. **Referrer и fallback (FR19, NFR4, AD-8)**
   - **Given** явный `source`/`utm_source` отсутствует
   - **When** внешний HTTP referrer доступен
   - **Then** система выводит стабильную метку только для распознанных источников: как минимум `instagram`, `telegram`, `vk`; явный `source=direct` также поддерживается
   - **And** внутренний referrer текущего сайта не превращается в источник сам по себе
   - **And** неизвестный домен, отсутствующий referrer, невалидный referrer или невозможность уверенно распознать источник дают `unknown`
   - **And** полный referrer URL, query string и buyer identity не записываются в analytics ledger.

3. **Сессионная атрибуция (FR19, NFR4, AD-8, AD-9)**
   - **Given** источник успешно разрешён на публичной витрине
   - **When** последующие события происходят в той же анонимной сессии
   - **Then** source metadata сохраняется server-owned механизмом, связанным с существующим `buyer_session_id`
   - **And** при отсутствии нового явного источника сохранённый источник имеет приоритет над новым referrer
   - **And** новый явный `source`/`utm_source` может осознанно обновить сохранённую метку и применяется к текущему событию
   - **And** persisted attribution содержит только безопасный source key, не raw referrer и не персональные данные
   - **And** cookie остаётся `HttpOnly`, `SameSite=Lax`, `Path=/`, с production `Secure` и сроком, совместимым с существующей анонимной сессией.

4. **Пропагация в store/product view (FR18, FR19, NFR5, AD-7, AD-8, AD-14)**
   - **Given** source определён на storefront view или direct public product entry
   - **When** покупатель открывает карточку товара в той же сессии
   - **Then** `product_view` получает тот же resolved `source`
   - **And** обычная навигация storefront → product detail не теряет attribution
   - **And** прямой вход на опубликованный product URL также корректно разрешает source и не требует buyer auth
   - **And** события по-прежнему записываются в существующий append-only `analytics_events` ledger в UTC.

5. **Пропагация в CTA click (FR16, FR18, FR19, NFR4, AD-4, AD-8)**
   - **Given** покупатель нажимает enabled Telegram CTA в той же сессии
   - **When** CTA click записывается перед Telegram handoff
   - **Then** `cta_click` получает resolved `source`
   - **And** source может быть получен из server-owned session attribution даже если предыдущий view beacon ещё не завершился
   - **And** существующая повторная server-side проверка store/product, preview exclusion, non-blocking analytics и CTA-before-handoff порядок сохраняются
   - **And** система не утверждает, что Telegram открылся, сообщение отправлено, сделка началась или покупка совершена.

6. **Unknown и downstream labels (FR19, NFR5, AD-19, UX)**
   - **Given** источник невозможно распознать
   - **When** событие сохраняется или агрегируется позже
   - **Then** оно сохраняется с `source = unknown` и не отбрасывается
   - **And** source key остаётся стабильным для будущих группировок Story 4.3/4.4
   - **And** helper для seller-facing labels возвращает человекочитаемую подпись, например `Instagram`, `Telegram`, `VK`, `Прямой переход`, `Неизвестный источник`
   - **And** Story 4.2 не добавляет dashboard widget, product analytics UI, charts или 30-day aggregation.

## Scope Decisions

Эти правила устраняют неоднозначности PRD и являются частью реализации:

- Приоритет кандидатов: текущий непустой `source` → текущий непустой `utm_source` → сохранённый session source → внешний referrer → `unknown`.
- `source` и `utm_source` разрешаются из текущего public URL; client hints являются только входными данными для server-side нормализации и не являются доверенной границей.
- Минимальный referrer allowlist: `instagram.com`/`l.instagram.com` → `instagram`, `t.me`/`telegram.me`/`telegram.org` → `telegram`, `vk.com`/`m.vk.com` → `vk`. Неизвестные домены не превращаются в произвольные source keys.
- Отсутствие referrer означает `unknown`; `direct` допустим только как явный source label.
- Сохраняется только распознанный non-`unknown` source key. Событие без attribution всё равно получает `unknown`; это не должно блокировать последующую попытку распознать внешний источник.
- Source cookie — это только session attribution hint. Каноническими остаются raw analytics events; не создавать вторую таблицу, mutable counters или materialized dashboard aggregate.
- Deduplication Story 4.1 сохраняется. Если view схлопнут в существующее событие, существующая строка не мутируется ради нового source; resolved source применяется к новой записи или deduplicated result согласно текущему RPC-контракту.

## Tasks / Subtasks

- [x] Task 1: Создать единый source-attribution contract (AC: 1, 2, 6)
  - [x] Вынести source resolution из дублирующихся `getSourceFromReferer` в общий pure-модуль под `src/features/analytics/`.
  - [x] Реализовать нормализацию stable keys, явный порядок `source` → `utm_source`, allowlist известных referrer hostnames, same-origin referrer rejection и `unknown` fallback.
  - [x] Добавить helper для human-readable seller labels; не использовать эти labels как persisted keys.
  - [x] Не хранить raw URL, referrer query, UTM campaign/medium или buyer identity в `analytics_events`, если для этого нет отдельного требования.

- [x] Task 2: Добавить server-owned session attribution (AC: 3)
  - [x] Использовать существующий `buyer_session_id`; не создавать второй идентификатор покупателя и не вводить buyer account.
  - [x] Добавить одну согласованную cookie-константу для source attribution (например, `buyer_source`) и общий server helper чтения/записи, чтобы `/api/analytics` и Telegram route не расходились.
  - [x] Записывать только безопасный распознанный source key; игнорировать невалидное или слишком длинное значение.
  - [x] Сохранять cookie только в Route Handler/server boundary, с `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` в production и сроком жизни, совместимым с `buyer_session_id`.
  - [x] Не менять семантику и cookie options существующего `buyer_session_id` без необходимости.

- [x] Task 3: Расширить public analytics hints без блокировки UI (AC: 1–4, 6)
  - [x] Обновить `src/features/analytics/public-analytics-beacon.tsx`, чтобы он передавал только transient hints из текущего URL (`source`/`utm_source`) и `document.referrer`; нормализация и persistence остаются на сервере.
  - [x] Обновить public storefront и product detail wiring так, чтобы явные query params не терялись; сохранить ровно один beacon на успешный public boundary.
  - [x] В `/api/analytics` разрешать source через общий resolver: текущие explicit hints, stored cookie, referrer hint, затем `unknown`.
  - [x] При успешном распознавании обновлять source cookie до/независимо от non-blocking ledger write, чтобы быстрый переход к CTA не терял attribution.
  - [x] Сохранить malformed payload 400, controlled 202 result, preview/admin exclusion, bot classification и public-flow resilience Story 4.1.

- [x] Task 4: Пропустить тот же resolver через Telegram handoff (AC: 5)
  - [x] Обновить `src/features/contact/telegram-route.ts` и `src/features/contact/telegram-request.ts`, чтобы CTA мог передать transient source/referrer hints, если beacon ещё не успел создать cookie.
  - [x] Server-side resolver должен предпочитать explicit source hint, затем stored session source, затем внешний referrer; body source не должен обходить нормализацию.
  - [x] Не создавать отдельную source resolution ветку в `handoff.ts`/`handoff-service.ts`; сохранить их dependency-injected seam и существующее ожидание CTA analytics перед handoff.
  - [x] Preview route не должен записывать публичную attribution или публичный `cta_click`; invalid/disabled CTA не должен записывать событие.

- [x] Task 5: Сохранить существующий ledger/RPC контракт (AC: 4–6)
  - [x] Передавать в существующие `record_public_store_view`, `record_public_product_view` и `record_public_cta_click` уже resolved/normalized source.
  - [x] Не добавлять вторую analytics table, mutable counters, dashboard-specific aggregates или UI Story 4.3/4.4.
  - [x] Не редактировать уже применённые миграции. Если потребуется schema change, добавить timestamped SQL migration под `supabase/migrations/` с rollback note, RLS/grant review и ссылками на AD/FR.
  - [x] Сохранить append-only raw events, UTC `occurred_at`, 30-second view dedupe, 3-second CTA double-tap dedupe, exclusion reason и server-side public store/product re-query.

- [x] Task 6: Тесты и проверка регрессий (AC: 1–6)
  - [x] Добавить unit/contract tests для `source` vs `utm_source`, explicit vs stored source, stored source vs referrer, known host mapping, same-origin referrer, invalid values, direct label и `unknown`.
  - [x] Проверить propagation storefront → product view и storefront/product → CTA при наличии и отсутствии source cookie.
  - [x] Проверить, что быстрый CTA с transient hints не теряет source, а preview/admin/crawler и disabled CTA не создают публичную attribution.
  - [x] Проверить, что raw referrer URL и buyer identity не попадают в RPC args, cookie value или migration schema.
  - [x] Сохранить существующие analytics/handoff contract tests и добавить static checks против дублирования source resolver logic.
  - [x] Запустить `npm.cmd run check`; отдельно отметить, если live Supabase/RLS integration недоступен локально.

## Dev Notes

### Business context and downstream contract

Story 4.1 уже реализовала append-only ledger и базовое поле `source`, но намеренно оставила session-scoped UTM/referrer attribution для Story 4.2. Story 4.3 будет ранжировать `top source` по public `store_view` count согласно AD-19. Story 4.4 будет использовать `source` у `product_view` и `cta_click`. Поэтому эта story отвечает за корректность source metadata, а не за seller-facing analytics screens.

### Existing implementation to extend

- `src/app/api/analytics/route.ts` уже читает `buyer_session_id`, классифицирует user agent и пишет через server-only ingestion, но текущая копия source logic смотрит только в HTTP `Referer` и не сохраняет source attribution.
- `src/features/analytics/public-analytics-beacon.tsx` отправляет `eventName`, `storeSlug`, `productId`, но ещё не отправляет query/referrer hints.
- `src/features/analytics/public-ingestion.ts` принимает normalized `source` и маппит view events на существующие RPCs. Расширять его нужно без изменения public event catalog.
- `src/features/analytics/public-ingestion-server.ts` импортирует service-role client и должен оставаться server-only. Client components не должны импортировать этот модуль.
- `src/features/contact/telegram-route.ts` содержит вторую копию referrer parsing и читает только `buyer_session_id`; заменить её общим resolver, сохранив response/status contract.
- `src/features/contact/telegram-request.ts` валидирует `storeSlug` и `productId`; transient attribution hints должны быть optional и безопасно отбрасываться при неверном типе.
- `src/features/contact/handoff.ts` и `src/features/contact/handoff-service.ts` уже обеспечивают server-side re-query и CTA-before-handoff. Не переносить source resolution в client CTA и не менять порядок этих операций.
- `src/features/store/public-contact-cta.tsx` вызывается и для catalog card, и для product detail. Если туда добавляется hint collection, она должна быть общей и не создавать второй handoff implementation.
- `src/app/(seller)/seller/(admin)/store/preview/page.tsx` и authorized preview product flow не должны монтировать public analytics beacon или записывать attribution.

### Architecture and security guardrails

- **AD-2:** public buyer and seller preview surfaces remain separate; preview exclusion is server-authorized, never a client opt-out flag.
- **AD-4:** CTA click remains an observed intent event recorded before external Telegram handoff.
- **AD-7:** `analytics_events` is append-only and canonical; no mutable counter is authoritative.
- **AD-8:** source is session-scoped; explicit source/UTM beats referrer, then attribution propagates to product and CTA events.
- **AD-9:** buyers remain anonymous. `buyer_session_id` is opaque; source cookie contains no identity.
- **AD-14:** persist event timestamps in UTC; store timezone is for later dashboard day windows, not source resolution.
- **AD-15:** browser code uses only public-safe inputs; service-role access remains isolated to server-only ingestion.
- **AD-17:** schema/RLS/function/index changes are migration-owned. Do not edit applied migrations in place.

Referrer input is untrusted metadata. Normalize it, compare against the request/site origin, allowlist known hosts, and discard the raw value before persistence. Do not use referrer or source as authorization, store identity, redirect target, or SQL fragment.

### File structure requirements

Expected ownership; confirm exact names against the repository before editing:

```text
src/features/analytics/source-attribution.ts             # NEW: pure resolver, stable keys, host mapping, label helper
src/features/analytics/source-attribution-server.ts      # NEW/UPDATE: cookie read/write and server boundary, if needed
src/features/analytics/public-analytics-beacon.tsx      # UPDATE: transient URL/referrer hints
src/app/api/analytics/route.ts                          # UPDATE: shared resolver + source cookie persistence
src/features/contact/telegram-route.ts                  # UPDATE: same resolver and source cookie
src/features/contact/telegram-request.ts                # UPDATE: optional transient attribution hints
src/features/store/public-contact-cta.tsx               # UPDATE only if needed for CTA race-safe hints
src/features/analytics/README.md                        # UPDATE: source ownership and persistence contract
scripts/analytics-contract.test.mjs                     # UPDATE or add source-attribution contract coverage
scripts/source-attribution.test.mjs                     # NEW if pure resolver coverage is clearer here
supabase/migrations/<timestamp>_*.sql                   # ONLY if an actual schema change is required
```

Do not add a second ledger, source table, buyer account, client-side Supabase write, raw referrer column, UTM-link generator, dashboard chart, 30-day UI, Telegram SDK/bot, WhatsApp/VK adapter, or purchase/message-delivery tracking.

### Testing requirements

Use the repository’s Node 24 `node:test` contract style and dependency injection. Minimum cases:

- `source=Instagram` + `utm_source=telegram` resolves to `instagram`.
- Empty `source` falls back to `utm_source`; missing both falls through to stored source.
- Stored `instagram` beats a later unrecognized external referrer; a later explicit `telegram` intentionally replaces it.
- `https://www.instagram.com/...`, `https://t.me/...`, and `https://vk.com/...` map to stable keys; unknown host, malformed URL, same-origin host, and no referrer resolve to `unknown`.
- `source=direct` remains `direct`; invalid URLs, whitespace-only values, overlong values, and unsafe characters become `unknown` and are never persisted raw.
- Store view source is available to product view; product view source reaches CTA; direct product entry can resolve source.
- CTA still works when analytics is unavailable or the view beacon has not completed; source is attached when a transient hint is available.
- Preview, admin, crawler, invalid product, disabled Telegram, and cross-store contexts remain excluded or rejected as in Story 4.1.
- No raw referrer appears in RPC arguments, persisted cookie source, public response, or analytics table changes.

Run `npm.cmd run check`. This validates lint, typecheck, build, contract tests, and smoke checks; it does not prove live Supabase RLS behavior when no runtime database is configured.

### Library/framework requirements

The repository is pinned to Node `>=24 <25`, Next.js `16.2.12`, React `19.2.4`, `@supabase/ssr` `0.12.4`, and `@supabase/supabase-js` `2.111.0`. Do not add dependencies for this story.

Next.js Route Handlers use native Web `Request`/`Response`; `POST` handlers are not cached by default. `cookies()` is asynchronous in the current App Router and cookie mutation belongs in a Route Handler or Server Function, not a Server Component. Follow the repository’s local docs before changing route/cookie code.

Supabase functions that use `security definer` must keep an explicit safe `search_path` and fully qualified relations; function execute privileges and RLS must remain least-privilege. Since this story should use the existing `source` column, prefer no migration unless schema inspection proves one is required.

### Previous story intelligence

Story 4.1 (`da483c35`) established the following patterns that must be preserved:

- server-only analytics ingestion through `/api/analytics` and isolated service-role RPC writer;
- public store/product re-query inside database RPCs;
- canonical `store_view`, `product_view`, `cta_click` event names;
- `buyer_session_id` opaque cookie created at the analytics Route Handler boundary;
- normalized stable source keys with `unknown` fallback;
- crawler/preview exclusion and non-blocking public rendering;
- raw event ledger with UTC timestamps and bounded deduplication;
- tests in `scripts/analytics-contract.test.mjs` and `scripts/handoff-contract.test.mjs`.

Story 4.1’s explicit deferred boundary is important: source attribution persistence/precedence belongs here; seller dashboard widgets and product summaries do not.

### Current git intelligence

The current baseline is commit `da483c35fe01b4cb96eadf542c59a1e347207b96` (`Story 4.1 реализована`). Recent work is organized as one story artifact plus implementation changes, contract tests, migrations when needed, and an updated sprint status. Keep this story’s changes focused on attribution and do not rewrite existing Story 4.1 migrations.

### Latest technical guidance

- Next.js local guide: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — Route Handlers use Web Request/Response APIs; non-GET handlers are not cached by default.
- Next.js local guide: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — `cookies()` is async; `.set()` is supported in Route Handlers/Server Functions, not ordinary Server Component rendering.
- [Next.js cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies) — current cookie API and mutation boundaries.
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) — secure `search_path` and explicit function privileges for `security definer` functions.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — exposed tables require RLS and least-privilege grants.

### Project structure notes

- This is a brownfield implementation: public routes are under `src/app/(public)/[storeSlug]`, seller routes under `src/app/(seller)/seller/(admin)`, and feature seams under `src/features/`.
- Existing public pages are Server Components and the beacon is the only client boundary for view analytics. Keep attribution hints minimal and non-blocking.
- The source cookie is not a replacement for `buyer_session_id`; it is an opaque-session-associated source key and must never be used as identity or authorization.
- No live Supabase fixture/integration harness is currently configured. Label migration/RLS verification limits accurately.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4 / Story 4.2]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — FR-18, FR-19, Analytics event catalog, NFR privacy/observability]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/addendum.md` — analytics/source attribution notes]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md` — AD-2, AD-4, AD-7, AD-8, AD-9, AD-14, AD-15, AD-17, AD-19]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md` — analytics states, unknown source, preview exclusion, mobile/accessibility floor]
- [Source: `_bmad-output/implementation-artifacts/4-1-record-store-product-and-cta-analytics-events.md` — existing analytics contract and deferred Story 4.2 boundary]
- [Source: `_bmad-output/implementation-artifacts/sprint-status.yaml` — Epic 4 and Story 4.2 status]
- [Source: `src/app/api/analytics/route.ts`, `src/features/analytics/*`, `src/features/contact/telegram-route.ts` — current implementation seams]
- [Source: `docs/environments.md` — Vercel/Supabase environment and secret boundaries]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `npm.cmd run check` passed. Live Supabase/RLS integration was not available in the local environment.

### Completion Notes List

- Реализован единый pure source resolver с приоритетом `source` → `utm_source` → stored session source → allowlisted referrer → `unknown`.
- Добавлены безопасная нормализация stable keys, mapping Instagram/Telegram/VK referrer hosts, same-origin rejection и seller-facing label helper.
- Добавлен server-owned `buyer_source` cookie helper; raw URL/referrer/query, campaign metadata и buyer identity не сохраняются.
- Analytics beacon и Telegram CTA передают только transient URL/referrer hints; оба server route используют общий resolver, preview/crawler exclusions и существующий CTA-before-handoff flow сохранены.
- Существующий analytics ledger/RPC и миграции не изменялись; source передаётся в existing view/CTA RPCs уже resolved/normalized.
- Добавлены source attribution contract tests и static checks. Полная проверка: lint, typecheck, build, 22 contract tests, smoke.

### File List

- `_bmad-output/implementation-artifacts/4-2-attribute-traffic-source-across-buyer-session.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `package.json`
- `scripts/analytics-contract.test.mjs`
- `scripts/source-attribution.test.mjs`
- `src/app/api/analytics/route.ts`
- `src/features/analytics/README.md`
- `src/features/analytics/event-contract.ts`
- `src/features/analytics/public-analytics-beacon.tsx`
- `src/features/analytics/public-ingestion.ts`
- `src/features/analytics/source-attribution-server.ts`
- `src/features/analytics/source-attribution.ts`
- `src/features/contact/telegram-request.ts`
- `src/features/contact/telegram-route.ts`
- `src/features/store/public-contact-cta.tsx`

### Review Findings

- [x] [Review][Patch] Explicit campaign parameters are dropped by catalog product links [src/features/store/public-catalog-view.tsx:48-55] — the beacon is fire-and-forget, while the store-to-product URL removes `source`/`utm_source`; if the beacon races with navigation or analytics is unavailable, `product_view` and the following CTA become `unknown`, violating AC 4. Preserve the safe attribution query parameters for public product links or establish attribution before navigation. Fixed by preserving bounded attribution query parameters.
- [x] [Review][Patch] CTA route does not create `buyer_session_id` before recording the CTA [src/features/contact/telegram-route.ts:66-84] — a fresh visitor who clicks before the view beacon completes sends `sessionId: null`; the later beacon creates a different session, so the CTA is not part of the buyer session required by AC 3 and AC 5. Reuse the existing session-cookie creation/options in this Route Handler. Fixed with shared buyer-session creation.
- [x] [Review][Patch] `buyer_source` is not bound to `buyer_session_id` [src/features/analytics/source-attribution-server.ts:37-42] — the source cookie is read and written independently from session-cookie rotation, so a missing or invalid session can inherit the previous session's source. This violates AC 3's server-owned, session-associated attribution; clear or otherwise rebind the source state whenever the buyer session is replaced. Fixed by clearing source attribution when a session is created or replaced.
- [x] [Review][Patch] Invalid public analytics requests can mutate attribution before RPC validation [src/app/api/analytics/route.ts:60-78] — `buyer_source` is persisted before the store/product RPC accepts the event, allowing a valid-shaped request for an invalid, hidden, or cross-store context to poison later valid events. Persist only after public context validation or an accepted event result. Fixed by persisting only after non-rejected ingestion.
- [x] [Review][Patch] A malformed client referrer suppresses a valid HTTP `Referer` fallback [src/features/analytics/source-attribution-server.ts:70-74] — the resolver uses the non-null body hint instead of the request header; an invalid body value therefore resolves to `unknown` even when the server request has a recognized external referrer, contrary to AC 2. Treat invalid/empty transient hints as absent before falling back to the request header. Fixed with shared referrer-hint selection.
- [x] [Review][Patch] Attribution hint fields have no length limits [src/features/analytics/public-ingestion.ts:90-98; src/features/contact/telegram-request.ts:26-32] — unauthenticated endpoints accept arbitrarily long `source`, `utmSource`, and `referrer` strings before normalization or URL parsing. Add explicit bounds so overlong inputs become invalid/`unknown` without avoidable resource use, as required by the story's validation constraints. Fixed with field and request-size bounds.
- [x] [Review][Patch] Route-level attribution and cookie behavior are not executable-tested [scripts/analytics-contract.test.mjs:271-318; scripts/source-attribution.test.mjs:10-110] — current additions cover the pure resolver and static wiring only; they do not verify cookie options/state, session continuity, resolved RPC arguments, rejected/excluded contexts, or CTA-before-beacon behavior. Add dependency-injected route/helper tests for AC 3–5 and Task 6. Fixed with resolver, policy, parser, navigation, and route-wiring regression coverage; 26 contract tests pass.
