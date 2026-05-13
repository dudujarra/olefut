# Component: EfButton

> SNES 16-bit Brutalist Arcade button — heavy 4px bevel borders, pixel-perfect press feedback.

**File**: `src/components/ui/EfButton.jsx`
**Memoized**: ✅ (`React.memo` — SPEC-169 Bloco 3.3)

## Variants

| Variant | Use When | Color |
|---------|----------|-------|
| `primary` | Main CTAs, "ESCALAR", "AVANÇAR SEMANA" | Neon Green border + glow |
| `secondary` | Supporting actions, "VOLTAR", "CANCELAR" | Border var(--border-panel) |
| `danger` | Destructive ops, "DELETAR", "RESETAR" | Cartão Vermelho border |
| `ghost` | Subtle actions, tertiary nav | Transparent bg + outlined |

## Sizes

| Size | Height | Use |
|------|--------|-----|
| `sm` | 32px | Inline actions, table rows |
| `md` | 44px | Standard CTAs (default) |
| `lg` | 56px | Hero buttons |

## Props

| Property | Type | Default |
|----------|------|---------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `icon` | `ReactNode` | — |
| `loading` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `onClick` | `() => void` | — |
| `type` | `string` | `'button'` |
| `aria-label` | `string` | — (required if icon-only) |

## States

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Bevel highlight top-left | Clickable |
| Hover | Bevel inverts | cursor: pointer |
| Active | translate Y 2px | Arcade press feel |
| Focus | 2px dotted gold | WCAG AA |
| Disabled | opacity 0.5 | No events |
| Loading | Spinner + aria-busy | Clicks swapped |

## Accessibility

- Role: native button
- Keyboard: Tab + Enter/Space
- Focus visible: gold dotted outline (WCAG 2.1 AA)
- Icon-only buttons REQUIRE `aria-label`

## Tokens

`--primary`, `--accent`, `--danger`, `--border-panel`, `--bg-panel`, `--text-main`, `--font-display`

## Do's / Don'ts

| ✅ | ❌ |
|---|---|
| Wrap onClick in useCallback | New inline handlers per render |
| Use `icon` prop for Phosphor | Embed icons as children |
| aria-label for icon-only | Leave icon-only unlabeled |
| variant="danger" for destructive | Inline red color |

## Code

```jsx
import { EfButton } from './ui';
import { FloppyDisk } from '@phosphor-icons/react';

<EfButton variant="primary" size="lg" onClick={save}>SALVAR JOGO</EfButton>
<EfButton variant="secondary" icon={<FloppyDisk />} onClick={save}>SALVAR</EfButton>
<EfButton variant="ghost" icon={<FloppyDisk />} aria-label="Salvar" onClick={save} />
<EfButton variant="primary" loading>PROCESSANDO...</EfButton>
<EfButton variant="danger" onClick={del}>DELETAR SAVE</EfButton>
```
