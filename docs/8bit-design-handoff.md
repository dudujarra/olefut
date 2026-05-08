# ELIFOOT 8-Bit Design Handoff — Claude Sign Brief

**Para**: Claude Sign (design specialist)
**De**: Dudu Jarra + Claude Code (após sessão UX completa)
**Data**: 2026-05-08
**Versão**: 1.0
**Live ref**: https://dudujarra.github.io/elifoot-web/

---

## 🎯 Mission

Transformar **ELIFOOT RPG** de visual moderno-clean para estética **8-bit retro** sem perder usabilidade. Inspiração: NES/SNES era + Football Manager classics + Elifoot 98 nostalgia.

---

## 📐 Design Principles

### Core
- **Pixel-perfect**: tudo grid 4×4 ou 8×8 base
- **Limited palette**: 16 cores max por screen (NES style)
- **No anti-aliasing**: bordas duras, sharp edges
- **Chunky typography**: pixelated 8-bit font (PressStart2P, VT323, ou custom)
- **Crunchy SFX**: 8-bit beeps/chirps (já temos via Web Audio API)
- **CRT vibes**: scanlines opcionais, slight bloom

### Modern compromises (não retro 100%)
- **Responsive**: layout precisa funcionar 375px–1920px
- **Dark mode default**: olhos modernos
- **A11y**: contrast WCAG AA mínimo
- **Touch-friendly**: targets 44px mínimo mobile

---

## 🎨 Color Palette (proposed)

```
PRIMARY (verde grama)
- Grass:     #2D5016 (dark) / #4A7C2A (mid) / #7CB342 (light)
- Field:     #1A3508
- Crowd:     #6B4226 (brown stands)

UI BASE
- BG-deep:    #0F0F1A (almost black)
- BG-panel:   #1C1C2E (slate)
- BG-elevated:#2A2A3F
- Border:     #3D3D5C

ACCENTS
- Goal:       #FFD700 (gold)
- Win:        #4ADE80 (NES green)
- Loss:       #EF4444 (NES red)
- Warning:    #F59E0B (NES amber)
- Info:       #3B82F6 (NES blue)
- Card-yel:   #FFEB3B
- Card-red:   #D32F2F

TEAM JERSEYS (4 base + tints)
- Red:        #DC2626 / accent #FFFFFF
- Blue:       #2563EB / accent #FFD700
- Green:      #16A34A / accent #FFFFFF
- Yellow:     #EAB308 / accent #16A34A

TEXT
- Primary:    #F0F0DC (off-white retro)
- Muted:      #A8A8B5
- Highlight:  #FFE066
```

---

## 🔤 Typography

### Stack
1. **Headers/scoreboard**: `'Press Start 2P', monospace` (Google Font, retro)
2. **Body/content**: `'VT323', monospace` (CRT terminal style)
3. **Numbers (stats)**: `'Silkscreen', monospace` (8-bit)
4. **Fallback**: `monospace`

### Sizes (em rem, em base 16px)
- H1 (logo):    2rem (32px) — Press Start 2P
- H2 (titles):  1.25rem (20px) — Press Start 2P
- H3 (panels):  1rem (16px) — VT323 bold
- Body:         1.125rem (18px) — VT323
- Small:        0.875rem (14px) — VT323
- Stats (num):  1.5rem (24px) — Silkscreen

---

## 🖼️ Screen Mockups (descritivos)

### 1. Start Screen
```
┌────────────────────────────────────┐
│        ████ ██     ████ ████       │
│       ██    ██     ██   ██  █      │
│       ██    ██     ████ ████       │
│       ██    ██  █  ██   ██         │
│        ████ ██████ ██   ██         │
│                                    │
│         SOCCER MANAGER RPG         │
│                                    │
│      ┌─────┐  ┌─────┐              │
│      │TREIN│  │JOGAD│              │
│      │ADOR │  │ OR  │              │
│      └─────┘  └─────┘              │
│                                    │
│   [Nome do Treinador___________]   │
│   [Sandbox (Livre)         ▼]      │
│   [Selecione seu time...   ▼]      │
│                                    │
│      [⚡ COMEÇAR CARREIRA]          │
└────────────────────────────────────┘
```

