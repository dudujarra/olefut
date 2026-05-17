# CODEX.md — espelho técnico para OpenAI Codex / GPT

Este arquivo existe para Codex/GPT ter o mesmo ponto de partida que Claude.
**Fonte canônica de verdade técnica é [`CLAUDE.md`](CLAUDE.md)** — lê esse arquivo primeiro.

---

## 🚨 FOUNDATION-FIRST ATIVO (desde 2026-05-12)

**Status**: Todos os Blocos Foundation DONE. Reliability Hardening DONE (AKITA-407~411). 1814+ testes, 145 specs.
**Fonte estratégica única**: [`specs/MASTER-ROADMAP-FOUNDATION-FIRST.md`](specs/MASTER-ROADMAP-FOUNDATION-FIRST.md)

**Os 10 mandamentos brutais** (sobrepõem-se temporariamente aos 7 Akita):
- Zero feature nova até Bloco 1 done
- Zero spec retroativa
- Zero emoji em código novo
- Zero inline style em código novo
- README/CLAUDE.md auto-gen (não editar manual)
- Playtest obrigatório por bloco
- Máximo 2 PRs/semana
- Domingo OFF

## Regras críticas (Protocolo AKITA)

Antes de qualquer ação produtiva neste repo:

1. Lê [`specs/MASTER-ROADMAP-FOUNDATION-FIRST.md`](specs/MASTER-ROADMAP-FOUNDATION-FIRST.md) — bloco atual + sub-tasks
2. Lê [`AKITA_RULES.md`](AKITA_RULES.md) — constituição (7 mandamentos)
3. Lê [`CLAUDE.md`](CLAUDE.md) — arquitetura, comandos, stack + 10 mandamentos brutais
4. Lê [`specs/SPEC-RULES.md`](specs/SPEC-RULES.md) — governance SDD
5. Roda `spec-check.sh "<descrição do trabalho>"` antes de tocar código. Exit 1/2 bloqueia.

## Resumo dos 7 mandamentos

1. **SDD obrigatório** — sem spec, sem trabalho.
2. **Regra 0** — toda spec entrega harness executável no mesmo PR. Sem harness = mentira.
3. **Zero vibe coding** — dev pensa, IA digita.
4. **`CLAUDE.md` fonte única** — toda decisão técnica mora lá.
5. **GitHub público dia 1** — build in public.
6. **Bug = ticket + fix + regression test** — 3-artefact pareados.
7. **LLM local default** — Ollama / `claude -p` subprocess. API paga proibida.

## Restrições específicas da engine

- `src/engine/` é headless. Zero React, zero DOM, zero `useState`.
- `src/components/` é read-only. Zero lógica de jogo, zero cálculo de tabela/OVR.
- Engine fala com React só via `src/context/GameContext`.
- Tudo random passa por `src/engine/rng.js` (seed determinístico).

## Gates obrigatórios antes de PR

```bash
npm run lint    # 0 erros
npm test        # tudo passa
npm run build   # 0 erros
```

PR sem SPEC/BUG linkado e sem harness = rejeitado.

---

Para qualquer outra coisa: **`CLAUDE.md`**.
