# Playtest Plan — ELIFOOT RPG (V2 release)

> **Data**: 2026-05-12
> **Goal**: Validar SPEC-F6.2 (mandamento brutal #7 satisfeito após sessão)
> **Owner**: Dudu

---

## Objetivo

Validar com 5 humanos BR se Fase A+B+C+V2 deliverables resolvem problemas de UX/jogabilidade flagged pelo brutal analysis. Métricas qualitativas + telemetria F6.1 capturando uso real.

---

## Recrutamento (Dudu)

### Perfil alvo
- 5 humanos brasileiros
- 18-45 anos
- Já jogou Brasfoot OU FM OU manager browser
- Aceita gravar sessão 30min (consent record)

### Canais de recrutamento
1. **Reddit r/futebol**: post "Estou desenvolvendo manager BR open source, busco 5 testadores"
2. **Twitter dev BR**: thread mostrando Chronicle export PNG do meu save
3. **Discord pessoal**: amigos cercanos (vies aceito pra primeira rodada)
4. **Tabnews**: post na seção "Show HN" estilo BR

Target: 7 inscritos pra garantir 5 que completam sessão.

---

## Roteiro de sessão (30 min cada)

| Tempo | Etapa | Observar |
|-------|-------|----------|
| 0-5 | Apresentação + termo de consentimento gravação | Comfortable, dúvidas |
| 5-7 | StartView: escolher clube + nome + dificuldade | Tempo decisão, dúvidas em dificuldade |
| 7-10 | Dashboard 1ª temp: OnboardingCoach + Rookie Sidebar | "Onde clico primeiro?", confusão com 4 entradas |
| 10-15 | 1ª partida: PreMatch decision-ready + match live | Lê tooltip? Escolhe tática informada? |
| 15-22 | 5+ partidas: Match Pause highlights + Mid-match cards + PostMortem | Sente impacto? Clica nas opções com intenção? |
| 22-25 | Fim de temporada se chegar: Chronicle modal + PNG export | "Quero compartilhar isso?" |
| 25-30 | Debrief: 5 perguntas qualitativas + telemetria export | Métricas honestas |

---

## Perguntas debrief (qualitativas)

1. **Em qual momento você quase fechou o jogo?** (descobrir friction)
2. **O que mais te surpreendeu positivamente?** (delight moments)
3. **Quais 3 mecânicas você usou mais? Quais ignorou?** (signal pra cortar)
4. **Você compartilharia esse jogo com amigo BR? Por quê?** (viralização)
5. **Se pudesse mudar UMA COISA, o que seria?** (prioridade #1)

---

## Métricas telemetria F6.1

User concede opt-in antes da sessão. Eventos capturados:

| Evento | Threshold sucesso |
|--------|-------------------|
| `save_start` | 5/5 |
| `match_played` | ≥3 por sessão (mostra retention <30min) |
| `view_opened` por view | DASHBOARD 100%, SQUAD 80%, STANDINGS 60%, outras decresce |
| `card_chosen` (mid-match) | ≥50% das cartas que aparecem |
| `aha_moment_dismissed` | ≥1 por sessão (significa aha apareceu) |
| `chronicle_exported` | ≥40% dos que chegam ao fim temp |
| `feature_used_first_time` | tracking quais features são descobertas |

---

## Análise pós-playtest (2h)

1. **Agregar telemetria** dos 5 testers (export JSON local)
2. **Comparar com hypothesis** dos SPECs implementados:
   - SPEC-180 Win Streak: alguém percebeu boost? (provável não, é sutil)
   - SPEC-A2 OnboardingCoach: 4/5 leram tooltips?
   - SPEC-F1.1 Highlight modal: 5/5 reconhecem gols como momentos especiais?
   - SPEC-F4.1 Chronicle enriched: nome de jogador aparece? Tester mencionou?
3. **Top 10 issues priorizados** por:
   - Severidade (bloqueia jogo / atrapalha / cosmético)
   - Frequência (5/5 testers / 3/5 / 1/5)
4. **Decisão**: o que fixa pré-launch vs pós-launch

---

## Cronograma sugerido

| Dia | Atividade |
|-----|-----------|
| Sáb | Dudu posta convites Reddit/Twitter |
| Dom-Qua | Inscrições + agendamento (target 7 confirms) |
| Qui-Sex | Sessões 30min (3-4 sessões/noite) |
| Sáb | Análise + top 10 issues |
| Dom | OFF |
| Seg seguinte | Sprint fix top 5 issues |

---

## Output esperado

- 5 gravações 30min (consent)
- 5 dumps telemetria localStorage exportada
- 1 doc `PLAYTEST-FINDINGS-<date>.md` com:
  - Top 10 issues priorizados
  - Quotes qualitativas mais reveladoras
  - Próximos passos concretos
  - Métricas vs hipóteses

---

## Anti-patterns a evitar

- ❌ Dudu intervir explicando o jogo durante sessão (vies "amigo do dev")
- ❌ Só amigos próximos (vies positivo)
- ❌ Sessão > 30 min (testador cansa, dados decay)
- ❌ Premiação que distorce comportamento ("ganha R$ se terminar 1 temp")
- ❌ Roteiro rígido demais (perde discoverable insights)

---

**SPEC-F6.2 satisfaz mandamento brutal #7** (playtest obrigatório por bloco).
**Próximo bloco só termina** quando este playtest rodar + findings doc commitado.

---

**Status**: 📋 PLAN — execução depende de Dudu (não-código)
