---
baseline_commit: 8b7f2d7c2b3536d0e1513a1835f45c4c659de516
---

# Story 4.3: Seller Home Analytics Widget

Status: done

<!-- Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a seller,
I want to see today’s key store analytics on my home dashboard,
so that I immediately understand whether my shared link is getting attention.

## Acceptance Criteria

1. **Основной виджет на домашнем экране (FR17, FR21, UX-DR9, UX-DR16)**
   - **Given** я являюсь аутентифицированным продавцом с магазином
   - **When** открываю домашний экран кабинета продавца
   - **Then** вижу primary analytics widget с метрикой «Просмотры магазина сегодня»
   - **And** эта метрика визуально доминирует над вторичными метриками
   - **And** seller navigation сохраняет пункты Home / Products / Analytics / Store
   - **And** buyer/public routes не получают seller analytics navigation.

2. **Границы дня и canonical ledger (FR17, FR20, NFR5, AD-7, AD-14)**
   - **Given** в `analytics_events` есть события магазина
   - **When** dashboard рассчитывает метрики за текущий день
   - **Then** границы дня вычисляются в timezone магазина
   - **And** для MVP при отсутствии иного timezone используется `Europe/Moscow`
   - **And** persisted event timestamps остаются UTC
   - **And** в seller totals входят только публичные события с `excluded_reason IS NULL`
   - **And** summary вычисляется из append-only `analytics_events`, без второй таблицы истины и mutable counters.

3. **Набор метрик и лучший источник (FR17, FR19, FR20, NFR5, AD-19)**
   - **Given** за текущий день есть product views и CTA clicks
   - **When** widget отображается
   - **Then** показывает store views, product views, CTA clicks и top source, если источник доступен
   - **And** store views считаются по `event_name = 'store_view'`
   - **And** product views считаются по `event_name = 'product_view'`
   - **And** CTA clicks считаются по `event_name = 'cta_click'`
   - **And** top source ранжируется только по количеству public `store_view` за выбранный период (сначала count по убыванию, затем стабильный tie-break по source key)
   - **And** source key преобразуется в seller-facing label существующим helper `sourceLabel`, а `unknown` показывается как понятное состояние.

4. **Zero state и отсутствие магазина (FR17, UX-DR14, UX-DR15, AD-20)**
   - **Given** за текущий день нет eligible analytics events
   - **When** продавец открывает dashboard
   - **Then** вижу zero state без fake/demo numbers
   - **And** zero state предлагает поделиться публичной ссылкой магазина как одно следующее действие
   - **And** dashboard не путает «нет событий сегодня» с отсутствующим магазином
   - **And** если магазин ещё не создан, сохраняется текущий onboarding state и CTA создания витрины.

5. **Доступность и mobile-first layout (FR21, NFR5, UX-DR9, UX-DR14, UX-DR16)**
   - **Given** виджет читается assistive technology
   - **When** метрики объявляются
   - **Then** доступный текст содержит ясные labels и значения, например «Просмотры магазина сегодня: 42. Лучший источник: Telegram.»
   - **And** числа не передаются только через визуальную иерархию или цвет
   - **And** при ширине 360–430px карточки читаемы, не создают горизонтальный overflow и остаются tappable там, где интерактивны
   - **And** оформление использует спокойную monochrome/liquid-glass систему, но при forced-colors/reduced-transparency сохраняет читаемость.

6. **Ошибки чтения не раскрывают данные и не ломают кабинет (NFR5, AD-2, AD-15, AD-20)**
   - **Given** seller summary query временно недоступен или возвращает ошибку
   - **When** dashboard рендерится
   - **Then** показывается text-first non-blocking error/try-again state без service-role credentials в браузере
   - **And** чужие магазины и сырые analytics rows не доступны продавцу
   - **And** route остаётся seller-auth protected и не превращается в public analytics endpoint.

## Tasks / Subtasks

- [x] Task 1: Зафиксировать seller home analytics summary contract (AC: 2, 3, 6)
  - [x] Описать typed result для сегодняшнего summary: `storeViews`, `productViews`, `ctaClicks`, `topSource` и store timezone/period metadata.
  - [x] Определить, что totals включают только `excluded_reason IS NULL`, а source aggregation для top source использует только `store_view`.
  - [x] Переиспользовать существующие canonical event names и `sourceLabel`; не создавать отдельные source labels, event ledger или mutable counter model.

