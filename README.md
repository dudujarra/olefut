# ⚽ OléFUT

> **Football Manager + RPG depth + Brazilian flavor.**
> 100% Spec-Driven Development. Zero vibe coding. Open source.

🎮 **Live demo**: https://dudujarra.github.io/olefut/

[![CI](https://github.com/dudujarra/olefut/actions/workflows/ci.yml/badge.svg)](https://github.com/dudujarra/olefut/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-1814%2F1834-brightgreen)](https://github.com/dudujarra/olefut/tree/main/tests)
[![Specs](https://img.shields.io/badge/specs-145%2B-blue)](https://github.com/dudujarra/olefut/tree/main/specs)
[![SDD](https://img.shields.io/badge/SDD-100%25-purple)](https://github.com/dudujarra/olefut/blob/main/specs/SPEC-RULES.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

> 🥋 **Antes de tocar código: leia [`CLAUDE.md`](CLAUDE.md) + [`AKITA_RULES.md`](AKITA_RULES.md) + [`CONTRIBUTING.md`](CONTRIBUTING.md).**

---

## 🎯 O que é

**OléFUT** = simulador futebol brasileiro com profundidade RPG. Gerencia 1 de **170 clubes reais** (BR + EU + SA), treina elenco, negocia contratos, sobe divisões, constrói legado. 100% offline. Sem signup. Sem cobrança.

Construído via **SDD (Spec-Driven Development)** + **Protocolo AKITA**. Cada feature: spec → harness → implementação → validação. Zero código sem teste.

---

## 🎮 Gameplay

### Modo Treinador
- 4 divisões, 5 zonas regionais
- 8 formações × 6 táticas (1600 combinações rock-paper-scissors)
- Match Engine ao vivo, narração lance a lance
- 15 traits por jogador (Decisivo, Líder Nato, Cavalo de Aço…)
- Vestiário dinâmico (capitão estabiliza, cancer contamina)
- Career stats, Youth Academy 5 níveis, 5 sponsor tiers, 30 achievements
- Promo/Relegation automático

### Modo Jogador
- Carreira do banco à titularidade
- Relacionamentos: diretoria, torcida, sponsors, companheiros
- Stress + energia recursos limitados
- Star Rating + Renome por performance

### Sabor BR
- 90+ strings atmosfera regional (sol/chuva/calor/vestiário)
- 20 clubes BR com voz própria (Vasco, Sport Recife, Cruzeiro…)
- 4 eventos sazonais (Carnaval, Janela, Copa do Brasil, final ano)
- Derbies emergentes + memória histórica

---

## 🏗️ Stack

| Camada | Tech |
|--------|------|
| Engine | JavaScript ES2022 puro (headless, zero-UI) |
| UI | React 19 + Vite 8 |
| Tests | Vitest 4 |
| CI/CD | GitHub Actions (lint + tests + build + deploy) |
| Deploy | GitHub Pages (auto on main) |
| LLM | WebLLM browser-side (opcional, SPEC-119) |

---

## 📊 Estado (snapshot 2026-05-16)

| Métrica | Valor |
|---------|-------|
| Tests | 1814/1834 ✅ (252 unit tests AKITA-411) |
| Core regression | 61/61 ✅ |
| Specs | 145+ |
| Build | ~600ms, initial 376KB (gzip 110KB) |
| Lint | 0 errors |
| Clubes reais | 170 (10 países) |
| Backend LOC | ~30.924 (ESM puro, zero require()) |
| AKITA commits | 411+ |

---

## 🚀 Quick Start

```bash
git clone https://github.com/dudujarra/olefut.git
cd olefut
npm install
npm run dev          # http://localhost:5173
```

Build produção:
```bash
npm run build
npm run preview
```

---

## 🧪 Testing

```bash
npm test                 # full suite
npm run test:specs       # spec harnesses
npm run test:regression  # regression tests
npm run test:watch       # watch mode
```

---

## 🐛 Bug Workflow (Mandamento Akita #6)

> **Bug = ticket + fix + regression test (3 artefatos pareados).**

```bash
npm run bug:full "Lesão duplica weeks"
```

CI auto-roda series em todo PR. Templates forçam 3-artefact checklist.

---

## 📁 Arquitetura

```
src/
├── engine/          # Headless engine (zero React)
│   ├── engine.js    # Thin facade (323L — pure delegators)
│   ├── data.js
│   ├── db/          # 170 clubes BR/EU/SA + club-voices.json
│   ├── systems/     # FormSystem, DressingRoom, Achievements...
│   ├── tournaments/
│   └── [40+ systems] PlayerCareer, InjurySystem, BoardSystem...
├── components/      # React UI (read-only)
├── services/        # WeekProcessor, WeekMatchResult, MatchSimulator,
│                    # MatchPostMatch, SeasonProcessor + 14 season/ modules,
│                    # AutoPlayLab, GameInitializer, SaveService
├── context/         # GameContext (ponte Engine↔React)
└── styles/          # design-tokens, animations (SNES theme)

specs/               # 145+ specs (SDD source of truth)
tests/               # 1814+ tests (unit + integration + regression + e2e)
```

Detalhes: [`CLAUDE.md`](CLAUDE.md).

---

## 🥋 Protocolo AKITA — 7 mandamentos

1. **SDD obrigatório** — Sem spec, sem trabalho.
2. **Sem harness, sem spec** — Toda spec entrega harness no mesmo PR.
3. **Anti-vibe coding** — Dev pensa, IA digita.
4. **CLAUDE.md central** — Single source of truth técnica.
5. **GitHub público dia 1** — Build in public.
6. **Bug = ticket + fix + regression test** — 3 artefatos pareados.
7. **LLM local default** — API paga proibida.

Commits: `AKITA-XXX: Título — Descrição` (pre-commit hook valida).

---

## 🎨 Direção Arte — SNES Pacaembu Edition

32-bit Super Nintendo era. Paleta Pacaembu (verde grama 90s). Tokens em `src/styles/tokens/`. Sprites pixel-art em `public/sprites/` (170 club badges + 9 animações + 7 backdrops atmosféricos). Todos assets abstract/fictional (IP-safe).

---

## 🤝 Contributing

1. Issue criada (BUG-XXX ou FEAT-XXX)
2. Branch `bug/<id>` ou `feat/<id>`
3. SPEC vinculada
4. Harness no mesmo PR
5. CI verde
6. Commit format `AKITA-XXX: Título — Descrição`

---

## 📜 License

MIT — fork, customize, ship your own football manager.

---

## 🙏 Credits

Built by [@dudujarra](https://github.com/dudujarra) with **Claude Code** (Anthropic) sob Protocolo AKITA.

Inspirado por:
- **Elifoot 98** (Miguel Vasconcelos, BR classic) — homenagem ao jogo que ensinou uma geração brasileira o que é management football
- Football Manager (Sports Interactive)
- Hattrick (online manager classic)

---

**🎮 [Joga grátis](https://dudujarra.github.io/olefut/)** — sem signup, sem cookie, sem cobrança.

Feito com ❤️ + ⚽ + 🥋 disciplina Akita.
