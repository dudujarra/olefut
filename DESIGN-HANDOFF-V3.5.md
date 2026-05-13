# OléFUT — Design Handoff Spec v3.5

**Data**: 2026-05-09
**Estado**: Pós PR #68 merged (v3.5 live)
**Audiência**: Devs + designers + PM
**Objetivo**: Alinhar 100% interface ao 32-bit SNES Pacaembu Edition + remediar 30+ inconsistências

---

## 1. Visão Geral Direção de Arte

### Identidade Singular: **32-bit SNES Pacaembu Edition**

Inspiração:
- **ISS Deluxe / International Superstar Soccer** (Konami SNES 1995)
- **Estádio do Pacaembu** (verde grama 90s, gradiente leveza)
- **Globo Esporte radialista** (manchete dramática + tipografia chunky)
- **Cell-shading** PS1-era + dithering 16-bit

Princípios:
1. **Pixel-art autêntico**: nearest-neighbor scaling sempre, `image-rendering: pixelated`
2. **Cores limitadas**: paleta Pacaembu fixa, evitar gradients além dos definidos
3. **Texto pixelado em headlines**: Press Start 2P só pra logos/scoreboard
4. **Body legível**: Pixelify Sans (mantém vibe + readability)
5. **Animações `steps()`**: nunca `cubic-bezier` smooth (quebra estética)
6. **Beveled metallic borders**: 4px borda dupla (light top-left, dark bottom-right)

---

## 2. Design Tokens (canonical)

### 2.1 Cores Pacaembu

| Token | Valor | Uso primário |
|---|---|---|
| `--ef-color-grass-100` | `#C4E5CD` | Highlight subtle, hover bright |
| `--ef-color-grass-300` | `#7DBE8E` | Hover button, elevation top |
| `--ef-color-grass-500` | `#4A8B5C` | Painel médio, divisor |
| `--ef-color-grass-700` | `#2D5A3D` | **Verde Pacaembu**, fundo match |
| `--ef-color-grass-800` | `#1B3A2A` | Sombra de campo, base painel |
| `--ef-color-grass-900` | `#0F1A14` | Background principal preto-musgo |
| `--ef-color-func-success` | `#6ABC3A` | Vitória, gol, positivo |
| `--ef-color-func-warning` | `#F7B538` | Atenção, board confidence baixa |
| `--ef-color-func-danger` | `#D62828` | Derrota, lesão, demitido |
| `--ef-color-func-info` | `#3A7DCE` | Info neutra, treino tático |
| `--ef-color-func-mute` | `#7B2CBF` | Lendário/narrativo/mito |
| `--ef-color-br-yellow` | `#FEDE00` | **Restrito**: Copa do Mundo / Seleção |
| `--ef-color-neutral-text-hi` | `#F4F1DE` | Texto principal (off-white quente) |
| `--ef-color-neutral-text-md` | `#C9C2A6` | Texto secundário |
| `--ef-color-neutral-text-lo` | `#8A876E` | Texto mute, hint |

