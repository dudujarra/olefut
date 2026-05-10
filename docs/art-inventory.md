# Olé FUT — Inventário Completo de Arte + Bíblia de Produção
## Análise 100% de Material Visual Necessário

---

## 1. INVENTÁRIO ATUAL (233 assets)

| Categoria | Qtd | Status |
|-----------|-----|--------|
| 🛡️ Shields (escudos) | 184 PNG + 187 no index | ⚠️ 3 missing files, inconsistência de composição, **possível futebol americano em alguns** |
| 🌍 Environments (backgrounds) | 16 | ✅ FASE 1 DONE — 3 views relinkadas, 3 novos BGs pendentes |
| 🏆 Trophies (troféus) | 9 (trophies/) unificados | ✅ FASE 1 DONE — root limpo, imports apontam p/ trophies/ |
| 🌧️ Weather (clima) | 4 | ✅ Completos |
| 🎨 Logos | 3 (logo, icon, monochrome) | ⚠️ Icon/mono gerados 8-bit, precisam regerar |
| 📦 Legacy | 0 | ✅ FASE 1 DONE — hero.png, react.svg, backgrounds/ deletados |

---

## 2. GAP ANALYSIS — O Que Falta

### 2A. Backgrounds Faltantes (5 views sem BG)

| View | Background Atual | BG Ideal |
|------|-----------------|----------|
| `TutorialView` | ❌ Nenhum | Sala de aula/lousa de futebol — quadro tático com giz |
| `TrophyCeremony` | ❌ Nenhum | Estádio lotado à noite com confetes e fogos, field view |
| `PreMatchScreen` | ❌ Nenhum | Vestiário com bancos, cabides de uniformes, quadro branco |
| `FormationBoard` | ❌ Nenhum | Usa bg_tactics_pitch do SquadView (OK — componente filho) |
| `Sidebar` | ❌ Nenhum | N/A — componente de navegação, sem BG full |
| `ChallengesWidget` | ❌ Nenhum | N/A — componente widget, sem BG full |

**→ 3 novos backgrounds necessários:** Tutorial, TrophyCeremony, PreMatch

### 2B. Backgrounds com Reuso Excessivo

6 views usam `bg_manager_office`:

| View | BG Ideal Diferenciado |
|------|----------------------|
| `DashboardView` | ✅ Manter — é o escritório do manager |
| `StandingsView` | 🔄 `bg_league_table` (já existe, não está linkado!) |
| `MarketView` | 🔄 `bg_transfer_market` (já existe, não está linkado!) |
| `CosmeticShopView` | 🔄 `bg_cosmetic_shop` (já existe, não está linkado!) |
| `MonitorView` | 🔄 `bg_autoplay_lab` ou manter office (monitor = debug) |
| `SaveSlotsView` | ✅ Manter — manager gerenciando saves no escritório |

**→ 3 views que já TÊM bg gerado mas não estão usando!**

### 2C. Categorias de Arte que NÃO EXISTEM

| Categoria | Quantidade Necessária | Prioridade |
|-----------|----------------------|------------|
| 👤 **Avatares de jogadores** | ~20 templates procedurais | 🟡 Média |
| 👔 **Avatar de manager** | 1 (player avatar) | 🟡 Média |
| ⚽ **Campos/Pitches** | 4 variações (bom/ruim/molhado/neve) | 🟢 Baixa |
| 🎭 **Ícones de UI** | ~15 (moeda, estrela, troféu-mini, bola, etc) | 🟡 Média |
| 📰 **Capas de jornal** | 3-5 templates | 🟢 Baixa |
| 🏟️ **Estádios variados** | 4-6 (pequeno → colossal) | 🟢 Baixa |
| 👕 **Uniformes de time** | 0 — não usado no jogo atual | ⚪ N/A |

### 2D. Troféus — Duplicatas e Gaps

Existem 2 sets separados:

**Set A — `src/assets/trophies/` (9 arquivos, com index.js):**
serie_a, serie_b, serie_c, serie_d, cup, supercopa, continental, golden_boot, best_manager

**Set B — `src/assets/` root (9 arquivos, importados no TrophyCeremony):**
trophy_world_cup, trophy_continental_cup, trophy_serie_a, trophy_gold_cup, 
trophy_silver_cup, trophy_league_shield, trophy_top_scorer, trophy_top_assist, trophy_manager_year