- [x] Task 2: Добавить seller-scoped server-side summary query (AC: 2, 3, 6)
  - [x] Реализовать query через существующий SSR Supabase user client и seller ownership boundary; не импортировать `service-role` в seller page/query.
  - [x] Если прямой SELECT к `analytics_events` невозможен по существующим grants, добавить versioned SQL migration с минимальным `SECURITY DEFINER` RPC для authenticated seller, проверяющим `auth.uid()` → `stores.seller_id`.
  - [x] В SQL/RPC считать UTC window по timezone магазина (`Europe/Moscow` default), безопасно работать с IANA timezone и не менять `occurred_at`.
  - [x] Вернуть только aggregate fields, не raw event rows, buyer identity, referrer URL или campaign metadata; добавить индексы только при доказанной необходимости.
  - [x] Для `security definer` сохранить explicit safe `search_path`, fully qualified relations и least-privilege execute grants; миграция должна содержать rollback note.

- [x] Task 3: Реализовать analytics summary widget (AC: 1, 3, 4, 5, 6)
  - [x] Создать переиспользуемый seller-facing widget/card composition в `features/analytics` или существующем design-system seam после проверки текущих компонентов.
  - [x] Сделать store views dominant, product views/CTA clicks secondary, top source secondary context; не добавлять charts, deltas, 7-day или 30-day UI в эту story.
  - [x] Добавить semantic headings, `aria-label`/visually available metric sentences и text-first zero/error states.
  - [x] Сохранить mobile layout 360–430px, tap targets минимум 44x44 CSS px для интерактивных элементов, focus order и forced-colors/reduced-transparency behavior.

- [x] Task 4: Подключить widget к seller home без регрессий onboarding (AC: 1, 4, 6)
  - [x] Обновить `src/app/(seller)/seller/(admin)/page.tsx` как async Server Component: получить текущий seller store profile и summary, сохранив redirect для unauthenticated и текущий no-store onboarding.
  - [x] Показать analytics state только при существующем магазине; не считать seller preview, admin views, bots или excluded events.
  - [x] Не добавлять публичный API route и не менять public storefront analytics ingestion из Stories 4.1–4.2.
  - [x] Если summary временно недоступен, показать non-blocking состояние с понятным повторным действием, не подменяя его нулевыми данными без объяснения.

- [x] Task 5: Добавить contract/unit coverage (AC: 2–6)
  - [x] Покрыть mapping summary RPC result, zero/error states, unknown source label и stable top-source tie-break.
  - [x] Покрыть timezone day-window boundaries around midnight and `Europe/Moscow` default; verify UTC event storage is not shifted.
  - [x] Покрыть exclusion of crawler/preview/invalid events and seller ownership boundary; verify no raw event payload is returned to UI.
  - [x] Добавить static contract checks, что seller summary не импортирует service-role, не появляется на public routes и использует canonical event names.
  - [x] Запустить `npm.cmd run check`; отдельно отметить, если live Supabase/RLS runtime недоступен локально.

## Dev Notes

### Business and scope boundary

Story 4.1 создала append-only `analytics_events` ledger и public event ingestion для `store_view`, `product_view`, `cta_click`. Story 4.2 добавила session-scoped stable source keys, `unknown` fallback и `sourceLabel`. Story 4.3 использует эти данные для seller home snapshot. Story 4.4 отвечает за product-level analytics и today + last-7-days detail, поэтому эта story не должна добавлять отдельный analytics detail screen, charts или 7-day controls.

AD-19 устанавливает единственную семантику home top source: ranking по public `store_view` count, а не по product views или CTA clicks. AD-20 различает существование public store route и activation completeness: dashboard может показывать store state после создания магазина, а zero analytics — это нормальный state, не 404 и не отсутствие магазина.

### Existing implementation to extend

- `src/app/(seller)/seller/(admin)/page.tsx` сейчас содержит onboarding-заглушку с CTA `/seller/store`; сохранить этот сценарий для seller без магазина и заменить placeholder только для seller с найденным store.
- `src/app/(seller)/seller/(admin)/layout.tsx` уже содержит mobile bottom navigation Home / Products / Analytics / Store с tap target `min-h-11`; не удалять и не дублировать navigation.
- `src/app/(seller)/seller/(admin)/analytics/page.tsx` остаётся отдельным placeholder/detail surface; не превращать его в 4.3 и не смешивать с будущей Story 4.4.
- `src/features/store/queries.ts` предоставляет `getCurrentSellerStoreProfile()` с `id`, `sellerId`, `timezone` и typed statuses `found/not_found/unauthenticated/error`; использовать существующий ownership/auth pattern.
- `src/features/analytics/event-contract.ts` — источник canonical event names/types и `UNKNOWN_ANALYTICS_SOURCE`.
- `src/features/analytics/source-attribution.ts` содержит `sourceLabel()` и stable source normalization; seller UI получает human-readable labels через него, но не сохраняет labels вместо keys.
- `src/features/analytics/README.md` фиксирует canonical raw ledger, server-only ingestion и запрет на raw referrer/identity persistence.
- `supabase/migrations/20260802110000_create_analytics_events.sql` и `20260802120000_complete_analytics_ingestion.sql` создают ledger, индексы, RLS и public ingestion RPCs. Не редактировать applied migrations; новая schema/RPC работа — только новая timestamp migration.

