# SPEC-154: NPC brain isolation — skipAutoRestore opt-in

**Categoria**: learning
**Status**: ✔️ done (retroativa — fix shipped via AKITA-204)
**Owner**: Dudu
**Criada**: 2026-05-11
**SPEC linkadas**: SPEC-117 (goal hierarchy — unique OCEAN contract)

---

## 1. Objetivo

Permitir que NPC brains do engine NÃO façam auto-restore do `STORAGE_KEY` compartilhado, preservando persona única por NPC (SPEC-117).

## 2. Motivação (bug latente descoberto)

`AdaptiveBrain` foi originalmente desenhado para um único bot (user autoplay). Constructor chama `_restore()` que lê `localStorage[STORAGE_KEY='elifoot_autoplay_brain']`.

Quando `Engine.initGame` passou a construir 169 NPC brains (MARL fase 6), TODOS chamavam `_restore()` no constructor → todos hidravam com a persona do último autoplay save. Resultado: 169 NPCs com OCEAN idêntico, quebrando SPEC-117 e marl-e2e test.

Bug silencioso em prod — nunca falhava o jogo, só fazia rivais virarem cópias.

## 3. Input

- `AdaptiveBrain` constructor signature: `(personalityId, opts)`
- `opts.skipAutoRestore: boolean` (default `false` — backwards-compat)

## 4. Output

- Quando `skipAutoRestore=true`: `_restore()` retorna early, brain fica com persona fresca da `generatePersonality()` com gaussian noise.
- Quando `false`/omitido: comportamento legado (autoplay user brain auto-restaura).

## 5. Comportamento

```js
constructor(personalityId = null, opts = {}) {
    this._skipAutoRestore = !!opts.skipAutoRestore;
    // ... resto do init
    this._restore();  // ← early-return se skipAutoRestore
}

_restore() {
    if (typeof localStorage === 'undefined') return;
    if (this._skipAutoRestore) return;  // ← novo gate
    // ... resto lê STORAGE_KEY
}
```

Call sites:
- `src/services/AutoPlayService.js:100` → `new AdaptiveBrain()` (sem opts — auto-restore ON, correto)
- `src/engine/engine.js:179` → `new AdaptiveBrain(archetype, { skipAutoRestore: true })` (NPCs — auto-restore OFF)

## 6. Validação (Regra 0 — harness)

**Arquivo**: `tests/regression/SPEC-117-skip-auto-restore.test.js` (5 testes — Mandamento #6 — 3-artefact)

- [x] persona persists across constructor when skipAutoRestore omitted (backwards-compat)
- [x] skipAutoRestore=true bypasses restore — fresh state
- [x] many NPCs with skipAutoRestore yield unique OCEAN personalities (>50 unique de 60 brains)
- [x] engine NPCs do not share persisted persona (polluted qTable não vaza)
- [x] opts argument is optional (backwards-compat sem opts)

**Marl-e2e indirect**: `tests/integration/marl-e2e.test.js > NPC brains have EmotionalEngine attached` agora passa (estava falhando em main antes do fix).

## 7. Forbidden cases

- ❌ Engine NPC criado sem `skipAutoRestore: true` (regressão do bug)
- ❌ AutoPlay user brain com `skipAutoRestore: true` (perderia save do jogador)
- ❌ `_skipAutoRestore` field exposto publicamente (private convention `_` mantida)

## 8. Arquivos tocados

- `src/services/learning/AdaptiveBrain.js` — constructor + `_restore()` gate
- `src/engine/engine.js:179` — passa flag para NPC brains
- `tests/regression/SPEC-117-skip-auto-restore.test.js` — novo

## 9. Decisão de arquitetura

**Alternativas consideradas**:
1. **Constructor opts** `{ skipAutoRestore }` — **escolhido**
2. Subclass `NpcBrain extends AdaptiveBrain` — over-engineering pra 1 flag
3. Per-team STORAGE_KEY no `_restore()` — quebra autoplay user save (key compartilhado é a feature lá)
4. Mover `_restore()` para fora do constructor — breaking change pra AutoPlayService

**Por quê 1**: zero breaking change, opcional, transparente, único call site afetado.

## 10. Riscos / débitos

- Outros futuros call sites de `new AdaptiveBrain()` precisam decidir flag. Mitigado por docstring no constructor.
- Per-team brain persistence via `BrainPersistence.js` (já existe, key `elifoot_npc_brains`) cobre cenário de save NPC; este SPEC só evita CROSS-contamination com user autoplay key.
