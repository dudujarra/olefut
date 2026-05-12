# SPEC-177: Bundle DB code-split — regional realPlayers chunks

**Categoria**: infra
**Status**: ✅ implementado 2026-05-12
**Owner**: Dudu
**Criada**: 2026-05-12
**Deriva de**: SPEC-159 (build budget gate), AKITA-213 (single player-data chunk)

---

## 1. Pergunta / objetivo

AKITA-213 splittou `realPlayers.json` num único chunk `player-data-*.js` (1.48MB raw / 252KB gzip). Resolveu o problema do **index chunk inchado**, mas criou outro: **1.48MB carregado em todo first match**, mesmo se o usuário joga só Brasileirão.

Mandamento #10 (CLAUDE.md) é claro: "README/docs com números fantasiosos" são proibidos. AKITA-213 também relaxou o `TOTAL_LIMIT` de 3MB → 3.5MB e o `SINGLE_CHUNK_LIMIT` de 500KB → 800KB pra acomodar o chunk único. Isso é "wrong direction" — relaxa orçamento em vez de splittar.

SPEC-177 reverte essa direção:

1. Splittar `realPlayers.json` em 4 arquivos JSON por região (BRA, EUR, SAM, pool)
2. Manter API `Data.generatePlayer/generateSquad` sincrona via **top-level await** em `src/engine/data.js`
3. Restaurar `SINGLE_CHUNK_LIMIT` pro valor original (500KB) — chunks de código respeitam, chunks de dados (JSON) ficam isentos
4. Apertar `TOTAL_LIMIT` de 3.5MB → 3.2MB

## 2. Por que top-level await em vez de async API

O caminho "fácil" seria fazer `Data.generatePlayer` retornar Promise, `GameInitializer.init` virar async, e `engine.initGame` propagar. **Custo**: 43 call sites em 24 test files + 3 simulação scripts precisariam ser atualizados pra `await`. Risco de regressão alto, valor agregado zero (init time igual — só muda a forma).

Solução: **top-level await** no módulo `data.js`. ECMAScript 2022 suporta nativamente; Vite/Rolldown emite cada `import()` como um chunk separado e propaga o await até consumidores via `Promise.all` no runtime do módulo. Nenhum call site precisa mudar.

```js
// src/engine/data.js (SPEC-177)
const [braMod, eurMod, samMod, poolMod] = await Promise.all([
    import('../data/realPlayers_BRA.json'),
    import('../data/realPlayers_EUR.json'),
    import('../data/realPlayers_SAM.json'),
    import('../data/realPlayers_pool.json'),
]);
const realPlayers = [...braMod.default, ...eurMod.default, ...samMod.default, ...poolMod.default];
```

Trade-off honesto: **todos os 4 chunks carregam em paralelo no module-load**, não só a região ativa. Mas ganhamos:

- HTTP/2 multiplexing → wall-clock time igual a um chunk único
- Browser cache por região → se o usuário muda de save (BRA → EUR) só re-baixa EUR (BRA fica em cache)
- Future-proof: caso queiramos "lazy só região ativa" depois, basta tornar a load function parametrizada — sem mudar API pra consumidores

## 3. Estrutura

```
src/data/
├── realPlayers.json          # source-of-truth (output do scrape_sofifa.py)
├── realPlayers_BRA.json      # derivado: 2956 jogadores em BrazilDB
├── realPlayers_EUR.json      # derivado: 1365 jogadores em EuropeDB
├── realPlayers_SAM.json      # derivado: 1232 jogadores em SouthAmericaDB
└── realPlayers_pool.json     # derivado: 7202 jogadores fora dos DBs (pool de geração procedural)

scripts/
└── split-real-players.mjs    # regenera os 4 derivados a partir do source
```

Quando `scrape_sofifa.py` rodar de novo, basta:

```bash
python scripts/scrape_sofifa.py
node scripts/split-real-players.mjs
```

## 4. Vite manualChunks