### Summary data contract

Рекомендуемый aggregate contract (названия можно адаптировать к локальному стилю, но смысл должен сохраниться):

```ts
type SellerHomeAnalyticsSummary = {
  status: "found";
  timezone: string;
  dayStartUtc: string;
  dayEndUtc: string;
  storeViews: number;
  productViews: number;
  ctaClicks: number;
  topSource: string | null; // stable key; null only when no eligible store_view exists
};
```

Query/RPC должен:

1. resolve the authenticated seller's store, never trust `store_id` from browser input;
2. calculate the local calendar-day window in the store's IANA timezone, converting boundaries to UTC for `occurred_at` comparison;
3. filter `excluded_reason IS NULL` for all seller-facing totals;
4. count each canonical event name independently;
5. rank top source from `store_view` only, preserving `unknown` as a countable source when it is the winner;
6. return aggregate values only.

Если в существующем schema direct SELECT is denied (как ожидается из analytics migrations), предпочтителен один authenticated RPC returning one row. It must enforce `auth.uid() = stores.seller_id` inside the database boundary. Не использовать service-role client для обычного seller read.

### Architecture and security guardrails

- **AD-7:** raw `analytics_events` remains canonical and append-only; do not add counters/materialized dashboard table as source of truth.
- **AD-14:** event timestamps are UTC; day buckets belong to store timezone, default `Europe/Moscow`.
- **AD-15:** browser uses anon-safe code only; seller summary reads use SSR user client/RLS or a narrowly granted authenticated RPC. Service-role is isolated to public ingestion/maintenance and must not enter a seller page module graph.
- **AD-17:** table/index/RPC/grant changes are versioned SQL migrations with rollback note; never edit applied migrations or use dashboard console-only changes.
- **AD-19:** top source is ranked by `store_view` count for the selected period, with stable tie-break.
- **AD-20:** zero analytics, no store, and inactive/activation states are distinct; do not hide an existing public store because it has no events.
- Seller-facing analytics must exclude `preview`, `crawler`, invalid and other non-null `excluded_reason` rows consistently with the ledger contract.
- No buyer identity, raw referrer, UTM campaign, message delivery, purchase, or public analytics endpoint is introduced.

### UX and accessibility guardrails

- Use `analytics-summary-widget` and `analytics-card` visual language from UX design: today store views dominate, top source is secondary context, no decorative chart when one number answers the question.
- Zero state is short, calm and action-oriented: one explanation plus one next action to share the store link. No stock illustration and no fake sample values.
- Accessible sentence must be present in text/ARIA, e.g. `Просмотры магазина сегодня: 42. Лучший источник: Telegram.`; color, size and card placement are not the only signal.
- Preserve `min-h-11`/44px tap target behavior, visible focus, normal-text contrast and forced-colors/reduced-transparency fallback.
- Mobile-first acceptance range is 360–430px; avoid dense tables and horizontal scrolling. Desktop may use a wider centered layout but does not redefine mobile IA.

### Testing requirements

Use repository Node 24 `node:test` contract style and dependency injection. Minimum scenarios:

- summary mapper accepts canonical event aggregate and rejects malformed/negative counts;
- event counts use only `store_view`, `product_view`, `cta_click` and exclude every row with non-null `excluded_reason`;
- top source ranks by store views, not product views/CTA, keeps `unknown`, and resolves deterministic ties;
- UTC boundary conversion is correct for `Europe/Moscow` and a non-default IANA timezone around local midnight;
- seller A cannot read seller B's store summary; unauthenticated access is rejected/redirected; raw rows and source URLs never reach UI;
- zero state contains no fabricated metrics and includes the share-link next action;
- error state is non-blocking and does not silently present zero as truth;
- static checks keep service-role out of seller summary/page, preserve existing seller nav, and keep public ingestion unchanged.

