# Olé FUT — Art Direction Bible v1.0
## Guia de Produção Visual para Consistência Determinística

> **Propósito:** Este documento não é sobre "o que é bonito" — é sobre **o que é reproduzível**. Todo asset novo deve sair idêntico em estrutura a qualquer asset existente da mesma categoria.

---

## 0. Diagnóstico: O Que Está Inconsistente Hoje

### 🛡️ Shields — Audit Visual

| Clube | Frame | BG | Banner | Glow | Problema |
|-------|-------|----|--------|------|----------|
| **Flamengo** | Chrome industrial com 4 rivets | CRT scanlines escuro | "ARCADE TEAM" | Vermelho neon | ✅ Referência ideal |
| **Palmeiras** | Card verde com borda arredondada | Checkered verde/branco | "RETRO ARCADE" + "EST. 1914" | Verde neon | ⚠️ Fundo checkerboard foge do padrão dark |
| **Corinthians** | Shield orgânico sem frame externo | Noise escuro sem frame | "FOOTBALL CLUB" + "EST. 1988" | Branco glow | ⚠️ Sem frame metálico, glow branco |
| **Barcelona** | Medalha circular | CRT grid azul | "RETRO ARCADE" + "EST. 1993" + "ARCADE FC" | Dourado warm | ⚠️ Formato circular, 3 banners |
| **Real Madrid** | Shield pontiagudo com coroa | Brick wall texture | "ARCADE FOOTBALL" | Dourado warm | ⚠️ BG de parede, texto bottom diferente |

**Diagnóstico Shields:** Cada escudo tem formato, frame, quantidade de banners e background diferentes. O estilo de DESENHO é consistente (16-bit SNES premium), mas a COMPOSIÇÃO (moldura + textos + fundo) varia em tudo.

### 🏆 Troféus — Audit Visual

| Troféu | Frame Externo | Background | Base | Label Style |
|--------|--------------|------------|------|-------------|
| **Serie A** | Rope/diagonal gold frame | Stadium + torcida | Mármore preto | Placa dourada |
| **Copa** | Silver metallic angular | Catedral gothic dark | Pedestal preto | Placa gold |
| **Continental** | Diamond-studded border | Vazio preto puro | Green glow pedestal | Neon green text |
| **Golden Boot** | Ornate gold corner pieces | Stadium + torcida | Mármore + steps | Placa gold |
| **Supercopa** | Red/gold card border | Vazio preto | Pedestal gold | Ribbon banner |
| **Best Manager** | Green corner pattern | Pattern de bolas/apitos | Mármore | Placa gold |

**Diagnóstico Troféus:** Background alterna entre cena de estádio e vazio. Frames são todos diferentes. Mais consistente que shields, mas ainda sem template fixo.

### 🌍 Environments — Audit Visual

Estes são os mais consistentes — todos dark, atmosféricos, densos. Variações naturais são aceitáveis aqui porque cada cenário é narrativamente diferente. **Aprovados como estão.**

---

## 1. Estilo Base: "ISS Deluxe Premium" — DNA Visual

Derivado da análise dos melhores assets aprovados, o DNA visual do Olé FUT é:

### O Que É (e o que NÃO é)

| ✅ ISTO | ❌ NÃO ISTO |
|---------|-------------|
| 16-bit SNES (256 cores por sprite, dithering manual) | 8-bit NES (paleta de 4 cores, sprites simples) |
| ISS Deluxe / Chrono Trigger / Secret of Mana | Mega Man / Duck Hunt / Pac-Man |
| Anti-aliasing de subpixel com dithering | Blocos pixelados crus sem refinamento |
| Iluminação pintada com 3-4 shades por material | Flat colors sem volume |
| Proporções realistas estilizadas (cabeça ~1/5 do corpo) | Chibi / SD / cabeçudos |
| Metal com reflexo specular (highlight → mid → shadow → ambient) | Metal flat de uma cor só |
| Atmosfera cinematográfica (depth of field via dither) | Fundo chapado ou grid |

### Os 5 Materiais Recorrentes

Todo asset Olé FUT é construído com estes materiais, renderizados em pixel art:

```
1. METAL BRUSHED    → Frame dos escudos, rivets, painéis
   Palette: #8B8B8B → #C0C0C0 → #E8E8E8 → #FFFFFF (highlight)
   Shadow:  #4A4A4A → #2D2D2D

2. GOLD POLISHED    → Títulos, estrelas, banners, ornamentos
   Palette: #8B6914 → #DAA520 → #FFD700 → #FFEC8B (highlight)
   Shadow:  #654321 → #3D2B1F

3. DARK MARBLE      → Bases de troféus, pedestais
   Palette: #1A1A2E → #2D2D3F → #16213E com veins #0A0A15
   
4. AGED WOOD        → Mesas, bases menores, molduras
   Palette: #3D2B1F → #6B4226 → #8B5A2B → #A0522D
   
5. CRT PHOSPHOR     → Glows, auras, efeitos de luz
   Green:   #39FF14 a 100% → dither falloff em 3 steps
   Gold:    #FFD700 dither falloff
   Red:     #FF3333 dither falloff (apenas perigo/rivalidade)
```

