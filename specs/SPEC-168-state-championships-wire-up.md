# SPEC-168: State Championships Wire-Up

> **Bloco 2.2 — último gap do audit AKITA-233.** Estaduais brasileiros existem em código mas nunca foram conectados ao GameInitializer. Esta spec faz o wire-up sem mexer no engine.

**Status**: Implementada (este PR)
**Owner**: Dudu (Eduardo Jarra)
**Spec linkada ao código**: `src/services/GameInitializer.js`, `src/engine/tournaments/StateChampionship.js`, `src/components/StandingsView.jsx`
**Harness**: `tests/integration/state-championship-init.test.js`

---

## O que é

Conecta a classe `StateChampionship` (já definida em `src/engine/tournaments/StateChampionship.js` desde SPEC-061) ao pipeline de inicialização do jogo. Resultado: ao iniciar um save, os estaduais brasileiros (Paulistão, Carioca, Mineiro, Gaúcho) são instanciados, populados com clubes do estado correto, e rodam automaticamente nas semanas 1-16 paralelamente ao Brasileirão.

---

## Por que estava sem wire-up

`StateChampionship.js` foi escrita em SPEC-061 com:
- `STATE_CHAMPIONSHIPS` config (4 estaduais)
- Classe `StateChampionship extends Tournament`
- Round-robin generator, fase de grupos, semis, fase final

…mas **zero imports fora dela mesma**. O autor original (legacy, pré-Akita Protocol) parou no meio. Audit AKITA-233 (Bloco 2.2) sinalizou o gap.

---

## Input

### Origem
- Lista de clubes BRA em `src/engine/db/brazil.js` (divisões 1-4).
- Config `STATE_CHAMPIONSHIPS` em `src/engine/tournaments/StateChampionship.js`.

### Restrição
- `brazil.js` **não tem campo `state`** nos clubes. Mantemos `brazil.js` intacto e introduzimos o mapping em `StateChampionship.js`:

```js
export const CLUB_STATE_MAP = {
    'Palmeiras': 'SP', 'Flamengo': 'RJ', 'Atlético-MG': 'MG', ...
    // 80 clubes mapeados; clube ausente = não participa de estadual
};
```

---

## Output

Após `engine.initGame(...)`:
- `engine.tournaments` contém os estaduais cujo estado tem **≥ 8 clubes mapeados**.
- Cada estadual tem `participants`, `standings`, `fixtures` populados.
- IDs: `paulistao`, `carioca`, `mineiro`, `gaucho`.
- `tournament.weekStart = 1`, `weekEnd = 16` — internalmente ignora `advanceWeek` fora dessa janela.

---

## Lógica de wire-up

`GameInitializer._initializeStateChampionships(engine)`:

1. Agrupa `engine.teams` BRA por estado via `CLUB_STATE_MAP`.
2. Para cada `STATE_CHAMPIONSHIPS[id]`:
   - Filtra clubes do estado (qualquer divisão BRA).
   - Ordena por (divisão asc, balance desc) — favorece "topo" do estado.
   - Trunca para `config.size`.
   - **Skip se `< 8` clubes** (mandamento #5 — padronização: divisões/torneios sem 8 times mínimos não rodam).
3. Instancia `new StateChampionship(id, name, state)`, chama `init(teamIds)`, push em `engine.tournaments`.

### Interação com o calendário

- `engine.advanceWeek()` já itera `tournaments.forEach(t => t.advanceWeek(...))`.
- `StateChampionship.advanceWeek` retorna `[]` quando `seasonWeek` está fora da janela 1-16.
- **Zero mudança no engine** — wire-up puro.

### Re-init no virar de temporada

`SeasonProcessor.rolloverSeason` itera todos `engine.tournaments` e chama `t.init(...)`:
- Para state championships, o id (`paulistao` etc.) não casa o regex `_\d+$`, então cai no fallback que re-inicializa com `standings.map(s => s.teamId)` — mesmos times.
- `StateChampionship.init()` foi atualizado pra resetar `phase = 'group'` e `winner = null` no re-init.

---

## States wired (snapshot atual)

| Estadual    | Estado | Size config | Pool real (BR DB) | Wired? |
|-------------|--------|-------------|-------------------|--------|
| Paulistão   | SP     | 16          | 13                | ✅ (truncado a 13) |
| Carioca     | RJ     | 12          | 8                 | ✅ (truncado a 8)  |
| Mineiro     | MG     | 12          | 6                 | ❌ < 8 clubes      |
| Gaúcho      | RS     | 16          | 6                 | ❌ < 8 clubes      |

**Quando estados crescem (mais clubes adicionados a brazil.js)**, automaticamente entram no wire-up sem mudar GameInitializer.

> Nota: o número de clubes por estado depende do que existe em `brazil.js`. Mineiro e Gaúcho ficam dormentes até preenchermos as divisões 3/4 com mais MG/RS.

---

## Validação

`tests/integration/state-championship-init.test.js`:

1. `engine.tournaments` contém pelo menos um estadual depois de `initGame`.
2. Cada estadual ativo tem `participants.length >= 8`.
3. Cada `participants` pertence ao estado correto (cross-check com `CLUB_STATE_MAP`).
4. `weekStart=1`, `weekEnd=16` ok.
5. `advanceWeek` em week 17 retorna `[]` (fora da janela).
6. `advanceWeek` em week 5 popula `standings` (jogos foram jogados).
7. Estadual com `< 8` clubes no pool não é instanciado (Mineiro/Gaúcho com DB atual).
8. Golden master: tournaments existentes (BRA_1..4, COPA_BR, LIBERTADORES, SULA, CHAMPIONS) continuam intactos.

---

## UI exposure

`StandingsView.jsx` ganhou painel "ESTADUAIS" (visível só na zona BRA, se há estaduais ativos):
- Botões clicáveis pra cada estadual.
- Click alterna entre liga normal (BRA/série N) e classificação do estadual.
- Header mostra nome do torneio quando estadual selecionado.
- Faixa "TOP 4 → SEMIFINAIS" substitui prom/releg legend.

---

## Forbidden

- ❌ Adicionar campo `state` em `brazil.js` (manter brazil.js como source único do real DB; mapping vive em StateChampionship.js).
- ❌ Mexer em `StateChampionship.advanceWeek` ou na simulação interna (esta spec é puro wire-up).
- ❌ Mexer em `engine.advanceWeek` ou em `SeasonProcessor.rolloverSeason` (delegação por contrato existente é suficiente).
- ❌ Quebrar golden master / 1080+ tests.

---

## Roadmap subsequente

- SPEC futura: prêmios em dinheiro dos estaduais (atualmente `prizeChampion`/`prizeRunnerUp` no metadata mas não pagos no engine).
- SPEC futura: integrar fase de semis/final (campos `phase = 'semi'/'final'` existem mas `advanceWeek` não os processa ainda).
- SPEC futura: rivalidades dos estaduais aumentam pressão (`rivalries` arr no metadata).