Run `npm.cmd run check`. This validates lint, typecheck, build, contract tests and smoke checks; it does not prove live Supabase RLS behavior without a configured runtime database.

### Library/framework requirements

The repository uses Node `>=24 <25`, Next.js `16.2.12`, React `19.2.4`, Tailwind CSS 4, `@supabase/ssr` `0.12.4`, and `@supabase/supabase-js` `2.111.0`. Do not add dependencies for this story.

Seller home should remain an async Server Component and read data server-side. Next.js local guidance confirms that App Router pages are Server Components by default, request-specific data should not be put into a client bundle, and `cookies()` is async. If a new Route Handler is considered, remember that GET handlers are cacheable only when explicitly configured; this story should not expose a public GET route. Follow local guides before changing route behavior:

- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

Supabase `security definer` functions must set an explicit safe `search_path`, qualify relations, and use least-privilege execute grants. Prefer a single aggregate RPC over exposing `analytics_events` rows to authenticated clients.

### File structure requirements

Confirm exact names against the repository before editing. Expected ownership:

```text
src/app/(seller)/seller/(admin)/page.tsx                 # UPDATE: seller home wiring
src/features/analytics/seller-home-summary.ts            # NEW/UPDATE: typed query/result mapping, server-only boundary as needed
src/features/analytics/analytics-summary-widget.tsx      # NEW: accessible widget/cards/zero/error states
src/features/analytics/README.md                         # UPDATE: seller summary ownership and exclusion contract
scripts/seller-analytics-contract.test.mjs               # NEW/UPDATE: mapping, ranking, timezone, static boundaries
supabase/migrations/<timestamp>_seller_home_analytics.sql # NEW only if RPC/index/grant is required
```

Possible shared design-system changes are allowed only if an existing component cannot satisfy the widget; do not create a second visual system. Do not modify public storefront routes, source attribution, Telegram handoff, existing applied migrations, or `src/app/(seller)/seller/(admin)/analytics/page.tsx` beyond what a test-proven shared summary contract requires.

### Previous story intelligence

Story 4.2 (commit `8b7f2d7`) completed source attribution and explicitly deferred dashboard widgets. Reuse its stable source keys and `sourceLabel()`; never reconstruct source labels from raw UTM/referrer. Its server boundary keeps raw public analytics data out of the browser. Story 4.1/4.2 contract tests and migrations are the regression baseline.

### Latest technical guidance

- Next.js local Route Handlers guide: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` — Web Request/Response APIs; GET caching is explicit, other methods are not cached by default.
- Next.js local cookies guide: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` — `cookies()` is async; mutation belongs to Server Functions or Route Handlers.
- Next.js local Server/Client Components guide: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` — pages/layouts are Server Components by default; keep DB reads and secrets server-side.
- [Next.js cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies) — async request-time cookie API and dynamic rendering implications.
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — server-side data fetching and narrow client boundaries.
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) — explicit `search_path` and least-privilege function grants for `security definer` functions.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — enforce authenticated ownership at the database boundary.

### Requirements trace

`FR17`, `FR19`, `FR20`, `FR21`, `NFR5`, `AD-14`, `AD-19`, `AD-20`, `UX-DR9`, `UX-DR14`, `UX-DR16`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4 / Story 4.3]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/prd.md` — FR17, FR19, FR20, FR21, analytics event catalog, NFR5]
- [Source: `_bmad-output/planning-artifacts/prds/prd-test01-2026-08-01/addendum.md` — accepted today + 7-day analytics scope and source attribution]
- [Source: `_bmad-output/planning-artifacts/architecture/architecture-test01-2026-08-01/ARCHITECTURE-SPINE.md` — AD-7, AD-14, AD-15, AD-17, AD-19, AD-20, Stack, structural seed]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md` — analytics-summary-widget, analytics-card, mobile tokens]
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-test01-2026-08-01/EXPERIENCE.md` — seller IA, analytics states, zero state, accessibility floor]
- [Source: `_bmad-output/implementation-artifacts/4-1-record-store-product-and-cta-analytics-events.md` — canonical ledger and exclusions]
- [Source: `_bmad-output/implementation-artifacts/4-2-attribute-traffic-source-across-buyer-session.md` — source key and seller label contract]
- [Source: `_bmad-output/implementation-artifacts/sprint-status.yaml` — Epic 4 order and status]
- [Source: `src/app/(seller)/seller/(admin)/page.tsx` — current seller home onboarding placeholder]
- [Source: `src/app/(seller)/seller/(admin)/layout.tsx` — existing mobile seller navigation]
- [Source: `src/features/store/queries.ts` — authenticated seller store query and timezone]
- [Source: `src/features/analytics/event-contract.ts` — canonical event names/types]
- [Source: `src/features/analytics/source-attribution.ts` — stable source normalization and `sourceLabel()`]
- [Source: `supabase/migrations/20260802110000_create_analytics_events.sql` and `20260802120000_complete_analytics_ingestion.sql` — ledger/RLS/RPC baseline]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Create-story workflow used manual customization fallback because `python3` is unavailable in the Windows environment.
- Source artifacts, previous stories, current code, git history, local Next.js guides, and official Next.js/Supabase documentation were inspected.
- Red phase: new seller analytics contract tests initially failed because the summary contract, RPC migration, and widget did not exist.
- Green phase: `node --experimental-strip-types --test scripts/seller-analytics-contract.test.mjs` passed with 8 tests.
- Full validation: `npm.cmd run check` passed; existing ESLint warning in `src/features/product/product-media-manager.tsx` remains unrelated. Live Supabase/RLS runtime was not available locally.

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created for Story 4.3.
- Added typed seller summary mapping, stable top-source ranking, safe IANA timezone window calculation, and `Europe/Moscow` fallback.
- Added seller-owned `SECURITY DEFINER` aggregate RPC migration that filters excluded events and returns counts/top source only.
- Added SSR user-client query and accessible mobile-first home widget with zero/error states; preserved no-store onboarding and seller navigation.
- Added 8 story-specific contract tests and documented the seller summary ownership/read boundary in the analytics README.