**Visual**: gradient sky bg pixel-art, logo grande pixel-art, botões com 4px border + dithered shadow.

### 2. Dashboard
```
┌──[ ELIFOOT ]──────[Dudu | Sem 5/38 | 💾🔊🔄]┐
├────────────────────────────────────────────┤
│  ╔══════════════════════════════════════╗  │
│  ║ [⚽] FLAMENGO          R$ 350.0M      ║  │
│  ║     5º • Série A • 2V 1E 1D          ║  │
│  ║     ████████░░░░░░░ 53% 🤔Observando ║  │
│  ╚══════════════════════════════════════╝  │
│                                            │
│  ┌─ PRÓXIMO JOGO ──────────────[☂ Chuva]──┐│
│  │ 4-3-3 • Ofensivo                       ││
│  │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐               ││
│  │ │80││69││73││76││58││75│               ││
│  │ │GO││DE││MI││AT││MO││EN│               ││
│  │ └──┘└──┘└──┘└──┘└──┘└──┘               ││
│  │                                        ││
│  │     ▶ JOGAR PARTIDA                    ││
│  └────────────────────────────────────────┘│
│                                            │
│  [VISÃO][TÁTI][TREI][CLUB]                 │
│  ─────────────────────────                 │
│  💡 DICAS DO TREINADOR                     │
│  1. Táticas: escolha formação...           │
│  2. Treino: melhore atributos...           │
│                                            │
│  [👥 PLANTEL] [🛒 MERCADO] [📊 TABELA]    │
└────────────────────────────────────────────┘
```

**Visual**: bordas 4px chunky, panels com inner shadow, stat boxes 8-bit number display.

### 3. Match Live
```
┌──[ ELIFOOT ]──────[Dudu | Sem 5/38]──┐
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ FLAMENGO     2 — 1     SANTOS  │  │
│  │              ╔══════╗           │  │
│  │              ║ 67'  ║ ● AO VIVO│  │
│  │              ╚══════╝ 2º Tempo │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌── NARRAÇÃO ─────────────────────┐ │
│  │ 12'  Flamengo arma jogada!      │ │
│  │ 23'  ⚽ Vinícius marca! (1×0)   │ │
│  │ 35'  🟨 Cartão pra Costa        │ │
│  │ 41'  Goleiro defende!           │ │
│  │ 67'  ⚽ Otávio empata! (1×1)    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  [1x][2x][5x]              [⏭ PULAR]│
│                                      │
│  ▶ INTERVALO                         │
└──────────────────────────────────────┘
```

**Visual**: scoreboard com retro display 7-segment, narração em terminal-style green-on-black.

### 4. Plantel (Squad)
```
┌──[ PLANTEL — FLAMENGO (18) ]──[← VOLTAR]┐
├──────────────────────────────────────────┤
│  [🔍 Buscar______][POS▼][Ordenar▼]      │
│                                          │
│  STAT NOME              POS OVR ⚡ 😊 ID │
│  ──── ──────────────── ─── ─── ── ── ── │
│  ⭐   [JS] João Silva  GOL  78 100 51 25│
│  🔄   [ML] Murilo Lima GOL  72 100 56 30│
│  ⭐   [OS] Otávio Souz DEF  73 100 50 31│
│  ⭐   [YA] Yuri Almei  DEF  71 100 65 27│
│  🔄   [FM] Felipe Mart DEF  71 100 69 24│
│  ...                                     │
└──────────────────────────────────────────┘
```

**Visual**: tabela pixel-art com avatares retangulares 8-bit (não círculos), badges POS retangulares com gradient.

---

## 🎨 Asset List (a ser gerado)