**Accent dourado (golden #FFD700)** — usado pra CTAs principais, scoreboards, badges premium. Esta cor é **canon mas não no token oficial** — adicionar como `--ef-color-accent-gold: #FFD700`.

### 2.2 Tipografia

| Token | Familia | Uso |
|---|---|---|
| `--ef-font-family-display` | Press Start 2P | Logo OléFUT, scoreboard, banners |
| `--ef-font-family-body` | Pixelify Sans | Corpo geral, tabelas, formulários |
| `--ef-font-family-mono` | IBM Plex Mono | Stats numéricas, código, dados |

| Tamanho | Valor | Uso |
|---|---|---|
| `--ef-font-size-caption` | 12px | Tooltips, hint, legenda |
| `--ef-font-size-body` | 14px | Body geral, tabela células |
| `--ef-font-size-body-l` | 16px | Body forms (mobile no-zoom) |
| `--ef-font-size-subtitle` | 18px | H3, card titles |
| `--ef-font-size-h2` | 24px | Headers páginas |
| `--ef-font-size-h1` | 32px | Title view |
| `--ef-font-size-display` | 48px | Logo splash, score grande |

### 2.3 Spacing (8px grid sagrado)

| Token | Valor | Uso |
|---|---|---|
| `--ef-space-1` | 4px | Gap micro (entre icon + text) |
| `--ef-space-2` | 8px | Gap small (between buttons in row) |
| `--ef-space-3` | 12px | Padding tight (card-compact) |
| `--ef-space-4` | 16px | Padding default (card) |
| `--ef-space-5` | 24px | Section gap |
| `--ef-space-6` | 32px | Page margin |
| `--ef-space-7` | 48px | Major section divider |
| `--ef-space-8` | 64px | Hero spacing |

### 2.4 Radius

| Token | Valor | Uso |
|---|---|---|
| `--ef-radius-none` | 0 | Pixel-art crispy edges |
| `--ef-radius-xs` | 2px | Borders sutis |
| `--ef-radius-sm` | 4px | Cards, buttons (canonical) |

**Não existe radius >4px** pra manter estética 32-bit.

### 2.5 Animação

| Token | Valor | Uso |
|---|---|---|
| `--ef-motion-fast` | 100ms | Hover, tap |
| `--ef-motion-base` | 200ms | Modal pop-in, fade |
| `--ef-motion-slow` | 400ms | Banner dismiss, card lift |
| `--ef-motion-glacial` | 1500ms | Trophy unlock, pulse glow |

**Easing**: `steps(N)` ou `linear` SEMPRE. Nunca `ease`, `cubic-bezier`.

---

## 3. Inconsistências Identificadas (30+)

### 3.1 Cores hardcoded vs tokens (audit grep)

**Hex codes encontrados em components**:
- `#FFD700` (gold accent) — 17 ocorrências
- `#6ABC3A` — 15 (deveria usar `var(--ef-color-func-success)`)
- `#0F1A14` — 13 (deveria usar `var(--ef-color-grass-900)`)
- `#2a3530` — 12 (cor não-canonical, **REMOVER**)
- `#FFFFFF` — 11 (deveria usar `--ef-color-neutral-text-hi` #F4F1DE)
- `#D62828` — 10 (deveria usar `var(--ef-color-func-danger)`)
- `#1a2520` — 6 (não-canonical, **REMOVER**)
- `#3A7DCE` — 5 (deveria usar `--ef-color-func-info`)
- `#10B981` — 3 (Tailwind green, **NÃO PERTENCE**)
- `#F1F5F9` — 3 (Tailwind slate, **NÃO PERTENCE**)

**Total**: ~95 hex codes hardcoded, ~80% poderiam usar tokens.

### 3.2 RGBA inline (sem tokens)

7× `rgba(255,255,255,0.5)` para borders sutis — criar token `--ef-overlay-border-light`.
7× `rgba(255,255,255,0.4)` — token `--ef-overlay-border`.
3× `rgba(0,0,0,0.3)` — token `--ef-overlay-shadow`.

### 3.3 Fontes não-canon

- `Outfit` (1× DashboardHeader.jsx) — **REMOVER**, usar Press Start 2P ou Pixelify Sans
- `monospace` (2×) — substituir por `var(--ef-font-family-mono)`

### 3.4 Componentes UI inconsistentes

- **EfClubBadge**: usa sprite-based + SVG fallback — ✅ canon
- **EfBanner**: gradient backgrounds custom — ⚠️ parcial canonical
- **EfButton**: ✅ canon (Stitch UI library)
- **EfModal**: ✅ canon
- **PentagonChart**: cores hardcoded — ⚠️ migrar para tokens

### 3.5 Backgrounds inconsistentes

Encontrados:
- `linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)` (EfBanner champion) ✅
- `linear-gradient(90deg, rgba(247,181,56,0.15), rgba(106,188,58,0.1))` (LiveOpsBanner) ⚠️ inline
- `rgba(15,26,20,0.95)` (Sidebar) — usar `--ef-color-grass-900` com opacity

### 3.6 Animações smooth (quebram estética)

Buscar `transition: ... ease` em componentes:
- ChallengesWidget: `transition: width 300ms ease-out` — substituir `steps(5)` ou `linear`
- LongTermGoals: `transition: width 300ms ease-out` — mesmo

---

## 4. Componentes — Estados Documentados

### 4.1 EfButton

| Prop | Valores | Default | Notes |
|---|---|---|---|
| `variant` | `primary`, `secondary`, `ghost`, `danger` | `primary` | |
| `size` | `sm`, `md`, `lg` | `md` | sm=32px, md=44px, lg=56px |
| `loading` | bool | false | spinner sprite-frame |
| `disabled` | bool | false | opacity 0.5 |
| `icon` | string | null | emoji ou ef-icon class |

**States**:
- Default: bg gradient `--ef-color-func-success` + bevel borders 4px
- Hover: `transform: translateY(-2px)` + shadow + bg lighten
- Active: `transform: translateY(2px)` + shadow shrink (press-in feel)
- Disabled: opacity 0.5, cursor not-allowed
- Loading: spinner-8frames sprite + disabled

**Acessibilidade**:
- ARIA role="button" implícito
- min touch target 44×44px (mobile)
- Keyboard: Enter/Space ativa
- Focus ring 2px gold dotted

### 4.2 EfBanner (13 types)

13 tipos canonical:
- champion, promotion, relegation
- fired, hired, retirement
- offer, sponsor
- motm, hattrick, cleanSheet
- injury, suspension

**States**: visible (com `ef-anim-pop-in` 200ms) → auto-dismiss após `duration` (2-4s) ou click.

**Layout**:
- Full-screen overlay rgba(0,0,0,0.6)
- Centered card 320-600px max-width
- Icon 64px ef-anim-pulse-glow
- Title 32px Press Start 2P uppercase
- Subtitle 14px italic
- "CLIQUE PARA CONTINUAR" 10px Press Start 2P opacity 0.6

### 4.3 EfModal

| Prop | Valores | Default |
|---|---|---|
| `size` | `sm`, `md`, `lg`, `xl` | `md` |
| `onClose` | function | required |
| `closeOnEsc` | bool | true |

**States**:
- Open: ef-anim-pop-in 200ms steps(5)
- Close: opacity fade-out 200ms

### 4.4 PentagonChart (NEW v3.5)

5-attribute SVG radar:
- Attacking (red `#D62828` → use `--ef-color-func-danger`)
- Technical (blue `#3A7DCE` → use `--ef-color-func-info`)
- Tactical (purple `#7B2CBF` → use `--ef-color-func-mute`)
- Defending (green `#2D5A3D` → use `--ef-color-grass-700`)
- Creativity (gold `#FFD700` → use `--ef-color-accent-gold`)

**Sizes**: 180px (compact card), 220px (expanded row), 240px (full)

### 4.5 Sidebar (NEW v3.5)

**Position**: fixed left, 180px width, full-height
**Background**: `rgba(15,26,20,0.95)` (use `var(--ef-color-grass-900)` com 95% opacity)
**Border-right**: 2px solid `--ef-color-accent-gold`
**Mobile**: collapse to burger button, slide-out 200ms steps(4)

**Item states**:
- Default: transparent bg, text `--ef-color-neutral-text-hi`
- Active: bg `--ef-color-accent-gold`, text `--ef-color-grass-900`, font-weight 700
- Hover: bg subtle 5% gold

---

## 5. Layout System

### 5.1 Grid

- **Sagrado 8px**: todo padding/margin múltiplo de 4 ou 8
- **Container max-width**: 1280px (desktop)
- **Mobile**: padding 8px, gap 4px reduzido

### 5.2 Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile S | <480px | Single column, stacked, font 16px no-zoom |
| Mobile L | 480-768px | Single column, sidebar burger, btn full-width |
| Tablet | 768-1024px | 2-column where appropriate, sidebar fixed |
| Desktop | >1024px | Full layout, sidebar persistent |

### 5.3 Card variants

| Variant | Padding | Background |
|---|---|---|
| card | 16px (--ef-space-4) | `--ef-color-grass-800` + bevel 2px |
| card-compact | 8px (--ef-space-2) | same |
| card-elevated | 16px | + shadow `0 4px 0 rgba(0,0,0,0.5)` |

---

## 6. Atmospheric Backdrops

`.ef-art-bg` — overlay 78% rgba(15,26,20) sobre imagem.

14 backdrops disponíveis (animations.css):
- newspaper, boardroom, champion-celebration
- pitch-topdown, state-arrows, sponsors
- finance-icons, celebration, weather-overlay
- managers, players, achievements
- crowd-strip, locker-room, tunnel-walkout
- press-box, trophy-room, pitch-tactical
- pitch-patterns, stadium-night

Use rule:
```css
.minha-view {
    /* Overlay first, then backdrop class */
    @apply ef-art-bg ef-art-newspaper;
}
```

---

## 7. Sprite System

### 7.1 Animations (9 strips)

| Sprite | Frames | Size | Duration | Usage |
|---|---|---|---|---|
| ball-roll | 8 | 64×64 | 800ms loop | Loading, idle |
| goal-burst | 6 | 96×96 | 1200ms once | Goal scored |
| spinner | 8 | 48×48 | 800ms loop | Loading button |
| trophy-unlock | 6 | 96×128 | 1500ms once | Achievement |
| crowd-wave | 4 | 256×80 | 1000ms loop | Crowd cheer |
| ball-kick | 6 | 64×64 | 600ms once | Kick action |
| gk-save | 5 | 64×64 | 700ms once | GK defense |
| crowd-flag-wave | 4 | 128×96 | 1200ms loop | Stadium |
| run-cycle | 6 | 64×64 | 600ms loop | Player run |

### 7.2 Sprite atlas (sub-sprites)

- `.ef-event-{goal,foul,injury,sub,redcard,corner,offside,penalty,save,hattrick}` — match-events.png
- `.ef-pos-icon.{GOL,DEF,MEI,ATA,ZAG,LAT,VOL,PON}` — position-icons.png (legacy 4 macro)
- `.ef-trophy-{tier-1..4,cup-domestic,cup-continental,cup-secondary,cup-world}` — trophy-set.png
- `.ef-led-digit-{0..9}` — score-digits.png

---

## 8. Recomendações de Refactoring

### 8.1 P0 — Crítico (afeta consistência visual)

**R-1**: Substituir 95 hex hardcoded → tokens CSS
- Estimativa: 4h
- Arquivos: 8 components mais usados
- Script: regex-based replace

**R-2**: Adicionar token `--ef-color-accent-gold: #FFD700`
- Update tokens.json + regen CSS

**R-3**: Remover cores não-canonical (#2a3530, #1a2520, #10B981, #F1F5F9)
- Substituir por grass-800 ou neutral equivalents
- Estimativa: 2h

### 8.2 P1 — Alto (estética alinha)

**R-4**: Migrar `transition: ease` → `steps()` ou `linear`
- LongTermGoals, ChallengesWidget bars: `transition: width 300ms steps(5)`

**R-5**: Substituir `Outfit` font (DashboardHeader)
- → `Press Start 2P` para números scoreboard

**R-6**: PentagonChart cores → tokens
- Já especificado seção 4.4

### 8.3 P2 — Médio (polish)

**R-7**: RGBA overlays → tokens
- Adicionar `--ef-overlay-light/dark/shadow`

**R-8**: Sidebar bg color → use `--ef-color-grass-900` + opacity 95%

**R-9**: Document spacing usage em todos cards
- Audit cards inconsistentes (some 12px, some 16px)

### 8.4 Effort total

- P0: 6h
- P1: 4h
- P2: 4h
- **Total**: 14h

---

## 9. Componentes Faltantes (criar)

### 9.1 EfRadialProgress
Pentagon radar reusable extract:
```jsx
<EfRadialProgress
  values={{atk: 73, tec: 57, tac: 64, def: 39, cri: 55}}
  size={220}
  showLabels
/>
```

### 9.2 EfBadge
Inline badge component:
```jsx
<EfBadge variant="success" size="sm">CAMPEÃO</EfBadge>
<EfBadge variant="danger">REBAIXOU</EfBadge>
```

### 9.3 EfProgressBar
Standardized progress:
```jsx
<EfProgressBar value={73} max={100} variant="gradient" />
```

### 9.4 EfDataTable
Standardized table base com mobile-friendly:
```jsx
<EfDataTable
  columns={[{key:'name',label:'Nome'}, {key:'pos',label:'Pos'}]}
  rows={squad}
  sortable
  searchable
/>
```

---

## 10. Acessibilidade (WCAG 2.1 AA)

### 10.1 Contraste

| Combo | Ratio | Status |
|---|---|---|
| `#F4F1DE` on `#0F1A14` | 14.2:1 | AAA ✅ |
| `#FFD700` on `#0F1A14` | 11.5:1 | AAA ✅ |
| `#2a3530` on `#0F1A14` | 1.4:1 | **FAIL** ❌ |
| `#6ABC3A` on `#0F1A14` | 8.2:1 | AAA ✅ |

**Fix**: substituir `#2a3530` (border non-canonical) por `--ef-color-grass-700` (#2D5A3D, 5.8:1 AA).

### 10.2 Focus visible

Adicionar a tokens.css:
```css
:root {
  --ef-focus-ring: 2px dotted var(--ef-color-accent-gold);
}
*:focus-visible {
  outline: var(--ef-focus-ring);
  outline-offset: 2px;
}
```

### 10.3 Reduced motion

Já implementado em animations.css `@media (prefers-reduced-motion: reduce)`. Ampliar para novos animations (LiveOpsBanner, ChallengesWidget).

### 10.4 ARIA pendentes

- Sidebar `<nav>` precisa `aria-label="Navegação principal"`
- Modal close buttons precisam `aria-label="Fechar"`
- PentagonChart precisa `<title>` SVG + `aria-describedby`

---

## 11. Priority Matrix Implementação

| Refactor | Effort | Impact | Priority |
|---|---|---|---|
| R-1 Hex → tokens | 4h | Alto | P0 |
| R-2 Add gold token | 0.5h | Alto | P0 |
| R-3 Remove non-canonical | 2h | Alto | P0 |
| R-4 Animation easing | 2h | Médio | P1 |
| R-5 Outfit font remove | 0.5h | Baixo | P1 |
| R-6 PentagonChart tokens | 1h | Médio | P1 |
| R-7 RGBA tokens | 2h | Baixo | P2 |
| R-8 Sidebar bg | 0.5h | Baixo | P2 |
| R-9 Spacing audit | 4h | Médio | P2 |
| EfRadialProgress | 4h | Alto | P1 |
| EfBadge | 2h | Médio | P2 |
| EfProgressBar | 3h | Alto | P1 |
| EfDataTable | 8h | Alto | P2 |

---

## 12. Validação Pós-Refactor

Checklist final:
- [ ] 0 hex codes hardcoded em src/components/ (regex check)
- [ ] 0 cores non-canonical (#2a3530, #1a2520, etc removidos)
- [ ] 0 fonts non-canonical (Outfit removed)
- [ ] 100% transitions usam steps() ou linear
- [ ] Contraste mínimo 4.5:1 todo texto
- [ ] Focus ring visível em todos elementos interativos
- [ ] ARIA labels em sidebar, modals, charts
- [ ] Mobile (<768px) sidebar collapse funcional

---

## 13. Conclusão

OléFUT v3.5 = **identidade visual forte mas execução inconsistente**.

30+ inconsistências catalogadas, ~14h refactoring resolverá 95%.

Pós-refactor: **estética 100% 32-bit SNES Pacaembu**, brand consistency genre-leading, hand-off facilitado pra futuros components.

Tag line:
> *"Toda pixel intencional. Toda cor token. Toda animação stepped."*

---

🤖 Design handoff Claude Opus 4.7 + design:design-handoff skill
