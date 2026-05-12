# ELIFOOT RPG — SDD Master Guide

**Status**: 🔨 Em evolução (SDD ativo desde 2026-05-07)
**Total specs**: **97** (engine 39 + gameplay 15 + ui 6 + infra 7 + learning 10 + refactor 19 + telemetry 15 + raiz)
**Test files**: 87
**Tests passing**: 1044 / 1044 ✅ (AKITA-204 fechou bugs latentes pós-merge main AKITA-200..203)
**Codebase coverage**: ver `npm run mutate:report`
**Last updated**: 2026-05-11

> Documento anterior (FASE 1-5, 30 specs) está superseded pela contagem real.
> Roadmap canônico: [`specs/ROADMAP-NARRATIVE-MASTER.md`](specs/ROADMAP-NARRATIVE-MASTER.md).
> Arquitetura canônica: [`CLAUDE.md`](CLAUDE.md).

---

## Quick Start

### Se está começando:
1. Leia [SPEC-RULES.md](specs/SPEC-RULES.md) (governance)
2. Leia [SPEC-TEMPLATE.md](specs/SPEC-TEMPLATE.md) (exemplo preenchido)
3. Browse specs por categoria abaixo

### Se quer implementar:
1. Escolha rota: Completa (50h) | Híbrida (40h) | Referência (0h)
2. Siga [FASE-1-2-SUMMARY.md](FASE-1-2-SUMMARY.md) (core)
3. Depois [FASE-3-4-SUMMARY.md](FASE-3-4-SUMMARY.md) (secondary+infra)
4. Depois [FASE-5-SUMMARY.md](FASE-5-SUMMARY.md) (backlog)

### Se quer validar código:
```bash
spec-check.sh validate        # Checa specs contra código
spec-check.sh "descrição"     # Desbloqueia novo trabalho
npm test                      # Roda harnesses
npm run coverage              # Coverage report
```

---

## 30 Specs Organization

### FASE 2: Core Engine (8 specs) — 🔴 CRÍTICO

Cobrem 70% da lógica do game. Implementação obrigatória.

| Spec | Focus | Validações | Testes | Status |
|------|-------|------------|--------|--------|
| **SPEC-001** | Match simulation | 8 | 8+ | ✅ |
| **SPEC-002** | Event deck & rarity | 8 | 8+ | ✅ |
| **SPEC-003** | Player development | 8 | 8+ | ✅ |
| **SPEC-004** | Formation & tactics | 8 | 8+ | ✅ |
| **SPEC-005** | Injury system | 7 | 7+ | ✅ |
| **SPEC-006** | Board & confidence | 7 | 7+ | ✅ |
| **SPEC-007** | Personalities | 5 | 5+ | ✅ |
| **SPEC-008** | Stress & morale | 4 | 4+ | ✅ |

**Implementação recomendada**: Primeiro (semanal 1-3)

---

### FASE 3: Secondary Features (11 specs) — 🟡 ALTO

Expansões do engine. Gameplay profundo. Iterativas com FASE 2.

| Spec | Focus | Validações | Testes | Status |
|------|-------|------------|--------|--------|
| **SPEC-009** | Youth Academy | 6 | 6+ | ✅ |
| **SPEC-010** | Stadium system | 7 | 7+ | ✅ |
| **SPEC-011** | Staff roles | 4 | 4+ | ✅ |
| **SPEC-012** | Scouting regions | 7 | 7+ | ✅ |
| **SPEC-013** | Sponsors/revenue | 7 | 7+ | ✅ |
| **SPEC-014** | Seasons & tournaments | 7 | 7+ | ✅ |
| **SPEC-015** | Transfer market | 8 | 8+ | ✅ |
| **SPEC-016** | Contracts & salary | 8 | 8+ | ✅ |
| **SPEC-017** | Rivals & derbies | 7 | 7+ | ✅ |
| **SPEC-018** | National teams | 8 | 8+ | ✅ |
| **SPEC-019** | NPC AI behavior | 8 | 8+ | ✅ |

**Implementação recomendada**: Sequencial a FASE 2 (semana 4-5)

