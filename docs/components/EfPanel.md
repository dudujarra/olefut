# Component: EfPanel

> Card container — collectible card frame with metallic bevel + scanline overlay.

**File**: `src/components/ui/EfPanel.jsx`

## Variants

| Variant | Use When | Visual |
|---------|----------|--------|
| `default` | Standard panels | Border + bevel |
| `elev` (elevated) | Important content, hero panels | Stronger bevel + glow |
| `sunk` | Recessed content (input groups, sub-sections) | Inverted bevel |

## Padding

| Value | Spacing |
|-------|---------|
| `none` | 0 |
| `sm` | 8px |
| `md` (default) | 16px |
| `lg` | 24px |

## Props

| Property | Type | Default |
|----------|------|---------|
| `variant` | `'default' \| 'elev' \| 'sunk'` | `'default'` |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` |
| `className` | `string` | `''` |
| `children` | `ReactNode` | — |

## Tokens

`--bg-panel`, `--border-panel`, `--color-shadow-deep`, `--color-bg-deep`

## Code

```jsx
import { EfPanel } from './ui';

<EfPanel padding="lg">
  <h3>Standard Card</h3>
  <p>Content</p>
</EfPanel>

<EfPanel variant="elev" padding="lg">
  <h2>Hero Panel</h2>
</EfPanel>

<EfPanel variant="sunk" padding="sm">
  <FormGroup>...</FormGroup>
</EfPanel>
```

## Do's / Don'ts

| ✅ | ❌ |
|---|---|
| Use `variant="elev"` for primary content | Stack 3+ elev panels (no hierarchy) |
| `padding="lg"` for main containers | Mix paddings within same hierarchy |
| Nest EfPanel inside EfPanel for hierarchy | Override `background` via style |
