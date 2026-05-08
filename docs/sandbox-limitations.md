# Browser MCP Sandbox Limitations

**Issue**: JS-triggered downloads não chegam ao filesystem do sistema.

## Por quê
Chrome MCP roda em sandbox isolado. Downloads:
- ✅ Click manual `<a download>` → triggera dialog mas pode falhar silently
- ❌ JS programmatic download → blocked
- ❌ Canvas → toBlob → URL.createObjectURL → click → save → 0 files
- ❌ fetch with credentials → CORS blocked

## Workarounds testados
1. `<a download>` JS injection — ⚠️ funciona ~50% (timing-dependent)
2. Canvas extract base64 → return — ❌ response size limit ~30KB
3. Right-click "Save As" → não acessível via MCP
4. Clipboard write → requires user permission grant

## Solução real
**Full computer-use access** (não browser-only):
- mcp__computer-use__* — system-wide click/type/screenshot
- Mas browsers tier "read" no full computer-use → bloqueia clicks no Chrome
- Catch-22: browser tools precisam Chrome MCP, file ops precisam computer-use

## Alternativas
1. **Playwright/Puppeteer headless**: roda fora MCP, controle completo
2. **gcloud auth + Imagen API**: gera imagens via API direta
3. **Manual download**: user clica botão Baixar no Flow UI
4. **AppleScript automation**: simula clicks Finder + Chrome separadamente

## Esta sessão
8 assets chegaram via clicks `Tamanho original` no Flow UI:
- logo-elifoot-8bit.jpeg (1.9MB)
- weather.jpeg (533KB)
- icons-football.jpeg (452KB) — **paleta futebol**
- stadium-bg.jpeg (640KB) — **16:9 paleta futebol**
- scoreboard.jpeg (504KB) — **ELIFOOT scoreboard**
- players.jpeg — **8 jerseys numerados**
- 2 weather/icons variantes paleta antiga

Não chegaram (mesmo após click):
- Stadium evolution chart 5 levels
- ELIFOOT THE MANAGER GAME cinematic
- Match scene wide
- Variantes adicionais

Para baixar resto: user manual via https://labs.google/fx/pt/tools/flow/project/c424a7b7-34b7-4ff4-8fee-5c297aeb171b