---

### FASE 4: Infrastructure (4 specs) — 🔴 CRÍTICO

DevOps, DB, CI/CD. Essencial para deploy.

| Spec | Focus | Validações | Testes | Status |
|------|-------|------------|--------|--------|
| **SPEC-020** | Database schema | 8 | 8+ | ✅ |
| **SPEC-021** | CI/CD pipeline | 6 | 6+ | ✅ |
| **SPEC-022** | Deploy & Pages | 7 | 7+ | ✅ |
| **SPEC-023** | Test coverage | 7 | 7+ | ✅ |

**Implementação recomendada**: Paralelo c/ FASE 3 (semana 4-6)

---

### FASE 5: Backlog & Polish (7 specs) — 🟢 MÉDIO

Qualidade de vida, estatísticas, achievements. Nice-to-have.

| Spec | Focus | Validações | Testes | Status |
|------|-------|------------|--------|--------|
| **SPEC-024** | Weather system | 8 | 8+ | ✅ |
| **SPEC-025** | Player aging | 8 | 8+ | ✅ |
| **SPEC-026** | Prestige/ranking | 8 | 8+ | ✅ |
| **SPEC-027** | News & headlines | 7 | 7+ | ✅ |
| **SPEC-028** | Analytics & stats | 8 | 8+ | ✅ |
| **SPEC-029** | Achievements | 8 | 8+ | ✅ |
| **SPEC-030** | Customization | 6 | 6+ | ✅ |

**Implementação recomendada**: Fim (semana 7+, post-MVP)

---

## Documento índice

### FASE 1: Foundation
- [SPEC-RULES.md](specs/SPEC-RULES.md) — Governance SDD
- [SPEC-TEMPLATE.md](specs/SPEC-TEMPLATE.md) — Template example

### FASE 2: Core (8 engine specs)
- [SPEC-001: Match Engine](specs/engine/SPEC-001-match-engine-simulation.md)
- [SPEC-002: Match Events](specs/engine/SPEC-002-match-events-deck.md)
- [SPEC-003: Player Dev](specs/engine/SPEC-003-player-development.md)
- [SPEC-004: Formation & Tactic](specs/engine/SPEC-004-formation-tactic-system.md)
- [SPEC-005: Injury System](specs/engine/SPEC-005-injury-system.md)
- [SPEC-006: Board System](specs/engine/SPEC-006-board-system.md)
- [SPEC-007: Personality](specs/engine/SPEC-007-personality-system.md)
- [SPEC-008: Stress & Morale](specs/engine/SPEC-008-stress-system.md)

### FASE 3: Secondary (11 specs)
- [SPEC-009: Youth Academy](specs/engine/SPEC-009-youth-academy.md)
- [SPEC-010: Stadium](specs/engine/SPEC-010-stadium-system.md)
- [SPEC-011: Staff](specs/engine/SPEC-011-staff-system.md)
- [SPEC-012: Scouting](specs/engine/SPEC-012-scouting-system.md)
- [SPEC-013: Sponsors](specs/engine/SPEC-013-sponsors-system.md)
- [SPEC-014: Season & Tournament](specs/engine/SPEC-014-season-tournament-system.md)
- [SPEC-015: Market & Transfer](specs/engine/SPEC-015-market-transfer-system.md)
- [SPEC-016: Contracts & Salary](specs/engine/SPEC-016-contracts-salary-system.md)
- [SPEC-017: Rivals & Derby](specs/engine/SPEC-017-rivals-derby-system.md)
- [SPEC-018: National Team](specs/engine/SPEC-018-national-team-system.md)
- [SPEC-019: NPC AI](specs/engine/SPEC-019-npc-ai-system.md)

### FASE 4: Infrastructure (4 specs)
- [SPEC-020: Database Schema](specs/infra/SPEC-020-database-schema.md)
- [SPEC-021: CI/CD Pipeline](specs/infra/SPEC-021-ci-cd-pipeline.md)
- [SPEC-022: Deploy & GitHub Pages](specs/infra/SPEC-022-deploy-github-pages.md)
- [SPEC-023: Test Coverage](specs/infra/SPEC-023-test-coverage.md)

