# SPEC-167 — LLM Narrative Service

> **Status**: ACTIVE
> **Owner**: Dudu (Eduardo Jarra)
> **Branch**: `claude/b23-llm-bridge`
> **Bloco**: 2.3 (LLM bridge real — Foundation-First Roadmap)
> **Origem**: AKITA-233 audit — "WebLLM é o único diferencial real. Hoje é 'bridge' — define o que faz."

---

## O que é

Camada pública de narrativa baseada em LLM (com fallback determinístico por templates) para 3 casos de uso narrativos:

1. **`postMatchAnalysis(matchData)`** — gera narrativa curta (2-3 frases, BR-PT) descrevendo o resultado da partida.
2. **`managerAdvice(matchCtx)`** — sugere tática/formação para o próximo confronto (1-2 frases).
3. **`boardReaction(event)`** — gera comunicado in-character da diretoria após evento crítico (2-3 frases).

A engine real (`AutoPlayLLMBridge` → WebLLM/Llama 3.2 1B) é opcional. Quando indisponível (sem WebGPU, modo `heuristic`, timeout, erro), serviço usa templates determinísticos. A API é a **mesma** nos dois caminhos.

**Regra-mãe**: o jogo deve rodar suave com ou sem LLM. LLM enriquece, nunca bloqueia.

---

## Input

### `postMatchAnalysis(matchData)`

```typescript
{
  homeTeam: string,        // nome do time da casa
  awayTeam: string,        // nome do time visitante
  homeGoals: number,       // gols casa (>=0)
  awayGoals: number,       // gols visitante (>=0)
  managerSide?: 'home'|'away', // qual lado é do manager (opcional)
  topScorer?: string,      // jogador que marcou mais
  isCup?: boolean,         // partida de copa?
  week?: number            // semana do calendário
}
```

### `managerAdvice(matchCtx)`

```typescript
{
  ownTeam: { name: string, avgOvr: number, formation: string, currentTactic: string },
  opponent: { name: string, avgOvr: number, recentForm?: Array<'W'|'L'|'D'> },
  position: number,        // posição na tabela
  totalTeams: number       // total na divisão
}
```

### `boardReaction(event)`

```typescript
{
  type: 'relegation'|'title'|'sacking_risk'|'win_streak'|'humiliation',
  managerStats?: { wins: number, losses: number, streak: number },
  expectation?: string,    // ex: 'top4', 'promotion'
  position?: number,
  totalTeams?: number,
  scoreDiff?: number       // em caso de humiliation
}
```

---

## Output esperado

Todas as 3 funções retornam `Promise<string>`. String não-vazia, BR-PT, 2-3 frases.

**Exemplo `postMatchAnalysis`**:
```
"Vitória sólida no Maracanã. O Flamengo controlou a posse no primeiro tempo e selou o 3-1 com gol de Pedro. Boa resposta após a derrota anterior."
```

**Exemplo `managerAdvice`**:
```
"Você tem vantagem técnica (OVR 72 vs 65). Mantenha 4-3-3 ofensivo e explore as laterais. Cuidado com contra-ataques."
```

**Exemplo `boardReaction`**:
```
"A diretoria está extremamente satisfeita com o título. Manteremos o investimento no próximo ano. Continue assim, treinador."
```

### Campos auxiliares

Cada função também retorna metadado (interno, NÃO faz parte do contrato público):
- `source`: `'webllm'` | `'template'`
- `cached`: `boolean`

A função pública retorna apenas `string` (a narrativa). O metadado vai pro `engine._llmNarrativeMeta` se o caller quiser auditar.

---

## Regras de validação

Checklist obrigatória. Output deve satisfazer todas:

### 1. Não-bloqueante
- [ ] Promise resolve em <= 3.5s (timeout interno 3000ms + folga)
- [ ] Sem `await` síncrono na engine principal — caller usa `.then()` ou ignora
- [ ] Erro do WebLLM nunca propaga para a engine (catch interno)