**Problemas:**
- Nome diferente entre sets (Set A: `cup` → Set B: `trophy_gold_cup`)
- TrophyCeremony importa do root, não do `trophies/`
- Falta troféu no Set A: world_cup, silver_cup, league_shield
- Falta troféu no Set B que existe no A: serie_b, serie_c, serie_d, supercopa

**→ Unificar em um set canônico de ~12 troféus**

### 2E. Shields — Gaps Residuais

- 187 entries no index.js, mas só 184 arquivos .png → **3 shields missing files**
- Composição visual inconsistente (diagnosticado na Art Direction Bible)

### 2F. 🏈 AUDIT CRÍTICO: Futebol Americano nos Assets

> ⚠️ **PROBLEMA:** Ao usar a palavra "football" nos prompts de geração, modelos de imagem 
> podem ter interpretado como **American Football** — gerando bolas ovais, capacetes, 
> field goals, yard lines em vez de futebol (soccer).

**Ação necessária:** Audit visual de TODOS os 184 shields + 9 troféus + 16 environments 
procurando por:
- ❌ Bola oval (American football) em vez de bola redonda
- ❌ Capacetes de futebol americano
- ❌ Traves de field goal em vez de gol de futebol
- ❌ Yard lines / campo listrado estilo NFL
- ❌ Jogadores com shoulder pads

**Mitigação nos prompts:** Em TODOS os templates canônicos, alterar:
- `"football"` → `"soccer football"`
- Adicionar: `"round soccer ball, NOT American football, NOT oval ball, NOT helmet"`

**Assets confirmados com futebol americano:** (a auditar)
- [ ] Precisa audit visual batch de todos os 184 shields
- [ ] Troféus do set `trophies/`: verificar

---

## 3. PLANO DE AÇÃO — LISTA COMPLETA DE ARTE

### Fase 1: Quick Fixes (sem regenerar, só linkar) — ✅ COMPLETA
- [x] Linkar `StandingsView` → `bg_league_table.png`
- [x] Linkar `MarketView` → `bg_transfer_market.png`
- [x] Linkar `CosmeticShopView` → `bg_cosmetic_shop.png`
- [x] Unificar troféus: root → `trophies/`, TrophyCeremony atualizado
- [x] Deletar 12 assets legacy (9 root trophies + hero.png + react.svg + backgrounds/)
- [x] Build verificado ✅

### Fase 2: Novos Assets (gerar)
- [ ] `bg_tutorial.png` — Sala de aula com lousa tática
- [ ] `bg_trophy_ceremony.png` — Estádio lotado, confetes, noite
- [ ] `bg_locker_room.png` — Vestiário pré-jogo
- [ ] `olefut_icon.png` v2 — Regerar no estilo 16-bit correto (não 8-bit)
- [ ] `olefut_monochrome.png` v2 — Regerar no estilo 16-bit correto

### Fase 3: Padronização de Shields (batch)
- [ ] Identificar os shields mais inconsistentes (top 20)
- [ ] Regerar com template canônico da Art Direction Bible
- [ ] QA checklist por shield

### Fase 4: Padronização de Troféus (batch)
- [ ] Regerar 12 troféus com template canônico
- [ ] Consolidar em set único em `trophies/`

### Fase 5: Nova Categoria — Avatares
- [ ] Criar 10-20 avatar templates procedurais
- [ ] Implementar sistema de composição (pele × cabelo × posição)

### Fase 6: Nova Categoria — Campos
- [ ] 4 pitch variations (normal, deteriorado, molhado, neve)
- [ ] Top-down 15° como ISS Deluxe

### Fase 7: Nova Categoria — Ícones de UI
- [ ] 15 ícones pixel art (moeda, estrela, troféu-mini, bola, cartão amarelo/vermelho, etc)
- [ ] Tamanho padrão 32×32 ou 48×48

---

## 4. PROMPTS CANÔNICOS — Regras por Categoria

### 4.1 🛡️ SHIELDS — Template de Prompt

```
OBRIGATÓRIO em todo prompt de shield:

"16-bit SNES pixel art club shield for {CLUBE} in a premium arcade 
collectible card style. Brushed steel rectangular frame with 4 gold 
corner rivets. Inside: {ELEMENTO ICÔNICO DO CLUBE} in {CORES DO CLUBE} 
pixel art on a dark {COR DOMINANTE} background with subtle CRT grid 
lines. Club name "{NOME}" in bold pixel font at top. "FOOTBALL CLUB" 
text below emblem. "ARCADE TEAM" on bottom metallic banner plate. 
{COR PRIMÁRIA DO CLUBE} neon glow around frame edges with dithered 
falloff. Dark CRT scanline background (#111417). Premium 16-bit SNES 
quality like International Superstar Soccer Deluxe. Rich 4-shade 
pixel rendering on all metals. NOT 8-bit, NOT chibi, NOT flat."
```

