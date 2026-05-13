# PROMPT MASTER — Gerar Pack Completo de Design OléFUT (AG / Antigravity)

> Cole este prompt inteiro no Antigravity (ou outra IA com geração de imagem).
> Resultado: pack completo de design — logo, CIP, slides, banners, social posts, ícones — todos alinhados ao brand existente.

---

## CONTEXTO DA MARCA

**Marca**: Olé FUT (football manager web)

**Posicionamento**:
> "O cheiro de cartucho assoprado. O barulho da ficha caindo na máquina."
> Football manager 16-bit que sente como SNES mas pensa como AI de 2026.
> Anti-corporativo, anti-planilha, anti-Football-Manager-genérico.

**Estilo visual**: **Luxury Arcade 32-bit (ISSSD-Premium)**
- Inspiração core: **International Super Star Soccer Deluxe (SNES, Konami 1994)**
- Pixel art premium, NÃO pixel art grosso/amador
- Refinamento contemporâneo executado com nostalgia tátil dos arcades SNES

---

## PALETA OBRIGATÓRIA

| Token | Hex | Uso |
|-------|-----|-----|
| **Neon Arcade Green** | `#39FF14` | Primary, CTAs, sucesso, glow |
| **Gold Trophy** | `#FFD700` | Títulos, headers premium, conquistas |
| **Cartão Vermelho** | `#FF3333` | Alertas, lesões, danger |
| **Amber Warning** | `#FBBF24` | Warnings, notificações |
| **Pitch Green** | `#52B788` | Campo, painéis orgânicos |
| **Deep Forest** | `#1B4332` | Bordas, painéis secundários |
| **CRT Black** | `#111417` | Background principal |
| **Abyss** | `#040805` | Shadows, vignette |
| **Midnight Green** | `#0E1F14` | Painéis recuados |
| **Smoke** | `#a0baae` | Texto secundário |
| **Parchment** | `#F1FAEE` | Texto primário |

## PROIBIÇÕES VISUAIS (zero exceção)

- ❌ `rgba()` com transparência — usar dithering ou camadas sólidas
- ❌ Gradientes CSS (linear/radial) — usar dithering
- ❌ `border-radius` — cantos sempre retos pixel-perfect
- ❌ `blur()`, glassmorphism, backdrop-filter
- ❌ Branco puro `#FFFFFF` — usar `#F1FAEE` ou `#111417`
- ❌ Soft shadows — usar bevel (highlight top-left + shadow bottom-right)
- ❌ Fontes genéricas (Inter, Roboto, Outfit, Helvetica)

## TIPOGRAFIA

```
Display/Headers: Press Start 2P (monospace pixel)
Body/Menus:     Pixelify Sans
Stats/Números:  IBM Plex Mono
```

## VOZ DA MARCA

| Trait | Somos | Não somos |
|-------|-------|-----------|
| Nostálgico | Reverência genuína 16-bit | Saudosismo forçado |
| Autoritativo | xG, táticas granulares | Jargão sem contexto |
| Vibrante | "GOL! GOLAÇO!" | Hype vazio |
| Irreverente | Trocadilhos de futebol | Humor ofensivo |
| Craftsman | Cada pixel intencional | Preciosismo paralisante |

**Termos proibidos**: "dashboard" (→ "escritório"), "user" (→ "mister"), "feature" (→ "novidade"), "loading..." (→ "preparando o gramado...")

**Termos sagrados**: "mister", "escala", "negocia", "avança", "treina", "convoca"

---

## ENTREGÁVEIS PEDIDOS

### 1. LOGO — 4 variantes

**Variante A — Primary Card** (uso principal):
- Frame metálico com rebites (aesthetic de card colecionável SNES)
- Bola de futebol pixel art integrada ao "O" de OLÉ
- 4 estrelas douradas acima do título (representam 4 séries do Brasil)
- Texto "OLÉ FUT" em Press Start 2P, gold trophy `#FFD700`
- Glow verde neon `#39FF14` no contorno externo
- Banner dourado "FOOTBALL MANAGER" na base
- Fundo: CRT Black `#111417`
- Output: 1024×1024 PNG, transparent OR `#F1FAEE` background