### Sprites (pixel-art, 16×16 ou 32×32)
1. **Logo ELIFOOT** (grande, 256×64px)
2. **Bola futebol** — animação rolling 8 frames
3. **Goal animation** — 12 frames (kick → ball → net → cheer)
4. **Card amarelo/vermelho** — 16×24
5. **Whistle/apito** — 16×16
6. **Trophy** — 32×32 (ouro/prata/bronze variants)
7. **Stadium** — 5 níveis (32×32 cada): Municipal → Regional → Moderno → Premium → Templo
8. **Player jersey** — 8 cores básicas, 16×24 cada
9. **Manager** — 16×24 sprite (terno + prancheta)
10. **Coach roles** — 5 sprites (Fisio/Olheiro/Físico/Financeiro/Base)

### Backgrounds
1. **Stadium grass** (full screen, parallax) — 1920×1080 tileable
2. **Sky variants** (4 weather): sun, cloud, rain, storm
3. **Crowd** (pixel-art, parallax behind grass)
4. **Locker room** (dressing room screen)
5. **Office/desk** (board meeting, contract)
6. **Trophy room** (legacy/awards screen)

### UI Elements
1. **Buttons**: idle, hover, pressed, disabled (4 states × 3 sizes = 12)
2. **Panels**: small, medium, large (with corner caps)
3. **Borders**: 4-corner pixel-art frames (chunky 4px)
4. **Progress bars**: empty/filled (segmented blocks)
5. **Tabs**: active/inactive
6. **Dropdowns**: chevron 8-bit
7. **Inputs**: text/select/checkbox

### Icons (16×16 each)
- ⚽ Bola, 🏆 Trofeu, 💰 Dinheiro, 🏥 Lesão, ⚡ Energia, 😊 Moral, 🔥 Form
- 📅 Calendar, 📊 Gráfico, 🛒 Carrinho, 📋 Prancheta, 🎓 Capelo
- ⭐ Star, 🔄 Refresh, ← Arrow, ▶ Play, ⏸ Pause, ⏭ Skip
- 🇧🇷🇦🇷🇺🇾🇨🇱🇨🇴🇬🇧🇪🇸🇮🇹🇩🇪🇫🇷 Bandeiras (estilo CRT)

---

## 🎬 Animations & Transitions

### Match
- **Goal**: scoreboard digit flips (7-segment style), screen flash gold, ball anim through net, "GOOOL" text bounce-in
- **Card**: ref pulls card animation, freeze 1s, beep sfx
- **Save**: goalkeeper dive sprite, ball deflects
- **Substitution**: player walks off, replacement walks on (pixel sprite)

### Navigation
- **Tab switch**: slide-left/right pixel transition (16-frame)
- **Modal in/out**: scale 0→1 with bounce
- **Toast**: slide-down from top, fade after 1.5s

### Idle
- **Logo**: subtle scanline flicker (1% opacity oscillation)
- **Live indicator**: pulse + blink (CRT vibe)
- **Player avatars**: idle bob (every 8s)

---

## 🔊 Audio Direction

### Music (NES 8-bit synth chip emulation)
- **Title theme**: upbeat 16-bar loop (chip arpeggios)
- **Match ambient**: crowd chant 4-bar loop + stadium hum
- **Victory fanfare**: 8-bar major key
- **Defeat sting**: 4-bar minor descend
- **Tactical thinking**: minimal pad (during pré-jogo)

### SFX (já temos engine via Web Audio API, falta polir)
- ⚽ Goal: 3-note arpeggio C-E-G (currently OK)
- 🟨 Card: low buzz (currently OK)
- ⏱ Whistle: 2 short beeps (currently OK)
- 👆 Click: short blip (currently OK)
- ✅ Success: ascending pair (currently OK)
- ❌ Fail: dissonant low (currently OK)

**Add**: crowd cheer (gol), boo (cartão vermelho), drum rolls (penalty), confetti (campeonato).

---

## 📱 Responsive Breakpoints

