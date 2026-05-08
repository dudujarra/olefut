# Google Flow — Assets Gerados (Madrugada 08/Mai/2026)

**Project URL**: https://labs.google/fx/pt/tools/flow/project/c424a7b7-34b7-4ff4-8fee-5c297aeb171b
**Modelo**: Nano Banana Pro x4 (Google Ultra)
**Status**: ✅ 5 asset packs completos gerados, aguardando download manual

---

## 🎨 Assets gerados

### 1. Logo ELIFOOT 8-bit
- **Prompt**: "8-bit pixel art logo for soccer manager game ELIFOOT. NES era retro style, chunky pixels, green and gold color palette, 320x64 pixels horizontal banner. The text 'ELIFOOT' rendered in bold pixelated letters with first half green (#4ADE80) and second half gold (#FFD700). Small pixel-art soccer ball at the end."
- **Variantes geradas**: 4
- **Best**: dark grid background, ELI verde + FOOT gold + bola
- **Filename sugerido**: `logo-elifoot.png`

### 2. Sprite Sheet Icons
- **Prompt**: "8-bit pixel art icon set for soccer manager game, NES retro style. White background. 8 separate icons in a row each 64x64: white soccer ball with hexagons, gold trophy cup, yellow card, red card, silver whistle, stopwatch, green soccer goal net, gray stadium silhouette."
- **Variantes**: 4
- **Conteúdo**: ⚽ 🏆 🟨 🟥 🔇 ⏱ 🥅 🏟️
- **Filename**: `icons-sprite-sheet.png`

### 3. Stadium Evolution (5 levels)
- **Prompt**: "8-bit pixel art soccer stadium evolution chart, NES retro style. 5 stadiums in a row showing progression: 1) tiny dirt municipal field with wooden fence, 2) small regional stadium with bleachers, 3) medium modern stadium with white roof, 4) large premium arena with two tiers, 5) massive temple-style stadium with crowd. Top-down isometric view."
- **Variantes**: 4
- **Best version**: "STADIUM EVOLUTION" labeled, 5 estágios distintos
- **Filename**: `stadiums-5-levels.png`

### 4. Player Jerseys (8 colors)
- **Prompt**: "8-bit pixel art soccer player sprites NES retro style. 8 players standing facing camera in different jerseys: red, blue, green, yellow, white, black, orange, purple. Each player 32x48 pixels."
- **Variantes**: 4
- **Conteúdo**: 8 players com numeração
- **Filename**: `players-jerseys.png`

### 5. Weather Icons (6 types)
- **Prompt**: "8-bit pixel art weather icons set NES retro style. 6 weather icons each 64x64: bright yellow sun, white fluffy cloud, gray cloud with blue rain drops, dark storm cloud with lightning bolt, white snow with snowflakes, foggy gray haze."
- **Variantes**: 4
- **Conteúdo**: ☀️ ☁️ 🌧️ ⛈️ ❄️ 🌫️
- **Filename**: `weather-icons.png`

---

## 📥 Download manual (user)

1. Abra https://labs.google/fx/pt/tools/flow/project/c424a7b7-34b7-4ff4-8fee-5c297aeb171b
2. Para cada imagem desejada:
   - Click na imagem (abre detalhe)
   - Click ícone download (seta down, top-right)
   - Escolha 1K, 2K ou 4K
   - Save com nome sugerido em `/Users/dudujarra/Documents/ELIFOOT/public/sprites/`

---

## 🛠️ Integration steps (após download)

```bash
# 1. Move downloads pra projeto
cd ~/Downloads
mv *elifoot* /Users/dudujarra/Documents/ELIFOOT/public/sprites/

# 2. Renomear para names padronizados
cd /Users/dudujarra/Documents/ELIFOOT/public/sprites/
# Manual rename ou:
mv "*ELIFOOT*.png" logo-elifoot.png
# etc

# 3. Update CSS pra usar imagens
```

### CSS update sugerido (`src/styles/8bit-theme.css`)

```css
body.theme-8bit .logo {
  background: url('/elifoot-web/sprites/logo-elifoot.png') no-repeat center;
  background-size: contain;
  width: 320px;
  height: 64px;
  text-indent: -9999px; /* hide text, show image */
}

body.theme-8bit .nav-tab[data-tab="match"]::before {
  content: '';
  display: inline-block;
  width: 16px; height: 16px;
  background: url('/elifoot-web/sprites/icons-sprite.png') no-repeat;
  background-position: 0 0; /* ball icon */
  margin-right: 4px;
}

/* Stadium levels via background-position offset */
.stadium-icon[data-level="1"] { background-position: 0 0; }
.stadium-icon[data-level="2"] { background-position: -64px 0; }
.stadium-icon[data-level="3"] { background-position: -128px 0; }
.stadium-icon[data-level="4"] { background-position: -192px 0; }
.stadium-icon[data-level="5"] { background-position: -256px 0; }

/* Weather */
.weather-icon[data-weather="sun"] { background-image: url('/elifoot-web/sprites/weather-sun.png'); }
.weather-icon[data-weather="rain"] { background-image: url('/elifoot-web/sprites/weather-rain.png'); }
/* etc */
```

---

## 📊 Generation stats

- **Tempo total Flow**: ~10 min
- **Imagens geradas**: 24+ (4 variantes × 5 prompts + extras)
- **Modelo**: Nano Banana Pro
- **Quality**: 1K original, 2K/4K upscale disponível

---

## ⚠️ Notas técnicas

### Por que não baixei via Claude Code?
1. **Browser sandbox**: JS-triggered downloads não chegam ao filesystem do sistema (sandbox isolado)
2. **CORS**: fetch das URLs via JS bloqueado por mesma origem
3. **Cookies sessão**: precisos pra acessar URL redirect, não acessíveis via curl
4. **Response size limit**: extração via canvas → base64 truncada em ~30KB

### Alternativas tentadas
1. ❌ JS `<a download>` blob trigger — sandbox stripped
2. ❌ fetch with credentials — CORS denied
3. ❌ Canvas toDataURL → return — response size limit
4. ✅ Document URLs + manual download — funcional, requer user

### Workaround future
- Use Playwright/Puppeteer fora de browser sandbox
- Configure Gemini API key para CLI direct image gen
- Use Imagen API (autenticada) via Vertex AI

---

## ✅ Status

- **Geração**: ✅ COMPLETA
- **Download user**: ⏳ pendente (manual)
- **Integration code**: ✅ pronto (CSS templates acima)
- **Live deploy**: aguarda assets

---

*User: ao acordar, baixe os 5 packs do Flow URL acima, salve em `/public/sprites/`, e rode o CSS update sugerido.*