**Variante B — Icon (favicon)**:
- Simplificado: apenas bola pixel art integrada ao "O"
- 32×32, 64×64, 192×192, 512×512 PNG

**Variante C — Monochrome**:
- Branco/parchment sem glow, sem cores
- Para watermarks e overlays

**Variante D — Horizontal Banner**:
- Logo + tagline numa horizontal pra header de site
- 1920×400 PNG

### 2. CIP (Corporate Identity Program) — 6 mockups

Todos com logo Variante A aplicado:

1. **Cartão de visita** (90×50mm) — frente + verso, mock realista numa mesa de madeira escura
2. **Letterhead** (A4) — papel premium com header pixel art
3. **Envelope** (DL 110×220mm) — branding lateral
4. **Camiseta polo** (manager edition) — bordada com escudo
5. **Caneca arcade** — branca com logo + arte 16-bit lateral
6. **Press kit folder** (A4) — capa premium com frame metálico

Estilo de mockup: photoreal premium, luz cinematográfica, ambient luxury arcade.

### 3. SLIDES — Pitch Deck (10 slides HTML)

Apresentação investor pitch:

1. **Cover** — Logo + tagline + apresentador
2. **Problem** — "Football manager moderno é planilha do Excel" (frustração)
3. **Solution** — Olé FUT (esperança)
4. **Demo Screenshot** — Tela do escritório pixel art
5. **Market** — TAM Brasil futebol + nostalgia gaming
6. **Traction** — Métricas (1619 testes, 25+ componentes, etc)
7. **Product** — Features matrix (RPG, MARL, ChronicleSystem)
8. **Roadmap** — V1 → V1.5 (5 camadas narrativas)
9. **Ask** — Funding ou comunidade
10. **CTA** — Link play.olefut.com + GitHub

Formato: HTML standalone com Chart.js (sem libs externas além de Phosphor icons via CDN). Cada slide 16:9, responsive, com keyboard navigation (arrows). Design tokens em CSS variables no `:root`. Pattern break entre slides (frustração ↔ esperança).

### 4. BANNERS — Social Media (8 formats)

1. **Twitter/X header** (1500×500) — Slogan + logo + screenshot teaser
2. **LinkedIn banner pessoal** (1584×396) — Para dev/founder
3. **YouTube channel art** (2560×1440) — Com safe zone 1546×423
4. **Facebook cover** (820×312) — Festivo de lançamento
5. **Instagram story** (1080×1920) — Vertical, animation-ready
6. **Instagram post quadrado** (1080×1080) — Logo central
7. **Google Ads Medium Rectangle** (300×250) — CTA "JOGAR GRÁTIS"
8. **Website hero** (1920×1080) — Background full-bleed

Cada banner: máx 2 fontes, headline ≥32px, CTA bottom-right ≥44px, safe zone central 70-80%.

### 5. SOCIAL PHOTOS — Launch Series (6 posts)

Carrossel/posts pra lançamento Instagram:

1. **Teaser** — Logo bordo + countdown
2. **Feature highlight** — Tela MatchView pixel art
3. **Trophy showcase** — 9 troféus alinhados (hierarquia metálica)
4. **Manager testimonial** — Fake quote estilo arcade card
5. **Brazilian flair** — Bandeira BR + escudos clubes brasileiros
6. **Launch day** — "JOGUE AGORA" CTA + link bio

Formato: 1080×1080. Series visual cohesion: mesma paleta, mesmo grid, mesmo nível de detalhe pixel.

### 6. ICONS — UI Set (20 SVGs)

Set de ícones para UI, estilo **outlined pixel-perfect 24×24**:

`escudo`, `troféu`, `gramado`, `bota-chuteira`, `cartão-amarelo`, `cartão-vermelho`, `bola-futebol`, `apito`, `cronômetro`, `taça-libertadores`, `bandeira-corner`, `arquibancada`, `coach-prancheta`, `câmera-replay`, `pix-dinheiro`, `contrato-papel`, `seta-promoção`, `seta-rebaixamento`, `medalha-mvp`, `mapa-brasil`