```css
/* Mobile (375px - 767px) */
- Stack vertical, 1-column
- Hide secondary stats (.hide-mobile)
- Larger touch targets (44px min)
- Sticky bottom nav optional

/* Tablet (768px - 1023px) */
- 2-column dashboard
- Sidebar opcional
- Match scoreboard maior

/* Desktop (1024px+) */
- Full layout 3-column
- Side panels (chat, news)
- Animation extras
```

---

## 🛠️ Implementation Steps (sugestão)

### Phase 1: Color + typography swap (2-3h)
1. Update `src/index.css` palette → 8-bit colors
2. Replace fonts (Google Fonts: Press Start 2P + VT323)
3. Add scanline overlay (CSS pattern)
4. Test contrast WCAG

### Phase 2: Pixel-art assets (4-6h, com Gemini Flash help)
1. Generate logo 8-bit
2. Generate icons sprite-sheet (24 icons)
3. Generate stadium sprites (5 levels)
4. Generate player avatars base + variations
5. Generate UI panel borders (9-slice)

### Phase 3: Apply assets to UI (3-4h)
1. Replace emoji icons with pixel sprites
2. Apply panel borders (CSS border-image)
3. Apply progress bar segments
4. Avatar sprite replacement

### Phase 4: Animations (3-5h)
1. Goal anim sequence
2. Page transitions
3. Idle micro-anims
4. Loading states

### Phase 5: Polish (2-3h)
1. Sound design improvements
2. Mobile fine-tune
3. A11y audit
4. Performance check (no jank)

**Total**: ~16-22h work for full overhaul

---

## ✅ Acceptance Criteria

- [ ] Todas telas usam palette 8-bit definida
- [ ] Fonts Press Start 2P + VT323 carregadas e aplicadas
- [ ] Logo ELIFOOT em pixel-art
- [ ] 24 ícones sprite-sheet aplicados
- [ ] Stadium 5 levels visualmente distintos
- [ ] Goal animation triggers em ⚽ event
- [ ] Mobile responsive 375px sem broken layouts
- [ ] WCAG AA contrast ratio mínimo
- [ ] Build size < 500KB
- [ ] 60fps animations (no jank)
- [ ] Sound on/off persist localStorage
- [ ] Existing tests 597/597 ainda passing

---

## 🤝 Handoff Notes

### Para Claude Sign:
- App stack: React 19 + Vite 8 + CSS plain
- CSS file: `src/index.css` (310 linhas)
- Components: 8 React JSX files em `src/components/`
- Existing UX: dark mode glassmorphism — substituir
- Existing tests: 597 pass — não quebrar
- Live demo: https://dudujarra.github.io/elifoot-web/

### Para Gemini Flash (arte):
Use prompts:
1. "8-bit pixel art logo for soccer manager game 'ELIFOOT', NES style, green palette, 256x64px, transparent background"
2. "8-bit pixel art soccer ball sprite, 32x32px, white with black hexagons, NES era style"
3. "8-bit pixel art football stadium, 5 progressive levels: small municipal field → premium temple, 64x64px each, top-down view"
4. "Pixel-art player jersey sprites, 16x24px, 8 different colors (red/blue/green/yellow/black/white/orange/purple), NES era"
5. "Pixel-art trophy icons, 32x32px, 3 variants: gold/silver/bronze, NES era, transparent bg"

---

## 📦 Deliverables Expected

1. **Updated `src/index.css`** com palette 8-bit + fonts retro
2. **Sprite sheets** (PNG): icons.png, players.png, stadiums.png, ui-frames.png
3. **Audio assets** (opcional): bgm.mp3, sfx-cheer.mp3, sfx-boo.mp3
4. **Updated components** com pixel-art applied
5. **Storybook/screenshots** de cada screen final
6. **Performance report** (Lighthouse)

---

**Status**: BRIEF READY  
**Next**: Claude Sign começa Phase 1 (colors + typography). Gemini Flash gera assets em paralelo.

---

*Generated automatically via Claude Code autonomous test session.*