### FASE 5: Backlog (7 specs)
- [SPEC-024: Weather System](specs/engine/SPEC-024-climate-weather-system.md)
- [SPEC-025: Player Aging](specs/engine/SPEC-025-advanced-player-aging.md)
- [SPEC-026: Prestige & Ranking](specs/engine/SPEC-026-prestige-reputation-system.md)
- [SPEC-027: News & Announcements](specs/engine/SPEC-027-news-announcements-system.md)
- [SPEC-028: Analytics & Stats](specs/engine/SPEC-028-analytics-statistics-system.md)
- [SPEC-029: Achievements](specs/engine/SPEC-029-achievements-milestones-system.md)
- [SPEC-030: Customization](specs/ui/SPEC-030-customization-preferences-system.md)

### Summaries
- [FASE-1-2-SUMMARY.md](FASE-1-2-SUMMARY.md) — Foundation + Core
- [FASE-3-4-SUMMARY.md](FASE-3-4-SUMMARY.md) — Secondary + Infra
- [FASE-5-SUMMARY.md](FASE-5-SUMMARY.md) — Backlog + Overall stats

---

## How to Use

### For implementers:
1. Pick a SPEC (ex: SPEC-001)
2. Read the spec document completely
3. Write harness tests (define contracts)
4. Implement code
5. Run `npm test` — harness validates against code
6. CI blocks if harness fails
7. Commit with `AKITA-XXX: message`

### For reviewers:
1. Check PR against SPEC
2. Validate inputs/outputs/forbidden match spec
3. Check harness passes
4. Sign off on spec alignment

### For architects:
1. Compare specs across modules (look for gaps)
2. Validate dependencies (SPEC-X depends on SPEC-Y)
3. Plan parallelizable work
4. Identify refactor opportunities

---

## Stats at a Glance

| Métrica | Valor |
|---------|-------|
| Total specs | 30 |
| Total linhas | 6009 |
| Validações | 218 |
| Forbidden cases | 125+ |
| Test cases | 240+ |
| Estimated implementation | 40-50h |
| Code coverage | 92% |
| Git commits | 5 (AKITA-021 a -025) |

---

## Implementation Paths

### Path A: Complete Build (50h, 7 weeks)
- Week 1: Validate FASE 2 vs code
- Weeks 2-3: Implement FASE 2 features
- Weeks 4-5: Implement FASE 3 features
- Week 6: Setup FASE 4 infra
- Week 7: FASE 5 polish

**Output**: Full ELIFOOT game, 100% spec-covered, deployed to GitHub Pages

### Path B: Hybrid Build (40h, 5-6 weeks)
- Week 1: Harnesses + CI setup
- Weeks 2-4: Implement FASE 2-3 incrementally
- Week 5: Deploy + FASE 4 infra
- Week 6: FASE 5 (optional)

**Output**: MVP game core, automated testing, continuous deploy

### Path C: Reference (0h)
- Archive specs as documentation
- Link specs from README
- Backlog for future implementation

**Output**: Complete game design document, zero code built

---

## Next Actions

- [ ] Choose implementation path (A/B/C)
- [ ] If building: `spec-check.sh --init` (setup pre-commit)
- [ ] If building: Setup GitHub Actions (`SPEC-021`)
- [ ] If building: Create harness tests (`SPEC-001.test.js` first)
- [ ] Commit with AKITA number format
- [ ] Link specs in README & CLAUDE.md

---

## Support & Questions

- **Spec unclear?** → Read the tests (show expected behavior)
- **Multiple valid implementations?** → Check Forbidden (shows constraints)
- **Missing validation?** → File issue with module/lines affected
- **Need to add spec?** → Follow SPEC-RULES.md template
- **Ready to ship?** → Check all harnesses pass + coverage ≥ 80%

---

**Created**: 2026-05-07  
**Spec-driven development**: ✅  
**Ready for build**: ✅  
**Happy coding!** 🎮⚽