### 2. Fallback graceful
- [ ] Sem `AutoPlayLLMBridge` ready → usa template
- [ ] Timeout (>3s) → usa template
- [ ] Erro durante geração → usa template
- [ ] Template sempre disponível para todos os 3 casos

### 3. Cache (memoize)
- [ ] Mesmo input (key estável) → retorna mesmo output sem nova chamada
- [ ] Cache key inclui apenas campos relevantes
- [ ] Cache cap em 100 entradas (LRU simples)

### 4. Saída válida
- [ ] String não vazia
- [ ] Comprimento >= 20 chars (não trivial)
- [ ] Comprimento <= 400 chars (não verborrágico)
- [ ] Em português brasileiro (apenas templates auditados)

### 5. Determinismo dos templates
- [ ] Mesmo input → mesmo template selecionado
- [ ] Sem `Math.random()` direto — usa systemRng ou seleção por hash determinístico

### 6. Integração WeekProcessor
- [ ] Após `engine.advanceWeek()` com match, `engine.lastMatchNarrative` é populado
- [ ] Falha silenciosa: se serviço quebra, weekProcessor segue normalmente

### 7. Integração DashboardView
- [ ] Botão "Conselho do Auxiliar" chama `managerAdvice` e mostra resultado num painel
- [ ] Loading state enquanto Promise pende

### 8. Integração BoardSystem (via WeekProcessor)
- [ ] Em humiliation (scoreDiff>=4) o serviço gera `boardReaction({type:'humiliation'})` e adiciona ao `engine.weekEvents`
- [ ] Em title win, gera reaction tipo `'title'`

---

## Forbidden

### ❌ Bloquear engine
- [ ] LLM call sem timeout (3s máximo)
- [ ] LLM call sem catch (erro propaga)
- [ ] WeekProcessor `await`-ando geração antes de avançar semana

### ❌ Quebrar API surface
- [ ] Retornar `null` ou `undefined` em vez de string
- [ ] Retornar objeto complexo onde string foi prometida
- [ ] Lançar exceção pela API pública

### ❌ Cache poison
- [ ] Cache crescer ilimitado (>100 entradas sem evict)
- [ ] Cache key incluir timestamps mutáveis (toda chamada vira miss)
- [ ] Cache compartilhado entre saves diferentes (vazamento)

### ❌ Templates ruins
- [ ] Template com placeholder não substituído (`${homeTeam}` literal)
- [ ] Template em inglês ou outro idioma
- [ ] Template < 20 chars (trivial)
- [ ] Template idêntico para casos opostos (ex: vitória e derrota com mesma frase)

### ❌ Dependências novas
- [ ] Adicionar package em `package.json` (usar apenas `@mlc-ai/web-llm` já existente)
- [ ] Importar de URL externa em código de produção (só dynamic import dentro de AutoPlayLLMBridge)

---

## Implementação

### Arquivos novos
- `src/services/LLMNarrativeService.js` — serviço público (~250 LOC)
- `specs/SPEC-167-llm-narrative-service.md` — esta spec
- `tests/integration/llm-narrative-service.test.js` — harness (~150 LOC)

### Arquivos modificados
- `src/services/WeekProcessor.js` — chama `postMatchAnalysis` após resultado da partida + `boardReaction` em eventos críticos
- `src/components/DashboardView.jsx` — adiciona botão "Conselho do Auxiliar"
- `src/engine/engine.js` — expõe `engine.lastMatchNarrative` e `engine.llmNarrative` (instância singleton)

### Reuso
- `src/services/AutoPlayLLMBridge.js` — bridge WebLLM já existente, usado em modo opt-in
- `src/services/learning/LLMBridge.js` — heurísticas (NÃO é LLM real; mantém-se intocado)

---

## Testes esperados

Mínimo 8 testes (1 por regra):

