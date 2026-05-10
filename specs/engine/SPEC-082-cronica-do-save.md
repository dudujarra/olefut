# SPEC-082: Crônica do Save — Tela de Prosa por Temporada

**Fase:** 6 — Legado (v1.5)  
**Prioridade:** MÉDIA  
**Pré-requisito:** SPEC-078 Hall de Lendas + SPEC-080 Rivalry Upgrade + SPEC-049 Narrative Layers  
**AKITA:** AKITA-056  
**SAVE_VERSION:** sobe pra 20

---

## O que é

Tela de prosa narrativa por temporada — uma "crônica" que sintetiza os eventos mais marcantes de cada season em texto legível. Montada a partir de templates + dados reais do save (arcos fechados, canonizações, vexames, títulos, rivalidades).

Não é gerada por LLM (proibido até v3.x). É template-driven com interpolação de dados.

---

## Input

```typescript
{
  season: number,
  clubId: number,
  managerId: number,
  seasonData: {
    finalPosition: number,
    titlesWon: Array<string>,          // ["Campeonato Baiano", "Copa do NE"]
    relegationOccurred: boolean,
    promotionOccurred: boolean,
    topScorer: { name: string, goals: number },
    biggestWin: { score: string, opponent: string, week: number },
    biggestLoss: { score: string, opponent: string, week: number },
    vexames: Array<{ score: string, opponent: string }>,
    lossStreakMax: number,
    winStreakMax: number,
    newCanonicizations: Array<{ slot: string, playerName: string }>,
    rivalryEvents: Array<{ rivalName: string, event: string }>,
    regenEmerged?: { name: string, parentName: string },
    managerEvents: Array<{
      type: 'hired' | 'fired' | 'proposal_received' | 'challenge_completed',
      description: string
    }>
  }
}
```

---

## Output esperado

```typescript
{
  season: number,
  clubId: number,
  chronicleText: string,           // prosa completa (300-600 chars)
  highlights: Array<{
    type: 'title' | 'relegation' | 'vexame' | 'canonization' | 'regen' | 'rivalry',
    headline: string,
    detail: string
  }>,
  exportable: {
    json: object,                  // dados estruturados para debug
    text: string                   // texto plano exportável
  }
}
```

**Estrutura do chronicleText (template):**
```
[ABERTURA: posição + tom geral]
[CORPO: 1-3 eventos marcantes com nomes e números reais]
[FECHAMENTO: canonização OU regen OU rivalidade OU manager event]
```

**Templates de abertura (handwritten, 8 mínimos):**
- Título: "A temporada de [ano] ficará marcada na memória do [clube]..."
- Rebaixamento: "Foi um ano para esquecer em [cidade]..."
- Meio-tabela + vexame: "Uma temporada irregular, marcada pela humilhação de [score] contra [adversário]..."
- Promoção: "O [clube] finalmente voltou. [ano] foi o ano da redenção..."
- [+ 4 variações]

**Templates de corpo (handwritten, 12 mínimos):**
- Artilheiro: "[nome] foi implacável. [N] gols em uma temporada para a história."
- Sequência: "[N] vitórias seguidas. Nunca antes..."
- Vexame + virada: "O 0-[N] assombrou, mas o clube se reergueu para..."
- [+ 9 variações]

**Templates de fechamento (8 mínimos):**
- Canonização: "E no fim, [nome] entrou para a galeria. [slot headline]"
- Regen: "Nas categorias de base, um nome familiar surgiu: [filho]. Filho de [pai]."
- Rivalidade: "A rivalidade com [clube] ganhou um novo capítulo. [arco]"

---

## Regras de validação

- [ ] `chronicleText` sempre 300-600 caracteres
- [ ] Nenhum template usa dados inventados (todos vêm de `seasonData`)
- [ ] `highlights` tem 2-5 itens (nem vazio, nem flood)
- [ ] `exportable.json` contém todos os dados de input + output
- [ ] Template de abertura reflete posição real (título ≠ template de rebaixamento)
- [ ] `canonization` highlight só aparece se `newCanonicizations` não vazio
- [ ] `regen` highlight só aparece se `regenEmerged` presente
- [ ] Texto é legível sem contexto externo (nomes completos, não IDs)