---

## 2. Template: SHIELDS (Escudos de Clubes)

### Padrão Canônico (baseado no Flamengo como melhor referência)

```
┌─────────────────────────────┐
│  BRUSHED METAL FRAME        │ ← Metal #C0C0C0, 4 rivets nos cantos
│  ┌───────────────────────┐  │    Inner border: cor principal do clube
│  │   NOME DO CLUBE       │  │ ← Press Start 2P style, cor do clube
│  │   (pixel font bold)   │  │
│  │                       │  │
│  │    ⚽ EMBLEMA          │  │ ← Símbolo icônico do clube (animal/escudo)
│  │    (pixel art central) │  │    Estilizado mas reconhecível
│  │                       │  │
│  │   FOOTBALL CLUB       │  │ ← Subtítulo padrão, SEMPRE "FOOTBALL CLUB"
│  └───────────────────────┘  │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬   │
│   ARCADE TEAM               │ ← Banner inferior, SEMPRE "ARCADE TEAM"
└─────────────────────────────┘
     ↑ Glow externo na cor principal do clube (dithered)
     ↑ Background: CRT scanline noise escuro SEMPRE (#111417)
```

### Regras Fixas para TODOS os Shields

1. **Frame:** Brushed metal retangular (não circular, não shield-shape, não orgânico)
2. **Rivets:** 4, um em cada canto do frame — dourados (#DAA520)
3. **Background dentro do frame:** Cor primária do clube com textura de grid/scanline
4. **Texto top:** Nome do clube em pixel font bold
5. **Texto mid:** "FOOTBALL CLUB" — SEMPRE esse texto, nunca "FC", nunca "Est. XXXX"
6. **Texto bottom (banner):** "ARCADE TEAM" — SEMPRE, pra todos os clubes
7. **Glow externo:** Cor primária do clube, dithered, 8-12px de falloff
8. **Background externo:** CRT black #111417 com subtle scanline noise
9. **Nunca:** Datas de fundação, "RETRO ARCADE", checkered patterns, paredes de tijolo
10. **Aspect Ratio:** Sempre 1:1 (quadrado)

### Prompt Template Canônico (para geração)

```
16-bit SNES pixel art club shield for {CLUBE} in a premium arcade 
collectible card style. Brushed steel rectangular frame with 4 gold 
corner rivets. Inside: the {ELEMENTO ICÔNICO} of {CLUBE} in {CORES DO CLUBE} 
pixel art. Club name "{CLUBE}" in bold pixel font at top. 
"FOOTBALL CLUB" text below emblem. "ARCADE TEAM" on bottom metallic 
banner. {COR PRIMÁRIA} neon glow around frame edges. Dark CRT 
scanline background (#111417). Premium 16-bit SNES quality like 
International Superstar Soccer Deluxe. NOT 8-bit, NOT chibi, NOT flat.
```

---

## 3. Template: TROFÉUS (Prêmios e Conquistas)

### Padrão Canônico (baseado no Golden Boot/Serie A como melhores)

```
┌──────────────────────────────────┐
│  ORNATE GOLD FRAME               │ ← Gold #DAA520, cantos decorados
│  com small ball/medal em cada     │    com mini-bolas nos 4 cantos
│  canto                           │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │      🏆 TROFÉU             │  │ ← Objeto central, hierarquia de metal
│  │      (metal renderizado)   │  │    com specular highlight
│  │                            │  │
│  │   ═══════════════════      │  │ ← Pedestal/base de mármore escuro
│  │   ║  NOME DO PRÊMIO  ║    │  │ ← Placa dourada na base
│  │   ═══════════════════      │  │
│  └────────────────────────────┘  │
│   GOLDEN BOOT AWARD              │ ← Subtitle text no bottom do frame
│   SEASON {ANO}                   │
└──────────────────────────────────┘
     ↑ Background: estádio desfocado via dither (NUNCA vazio preto)
     ↑ Green neon glow (#39FF14) na base do troféu
```

### Regras Fixas para TODOS os Troféus

1. **Frame:** Ornate gold frame com decorações nos 4 cantos (bolas de futebol ou medalhas)
2. **Background DENTRO do frame:** Cena de estádio com torcida, dithered para depth — NUNCA fundo vazio preto
3. **Objeto central:** Troféu renderizado com 4-shade metal (highlight → mid → shadow → ambient)
4. **Base:** Sempre mármore escuro ou dark stone, NUNCA madeira
5. **Placa:** Sempre placa dourada na base com nome em pixel font
6. **Glow:** Green neon (#39FF14) emanando da base — TODOS os troféus
7. **Subtítulo:** Nome descritivo + "SEASON {ANO}" no rodapé do frame
8. **Hierarquia de metal:** O METAL do troféu em si determina o tier:

| Tier | Metal do Troféu | Glow Intensity |
|------|----------------|----------------|
| Continental | Platinum/silver com crystal accents | Máximo |
| Serie A | Gold polished | Alto |
| Copa | Gold com lid ornamentado | Alto |
| Supercopa | Gold shield-shape | Médio |
| Serie B | Silver | Médio |
| Serie C | Bronze | Baixo |
| Serie D | Iron/dark steel | Minimal |
| Artilheiro | Gold boot (especial) | Alto |
| Treinador | Crystal star (especial) | Alto |

---

## 4. Template: ENVIRONMENTS (Cenários de Fundo)

### Padrão Canônico (já consistente — formalização)

Os environments são a categoria mais consistente. Regras existentes:

1. **Paleta:** Dominância escura — 70% da imagem abaixo de #333333
2. **Iluminação:** Uma fonte de luz principal (lâmpada, monitor, janela, refletor) que define o mood
3. **Temperatura:** Variável conforme narrativa mas SEMPRE com undertone verde/teal
4. **Objetos narrativos:** Cada cena conta uma história (contratos na mesa = transfer market, monitores CRT = autoplay lab)
5. **Profundidade:** Foreground detalhado → midground → background dithered
6. **Aspect ratio:** 1:1 (quadrado) para uso como background-image com cover
7. **Nunca:** Personagens em primeiro plano, texto UI, logos

### Prompt Template Canônico

```
16-bit SNES pixel art environment scene for a football manager game. 
{DESCRIÇÃO NARRATIVA DA CENA}. Dark atmospheric lighting with a 
{FONTE DE LUZ} as the main light source. Rich pixel detail with 
dithered shadows. Green/teal color undertone. Moody, cinematic 
composition. Dense with narrative objects. Dark background (#111417 
dominant). Premium 16-bit quality like Chrono Trigger background art. 
NOT cartoony, NOT bright, NOT empty.
```

---

## 5. Template: AVATARES (Ainda Não Produzidos)

### Padrão Proposto

Avatares de jogadores e managers no estilo ISS Deluxe — proporções semi-realistas, não chibi.

```
┌───────────────────┐
│  PORTRAIT FRAME   │ ← Brushed metal frame (mesmo dos shields)
│  ┌─────────────┐  │
│  │             │  │
│  │  BUST SHOT  │  │ ← Peito pra cima, ligeiramente virado 3/4
│  │  do jogador │  │    Pele renderizada com 4 shades
│  │             │  │    Camisa na cor do clube
│  │             │  │
│  └─────────────┘  │
│  ═══════════════   │
│  NOME / POSIÇÃO   │ ← Placa na base do frame
└───────────────────┘
     ↑ Background: gradiente via dither, cor do clube → preto
     ↑ Sem glow externo (diferencia de shields)
```

### Regras para Avatares

1. **Proporção:** ISS Deluxe — cabeça ~1/5 do corpo, ombros definidos
2. **Pose:** Bust shot 3/4 (nunca frontal chapado, nunca perfil total)
3. **Pele:** 4 tons (highlight, mid, shadow, ambient) — tom de pele variado
4. **Cabelo:** Pixel art detalhado, vários estilos procedurais
5. **Camisa:** Na cor primária do clube, com collarinho visível
6. **Expressão:** Neutra-determinada (nunca sorrindo, nunca triste)
7. **Frame:** Mesmo brushed metal dos shields, sem glow externo
8. **Background:** Dither da cor do clube para preto — diferencia do shield
9. **Nunca:** Número na camisa, logos de patrocínio, barba/detalhes que sumam em 48px

### Prompt Template Canônico

```
16-bit SNES pixel art football player portrait for a manager game. 
Bust shot of a {TIPO FÍSICO} player with {COR DE PELE} skin tone, 
{ESTILO DE CABELO}, wearing a {COR} jersey with visible collar. 
3/4 angle, determined neutral expression. Brushed steel rectangular 
frame with rivets. Background: {COR DO CLUBE} dithered to black. 
ISS Deluxe proportions (NOT chibi, NOT 8-bit). Detailed 4-shade 
skin rendering. Premium 16-bit SNES quality.
```

---

## 6. Template: CAMPOS (Pitch Views)

### Padrão Proposto

Vista aérea do campo estilo ISS Deluxe para a tela de táticas.

```
┌──────────────────────────────────────┐
│         GRAMA SNES TEXTURIZADA       │
│    ┌──────────────────────────┐      │
│    │   Faixas de grama em 3   │      │
│    │   tons de verde alternado │      │
│    │                          │      │
│    │   ○ Marcações do campo   │      │ ← Linhas brancas #F1FAEE, 2px
│    │     em branco pixel      │      │
│    │                          │      │
│    │   Área, meio de campo,   │      │
│    │   grande área, penalti   │      │
│    └──────────────────────────┘      │
│  ARQUIBANCADA (dithered crowd)       │ ← Torcida pixelada em strip
└──────────────────────────────────────┘
```

### Regras para Campos

1. **Grama:** 3 faixas alternadas de verde (dark #2D6A4F → mid #52B788 → light #6FCF97)
2. **Linhas:** Brancas #F1FAEE, 2px de espessura
3. **Perspectiva:** Top-down com leve inclinação (~15°) como ISS Deluxe
4. **Borda:** Strip de torcida dithered nas laterais (1/8 da altura)
5. **Iluminação:** Refletores criando hotspots de luz na grama (faixas mais claras)
6. **Variações de condição:**
   - **Bom:** Verde vibrante, linhas nítidas
   - **Deteriorado:** Manchas marrons, grama irregular
   - **Encharcado:** Tons azulados, reflexos de poça
   - **Neve:** Cobertura branca parcial, linhas quase invisíveis
7. **Nunca:** Campo visto de lado (broadcast angle), grama photorealistic

---

## 7. Glossário de Prompt — Termos que Garantem Consistência

### SEMPRE usar estes termos nos prompts de geração:

| Termo | Efeito | Importância |
|-------|--------|-------------|
| `16-bit SNES` | Define a era visual correta (256 cores, dithering) | 🔴 Crítico |
| `International Superstar Soccer Deluxe` | Referência visual exata | 🔴 Crítico |
| `brushed steel rectangular frame` | Frame metálico consistente | 🔴 Shields/Avatares |
| `ornate gold frame` | Frame dourado para troféus | 🔴 Troféus |
| `4 gold corner rivets` | Rivets fixos nos cantos | 🟡 Shields |
| `dithered shadows` | Sombras via dither, não gradiente | 🔴 Tudo |
| `dark CRT scanline background (#111417)` | Fundo padronizado | 🔴 Tudo |
| `premium pixel art` | Evita output low-effort | 🟡 Tudo |
| `NOT 8-bit, NOT chibi, NOT flat` | Bloqueia regressão de estilo | 🔴 Crítico |

### NUNCA usar estes termos:

| Termo | Problema |
|-------|----------|
| `retro` sozinho | Muito vago — pode dar 8-bit |
| `pixel art` sozinho | Sem qualificação, gera Minecraft style |
| `vintage` | Gera sepia/brown tones, não SNES |
| `cartoon` | Destrói a seriedade do estilo |
| `cute` / `chibi` | Inverte as proporções |
| `minimalist` | Remove a densidade que define o estilo |
| `clean` | Remove o noise/scanline que dá atmosfera |

---

## 8. Checklist de Validação — QA por Categoria

### Shields ✓
- [ ] Frame é brushed metal retangular?
- [ ] Tem 4 rivets dourados nos cantos?
- [ ] Background externo é CRT dark #111417?
- [ ] Texto bottom diz "ARCADE TEAM"?
- [ ] Texto "FOOTBALL CLUB" presente?
- [ ] Glow é na cor primária do clube?
- [ ] Sem datas de fundação?
- [ ] Sem checkered/patterned backgrounds?

### Troféus ✓
- [ ] Frame é ornate gold com decorações nos cantos?
- [ ] Background tem cena de estádio (não vazio preto)?
- [ ] Base é mármore escuro (não madeira)?
- [ ] Tem placa dourada com nome?
- [ ] Green glow (#39FF14) na base?
- [ ] Metal do troféu corresponde ao tier?

### Environments ✓
- [ ] 70%+ da imagem é escuro (< #333)?
- [ ] Tem uma fonte de luz principal definida?
- [ ] Undertone verde/teal presente?
- [ ] Objetos narrativos contam a história da view?
- [ ] Sem personagens em primeiro plano?
- [ ] Sem texto UI ou logos?

### Avatares ✓
- [ ] Frame brushed metal (mesmo dos shields)?
- [ ] Pose bust shot 3/4?
- [ ] Proporção ISS Deluxe (não chibi)?
- [ ] Pele com 4 shades?
- [ ] Background dither cor→preto (sem glow externo)?
- [ ] Expressão neutra-determinada?

### Campos ✓
- [ ] 3 faixas de grama alternadas?
- [ ] Linhas brancas 2px?
- [ ] Perspectiva top-down ~15°?
- [ ] Strip de torcida nas bordas?

---

*Este documento é o source of truth para reprodutibilidade visual.*
*Qualquer asset que não passe no checklist da sua categoria deve ser regenerado.*