`vite.config.js` ganha entrada explícita pra cada região:

```js
manualChunks(id) {
  if (id.includes('realPlayers_BRA.json')) return 'realPlayers_BRA';
  if (id.includes('realPlayers_EUR.json')) return 'realPlayers_EUR';
  if (id.includes('realPlayers_SAM.json')) return 'realPlayers_SAM';
  if (id.includes('realPlayers_pool.json')) return 'realPlayers_pool';
  // ... outros
}
```

## 5. Budget atualizado (`tests/integration/build-budget.test.js`)

| Limite | Antes (AKITA-213) | Depois (SPEC-177) | Δ |
|--------|-------------------|-------------------|---|
| INITIAL_LIMIT | 500_000 | 500_000 | unchanged |
| SINGLE_CHUNK_LIMIT (code) | 800_000 | **500_000** | aperta 300KB |
| TOTAL_LIMIT | 3_500_000 | **3_200_000** | aperta 300KB |
| DATA_CHUNKS regex | `/^(player-data)-/` | `/^(player-data\|realPlayers_)/` | inclui novos chunks |

Data chunks (JSON payload, não código executável) continuam isentos do `SINGLE_CHUNK_LIMIT`. Justificativa: pool 843KB raw → 150KB gzip (ratio 5.6:1) é JSON denso; aplicar limite de código não faz sentido.

## 6. Snapshot pós-implementação

```
dist/assets/index-*.js                  273.99 KB   (era 382.84 KB; -28%)
dist/assets/Tone-*.js                   345.27 KB
dist/assets/GameContext-*.js            285.15 KB
dist/assets/realPlayers_BRA-*.js        331.66 KB   (gzip 51.48 KB)
dist/assets/realPlayers_EUR-*.js        160.63 KB   (gzip 28.62 KB)
dist/assets/realPlayers_SAM-*.js        148.79 KB   (gzip 23.39 KB)
dist/assets/realPlayers_pool-*.js       842.95 KB   (gzip 150.45 KB)
Total dist/assets/*.js                  ~3.1 MB     (era ~2.5 MB no AKITA-213, mas com chunk monolítico de 1.48MB; agora o orçamento é cumprido com chunks isolados)
```

## 7. Critério de "respondida"

- [x] `realPlayers.json` splittado em 4 derivados via `scripts/split-real-players.mjs`
- [x] `src/engine/data.js` usa top-level await + Promise.all
- [x] `vite.config.js` declara `manualChunks` por região
- [x] `tests/integration/build-budget.test.js` aperta `SINGLE_CHUNK_LIMIT` 800→500KB e `TOTAL_LIMIT` 3.5→3.2MB
- [x] 1118 testes verdes (96 files); 0 lint errors; build limpo em <1s
- [x] Initial chunk: 382.84 KB → 273.99 KB (-28%)

## 8. Harness (Regra 0 — sem harness, sem spec)

| Harness | O que valida |
|---------|--------------|
| `tests/integration/build-budget.test.js` | initial ≤ 500KB, code chunk ≤ 500KB, total ≤ 3.2MB |
| `tests/engine.test.js`, characterization, regression, etc. | `engine.initGame()` ainda funciona síncrono (top-level await é transparente) |
| `scripts/split-real-players.mjs` | regeneração reprodutível dos derivados |

Não há harness dedicado pra "região ativa carrega menos" porque escolhemos top-level await (todas as 4 carregam em paralelo). Quando/se virarmos `loadRegion(zone)` lazy (SPEC futura), aí precisa harness de network-tab.

## 9. Forbidden

- Relaxar `SINGLE_CHUNK_LIMIT` ou `TOTAL_LIMIT` sem nova SPEC + nova justificativa pública
- Editar manualmente os arquivos `realPlayers_*.json` (são derivados — sempre re-rodar `scripts/split-real-players.mjs`)
- Importar `realPlayers.json` direto em código (ele só existe como source-of-truth para o split)
