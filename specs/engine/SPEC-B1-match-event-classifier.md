# SPEC-B1: Match Event Classifier + Pitch Backdrop CSS

> Status: **DRAFT — implementação parcial PR atual (helper + CSS)**
> Fase: B1 — Tornar PRAZEROSO
> Wiring MatchView (animação bola, hierarchy render): SPEC-B1.2 separate PR

---

## O que é

Helper pure que classifica eventos da partida em tiers visuais (`highlight` / `minor`) para hierarquia render. + CSS class `.ef-match-pitch-bg` que usa `pitch-topdown-32bit.png` como backdrop semitransparente.

Resolve problema #1 GAME-DESIGN-ROADMAP (sem dramatização): hoje todos eventos visualmente iguais. Player não distingue importante de filler.

Escopo deste PR: PURE classifier + CSS asset prep. Wiring no MatchView (handles 794 LOC god-view) fica B1.2 PR.

---

## Input

```typescript
{
  type: 'goal' | 'yellow' | 'red' | 'chance' | 'corner' | 'free-kick' | 'substitution' | 'injury' | 'narration',
}
```

---

## Output

```typescript
'highlight' | 'minor' | 'tactical'
```

- `highlight`: goal, red (críticos visuais — pause/modal candidate)
- `tactical`: substitution, injury (importantes mas não cinematic)
- `minor`: chance, corner, free-kick, yellow, narration (passam rápido)

---

## Regras

### 1. Mapping completo
- [ ] goal → highlight
- [ ] red → highlight
- [ ] substitution → tactical
- [ ] injury → tactical
- [ ] yellow → minor
- [ ] chance → minor
- [ ] corner → minor
- [ ] free-kick → minor
- [ ] narration → minor

### 2. Default safe
- [ ] Tipo desconhecido → minor (não promove ao destaque acidentalmente)

### 3. Determinístico

### 4. CSS layer
- [ ] `.ef-match-pitch-bg` aplica `pitch-topdown-32bit.png` como background com opacity 0.3
- [ ] Sem alterar layout existente

---

## Implementação

- **Novo**: `src/engine/MatchEventClassifier.js` (~40 LOC)
- **Modifica**: `src/styles/luxury-arcade.css` (+ classes pitch backdrop)
- **Novo harness**: `tests/specs/SPEC-B1-event-classifier.test.js`

---

**SPEC versão**: 1.0 (escopo minimal)
