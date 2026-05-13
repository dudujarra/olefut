# OléFUT — Modding Guide

> SPEC-C4 — ModLoader habilita comunidade BR a adicionar cartas customizadas sem editar engine. Documentação prática.

---

## TL;DR

1. Cria arquivo JSON em `/public/mods/cards/<seu-pack>/<arquivo>.json`
2. Estrutura:
```json
{
  "deck": "mid_match_manager",
  "cards": [{ "id": "minha_carta", "text": "...", "options": [...] }]
}
```
3. ModLoader valida, sanitiza, prefixa `mod_` automaticamente.
4. Cards merge no deck builtin via `mergeWithDeck`.

---

## Decks disponíveis

| Deck key | Onde aparece | Trigger |
|----------|--------------|---------|
| `mid_match_manager` | Modo Manager during play | minutos 15/30/45/60/75 |
| `match_events_ata/def/mei/gol` | Modo Player carreira | drawCard durante partida |
| `bench_events` | Modo Player (banco) | semana de partida |
| `off_pitch_events` | Modo Player (fora) | semanal random |

---

## Schema completo de carta

```typescript
{
  id: string,            // obrigatório, prefix 'mod_' auto-injected
  text: string,          // obrigatório, PT-BR, sem HTML/scripts
  tier?: 'common' | 'uncommon' | 'rare' | 'legendary',  // default common
  options: Array<{       // obrigatório, 2-5 entries
    label: string,       // texto botão
    effect: {            // whitelist:
      moralDelta?: number,     // -20..20 (clamp)
      energyDelta?: number,    // -20..20
      tacticShift?: string,    // tactic key (offensive/defensive/etc)
      stress?: number,
      boss?: number,
      fans?: number,
      teammates?: number,
      sponsors?: number,
    },
    resultText: string    // PT-BR, narrativa do resultado
  }>
}
```

**Campos fora da whitelist são silenciosamente removidos** (segurança).

---

## Carregar mod (manual)

```javascript
import { load, mergeWithDeck } from '@/engine/ModLoader';
import { MidMatchManagerDeck } from '@/engine/MidMatchManagerDeck';

const response = await fetch('/mods/cards/sample-pack-br/midmatch-extras.json');
const json = await response.text();
const { valid, errors } = load(json);

if (errors.length > 0) {
  console.warn('Mod errors:', errors);
}

const enrichedDeck = mergeWithDeck(MidMatchManagerDeck, valid);
```

---

## Validações automáticas

- **HTML strip**: tags `<b>`, `<i>` etc removidos do texto
- **Script reject**: `<script>`, `<iframe>` etc → carta inteira rejeitada
- **Numeric clamp**: valores fora ±20 viram ±20
- **Foreign field strip**: `effect.hackVar` silenciosamente removido
- **Prefix `mod_`**: injetado se ausente (evita colisão com IDs builtin)
- **Duplicate IDs**: dentro do mesmo batch JSON, segunda ocorrência rejeitada

---

## Exemplo completo

Veja `/public/mods/cards/sample-pack-br/midmatch-extras.json`.

3 cartas BR-flavor:
- `carnival_celebration` (uncommon) — Salvador no carnaval
- `maracana_fortress` (rare) — Maracanã lotado
- `veteran_speech_halftime` (common) — capitão veterano

---

## Contribuir

1. Fork do repo
2. Cria pack em `/public/mods/cards/<seu-pack-id>/`
3. Adiciona JSON validado
4. Abre PR com:
   - Descrição do pack (5-10 linhas)
   - Lista de cartas
   - Atribuição (CC-BY-SA 4.0 ou compatível)
5. PR vai pra revisão da comunidade

---

## Limites

- Tamanho máximo de arquivo: 100KB (~50 cartas)
- Cartas por deck: ilimitado, mas balanceamento é responsabilidade do modder
- Sem código JS executável (só JSON puro)
- Sem assets externos (URLs de imagem rejeitadas)

---

## FAQ

**P: Posso criar deck novo?**
R: Por ora não. Use os 4 decks existentes. Deck novo = SPEC nova.

**P: Como testo localmente?**
R: Coloca JSON em `/public/mods/cards/<pack>/file.json`, abre console no jogo, importa ModLoader.load manualmente. Auto-wire em GameInitializer fica para SPEC-C4.2 (futuro).

**P: Posso traduzir cartas existentes?**
R: Não dessa via — edit direto no engine. ModLoader é pra ADICIONAR, não substituir.

---

**Versão**: 1.0 (SPEC-C4)
**Última atualização**: 2026-05-12
