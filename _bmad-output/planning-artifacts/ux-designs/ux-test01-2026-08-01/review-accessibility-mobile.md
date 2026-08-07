# Accessibility + Mobile UX Review — final uncommitted snapshot

Дата ревью: 2026-08-07

Baseline: `ffb39c5bdaa724fa238234d8b1f32cc7ca88da16`

Target: зафиксированный uncommitted working tree после accessibility-fix pass

Стандарт: WCAG 2.2, уровень AA; WAI-ARIA APG для modal dialog

## Итог

| Категория | Открыто |
|---|---:|
| Critical code defects | 0 |
| High code defects | 0 |
| Medium code defects | 0 |
| Low code defects | 0 |
| High verification / release-gate gaps | 0 |
| Residual evidence limitations, unscored | 5 |

В финальном snapshot не подтверждены оставшиеся Critical/High дефекты реализации. Source-level проверки показывают сильное покрытие семантики, клавиатуры, focus management, форм, live status, dialog, mobile reflow и reduced/forced-colors режимов.

Финальный browser acceptance для заявленного local frontend scope также пройден: обязательные mobile widths, accessibility tree, критические focus/recovery paths, network retry и computed layout проверены на production build. Это закрывает прежний High evidence gate, но не является формальной сертификацией WCAG 2.2 AA: физический screen reader, буквальный 400% zoom и эмуляция preference modes не выполнялись.

## Метод и границы

Проверены:

- `DESIGN.md`, `EXPERIENCE.md`, `IMPLEMENTATION_PLAN.md`, `spec-frontend-ux-redesign.md`;
- diff текущего frontend относительно baseline;
- route boundaries, shared UI, seller shell, wizard, upload queue, product lifecycle, store settings, public storefront, gallery и Telegram CTA;
- финальный `frontend-ux-redesign-browser-report.md`, предшествующий `full-browser-e2e-report.md` и свежие after-скриншоты;
- три независимых review-слоя: blind defect hunt, edge-case hunt и acceptance audit;
- lint, TypeScript, production build, smoke, 105 contract tests и local Chromium runtime на финальном frozen snapshot.

Автор этого независимого ревью не управлял браузерной сессией и не изменял UI; вывод о runtime основан на повторно проверенном финальном browser report и его наблюдаемом evidence. Live physical screen-reader pass не выполнялся. Единственная запись данного review-шага — этот файл.

## Закрытый finding и остаточные ограничения

### A11Y-EVID-01 — Resolved — финальное runtime-доказательство оформлено

Прежний High verification gate закрыт файлом `_bmad-output/implementation-artifacts/frontend-ux-redesign-browser-report.md` для заявленного local browser scope.

Подтверждено в финальном production runtime:

- public storefront и product detail прошли на точных 320, 360, 390, 412, 430 и 1440 CSS px; seller dashboard, settings, wizard, import и analytics — на 320, 390, 430 и 1440 px;
- для каждой проверенной поверхности `scrollWidth === clientWidth`, сохранены один `h1`, route metadata и доступный `main`;
- browser accessibility snapshot подтвердил heading hierarchy, именованные regions/buttons, alerts и status messages;
- реальный focus проверен для validation summary, dirty-navigation dialog, mobile preview, media delete dialog и post-action fallback;
- на 320 px измерено отсутствие перекрытия focused settings field dirty bar и bottom navigation; safe-area и `scroll-padding-block-end` присутствуют в CSSOM;
- invalid media отклоняется до queue; реальный network failure сохраняет item/File, а Retry после восстановления server завершается без повторного picker;
- browser history возвращает невалидный Review к первому ошибочному wizard step и фокусирует ErrorSummary;
- 500-символьное непрерывное значение переносится в preview и storefront без overflow;
- gallery selected state, CTA name/status, dialog initial/return focus и recovery paths подтверждены в runtime;
- console финального прохода чиста: 0 application warnings/errors;
- fresh production screenshots сняты после финального build, а точные viewport widths проверены runtime DOM measurements независимо от PNG profile dimensions.

### Остаточные evidence limitations — не найденные дефекты

1. Физическая screen-reader сессия не запускалась. Accessibility tree проверяет роли/имена/структуру, но не доказывает фактическую речь, verbosity и удобство последовательного чтения конкретной AT/browser пары.
2. Буквальный browser zoom 400% не переключался. Проверка 320 CSS px подтверждает требуемую reflow-геометрию для 1280 px при 400%, но не тестирует сам механизм zoom, text scaling и browser chrome.
3. `prefers-reduced-motion` и forced-colors подтверждены как загруженные CSSOM rules, но соответствующие preference modes не эмулировались; итоговые motion и system-color rendering остаются manual evidence item.
4. Skip link и focusable target подтверждены структурно, однако automation wrapper не воспроизвёл точную последовательность `Tab` → `Enter`; буквальная keyboard activation не заявляется как runtime-pass.
5. Промежуточные 768 и 1024 px из расширенной implementation matrix не были отдельными runtime-точками. Проверены обязательные mobile endpoints и desktop 1440, но это остаётся ограничением полноты breakpoint evidence.

Эти ограничения не переоткрывают `A11Y-EVID-01` и не указывают на подтверждённый code defect. Они должны сопровождать любой sign-off; для формального заявления о полном соответствии WCAG их следует закрыть manual AT/zoom/preference pass.

## Что подтверждено в финальном evidence

