# Component: EfInput

> Form input — recessed panel style, mono font for data input, error/helper states.

**File**: `src/components/ui/EfInput.jsx`

## Types

`text`, `email`, `number`, `password`, `search` (uses native `type=`)

## Props

| Property | Type | Default |
|----------|------|---------|
| `label` | `string` | — |
| `type` | `string` | `'text'` |
| `value` | `string \| number` | — |
| `onChange` | `(e) => void` | — |
| `placeholder` | `string` | — |
| `disabled` | `boolean` | `false` |
| `error` | `string` | — (renders error state + message) |
| `helper` | `string` | — (renders helper text below) |

## States

| State | Visual |
|-------|--------|
| Default | Recessed bg, border var(--color-soft-border) |
| Focus | Border becomes var(--primary), gold dotted outline |
| Disabled | opacity 0.5, cursor not-allowed |
| Error | Border var(--danger), error text below |
| Helper | Subtle text below input (var(--text-muted)) |

## Accessibility

- `<label>` associated via `htmlFor`/`id`
- Error → `aria-describedby={errorId}`
- Required indicator via asterisk + `aria-required`

## Tokens

`--bg-panel`, `--color-input-error-bg`, `--color-input-error-deep`, `--danger`, `--text-muted`

## Code

```jsx
import { EfInput } from './ui';

<EfInput
  label="Nome do Mister"
  value={name}
  onChange={(e) => setName(e.target.value)}
  helper="Aparece no save card"
/>

<EfInput
  label="Email"
  type="email"
  error="Formato inválido"
  value="bad-email"
/>

<EfInput label="Idade" type="number" disabled value="25" />
```