---

## Forbidden

- [ ] `chronicleText` com placeholder não substituído (ex: "[NOME]" literal)
- [ ] `chronicleText` abaixo de 300 ou acima de 600 chars
- [ ] Dados de temporada diferente misturados
- [ ] LLM ou Tracery gerando texto (sempre template JS puro)
- [ ] `highlights` vazio (ao menos 2 sempre)

---

## Implementação

**Arquivo:** `src/engine/ChronicleSystem.js` (novo)  
**Templates:** `src/data/chronicleTemplates.js` — objeto fixo com todas as strings  
**UI:** `src/views/ChronicleView.js` — tela scrollável por season  
**Export:** botão "Exportar Crônica" → download JSON + TXT

---

## Testes esperados

```javascript
describe('SPEC-082: Crônica do Save', () => {
  test('chronicleText length 300-600 chars (rule 1)', () => {
    const result = ChronicleSystem.generate(mockSeasonData);
    expect(result.chronicleText.length).toBeGreaterThanOrEqual(300);
    expect(result.chronicleText.length).toBeLessThanOrEqual(600);
  });

  test('no unresolved placeholders in text (rule 2)', () => {
    const result = ChronicleSystem.generate(mockSeasonData);
    expect(result.chronicleText).not.toMatch(/\[.*?\]/); // sem [NOME] literal
  });

  test('highlights has 2-5 items (rule 3)', () => {
    const result = ChronicleSystem.generate(mockSeasonDataRich);
    expect(result.highlights.length).toBeGreaterThanOrEqual(2);
    expect(result.highlights.length).toBeLessThanOrEqual(5);
  });

  test('exportable.json contains all input data (rule 4)', () => {
    const result = ChronicleSystem.generate(mockSeasonData);
    expect(result.exportable.json.season).toBe(mockSeasonData.season);
    expect(result.exportable.json.finalPosition).toBe(mockSeasonData.seasonData.finalPosition);
  });

  test('title opening template used for champion (rule 5)', () => {
    const result = ChronicleSystem.generate({ ...mockSeasonData, seasonData: { ...mockSeasonData.seasonData, titlesWon: ['Campeonato Baiano'] } });
    expect(result.chronicleText.toLowerCase()).toContain('ficará marcada');
  });

  test('relegation opening template used when relegated (rule 5b)', () => {
    const result = ChronicleSystem.generate({ ...mockSeasonData, seasonData: { ...mockSeasonData.seasonData, relegationOccurred: true, titlesWon: [] } });
    expect(result.chronicleText.toLowerCase()).toContain('esquecer');
  });

  test('canonization highlight only if new canon exists (rule 6)', () => {
    const resultNoCanon = ChronicleSystem.generate({ ...mockSeasonData, seasonData: { ...mockSeasonData.seasonData, newCanonicizations: [] } });
    expect(resultNoCanon.highlights.some(h => h.type === 'canonization')).toBe(false);
  });

  test('forbidden: unresolved placeholder (rule forbidden 1)', () => {
    // Testar template com dado faltando — deve fallback gracioso, não placeholder literal
    const incompleteData = { ...mockSeasonData, seasonData: { ...mockSeasonData.seasonData, topScorer: null } };
    const result = ChronicleSystem.generate(incompleteData);
    expect(result.chronicleText).not.toMatch(/\[.*?\]/);
  });
});
```

---

## Definition of Done
- [ ] `ChronicleSystem.js` passa todos os 8 testes
- [ ] 8 templates de abertura + 12 de corpo + 8 de fechamento (28 total handwritten)
- [ ] ChronicleView renderiza corretamente para 5+ seasons
- [ ] Export JSON + TXT funcionando
- [ ] Stress test: save 200 seasons sem crash ou texto inválido

## Definition of Stop
- Se texto ficar repetitivo após 20+ seasons (mesmos templates sempre): adicionar 5 variações por categoria (total 43 templates)
