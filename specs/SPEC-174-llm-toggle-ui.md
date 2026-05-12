# SPEC-174 — LLM Toggle UI

> **Status**: ACTIVE
> **Owner**: Dudu (Eduardo Jarra)
> **Branch**: `claude/llm-toggle-ui`
> **Bloco**: 2.3 (LLM bridge real — Foundation-First Roadmap)
> **Depende de**: [SPEC-167](SPEC-167-llm-narrative-service.md) (LLMNarrativeService) e SPEC-119 (WebLLM bridge)
> **Origem**: feedback Dudu — "default tem que ser template; quem quiser IA real liga no header"

---

## O que é

Toggle visível no header do jogo (ao lado dos botões 🔊 som e 📊 monitor) que liga/desliga a integração WebLLM (Llama 3.2 1B local via `AutoPlayLLMBridge`) usada pelo `LLMNarrativeService`.

**Default**: OFF — todas as narrativas (`postMatchAnalysis`, `managerAdvice`, `boardReaction`) vêm dos templates determinísticos pt-BR. Zero download, zero VRAM, zero latência.

**Opt-in**: ao clicar no toggle, o serviço:
1. Persiste a preferência em `localStorage['elifoot_llm_enabled'] = '1'`.
2. **Lazy-carrega** o módulo `AutoPlayLLMBridge` (dynamic import — não estava no bundle inicial).
3. Chama `bridge.setMode('webllm')` + `bridge.init()` que baixa o modelo `Llama-3.2-1B-Instruct-q4f16_1-MLC` via `@mlc-ai/web-llm` (~500MB do CDN). Download é assíncrono, **não bloqueia** o jogo.
4. Mostra toast pt-BR no canto: "Auxiliar IA carregando modelo (~500MB)…" → quando pronto: "Auxiliar IA pronto. Roda local, sem custo, sem API."

Enquanto o modelo carrega, as chamadas continuam respondendo via templates (regra de não-bloquear do SPEC-167). Quando o bridge fica `loadStatus === 'ready'`, a próxima chamada usa WebLLM de verdade.

**Opt-out** (clique de novo): instantâneo. Flag volta a `false`, persistência limpa, próximas chamadas pulam o bridge. A instância já baixada do bridge fica em cache na memória — re-ligar não baixa o modelo de novo.

---

## Por que opt-in (e não padrão)

| Razão | Detalhe |
|-------|---------|
| **Bandwidth** | Modelo Llama 3.2 1B q4f16 = ~500MB. Brasileiro médio em conexão 4G/fixed entry-level não topa download silencioso. |
| **WebGPU obrigatório** | `bridge.init()` falha em navegadores sem WebGPU (Safari < 18, Firefox antes do flag). Padrão template = jogo roda em qualquer lugar. |
| **Latência cold-start** | Primeira `decide()` depois de `init()` leva ~3-8s em hardware comum. Pior UX que template instantâneo se usuário só quer jogar. |
| **Determinismo** | Specs e testes (SPEC-167) validam templates determinísticos. Default LLM quebraria reprodutibilidade de saves/replays. |
| **Privacy não é tradeoff** | LLM roda **localmente no browser** via WebGPU. Zero chamada de rede após o download. Diferencial real do projeto vs Football Manager/FIFA. |

---

## Input (UI)

| Elemento | Onde | Comportamento |
|----------|------|---------------|
| Botão `<Brain />` (Phosphor) no header | `App.jsx` ao lado de 🔊 e 📊 | `weight="regular"` quando OFF, `weight="fill"` + cor verde quando ON. `disabled` enquanto carrega. |
| Toast `loading` | Canto superior direito | Fundo amarelo `#FFC400`, "Auxiliar IA carregando modelo (~500MB)…" |
| Toast `ok` | mesmo lugar | Fundo verde `#39FF14`, "Auxiliar IA pronto…" / "Auxiliar IA desligado…" |
| Toast `err` | mesmo lugar | Fundo vermelho `#FF3030`, mensagem do `bridge.status().error` |
| `aria-pressed` / `aria-label` | botão | Acessibilidade leitor de tela |

---

## Output esperado