### File List

- `_bmad-output/implementation-artifacts/4-3-seller-home-analytics-widget.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `package.json`
- `scripts/seller-analytics-contract.test.mjs`
- `src/app/(seller)/seller/(admin)/page.tsx`
- `src/features/analytics/README.md`
- `src/features/analytics/analytics-summary-widget.tsx`
- `src/features/analytics/seller-home-analytics.ts`
- `src/features/analytics/seller-home-summary.ts`
- `supabase/migrations/20260802130000_seller_home_analytics.sql`

## Change Log

- 2026-08-02: Implemented seller home analytics summary, timezone-aware aggregate RPC, accessible widget states, contract tests, and sprint tracking updates.

### Review Findings

- [x] [Review][Patch][P1] Валидные RPC timestamp-значения отклоняются строгим парсером — `mapSellerHomeAnalyticsRow` принимает только формат `YYYY-MM-DDTHH:mm:ss.sssZ`, хотя `timestamptz` из Supabase/PostgREST может приходить с offset или без миллисекунд; dashboard переходит в error state вместо отображения summary. Принимать любой валидный ISO timestamp и нормализовать его перед возвратом [src/features/analytics/seller-home-summary.ts:52]
- [x] [Review][Patch][P2] Zero-state CTA с подписью «Поделиться ссылкой» открывает редактор, а не публичную ссылку — действие ведёт на `/seller/store`, поэтому продавец не может сразу открыть/скопировать public storefront link; передать slug-based share/copy action либо переименовать CTA в действие настройки ссылки [src/app/(seller)/seller/(admin)/page.tsx:59]
- [x] [Review][Patch][P2] Неразрывные store/source labels могут вызвать mobile horizontal overflow — имя магазина и произвольный source key до 64 символов рендерятся без wrapping/overflow protection, что нарушает mobile-first границу 360–430px [src/features/analytics/analytics-summary-widget.tsx:55]
- [x] [Review][Patch][P2] Error state не гарантирует рабочий retry и скрывает home shell — ссылка «Обновить» ведёт на текущий `/seller` route и может не инициировать refresh, а при ошибке summary страница возвращает только error card; использовать `router.refresh()`/hard reload и оставить seller home shell вокруг ошибки [src/features/analytics/analytics-summary-widget.tsx:81]
- [x] [Review][Patch][P2] Ошибка чтения store profile показывается как ошибка analytics — `storeResult.status === "error"` возвращает `AnalyticsSummaryError`, что даёт продавцу неверную причину и recovery guidance [src/app/(seller)/seller/(admin)/page.tsx:39]
- [x] [Review][Patch][P2] Contract tests усилены source-level проверками ownership, SQL predicates и wire-format — добавлены проверки seller boundary, store scoping и валидных `timestamptz` вариантов; live Supabase/RLS integration остаётся ограничением репозитория без runtime harness [scripts/seller-analytics-contract.test.mjs:105]
