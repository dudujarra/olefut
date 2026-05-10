# Olé FUT — Brand Guidelines v1.0

> **"O cheiro de cartucho assoprado. O barulho da ficha caindo na máquina."**

---

## Quick Reference

| Token | Valor |
|-------|-------|
| **Primary Color** | `#39FF14` (Neon Arcade Green) |
| **Secondary Color** | `#FFD700` (Gold Trophy) |
| **Danger** | `#FF3333` (Cartão Vermelho) |
| **Background** | `#111417` (CRT Black) |
| **Primary Font** | `Press Start 2P` |
| **Body Font** | `Pixelify Sans` |
| **Voice** | Nostálgico · Autoritativo · Vibrante |

---

## 1. Conceito de Marca

### Manifesto

**Olé FUT** é um football manager que rejeita a frieza clínica das planilhas modernas em favor de uma **nostalgia premium** — a energia visceral dos arcades dos anos 90, executada com o esmero técnico de obras-primas contemporâneas de pixel art.

Não somos um jogo que *parece* antigo. Somos um jogo que **sente** como aquela tarde no fliperama, mas jogado no seu navegador com a inteligência de 2026.

### Posicionamento

> **Olé FUT** é o football manager para quem cresceu assopro cartucho, que quer sentir a emoção do comando sem abrir uma planilha do Excel — porque gerenciar um time deveria parecer uma aventura, não uma reunião de diretoria.

### Elevator Pitches

**10 segundos:**
"Olé FUT é um football manager 16-bit que sente como SNES mas pensa como AI."

**30 segundos:**
"Enquanto todo football manager moderno te enterra em menus brancos e planilhas frias, Olé FUT revive a energia dos arcades SNES dos anos 90 — com pixel art premium, decisões táticas reais e um motor MARL que faz os rivais aprenderem com você."

**60 segundos:**
"Olé FUT reimagina o gerenciamento de futebol como experiência. Em vez da interface hospitalar dos concorrentes, você entra num escritório pixel-art com madeira escura e jornal na mesa. Os troféus são itens colecionáveis em gold e bronze. Os rivais evoluem via aprendizado de máquina. As rivalidades crescem com o tempo. É a profundidade tática que você espera, vestida na pele mais linda que um football manager já teve — 16-bit, brutalist, e radicalmente anti-genérico."

---

## 2. Paleta de Cores

### Cores Primárias

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Neon Arcade Green** | `#39FF14` | 57, 255, 20 | Cor principal, CTAs, destaques de sucesso, glow effects |
| **Gold Trophy** | `#FFD700` | 255, 215, 0 | Títulos, conquistas, headers premium, tipografia display |

### Cores Secundárias

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **Cartão Vermelho** | `#FF3333` | 255, 51, 51 | Alertas, lesões, derrotas, danger states |
| **Amber Warning** | `#FBBF24` | 251, 191, 36 | Warnings, notificações, transições |
| **Pitch Green** | `#52B788` | 82, 183, 136 | Campo, fundos de painéis, elementos orgânicos |
| **Deep Forest** | `#1B4332` | 27, 67, 50 | Bordas, painéis secundários, depth layers |

### Paleta Neutra

| Nome | Hex | RGB | Uso |
|------|-----|-----|-----|
| **CRT Black** | `#111417` | 17, 20, 23 | Background principal, base de todas as telas |
| **Abyss** | `#040805` | 4, 8, 5 | Shadow depth, vignette, overlays pesados |
| **Midnight Green** | `#0E1F14` | 14, 31, 20 | Painéis recuados, input backgrounds |
| **Smoke** | `#a0baae` | 160, 186, 174 | Texto secundário, captions, muted elements |
| **Parchment** | `#F1FAEE` | 241, 250, 238 | Texto primário, labels de alto contraste |

### Cores Proibidas

> [!CAUTION]
> As seguintes cores e técnicas são **terminantemente proibidas** na identidade Olé FUT:

- ❌ `rgba()` com transparência — use dithering ou camadas sólidas
- ❌ Gradientes CSS (`linear-gradient`, `radial-gradient`)
- ❌ `border-radius` — cantos sempre retos (pixel-perfect)
- ❌ `blur()`, `backdrop-filter` — zero glassmorphism
- ❌ Brancos puros (#FFFFFF) como background — use `#F1FAEE` ou `#111417`

### Acessibilidade

| Par | Contraste | Nível WCAG |
|-----|-----------|-----------|
| Parchment / CRT Black | 15.2:1 | AAA |
| Neon Green / CRT Black | 11.8:1 | AAA |
| Gold / CRT Black | 12.6:1 | AAA |
| Cartão Vermelho / CRT Black | 5.1:1 | AA |

---

## 3. Tipografia

### Font Stack

```css
--font-display: 'Press Start 2P', monospace;        /* Títulos, headers, badges */
--font-body: 'Pixelify Sans', system-ui, sans-serif; /* Corpo, stats, menus */
--font-mono: 'IBM Plex Mono', monospace;              /* Dados numéricos, tabelas */
```

### Hierarquia Tipográfica

| Elemento | Fonte | Peso | Tamanho (Desktop / Mobile) | Line Height | Uso |
|----------|-------|------|---------------------------|-------------|-----|
| **H1 — Título de Tela** | Press Start 2P | 400 | 1.2rem / 0.9rem | 1.4 | Nome da view ativa |
| **H2 — Seção** | Press Start 2P | 400 | 0.85rem / 0.7rem | 1.3 | Subtítulos de painel |
| **H3 — Card Header** | Pixelify Sans | 700 | 1.1rem / 1rem | 1.25 | Títulos de cards |
| **Body** | Pixelify Sans | 400 | 0.85rem / 0.8rem | 1.5 | Texto geral |
| **Stat Number** | IBM Plex Mono | 600 | 1rem / 0.9rem | 1.2 | Números, placares, $$ |
| **Caption** | Pixelify Sans | 400 | 0.7rem / 0.65rem | 1.4 | Labels, timestamps |
| **Badge/Tag** | Press Start 2P | 400 | 0.45rem / 0.4rem | 1.0 | Conquistas, status |

### Regras Tipográficas

1. **Press Start 2P é sagrada** — usá-la apenas em headers, badges e elementos de destaque. Nunca em parágrafos longos.
2. **Pixelify Sans é a workhorse** — todo texto legível, menus, descrições.
3. **IBM Plex Mono para dados** — placares, valores monetários, estatísticas tabulares.
4. **Nunca usar Inter, Roboto, Outfit** — fontes genéricas são proibidas no universo Olé FUT.
5. **Letter-spacing mínimo** — `0.5px` em Press Start 2P para legibilidade; `0` em Pixelify Sans.

---

## 4. Logo

### Variantes

| Variante | Uso | Arquivo |
|----------|-----|---------|
| **Primary (Card)** | Tela inicial, splash, materiais de marketing | `src/assets/olefut_logo.png` |
| **Icon** | Favicon, app icon, notificações PWA | *a gerar — versão simplificada da bola* |
| **Monochrome** | Watermarks, overlays em screenshots | *a gerar — versão branca sem glow* |

### Elementos do Logo

- ⚽ Bola de futebol pixel art integrada ao "O" de OLÉ
- 🌟 4 estrelas douradas acima do título (representam as 4 séries)
- 🏆 Frame metálico com rebites (aesthetic de card colecionável SNES)
- ✨ Glow verde neon `#39FF14` no contorno externo
- 📜 Banner dourado "FOOTBALL MANAGER" na base

### Clear Space

Mínimo: 1× a altura do frame metálico em todos os lados.

### Minimum Size

- **Digital:** 120px de largura
- **Favicon:** 32×32px (usar variant Icon)

### Proibições de Uso

- ❌ Rotacionar, inclinar ou distorcer
- ❌ Mudar as cores fora da paleta aprovada
- ❌ Adicionar sombras CSS, blur ou gradientes
- ❌ Colocar sobre backgrounds com muito ruído visual
- ❌ Usar o logo sem o frame metálico (exceto variant Icon)
- ❌ Remover as estrelas ou o banner

---

## 5. Voz & Tom

### Personalidade da Marca

| Trait | Somos | Não somos |
|-------|-------|-----------|
| **Nostálgico** | Reverência genuína pela era 16-bit; referências que quem viveu reconhece | Saudosismo forçado ou referências cringe de "lembra disso?" |
| **Autoritativo** | Sabemos de futebol — dados reais, xG, táticas granulares | Academicismo frio; jargão sem contexto |
| **Vibrante** | Energético como narrador de gol latino; cada vitória é épica | Gritaria sem substância; hype vazio |
| **Irreverente** | Humor sutil, trocadilhos com futebol, easter eggs | Humor ofensivo, piadas internas exclusivistas |
| **Craftsman** | Cada pixel é intencional; orgulho artesanal no detalhe | Perfeccionismo paralisante; preciosismo sem entrega |

### Voice Spectrum

```
Formal ←—————●———————————→ Casual
              ↑
         "Narrador esportivo que leu um livro de táticas"

Simple ←———————————●—————→ Complex
                    ↑
           "Explica xG sem precisar de PhD"

Serious ←——————●—————————→ Playful
                ↑
        "Leva o jogo a sério, mas não a si mesmo"

Reserved ←—————————————●—→ Expressive
                        ↑
              "GOL! GOL! GOLAÇO!"
```

### Tom por Contexto

| Contexto | Tom | Exemplo |
|----------|-----|---------|
| **Vitória** | Eufórico, celebratório | "🏆 CAMPEÃO! Seus 38 jogos de glória ficam eternizados na crônica." |
| **Derrota** | Resiliente, motivador | "Cabeça erguida, mister. O campeonato não se perde numa rodada." |
| **Tutorial** | Amigável, guiado | "Aqui é seu escritório. De onde saem os ônibus e os xG." |
| **Erro/Bug** | Honesto, leve | "Algo saiu errado — como zagueiro com a bola no pé. Tente de novo." |
| **Transferência** | Suspenseful, editorial | "O olheiro trouxe um nome. Velocidade 87. Preço salgado." |
| **Rivalidade** | Intenso, narrativo | "Eles não esqueceram a goleada da ida. Prepara o elenco." |

### Termos Proibidos

| Termo | Motivo |
|-------|--------|
| "dashboard" | Corporativo demais → use "escritório", "QG", "painel" |
| "user" | Impessoal → use "mister", "treinador", "você" |
| "feature" | Dev-speak → use "novidade", "desbloqueio" |
| "beautiful/stunning" | Adjetivos genéricos de AI → use linguagem sensorial específica |
| "click here" | Passivo → use verbos de ação: "escale", "negocie", "avance" |
| "loading..." | Quebra imersão → use "preparando o gramado...", "esquentando motores..." |

---

## 6. Imagery & Art Direction

### Estilo Visual: "Luxury Arcade 16-Bit"

A identidade visual do Olé FUT segue o conceito **Luxury Arcade** — a junção da nostalgia tátil dos arcades SNES com o esmero de pixel art premium contemporâneo.

### Princípios de Imagem

| Princípio | Regra |
|-----------|-------|
| **Hard Edges** | Zero blur, zero soft shadows. Bordas pixeladas nítidas sempre. |
| **Bevel & Emboss** | Todo painel simula profundidade com chanfro claro/escuro (highlight top-left, shadow bottom-right). |
| **Dithering over Gradients** | Transições de cor feitas via padrão de dither, nunca CSS gradients. |
| **CRT Atmosphere** | Fundos escuros com scanline sutil. Glow de fósforo verde nos elementos de destaque. |
| **Collectible Card Frame** | Shields, troféus e ícones emoldurados com metallic bevel + rivets dourados. |

### Categorias de Assets

| Categoria | Quantidade | Estilo | Resolução |
|-----------|-----------|--------|-----------|
| **Shields** | 184 PNGs | Card colecionável com bevel metálico, gold trim, neon glow | 1024×1024 source, renderizado em 48-64px |
| **Environments** | 16 cenários | Pixel art atmosférico, escuro, scanline overlay | 1024×1024 source |
| **Trophies** | 9 variantes | Hierarquia metálica (ouro→prata→bronze→ferro), card frame | 1024×1024 source |
| **Weather** | 4 overlays | Tileable, fundo preto pra blend em mix-blend-mode | 1024×1024 source |
| **Logo** | 1 + variantes | Frame metálico premium, glow verde, estrelas douradas | 1024×1024 source |

### Hierarquia Visual dos Troféus

```
  🏆 CONTINENTAL    → Platinum + Diamond Crystal + Blue Glow
  🏆 SÉRIE A        → Gold + Marble Base + Green Glow  
  🏆 COPA           → Gold + Neon Green Glow + Ornate Lid
  🏆 SUPERCOPA      → Gold Shield + Ruby Gem + Red/Gold
  🥈 SÉRIE B        → Silver + Wood Base + Blue Tint
  🥉 SÉRIE C        → Bronze + Dark Wood + Warm Tones
  ⚙️ SÉRIE D        → Iron/Grey + Plain Wood + Minimal
  👟 ARTILHEIRO     → Golden Boot + Marble + Neon Glow
  ⭐ TREINADOR      → Crystal Star + Gold Clipboard
```

---

## 7. UI Components — Regras de Estilo

### Painéis e Cards

```
┌──────────────────────────────┐  ← highlight: +1 shade lighter
│  ▪ TÍTULO EM PRESS START 2P  │  ← fundo: #0E1F14 ou #1B4332
│                              │
│  Conteúdo em Pixelify Sans   │
│  Dados em IBM Plex Mono      │
│                              │
└──────────────────────────────┘  ← shadow: +1 shade darker
   ↑ border: 2px solid #2D6A4F
```

- **Sem border-radius** — sempre cantos retos
- **Sem box-shadow CSS** — profundidade via border-color (light top/left, dark bottom/right)
- **Background sólido** — nunca transparente

### Botões

| Estado | Background | Border | Texto |
|--------|-----------|--------|-------|
| Default | `#1B4332` | 2px `#2D6A4F` | `#F1FAEE` |
| Hover | `#2D6A4F` | 2px `#39FF14` | `#39FF14` |
| Active/Pressed | `#0E1F14` | 2px inset | `#FFD700` |
| Disabled | `#111417` | 2px `#333` | `#555` |
| Danger | `#8B0000` | 2px `#FF3333` | `#FF3333` |

### Notificações/Toasts

| Tipo | Border Color | Accent | Ícone |
|------|-------------|--------|-------|
| Sucesso | `#39FF14` | Neon Green | ✅ |
| Warning | `#FBBF24` | Amber | ⚠️ |
| Erro | `#FF3333` | Red | ❌ |
| Info | `#4A90E2` | Blue | ℹ️ |

---

## 8. Consistência — Checklist

### Antes de todo commit visual:

- [ ] Zero `border-radius` — cantos 100% retos
- [ ] Zero `rgba()` / `opacity` — use cores sólidas
- [ ] Zero gradientes CSS
- [ ] Zero blur/backdrop-filter
- [ ] Fontes: apenas Press Start 2P, Pixelify Sans, IBM Plex Mono
- [ ] Cores: apenas da paleta aprovada neste documento
- [ ] Texto visível ao player: "Olé FUT" (nunca "Elifoot")
- [ ] localStorage keys: mantêm prefixo `elifoot_` (compatibilidade)
- [ ] Novos assets: seguem o estilo "Luxury Arcade" (card frame, bevel, dark BG)
- [ ] Build limpo (`npx vite build` sem erros)

---

## 9. Asset Naming Convention

### Estrutura de Diretórios

```
src/assets/
├── shields/high_end/    → {club_name_snake_case}.png
├── environments/        → bg_{view_name}.png  
├── trophies/            → {trophy_name}.png
├── weather/             → {weather_type}.png
├── olefut_logo.png      → Logo principal
└── {category}/index.js  → Registry/export map
```

### Regras de Naming

1. **snake_case** para todos os nomes de arquivo
2. Prefixo `bg_` para backgrounds
3. Prefixo `shield_` apenas no cache de geração, removido no projeto final
4. Acentos removidos do filename (ex: `sao_paulo.png`, não `são_paulo.png`)
5. Todo asset novo DEVE ser registrado no `index.js` correspondente

---

## 10. Aplicação da Marca por Audiência

| Audiência | Dor | Mensagem Chave | CTA |
|-----------|-----|---------------|-----|
| **Gamer nostálgico (25-40)** | "Football managers modernos são planilhas sem alma" | "Gerenciar um time deveria parecer uma aventura, não um relatório fiscal" | "Monte seu elenco" |
| **Fan de pixel art** | "Quero um jogo bonito que respeite a estética 16-bit" | "229 assets feitos a pixel — cada escudo é uma carta colecionável" | "Explore os escudos" |
| **Hardcore de FM** | "Quero profundidade tática real, não casual game" | "xG, 18 posições granulares, motor MARL que aprende" | "Desafie a engine" |
| **Dev/Maker** | "Quero ver como isso funciona por baixo" | "Engine open-source, React + Vite, 100% browser-native" | "Veja o código" |

---

*Documento gerado em maio/2026. Versão 1.0.*
*Fonte de verdade para qualquer decisão visual ou textual no projeto Olé FUT.*