### Estado do serviço

`LLMNarrativeService` ganha três métodos públicos novos:

```typescript
isLLMEnabled(): boolean
enableLLM(opts?: { bridgeLoader?: () => Promise<{AutoPlayLLMBridge: any}> }): Promise<{ ok: boolean, status?: string, error?: string }>
disableLLM(): void
getLLMStatus(): { enabled: boolean, bridgeReady: boolean, bridgeStatus: object | null }
```

E persistência:

```typescript
localStorage['elifoot_llm_enabled'] = '1' | (chave removida quando OFF)
```

### Comportamento

| Estado | `isLLMEnabled()` | `getLastMeta().source` |
|--------|------------------|------------------------|
| Default (sem opt-in) | `false` | `'template'` |
| Após `enableLLM()` antes do download terminar | `true` | `'template'` (não-bloqueante) |
| Após `enableLLM()` com bridge ready | `true` | `'webllm'` (ou `'template'` se timeout/erro/short) |
| Após `disableLLM()` | `false` | `'template'` |

---

## Validação

### Harness (`tests/unit/llm-narrative-service-toggle.test.js`)

- `isLLMEnabled()` é `false` por padrão (sem localStorage, sem opt explícito).
- `enableLLM()` flipa flag para `true`, persiste em `localStorage`.
- `disableLLM()` zera flag, limpa `localStorage`.
- Construtor lê localStorage existente: `localStorage.setItem('elifoot_llm_enabled', '1')` → nova instância já vem `enabled=true`.
- `managerAdvice()` retorna template (rule 4: ≥20 chars BR-PT) quando `enabled=false`, sem chamar bridge.
- `enableLLM({ bridgeLoader })` injetável aceita um mock; bridge é construído e `setMode('webllm')` é chamado.
- `disableLLM()` mantém instância do bridge em cache (não re-baixa em próximo opt-in).

### Acceptance manual

- [ ] Header mostra ícone Brain (Phosphor) entre 🔊 e 📊 quando logado.
- [ ] Click no toggle OFF → ON dispara toast "Auxiliar IA carregando…" sem travar o jogo (clicks em outras views continuam respondendo).
- [ ] Após download, próxima chamada de `handleAuxiliarAdvice` (botão "Auxiliar técnico" no Dashboard) retorna texto distinto dos templates (verificar `engine.llmNarrative.getLastMeta().source === 'webllm'`).
- [ ] Reload da página: estado do toggle persiste.
- [ ] Em navegador sem WebGPU: toggle ON falha graciosamente, toast vermelho, jogo continua com templates.

---

## Forbidden

- ❌ Default ON. Toggle nasce OFF, sempre.
- ❌ Bloquear UI durante download (`init()` é fire-and-forget, jogo continua respondendo via templates).
- ❌ Quebrar API existente do `LLMNarrativeService` (todos os callers do SPEC-167 continuam funcionando sem mudança).
- ❌ Adicionar `@mlc-ai/web-llm` ao bundle inicial. Bridge é dynamic import, só baixa no opt-in.
- ❌ Chamadas a `https://api.anthropic.com` ou qualquer API paga (Mandamento Akita #7). LLM roda local.
- ❌ Persistir bridge instance no save game (zerar entre saves está OK; toggle vive em localStorage independente).

---

## Notas de implementação

- Arquivos tocados: `src/services/LLMNarrativeService.js` (+ métodos), `src/App.jsx` (+ botão e toast).
- Lazy load via `import('./AutoPlayLLMBridge.js')` — Vite gera chunk separado. WebLLM CDN só carrega quando `bridge.init()` roda.
- Toast é puro `<div>` posicionado fixed (mesmo padrão do `savedToast`); não introduz dependência.
- `LLM_TOGGLE_STORAGE_KEY` exportado em `__internals` para testes.

---

## Privacidade

O modelo Llama 3.2 1B roda **inteiramente no browser** via WebGPU. Após o download inicial do CDN (`esm.run/@mlc-ai/web-llm` + pesos do MLC), zero requisições saem. Sem telemetria, sem token tracking, sem custo. Diferencial real frente a qualquer game de gestão comercial.
