# Component: EfBanner

> Full-screen narrative moment overlay — pixel-art card with auto-dismiss.

**File**: `src/components/ui/EfBanner.jsx`
**CSS**: `src/styles/ef-banner.css`

## Types (13)

| Type | Icon | Use |
|------|------|-----|
| `champion` | 🏆 | Title won (4s duration) |
| `promotion` | ⬆️ | Division up |
| `relegation` | ⬇️ | Division down |
| `fired` | 💼 | Manager fired (3.5s) |
| `hired` | 🤝 | New job |
| `retirement` | 🎖️ | Career end (4.5s) |
| `offer` | 📨 | Transfer offer |
| `sponsor` | 💰 | Sponsorship deal |
| `motm` | ⭐ | Man of the match |
| `hattrick` | 🎩 | 3 goals same match |
| `injury` | 🩹 | Player injured |
| `suspension` | 🟥 | Cards accumulated |
| `cleanSheet` | 🛡️ | No goals conceded (2s) |

## Props

| Property | Type | Default |
|----------|------|---------|
| `type` | enum (13 types) | — |
| `customTitle` | `string` | — (override default) |
| `customSubtitle` | `string` | — |
| `onDismiss` | `() => void` | — (auto-fires after duration) |

## Behavior

- Auto-dismiss after `cfg.duration` (per-type)
- Click anywhere on overlay dismisses early
- Fade-in 200ms, fade-out 400ms before close
- z-index 10000 (highest)

## Accessibility

- `role="dialog"` + `aria-label={cfg.title}`
- Keyboard: ESC dismisses (via onDismiss)
- Animations respect `prefers-reduced-motion`

## Tokens

13 component tokens: `--ef-banner-{promo,fired,hired,retirement,offer,sponsor,motm,hattrick,injury,relegation,stripe}` + global `--accent`, `--text-main`, `--color-shadow-deep`

## Code

```jsx
import { EfBanner } from './ui';

<EfBanner type="champion" onDismiss={() => setShow(false)} />
<EfBanner type="offer" customTitle="NOVA OFERTA" customSubtitle="Manchester paga R$50M" />
```
