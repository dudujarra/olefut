# Component: EfModal

> Overlay modal — full-screen backdrop + centered card with bevel frame.

**File**: `src/components/ui/EfModal.jsx`

## Sizes

| Size | Width | Use |
|------|-------|-----|
| `sm` | 400px | Confirmations, alerts |
| `md` (default) | 600px | Forms, content modals |
| `lg` | 800px | Rich content, multi-section |
| `xl` | 1000px | Full editors (FormationBoard) |

## Props

| Property | Type | Default |
|----------|------|---------|
| `open` | `boolean` | `false` |
| `onClose` | `() => void` | — (close on overlay click + ESC) |
| `title` | `string \| ReactNode` | — |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `footer` | `ReactNode \| null` | — (use `null` to hide footer area) |
| `children` | `ReactNode` | — body content |

## States

| State | Behavior |
|-------|----------|
| Open | Backdrop fade-in, card pop-in, focus trapped |
| Closing | Reverse animation, body scroll restored |

## Accessibility

- Role: `dialog`
- `aria-modal="true"`, `aria-labelledby={titleId}`
- Focus trap (Tab cycles within modal)
- ESC closes
- Click outside (backdrop) closes
- Restores focus to opener on close

## Tokens

`--bg-panel`, `--border-panel`, `--color-shadow-deep`, `--accent`

## Code

```jsx
import { EfModal, EfButton } from './ui';

<EfModal
  open={open}
  onClose={() => setOpen(false)}
  title="Confirmar Substituição"
  size="md"
  footer={
    <>
      <EfButton variant="secondary" onClick={() => setOpen(false)}>CANCELAR</EfButton>
      <EfButton variant="primary" onClick={confirm}>CONFIRMAR</EfButton>
    </>
  }
>
  <p>Tem certeza que deseja...?</p>
</EfModal>
```
