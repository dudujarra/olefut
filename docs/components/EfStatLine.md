# Component: EfStatLine

> Stat row — label + value pair, monospace numeric, semantic color by value.

**File**: `src/components/ui/EfStatLine.jsx`

## Props

| Property | Type | Default |
|----------|------|---------|
| `label` | `string` | — |
| `value` | `string \| number` | — |
| `unit` | `string` | — (e.g. "M", "%", "GP") |
| `color` | `'default' \| 'primary' \| 'accent' \| 'danger'` | `'default'` |
| `trend` | `'up' \| 'down' \| 'flat'` | — (renders arrow) |
| `tooltip` | `string` | — (wraps in EfTooltip) |

## Visual

```
LABEL .........  VALUE [unit] [↑/↓]
```

Label: small, muted (--text-muted), `var(--font-sans)`
Value: bold, mono (`var(--font-mono)`), semantic color

## Use Cases

- Player stats (energy, moral, OVR)
- Financial figures (balance, salary, transfer fee)
- Match metrics (possession %, shots, goals)
- Standings rows (V/E/D, pts)

## Tokens

`--text-main`, `--text-muted`, `--font-mono`, plus color variant tokens

## Code

```jsx
import { EfStatLine } from './ui';

<EfStatLine label="ENERGIA" value={75} unit="%" color="primary" />
<EfStatLine label="SALÁRIO" value="2.5M" trend="up" color="accent" />
<EfStatLine label="DERROTAS" value={3} color="danger" tooltip="Últimos 10 jogos" />
```
