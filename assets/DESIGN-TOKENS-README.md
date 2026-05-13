# OléFUT Design Tokens — Three-Layer Architecture

**Source of Truth**: `docs/brand-guidelines.md` v1.1 + SPEC-176, SPEC-177  
**Generated**: 2026-05-13  
**Files**:
- `design-tokens.json` — structured token definitions
- `design-tokens.css` — CSS custom properties (ready to import)

---

## Three-Layer Structure

```
┌─────────────────────────────────────────────────────┐
│ LAYER 3: COMPONENT                                  │
│ (button-bg-hover, card-border, input-placeholder)   │
└────────────────┬────────────────────────────────────┘
                 ↑
┌────────────────┴────────────────────────────────────┐
│ LAYER 2: SEMANTIC                                   │
│ (color-primary, color-text-primary, font-display)   │
└────────────────┬────────────────────────────────────┘
                 ↑
┌────────────────┴────────────────────────────────────┐
│ LAYER 1: PRIMITIVE                                  │
│ (color-green-neon, font-size-h1-desktop, spacing)   │
└─────────────────────────────────────────────────────┘
```

### Why Three Layers?

1. **Primitive** — Raw, immutable values (hex colors, pixel sizes, font names)
   - Single source of truth for physical values
   - Changes propagate up automatically via CSS var references

2. **Semantic** — Purpose-driven aliases (primary, danger, text-secondary)
   - Decouples meaning from raw values
   - Enables theme switching (e.g., light/dark mode) by changing only this layer

3. **Component** — Component-specific tokens (button-bg-hover, card-border)
   - Granular control per component
   - Prevents one-off customizations; all variants defined here

---

## Usage

### Import in CSS
```css
@import 'assets/design-tokens.css';

button {
  background: var(--button-bg-default);
  border: var(--button-border-default);
  color: var(--button-color-default);
  font-family: var(--font-body);
}

button:hover {
  background: var(--button-bg-hover);
  border: var(--button-border-hover);
  color: var(--button-color-hover);
}
```

### Import in JavaScript (if using CSS-in-JS)
```js
const tokens = {
  color: {
    primary: 'var(--color-primary)',      // #39FF14
    danger: 'var(--color-danger)',        // #FF3333
    textPrimary: 'var(--color-text-primary)', // #F1FAEE
  },
  spacing: {
    sm: 'var(--primitive-spacing-sm)',    // 0.5rem
    md: 'var(--primitive-spacing-md)',    // 1rem
  },
};

export default tokens;
```

### Naming Convention

**Primitive**: `--primitive-{category}-{subcategory}-{variant}`
```css
--primitive-color-green-neon: #39FF14;
--primitive-font-size-h1-desktop: 1.2rem;
--primitive-spacing-md: 1rem;
```

**Semantic**: `--{purpose}`
```css
--color-primary: var(--primitive-color-green-neon);
--color-text-primary: var(--primitive-color-neutral-parchment);
--font-display: var(--primitive-font-display);
```

**Component**: `--{component}-{property}-{state}`
```css
--button-bg-default: #1B4332;
--button-bg-hover: #2D6A4F;
--card-border: 2px solid #2D6A4F;
--input-placeholder-color: var(--color-text-secondary);
```

---

## ISSSD-Premium Design Rules (Enforced by Tokens)

### Forbidden Techniques (Tokens exclude these)
❌ `rgba()` transparency — use solid colors from palette  
❌ CSS `linear-gradient` / `radial-gradient` — not in tokens  
❌ `border-radius` — all tokens assume `0` (pixel-perfect)  
❌ `blur()` / `backdrop-filter` — not in tokens  
❌ Pure white `#FFFFFF` — use `--color-text-primary` (#F1FAEE)  

### Typography Rules (Enforced)
✅ **Display** (`--font-display`) — Press Start 2P, headers only  
✅ **Body** (`--font-body`) — Pixelify Sans, readable text  
✅ **Mono** (`--font-mono`) — IBM Plex Mono, numbers/stats  
❌ Never Inter, Roboto, Outfit — not in token definitions  

### Color Palette (Enforced)
✅ **Primary** (#39FF14) — CTAs, success, highlights  
✅ **Secondary** (#FFD700) — titles, achievements  
✅ **Danger** (#FF3333) — alerts, errors  
✅ **Background** (#111417) — CRT Black main bg  
✅ **Text** (#F1FAEE) — Parchment primary text  

### Fixed Frame Pattern (SPEC-177)
```css
.ef-card-frame {
  border: var(--ef-card-frame-border);
  background: var(--ef-card-frame-bg);
}

.ef-card-content {
  background: var(--ef-card-content-bg); /* Solid #111417 */
  color: var(--ef-card-content-color);
  padding: var(--ef-card-content-padding);
}
```

Frame **never changes**. Content is mutable. Background is solid CRT Black (works in any context).

---

## Token Audit Checklist

Before committing UI changes:

- [ ] All colors come from `--color-*` or `--primitive-color-*` tokens
- [ ] All typography uses `--font-*` token (never hardcoded fonts)
- [ ] All spacing uses `--primitive-spacing-*` token
- [ ] No hardcoded hex values in component CSS
- [ ] No `rgba()` / `opacity` — use solid colors
- [ ] No `border-radius` (pixel-perfect corners)
- [ ] No gradients — solid colors only
- [ ] Button states use `--button-*` tokens (default, hover, active, disabled, danger)
- [ ] Notification types use `--notification-*` tokens (success, warning, danger, info)
- [ ] Cards use `--card-*` or `--ef-card-*` tokens
- [ ] Inputs use `--input-*` tokens
- [ ] Fixed frame pattern respected: `.ef-card-frame` (immutable) + `.ef-card-content` (mutable)

---

## Validation

Run token validator (when script exists):
```bash
node scripts/validate-tokens.cjs --dir src/
```

This checks:
- No hardcoded hex values in `.jsx` / `.js` / `.css`
- All colors reference tokens
- All typography uses token fonts
- No forbidden CSS techniques (gradients, rgba, border-radius)

---

## Next Steps

1. **Update `src/index.css`** to import design tokens at top:
   ```css
   @import 'assets/design-tokens.css';
   ```

2. **Migrate existing components** to use tokens:
   - `src/components/` — replace hardcoded colors with `var(--color-*)`
   - `src/styles/isssd-premium.css` — sync with `design-tokens.css`
   - Tests — add `SPEC-XXX.test.js` harness to validate token compliance

3. **Create SPEC-178** (Component Tokens Implementation):
   - Defines bevel effect classes (`.ef-bevel`, `.ef-bevel-invert`)
   - Defines frame variations (`.ef-frame-standard`, `.ef-frame-metallic`)
   - Defines spacing scales per component type

4. **Create SPEC-179** (Logo Guide):
   - Logo with fixed ISSSD metallic frame
   - Clear space rules, minimum sizes
   - Approved color variations (full color, monochrome, on-dark)

5. **Create SPEC-180** (Shield/Card/Trophy Patterns):
   - Implement fixed-frame pattern for all asset-based components
   - Trophy hierarchy rendering
   - Shield card design system

---

## Reference

- **Source**: `docs/brand-guidelines.md` v1.1
- **Decisions**: SPEC-176 (brand identity), SPEC-177 (component frame)
- **Validation**: SPEC-XXX (component tokens harness — TBD)
- **Architecture**: Three-layer (primitive → semantic → component)
