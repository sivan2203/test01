---
title: 'Чёрный цвет кнопок во всём приложении'
type: 'feature'
created: '2026-08-08'
status: 'done'
route: 'one-shot'
---

# Чёрный цвет кнопок во всём приложении

## Intent

**Problem:** Залитые primary и Telegram-кнопки использовали кобальтовый синий, хотя пользователь хочет единый чёрный кнопочный цвет на всех seller и public поверхностях.

**Approach:** Отделить чёрный action-token от кобальтового brand/focus token и применить его к shared Button, button-like links, file selector и кнопочному catalog toggle, сохранив нейтральные secondary, прозрачные ghost, красные destructive и синие некнопочные состояния.

## Suggested Review Order

**Action tokens и shared control**

- Отдельный чёрный token не перекрашивает focus, links и navigation markers.
  [`globals.css:17`](../../src/app/globals.css#L17)

- Shared primary и Telegram variants покрывают кнопки и button-like links.
  [`button.tsx:11`](../../src/components/ui/button.tsx#L11)

- Inverse dirty bar сохраняет видимую белую границу чёрной Save-кнопки.
  [`store-dirty-bar.tsx:43`](../../src/features/store/store-dirty-bar.tsx#L43)

**Оставшиеся кнопочные поверхности**

- Native file selector использует тот же чёрный action-token.
  [`store-profile-form.tsx:681`](../../src/features/store/store-profile-form.tsx#L681)

- Catalog toggle меняет только кнопочный selected marker.
  [`public-catalog-view.tsx:206`](../../src/features/store/public-catalog-view.tsx#L206)

**Контракт и регрессия**

- Канонический дизайн теперь отделяет Action Black от Cobalt.
  [`DESIGN.md:107`](../planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md#L107)

- Пользовательский override и границы изменения зафиксированы отдельным решением.
  [`DECISIONS.md:77`](../planning-artifacts/ux-designs/ux-test01-2026-08-01/DECISIONS.md#L77)

- Regression scan запрещает синие treatments в button и file-selector tags.
  [`design-system-contract.test.mjs:122`](../../scripts/design-system-contract.test.mjs#L122)
