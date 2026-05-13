# Component: EfTooltip

> Hover/focus tooltip — pixel-art bevel popup with arrow, semantic color variants.

**File**: `src/components/ui/EfTooltip.jsx`

## Colors

| Color | Visual | Use |
|-------|--------|-----|
| `default` | Neutral border | General info |
| `success` | var(--primary) border | Confirmations |
| `warning` | var(--accent) border | Cautions |
| `danger` | var(--danger) border | Errors |

## Positions

`top`, `bottom`, `left`, `right`, `auto` (default — auto-flip on viewport edge)

## Props

| Property | Type | Default |
|----------|------|---------|
| `content` | `ReactNode` | — |
| `color` | `'default' \| 'success' \| 'warning' \| 'danger'` | `'default'` |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'auto'` |
| `delay` | `number` (ms) | `300` |
| `children` | `ReactNode` | — wrapped element |

## Accessibility

- `role="tooltip"`
- `aria-describedby` set on child via portal
- Visible on focus (keyboard) AND hover (mouse)
- ESC dismisses

## ⚠️ Constraint

**NEVER wrap `<th>`, `<td>`, `<tr>` with EfTooltip** — emits `<span>` inside `<tr>` (invalid HTML, hydration warning).
Use `title=` attribute on those elements instead. See BUG-084.

## Tokens

`--color-tooltip-bg`, `--border-panel`, plus color variant tokens

## Code

```jsx
import { EfTooltip, EfButton } from './ui';

<EfTooltip content="Salva o estado atual no slot escolhido">
  <EfButton variant="primary">SALVAR</EfButton>
</EfTooltip>

<EfTooltip content="Ação irreversível" color="danger" position="top">
  <EfButton variant="danger">DELETAR</EfButton>
</EfTooltip>

// ❌ DON'T:
<EfTooltip content="Pontos"><th>P</th></EfTooltip>  // Invalid HTML

// ✅ DO:
<th title="Pontos">P</th>
```
