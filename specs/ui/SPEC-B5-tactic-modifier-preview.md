# SPEC-B5: Tactic Modifier Preview

> Status: **DRAFT — implementação no mesmo PR**
> Fase: B5 — Tornar PRAZEROSO (versão minimal)

---

## O que é

Adiciona display de modifiers concretos (ATA ×N / DEF ×M) à seção tática do Dashboard. Resolve problema #2 do GAME-DESIGN-ROADMAP em escopo reduzido: player vê o número, não só "Defensivo busca brechas".

Versão completa (tooltip dinâmico vs oponente) fica para SPEC-B5.2 quando engine expor `getNextOpponent()`.

---

## Input/Output

- Lê `TACTICS[engine.currentTactic].ataModifier` e `.defModifier`
- Renderiza string "ATA ×N.NN / DEF ×N.NN" próximo à descrição

---

## Regras

### 1. Display
- [ ] Modifier exibido com 2 casas decimais
- [ ] Cor: ATA verde, DEF azul

### 2. Helper export
- [ ] `formatTacticModifiers(tacticKey)` retorna string formatada

### 3. Forbidden
- [ ] Sem alterar engine (read-only)

---

## Implementação

- **Novo helper**: `src/engine/TacticFormatter.js` (~30 LOC)
- **Modifica**: `src/components/DashboardView.jsx` (+5 LOC)
- **Novo harness**: `tests/specs/SPEC-B5-tactic-formatter.test.js`

---

**SPEC versão**: 1.0 (escopo minimal)
