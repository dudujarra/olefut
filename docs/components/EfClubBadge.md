# Component: EfClubBadge

> Club shield — collectible card frame with metallic bevel + gold rivets.

**File**: `src/components/ui/EfClubBadge.jsx`

## Sizes

| Size | Pixels |
|------|--------|
| `xs` | 24×24 |
| `sm` | 32×32 |
| `md` (default) | 48×48 |
| `lg` | 64×64 |
| `xl` | 96×96 |

## Props

| Property | Type | Default |
|----------|------|---------|
| `name` | `string` (club name, used to lookup shield asset) | — |
| `size` | enum | `'md'` |
| `fallback` | `boolean` | `false` (show silhouette if asset missing) |

## Behavior

- Looks up `src/assets/shields/{name}.png` by name
- Falls back to silhouette if asset missing (or shows fallback prop)
- Pixelated rendering (`image-rendering: pixelated`)

## Asset Source

184 PNG shields in `src/assets/shields/`. 1024×1024 source, scaled to size.

## Code

```jsx
import { EfClubBadge } from './ui';

<EfClubBadge name="Flamengo" size="lg" />
<EfClubBadge name="Unknown Club" fallback />
```
