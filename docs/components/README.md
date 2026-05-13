# OléFUT UI Components — Variant Documentation

Reference docs for UI primitives in `src/components/ui/`.

## Primitives

| Component | Doc | File |
|-----------|-----|------|
| EfButton | [EfButton.md](EfButton.md) | `src/components/ui/EfButton.jsx` |
| EfPanel | [EfPanel.md](EfPanel.md) | `src/components/ui/EfPanel.jsx` |
| EfModal | [EfModal.md](EfModal.md) | `src/components/ui/EfModal.jsx` |
| EfInput | [EfInput.md](EfInput.md) | `src/components/ui/EfInput.jsx` |
| EfTooltip | [EfTooltip.md](EfTooltip.md) | `src/components/ui/EfTooltip.jsx` |

## Pending Docs

| Component | Status |
|-----------|--------|
| EfBanner | ⏳ Has CSS, needs doc |
| EfCardPlayer | ⏳ Has CSS, needs doc |
| EfClubBadge | ⏳ Pending |
| EfStatLine | ⏳ Pending |

## Conventions

- All primitives: `Ef*` PascalCase
- CSS classes: `.ef-{component-kebab}__{element}--{modifier}` (BEM)
- Memoized: critical primitives wrapped in `React.memo` for list perf
- Tokens: zero hardcoded hex; consume from `var(--*)` exclusively

## Live Reference

See `src/components/StyleguideView.jsx` — interactive showcase of all primitives + variants + states.
