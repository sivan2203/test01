---
title: 'Розовый акцентный цвет интерфейса'
type: 'feature'
created: '2026-08-08'
status: 'done'
route: 'one-shot'
---

# Розовый акцентный цвет интерфейса

## Intent

**Problem:** Интерфейс использовал синий акцент, тогда как обновлённый визуальный контракт требует розовый `#FF488B`, сохраняя чёрные action-кнопки.

**Approach:** Системные `primary`/`ring` токены, активные маркеры, focus и progress переведены на `#FF488B`; текстовые проекции используют контрастный `#9B174F`, а кнопки остаются чёрными. Документация, mockups и контрактные проверки синхронизированы.

## Suggested Review Order

1. [Системные токены и forced-colors](../../src/app/globals.css) — проверить `primary`, `ring`, `primary-text`, selection и сохранение чёрных action-токенов.
2. [Контракт визуальной системы](../../scripts/design-system-contract.test.mjs) — проверить pink token, контраст и отсутствие возврата синего оформления кнопок.
3. [Компонентные проекции](../../src/components/ui/button.tsx) — убедиться, что primary/Telegram buttons не наследуют розовую заливку.
4. [Канонический дизайн-контракт](../planning-artifacts/ux-designs/ux-test01-2026-08-01/DESIGN.md) — сверить pink accent, contrast pair и чёрные CTA.
5. [Решения и accessibility evidence](../planning-artifacts/ux-designs/ux-test01-2026-08-01/DECISIONS.md) — проверить согласованность product decision с обновлённым акцентом.
