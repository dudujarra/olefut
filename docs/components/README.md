# OléFUT UI Components — Variant Documentation

Reference docs for UI primitives in `src/components/ui/`.

## Primitives (9/9 documented ✅)

| Component | Doc | File |
|-----------|-----|------|
| EfButton | [EfButton.md](EfButton.md) | `src/components/ui/EfButton.jsx` |
| EfPanel | [EfPanel.md](EfPanel.md) | `src/components/ui/EfPanel.jsx` |
| EfModal | [EfModal.md](EfModal.md) | `src/components/ui/EfModal.jsx` |
| EfInput | [EfInput.md](EfInput.md) | `src/components/ui/EfInput.jsx` |
| EfTooltip | [EfTooltip.md](EfTooltip.md) | `src/components/ui/EfTooltip.jsx` |
| EfBanner | [EfBanner.md](EfBanner.md) | `src/components/ui/EfBanner.jsx` |
| EfCardPlayer | [EfCardPlayer.md](EfCardPlayer.md) | `src/components/ui/EfCardPlayer.jsx` |
| EfClubBadge | [EfClubBadge.md](EfClubBadge.md) | `src/components/ui/EfClubBadge.jsx` |
| EfStatLine | [EfStatLine.md](EfStatLine.md) | `src/components/ui/EfStatLine.jsx` |

## Conventions

- All primitives: `Ef*` PascalCase
- CSS classes: `.ef-{component-kebab}__{element}--{modifier}` (BEM)
- Memoized: critical primitives wrapped in `React.memo` for list perf
- Tokens: zero hardcoded hex; consume from `var(--*)` exclusively

## Live Reference

See `src/components/StyleguideView.jsx` — interactive showcase of all primitives + variants + states.
