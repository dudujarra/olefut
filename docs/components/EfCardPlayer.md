# Component: EfCardPlayer

> Player card — collectible-style frame with portrait, OVR, position, stats badges.

**File**: `src/components/ui/EfCardPlayer.jsx`

## Props

| Property | Type | Default |
|----------|------|---------|
| `player` | `Player` object | — required |
| `badge` | `string` (e.g. "LEND", "MVP") | — |
| `selected` | `boolean` | `false` |
| `onClick` | `() => void` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |

## Player Object Shape

```ts
{
  id: number,
  name: string,
  position: 'GOL' | 'DEF' | 'MEI' | 'ATA',
  age: number,
  ovr: number,        // 30-99
  energy: number,     // 0-100
  moral: number       // 0-100
}
```

## Visual States

| State | Visual |
|-------|--------|
| Default | Metallic frame, gold trim, neon glow |
| Hover | Brighter glow + cursor pointer (if onClick) |
| Selected | Border highlight + bevel inverted |
| Low energy (<30) | Red energy bar |
| Low moral (<40) | Yellow moral indicator |

## Tokens

`--bg-panel`, `--border-panel`, `--primary`, `--accent`, `--danger`, position-specific colors

## Code

```jsx
import { EfCardPlayer } from './ui';

<EfCardPlayer player={pelePlayer} />
<EfCardPlayer player={pelePlayer} badge="LEND" selected />
<EfCardPlayer player={pelePlayer} size="sm" onClick={() => select(pelePlayer)} />
```