**Checklist de Validação:**
- [ ] Frame retangular brushed metal?
- [ ] 4 rivets dourados nos cantos?
- [ ] Background externo CRT dark?
- [ ] "FOOTBALL CLUB" presente?
- [ ] "ARCADE TEAM" no banner inferior?
- [ ] Glow na cor do clube?
- [ ] Sem data de fundação?
- [ ] Sem checkered/pattern/brick backgrounds?

### 4.2 🏆 TROFÉUS — Template de Prompt

```
OBRIGATÓRIO em todo prompt de troféu:

"16-bit SNES pixel art trophy for {NOME DO PRÊMIO} in a premium 
arcade collectible card style. Ornate gold decorative frame with 
small soccer ball ornaments in each corner. Inside: {DESCRIÇÃO DO 
TROFÉU} in {METAL: gold/silver/bronze/platinum} with specular 
highlights and 4-shade pixel metal rendering. Dark marble pedestal 
base with gold nameplate reading "{NOME}". Green neon glow (#39FF14) 
emanating from the base. Background: packed stadium at night with 
dithered pixel crowd, visible field and floodlights. Premium 16-bit 
SNES quality like International Superstar Soccer Deluxe. NOT 8-bit, 
NOT flat, NOT empty black background."
```

**Checklist de Validação:**
- [ ] Frame ornate gold com bolas nos cantos?
- [ ] Background tem cena de estádio (não vazio preto)?
- [ ] Base mármore escuro?
- [ ] Placa dourada com nome?
- [ ] Green glow na base?
- [ ] Metal do troféu corresponde ao tier?

### 4.3 🌍 ENVIRONMENTS — Template de Prompt

```
OBRIGATÓRIO em todo prompt de background:

"16-bit SNES pixel art environment scene for a football manager game.
{DESCRIÇÃO NARRATIVA DETALHADA DA CENA — objetos, mobília, atmosfera}.
Dark atmospheric lighting with {FONTE DE LUZ PRINCIPAL} as the main 
light source. Rich pixel detail with dithered shadows and depth. 
Green/teal color undertone throughout. Moody, cinematic composition. 
Dense with narrative objects that tell the story of {CONTEXTO DA VIEW}.
Dark background (#111417 dominant, 70%+ of image below #333). 
Premium 16-bit quality like Chrono Trigger/Secret of Mana backgrounds.
Square 1:1 aspect ratio. NOT cartoony, NOT bright, NOT empty, NOT 
photorealistic."
```

