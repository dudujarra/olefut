# SPEC-156: ADR — Resolução de conflitos AKITA numbering em trabalho paralelo

**Tipo**: decision
**Status**: ✅ accepted
**Owner**: Dudu
**Decidida em**: 2026-05-11

---

## 1. Contexto

Sessão de 2026-05-11 produziu dois commits diferentes com `AKITA-203` (um em main: deep-soak fix; outro em branch claude/hardcore-spence: docs canônicas). Numeração sequencial em commits AKITA-XXX colide quando trabalho paralelo acontece (Dudu em main + agente em worktree).

## 2. Opções consideradas

| # | Opção | Pro | Contra |
|---|-------|-----|--------|
| A | Aceitar duplicação histórica | Zero retrabalho, histórico preservado | Confusão futura ao buscar `AKITA-203` em logs/CHANGELOG |
| B | Reservar range por author (main = 100-199, branches = 200-299) | Sem colisão | Coordenação manual obrigatória, range esgota |
| C | Prefixo de author (`AKITA-DUDU-203`, `AKITA-CLAUDE-204`) | Sem colisão, atribuição clara | Quebra hook de validação atual, todos commits antigos viram inconsistentes |
| D | `git fetch origin main` como primeiro tool call em toda sessão | Detecta divergência cedo, agente reusa próximo número livre | Disciplina de processo, não enforcement automático |
| E | Hook pre-commit que valida AKITA-XXX unicidade contra histórico | Hard enforcement | Lento em repos grandes, false positives em rebase |

## 3. Decisão

**Opção A + D combinadas**: aceitar duplicação histórica do passado + adotar `git fetch` como primeiro Bash em toda sessão futura.

## 4. Consequências

**Positivas**:
- Sem retrabalho de histórico existente.
- Próximas sessões evitam colisão via fetch precoce.
- Memory feedback `~/.claude/projects/-Users-dudujarra-Documents-ELIFOOT/memory/feedback_session_overhead.md` documenta a regra.

**Negativas / tradeoffs aceitos**:
- Histórico do projeto tem 2 commits com `AKITA-203` permanentemente.
- `git log --grep AKITA-203` retorna ambos. Mitigado por hash + data no output.

**Trabalho derivado**:
- Nenhum imediato. Próxima evolução: hook pre-commit (Opção E) se duplicação reincidir.

## 5. Validação

Como saberemos que a decisão funcionou:
- [ ] Próximas 5 sessões: 0 colisões AKITA-XXX detectadas
- [ ] `git fetch` aparece como primeiro Bash em 100% das sessões agente

## 6. Quando reabrir

Reabrir se:
- 2+ colisões adicionais em 30 dias → adotar Opção E (hook enforcement)
- Equipe cresce além de 2 contribuidores → adotar Opção C (prefixo author)

## 7. Referências

- Feedback memory: `~/.claude/projects/-Users-dudujarra-Documents-ELIFOOT/memory/feedback_session_overhead.md`
- Sessão pós-mortem que motivou: 2026-05-11
- Commits afetados: `b84d540` (main AKITA-203) + `ab9b9a3` (branch AKITA-203)
