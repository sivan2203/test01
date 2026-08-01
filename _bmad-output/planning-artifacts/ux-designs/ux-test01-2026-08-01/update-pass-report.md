# UX Update Pass Report — 2026-08-01

## Summary

Applied UX validation findings to `DESIGN.md` and `EXPERIENCE.md`.

## Closed or materially addressed

- Added inline links to `mockups/storefront-mobile.html` and `mockups/seller-dashboard-mobile.html`; stated that spines win on conflict.
- Added Preview-as-buyer Key Flow for PRD UJ-5.
- Normalized component coverage across DESIGN and EXPERIENCE: store header, catalog view toggle, product card, product detail media, Telegram CTA, copy fallback, analytics widgets/cards, state control, slug editor, import mapper, form field, empty state.
- Added `{path.to.token}` references from EXPERIENCE.md to DESIGN.md components/tokens.
- Converted `[ASSUMPTION]` notes into explicit UX decisions.
- Added load-bearing WCAG AA contrast pairs.
- Added cold-load, save failure, and offline states.
- Added product gallery accessible labels and disabled CTA semantics.
- Added reduced-transparency/high-contrast solid fallback for glass panels.
- Accepted product detail/editor as spine-only for now, with revisit condition if implementation review finds layout ambiguity.

## Remaining non-blocking

- Optional future mockups for product detail and product editor if implementation needs visual anchoring.
- Deleted/hidden product URL copy still depends on architecture URL behavior and implementation copy review.