| Область | Финальное evidence | WCAG/APG связь |
|---|---|---|
| Документ и маршруты | `lang="ru"`, skip link, focusable `main`; route-specific static/dynamic metadata для seller, storefront, product и editor; loading/error/not-found имеют собственные доступные заголовки | 1.3.1, 2.4.1, 2.4.2, 2.4.6 |
| Heading hierarchy | Route states не дублируют `h1`; `Alert`/`EmptyState` умеют выбирать уровень заголовка; секции редактора связаны через `aria-labelledby` | 1.3.1, 2.4.6 |
| Формы и ошибки | Поля имеют labels/helper/error associations, `aria-invalid`/`aria-describedby`; ErrorSummary фокусирует ошибку/поле; server status программно объявляется | 1.3.1, 3.3.1, 3.3.2, 4.1.3 |
| Dialog | Общий native `<dialog>` открывается через `showModal()`, использует cancel-first для destructive flow и title-first для preview, поддерживает Escape и возврат/резервный возврат фокуса; pending operation не обязана удерживать modal открытым | 2.1.1, 2.4.3, 2.4.11, 4.1.2; APG modal dialog |
| Keyboard и focus | Общий `:focus-visible` outline, усиленный forced-colors outline; reorder/cover/gallery/destructive actions представлены настоящими controls; минимум 44 px закреплён в shared controls/navigation | 2.1.1, 2.4.7, 2.5.8 |
| Цвет и motion | Светлые semantic tokens, состояние selected дополнено текстом/semantics, reduced-motion выключает smooth scroll/существенные transition и animation, forced-colors переводит tokens на system colors | 1.4.1, 1.4.3, 1.4.11, 2.3.3 |
| Reflow и safe area | Удалён глобальный `min-width`; long words получают wrapping; mobile reserve увеличен до 14 rem; bottom nav, dirty bar и public CTA учитывают safe-area inset | 1.4.10, 2.4.11 |
| Upload queue | Invalid/over-capacity files не попадают в очередь; последовательная очередь различает queued/uploading/processing/success/error, выдаёт bounded rejection alert, сохраняет retry/cancel и filename-specific accessible names | 1.3.1, 2.4.6, 3.3.1, 4.1.3 |
| Wizard | Четыре именованных шага, live step status, focus на heading/error summary, browser-history guard и запрет навигации при media busy | 2.4.3, 2.4.6, 3.3.1, 4.1.3 |
| Store settings | Controlled dirty state, save/discard возвращают focus к settings heading, mobile preview начинает с title, длинный пользовательский текст переносится | 1.4.10, 2.4.3, 2.4.11 |
| Public storefront | Gallery объявляет позицию/выбор и использует non-color selected marker; CTA сохраняет visible label-in-name, объясняет disabled state и объявляет результат | 1.4.1, 2.5.3, 3.3.2, 4.1.2, 4.1.3 |

## Закрытые в ходе ревью риски

До freeze были обнаружены и затем устранены: 320 px global min-width, попадание локально отклонённых файлов в queue, недостаточный focus reserve под mobile dirty bar, overflow длинного текста, focus в конце длинного preview, отсутствие programmatic constraints у file picker, async focus steal после раннего закрытия dialog, некорректный wizard/history focus, дубли heading в route states, generic document titles, color-only gallery state и неразличимые disabled CTA.

Канонический `EXPERIENCE.md` теперь согласован с моделью данных media reorder: объявляются номер фото, прежняя и новая позиция; исходное filename после сохранения БД не хранит.

## Проверки финального snapshot

| Проверка | Результат |
|---|---|
| `npm run lint` | pass |
| `npx tsc --noEmit` | pass |
| `npm run test:contracts` | pass — 105/105 |
| `npm run check` в финальном browser pass | pass — lint, typecheck, production build, 105/105 contracts, smoke |
| Browser reflow | pass — exact mobile matrix и 1440; horizontal page overflow не найден |
| Accessibility tree / real focus | pass для перечисленных route semantics и критических focus/recovery paths |
| Physical screen reader | не выполнялся; остаётся evidence limitation |
| Reduced motion / forced colors | CSSOM rules подтверждены; preference emulation не выполнялась |
| Automated axe/Playwright inventory | отдельного runner нет; использован browser accessibility snapshot |
| Console | 0 application warnings/errors после финального route pass |

Расчёт контраста по финальным CSS tokens:

- `ink-disabled #706f69` / `surface #fbfaf7`: 4.83:1;
- `ink-secondary #5e5d57` / `background #f5f3ee`: 5.96:1;
- `primary #2457e6` / `background #f5f3ee`: 5.29:1;
- `white #ffffff` / `primary #2457e6`: 5.86:1;
- `border-strong #88857e` / `surface #fbfaf7`: 3.53:1;
- `destructive #a4352b` / `destructive-surface #f7e8e6`: 5.65:1.

Эти пары проходят соответствующие пороги для обычного текста или non-text UI, но итоговый rendered contrast необходимо подтвердить browser inspection для каждого фактического сочетания, включая disabled и forced-colors states.

## Нормативные ссылки

- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA APG: Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Release recommendation

Accessibility + mobile browser acceptance — **pass within the documented local scope**. `A11Y-EVID-01` закрыт, нерешённых code defects не обнаружено. Результат нельзя называть формальной WCAG 2.2 AA сертификацией: sign-off должен явно сохранять перечисленные physical-AT, literal-zoom, preference-emulation, skip-link gesture и intermediate-breakpoint limitations.