Cada ícone: stroke 2px, cores `currentColor` (herda CSS), formato SVG inline-ready, viewBox 24×24.

### 7. TROPHIES — Asset Refresh (9 variantes)

Hierarquia metálica pixel art:

```
🏆 CONTINENTAL    → Platinum + Diamond Crystal + Blue Glow
🏆 SÉRIE A        → Gold + Marble Base + Green Glow
🏆 COPA           → Gold + Neon Green Glow + Ornate Lid
🏆 SUPERCOPA     → Gold Shield + Ruby Gem + Red/Gold
🥈 SÉRIE B        → Silver + Wood Base + Blue Tint
🥉 SÉRIE C        → Bronze + Dark Wood + Warm Tones
⚙️ SÉRIE D        → Iron/Grey + Plain Wood + Minimal
👟 ARTILHEIRO    → Golden Boot + Marble + Neon Glow
⭐ TREINADOR     → Crystal Star + Gold Clipboard
```

Cada troféu: 1024×1024 source, transparent background, frame metálico card collectible style.

---

## REGRAS DE EXECUÇÃO

1. **Refs cruzadas obrigatórias**:
   - ISSSD (International Super Star Soccer Deluxe, SNES 1994)
   - Mega Drive/Genesis pixel art premium
   - Stardew Valley (sprite craftsmanship)
   - Octopath Traveler (HD-2D feel mas pixel)
   - **NÃO**: Minecraft-style, Roblox, mobile flat design

2. **Output deve incluir**:
   - PNG files com transparent OR `#F1FAEE` background
   - SVG para icons
   - HTML para slides
   - Source files (Figma export ou PSD layered, se possível)
   - README com naming convention e instruções de uso

3. **Naming convention**:
   - `olefut_logo_[variant]_[size].png`
   - `olefut_cip_[deliverable]_mockup.png`
   - `olefut_slide_[NN]_[topic].html`
   - `olefut_banner_[platform]_[size].png`
   - `olefut_social_[NN]_[topic].png`
   - `olefut_icon_[name].svg`
   - `olefut_trophy_[tier].png`

4. **Validação self-check** antes de entregar:
   - [ ] Zero rgba/transparency
   - [ ] Zero gradient CSS
   - [ ] Zero border-radius
   - [ ] Zero glassmorphism
   - [ ] Cores ESTRITAMENTE da paleta listada
   - [ ] Fontes corretas (Press Start 2P / Pixelify Sans / IBM Plex Mono)
   - [ ] Tom da voz alinhado (nostálgico/autoritativo/vibrante)

---

## ORDEM DE PRIORIDADE (se tempo limitado)

1. Logo Variante A (Primary Card) + favicon → critical
2. Slides pitch deck → critical
3. Banner Twitter/X + Instagram post → high
4. Trophies refresh (9) → high
5. CIP (cartão de visita + letterhead) → medium
6. Ícones SVG set → medium
7. Social photos series → low
8. Banners restantes → low

---

## DELIVERY

Empacotar tudo num único `.zip` com estrutura:

```
olefut-design-pack/
├── README.md (instruções de uso + naming)
├── 01-logo/
├── 02-cip/
├── 03-slides/
├── 04-banners/
├── 05-social/
├── 06-icons/
├── 07-trophies/
└── source-files/ (se possível)
```

---

## NOTAS FINAIS

- Quando em dúvida, **vá pelo refinement em vez de noise** — luxury arcade é sobre esmero, não barulho
- Toda decoração deve ter **propósito narrativo** (não decoração por decoração)
- O usuário (mister/treinador) deve sentir que entrou num **escritório premium dos anos 90** — mas com inteligência de 2026
- Glow neon é assinatura — usar com parcimônia, máxima impacto

**Brand owner**: Eduardo "Dudu" Jarra (@dudujarra)
**Repo**: https://github.com/dudujarra/olefut
**Demo atual**: https://dudujarra.github.io/olefut/
**Token reference**: assets/design-tokens.json no repo
**Brand guidelines completas**: docs/brand-guidelines.md no repo

---

**FIM DO PROMPT — começar geração agora.**