**Checklist de Validação:**
- [ ] 70%+ da imagem é escuro (< #333)?
- [ ] Fonte de luz principal definida?
- [ ] Undertone verde/teal presente?
- [ ] Objetos narrativos contam a história?
- [ ] Sem personagens em primeiro plano?
- [ ] Sem texto UI ou logos?

### 4.4 👤 AVATARES — Template de Prompt (NOVO)

```
OBRIGATÓRIO em todo prompt de avatar:

"16-bit SNES pixel art football player portrait in International 
Superstar Soccer Deluxe style. Bust shot from chest up, slight 3/4 
angle. {TIPO FÍSICO} build player with {COR DE PELE} skin (4-shade 
rendering: highlight, mid, shadow, ambient). {ESTILO DE CABELO} hair. 
Wearing {COR} jersey with visible collar detail. Determined neutral 
expression — NOT smiling, NOT angry. Brushed steel rectangular portrait
frame with 4 gold corner rivets (same as shield frames). Background: 
{COR DO CLUBE} color dithered to black (NO external glow — 
differentiates from shields). ISS Deluxe body proportions — realistic, 
NOT chibi, NOT SD. Premium 16-bit SNES quality."
```

**Checklist de Validação:**
- [ ] Bust shot 3/4?
- [ ] Proporção ISS Deluxe (não chibi)?
- [ ] Pele com 4 shades?
- [ ] Frame brushed metal (mesmo dos shields)?
- [ ] Background dither cor→preto?
- [ ] Sem glow externo?
- [ ] Expressão neutra-determinada?

### 4.5 ⚽ CAMPOS — Template de Prompt (NOVO)

```
OBRIGATÓRIO em todo prompt de campo:

"16-bit SNES pixel art football pitch seen from slightly elevated 
top-down angle (~15 degrees), like International Superstar Soccer 
Deluxe gameplay view. {CONDIÇÃO}: {DESCRIÇÃO DA CONDIÇÃO}. 
Three alternating stripes of grass in shades of green (dark #2D6A4F, 
mid #52B788, light #6FCF97). White field markings (center circle, 
penalty areas, goal areas) in #F1FAEE, 2px thick lines. Stadium 
floodlights creating bright hotspots on the grass. Thin strip of 
dithered pixel crowd on all four sides (1/8 of image height). 
Square 1:1 format. Premium 16-bit SNES quality. NOT broadcast camera
angle, NOT photorealistic, NOT 8-bit."
```

**Condições disponíveis:**
- `PERFECT` — Verde vibrante, linhas nítidas, sol forte
- `WORN` — Manchas marrons centro+áreas, grama irregular 
- `RAINY` — Tons azulados, reflexos de poça, linhas desbotadas
- `SNOWY` — Cobertura branca 60%, linhas quase invisíveis

### 4.6 🎭 ÍCONES DE UI — Template de Prompt (NOVO)

```
OBRIGATÓRIO em todo prompt de ícone:

"16-bit SNES pixel art game icon of {OBJETO}. Clean, bold silhouette 
on transparent/dark background. {CORES RELEVANTES}. 2px black outline.
Recognizable at 32x32px scale but rendered at higher resolution for 
detail. Consistent with International Superstar Soccer Deluxe HUD 
style. NOT 8-bit, NOT flat color, includes 3-shade rendering."
```

**Ícones necessários (15):**
1. `coin.png` — Moeda dourada girada
2. `star.png` — Estrela dourada de rating
3. `trophy_mini.png` — Troféu mini para listas
4. `ball.png` — Bola de futebol
5. `card_yellow.png` — Cartão amarelo
6. `card_red.png` — Cartão vermelho
7. `whistle.png` — Apito de árbitro
8. `boot.png` — Chuteira
9. `shield_mini.png` — Escudo genérico mini
10. `arrow_up.png` — Seta verde para melhoria
11. `arrow_down.png` — Seta vermelha para queda
12. `heart.png` — Coração de moral/saúde
13. `clock.png` — Relógio para tempo
14. `flag.png` — Bandeirinha de escanteio
15. `megaphone.png` — Megafone para anúncios

### 4.7 🎨 LOGOS — Template de Prompt

```
VERSÃO PRINCIPAL (já aprovada — manter como está):
olefut_logo.png ✅

ÍCONE/FAVICON (regerar — saiu 8-bit):
"16-bit SNES pixel art favicon icon for Olé FUT football manager game.
A golden pixel soccer ball with detailed hexagonal panels and specular 
highlights, surrounded by a subtle green (#39FF14) neon glow aura with 
dithered falloff. Pure dark background (#111417). Must be recognizable 
at 32x32px but rendered with 16-bit SNES detail and richness — 
4-shade gold rendering, NOT flat, NOT 8-bit blocky. Premium quality 
matching the ISS Deluxe aesthetic."

MONOCROMO (regerar — saiu 8-bit):
"16-bit SNES pixel art monochrome wordmark for 'OLÉ FUT' football 
manager game. Text in white/light (#F1FAEE) pixel font with subtle 
bevel/shadow effect on each letter. Small detailed pixel soccer ball 
integrated as the accent on the É. Dark background. Suitable for 
watermarks and overlays. 16-bit quality with detailed letterforms — 
NOT 8-bit blocky, NOT flat. Same visual richness as game shields."
```

---

## 5. RESUMO EXECUTIVO

| O Que | Quantidade | Ação |
|-------|-----------|------|
| Quick fixes (linkar BGs existentes) | 3 views | Fase 1 — código only |
| Unificar troféus | 12 → 1 set | Fase 1 — reorganizar |
| Limpar legacy | 5 arquivos | Fase 1 — deletar |
| Novos backgrounds | 3 | Fase 2 — gerar |
| Regerar logos | 2 (icon + mono) | Fase 2 — gerar |
| Padronizar shields | ~20 piores | Fase 3 — batch regerar |
| Padronizar troféus | 12 | Fase 4 — batch regerar |
| Nova categoria: avatares | 10-20 | Fase 5 — gerar |
| Nova categoria: campos | 4 | Fase 6 — gerar |
| Nova categoria: ícones UI | 15 | Fase 7 — gerar |

**Total de trabalho de geração restante: ~70 assets**
**Total após conclusão: ~240 assets padronizados**