```javascript
describe('SPEC-167: LLM Narrative Service', () => {

  test('postMatchAnalysis: returns non-empty string (rule 4)', async () => {
    const svc = new LLMNarrativeService();
    const text = await svc.postMatchAnalysis({ homeTeam: 'Flamengo', awayTeam: 'Vasco', homeGoals: 3, awayGoals: 1 });
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThanOrEqual(20);
  });

  test('managerAdvice: returns advice string with context (rule 4)', async () => {
    const svc = new LLMNarrativeService();
    const text = await svc.managerAdvice({ ownTeam: { name: 'X', avgOvr: 70, formation: '4-3-3', currentTactic: 'offensive' }, opponent: { name: 'Y', avgOvr: 60 }, position: 5, totalTeams: 20 });
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(20);
  });

  test('boardReaction: returns reaction for relegation (rule 4)', async () => {
    const svc = new LLMNarrativeService();
    const text = await svc.boardReaction({ type: 'relegation' });
    expect(text.length).toBeGreaterThan(20);
  });

  test('cache: same input returns same output (rule 3)', async () => {
    const svc = new LLMNarrativeService();
    const ctx = { homeTeam: 'A', awayTeam: 'B', homeGoals: 2, awayGoals: 0 };
    const a = await svc.postMatchAnalysis(ctx);
    const b = await svc.postMatchAnalysis(ctx);
    expect(a).toBe(b);
  });

  test('fallback: timeout uses template (rule 2)', async () => {
    const fakeBridge = { status: () => ({ mode: 'webllm', loadStatus: 'ready' }), decide: () => new Promise(() => {}) };
    const svc = new LLMNarrativeService({ bridge: fakeBridge, timeoutMs: 50 });
    const text = await svc.postMatchAnalysis({ homeTeam: 'A', awayTeam: 'B', homeGoals: 1, awayGoals: 0 });
    expect(text.length).toBeGreaterThan(20);
  });

  test('fallback: bridge error uses template (rule 2)', async () => {
    const fakeBridge = { status: () => ({ mode: 'webllm', loadStatus: 'ready' }), decide: () => Promise.reject(new Error('LLM crashed')) };
    const svc = new LLMNarrativeService({ bridge: fakeBridge });
    const text = await svc.postMatchAnalysis({ homeTeam: 'A', awayTeam: 'B', homeGoals: 1, awayGoals: 0 });
    expect(text.length).toBeGreaterThan(20);
  });

  test('non-blocking: resolves in <= 3500ms (rule 1)', async () => {
    const fakeBridge = { status: () => ({ mode: 'webllm', loadStatus: 'ready' }), decide: () => new Promise(() => {}) };
    const svc = new LLMNarrativeService({ bridge: fakeBridge, timeoutMs: 100 });
    const start = Date.now();
    await svc.postMatchAnalysis({ homeTeam: 'A', awayTeam: 'B', homeGoals: 0, awayGoals: 0 });
    expect(Date.now() - start).toBeLessThan(3500);
  });

  test('forbidden: no null return on bad input (forbidden 1)', async () => {
    const svc = new LLMNarrativeService();
    const text = await svc.postMatchAnalysis({ homeTeam: '', awayTeam: '', homeGoals: 0, awayGoals: 0 });
    expect(text).not.toBeNull();
    expect(typeof text).toBe('string');
  });

  test('determinism: same input → same template choice (rule 5)', async () => {
    const svc = new LLMNarrativeService();
    const ctx = { type: 'title' };
    const a = await svc.boardReaction(ctx);
    const b = await svc.boardReaction(ctx);
    expect(a).toBe(b);
  });

  test('integration: WeekProcessor populates engine.lastMatchNarrative (rule 6)', async () => {
    // see WeekProcessor test
  });
});
```

---

## Open Questions

- **Q1**: WebLLM em modo `heuristic` deve sempre usar template? **R**: Sim — não tem engine pra chamar.
- **Q2**: Cache deve persistir entre saves? **R**: Não — é só in-memory, regenera quando precisar.
- **Q3**: Templates devem ser dinâmicos com nomes de jogadores reais? **R**: Sim, quando os campos vêm preenchidos no input (não inventar).

---

**Spec versão**: 1.0
**Última atualização**: 2026-05-12
**Protocolo**: AKITA SDD
