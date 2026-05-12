# SPEC-B3: Chronicle Season-End Modal (Obrigatório)

> Status: **DRAFT — implementação no mesmo PR**
> Fase: B3 — Tornar PRAZEROSO

---

## O que é

Ao fim de cada temporada (week 38 → rollover), abre **modal full-screen** com a Crônica gerada. Player vê o payoff narrativo. Botão "EXPORTAR" baixa MD. Botão "CONTINUAR" fecha e segue pra próxima temp.

Resolve gap: Crônica enterrada na sidebar = ninguém vê. Roadmap problema #1 strength (Crônica é a peça mais shareable do jogo).

---

## Input

- `engine.pendingChronicleSeason` — chronicle object (set por SeasonProcessor)

---

## Output

- Full-screen overlay com mood (triumph/despair/normal)
- Conteúdo: temporada N, clube, manager, chronicle text
- Export MD: download `cronica-temp-N-CLUB.md`

---

## Regras

### 1. Trigger
- [ ] Aparece quando `engine.pendingChronicleSeason` é truthy
- [ ] Fecha quando user clica "CONTINUAR" (limpa flag)

### 2. Conteúdo
- [ ] Mostra `season`, `clubName`, `managerName`, `chronicle.chronicle`
- [ ] Indicador mood (triumph/despair/normal)

### 3. Export
- [ ] Download MD com nome `cronica-temp-N-CLUB.md`
- [ ] Conteúdo MD: cabeçalho + texto crônica

### 4. Acessibilidade
- [ ] role="dialog" + aria-labelledby
- [ ] ESC fecha (limpa pendingChronicleSeason)

### 5. Determinístico
- [ ] Renderiza igual pro mesmo chronicle object

### 6. Forbidden
- [ ] Sem emoji em código novo (chronicle.chronicle pode conter — ok, é dado)
- [ ] Sem deps externas (html2canvas, etc)

---

## Implementação

- **Modifica**: `src/services/SeasonProcessor.js` (+2 LOC: set flag)
- **Novo**: `src/components/ChronicleSeasonEndModal.jsx` (~110 LOC)
- **Modifica**: `src/App.jsx` (+3 LOC: mount modal)
- **Novo harness**: `tests/specs/SPEC-B3-chronicle-modal.test.js`

---

## Testes

```javascript
describe('SPEC-B3: ChronicleSeasonEndModal', () => {
  test('rule 3: MD export filename format', () => {});
  test('rule 3: MD content includes chronicle text', () => {});
  test('rule 5: helper functions deterministic', () => {});
});
```

---

**SPEC versão**: 1.0
