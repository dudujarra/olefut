# 📖 OléFUT — Manual Completo

> Versão: 1.0 | Data: 2026-05-07 | Protocolo: AKITA

---

## PARTE 1: O JOGO

### 1.1 O que é o OléFUT RPG?

Um **soccer manager RPG** no estilo clássico dos jogos OléFUT, reconstruído como aplicação web moderna. Você assume o papel de um **treinador** (ou **jogador**) e gerencia todos os aspectos de um clube de futebol: escalação, tática, contratações, finanças, base, estádio e competições.

O jogo é baseado em **turnos semanais**: cada semana você toma decisões, treina o elenco e joga uma partida. As temporadas duram 38 rodadas.

### 1.2 Modos de Jogo

| Modo | Descrição |
|---|---|
| 🧑‍💼 **Treinador** | Controle total: escalação, tática, mercado, finanças, staff |
| ⚽ **Jogador** | Você é um jogador. Controla treino pessoal e decisões de carreira |

### 1.3 Cenários (Modo Treinador)

| Cenário | Efeito |
|---|---|
| 🌍 **Sandbox** | Orçamento normal. Liberdade total |
| 📉 **Gigante Caído** | Orçamento reduzido em 90%. Desafio extremo |

---

## PARTE 2: GAMEPLAY — CICLO SEMANAL

### 2.1 Dashboard (Centro de Comando)

O dashboard é dividido em abas:

**📊 Visão Geral**
- Semana atual, saldo, próximo jogo
- Status da diretoria (😊 Satisfeita → 🔥 Furiosa)
- Dicas do treinador (primeiras 2 semanas)
- Prêmios da temporada

**⚽ Táticas**
- Escolha a formação (4-3-3, 4-4-2, 3-5-2, 5-3-2, 4-2-3-1, 4-1-4-1, 3-4-3, 5-4-1)
- Escolha a tática de jogo (Normal, Ofensivo, Defensivo, Pressão, Contra-Ataque, Posse)
- Selecione o tipo de treino semanal

**🏟️ Clube**
- Upgrade de estádio (5 níveis: Campo Municipal → Templo do Futebol)
- Contratação de staff (Fisioterapeuta, Olheiro, Preparador, Financeiro, Treinador de Base)
- Upgrade da academia de base (5 níveis)
- Patrocínio atual

### 2.2 Formações

| Formação | Estilo | Uso ideal |
|---|---|---|
| 4-3-3 | Equilibrado | Padrão |
| 4-4-2 | Equilibrado | Meio-campo forte |
| 3-5-2 | Ofensivo | Dominar posse |
| 5-3-2 | Defensivo | Segurar resultado |
| 4-2-3-1 | Posse | Controle total |
| 4-1-4-1 | Contra-ataque | Explorar velocidade |
| 3-4-3 | Ultra-ofensivo | Arriscado (-5 moral) |
| 5-4-1 | Retranca | Último recurso (-5 moral) |

### 2.3 Táticas

O sistema usa **pedra-papel-tesoura tático**:

| Tática | Forte contra | Fraca contra |
|---|---|---|
| Ofensivo | Pressing, Posse | Defensivo, Contra |
| Defensivo | Ofensivo | Pressing |
| Pressing | Defensivo, Posse | Contra-Ataque |
| Contra-Ataque | Pressing, Ofensivo | Defensivo |
| Posse | Defensivo | Pressing |

### 2.4 Treinos

| Tipo | Atributo | Energia | Moral |
|---|---|---|---|
| 🏃 Preparação Física | FIS +1 | +20 | -2 |
| 📋 Tático | DEF +1 | +5 | 0 |
| ⚽ Técnico | CRI +1 | +5 | 0 |
| 🎯 Ataque | FIN +1 | +5 | -1 |
| 😴 Folga | — | +35 | +3 |
| 💀 Dobrado | TODOS +1 | -15 | -8 |

O treino retorna feedback detalhado por jogador: `📈 Atributo: X → Y`.

### 2.5 Team Talks (Preleção)

| Preleção | Efeito | Melhor quando |
|---|---|---|
| 💪 Motivacional | +5 moral, ATK +10% | Sequência ruim |
| 🧘 Calma | +2 moral, DEF +5% | Sequência boa |
| 🔥 Agressivo | -3 moral, ATK +20%, DEF -10% | Jogão |
| ⚠️ Ameaçador | -8 moral, ATK/DEF +15% | Elenco acomodado |
| 📋 Tático | ATK +5%, DEF +10% | Sempre |
| 😎 Descontraído | +3 moral, +5 energia | Jogo fácil |

### 2.6 Condições de Jogo

Sorteadas aleatoriamente antes de cada partida:

| Condição | Probabilidade | Efeito |
|---|---|---|
| ☀️ Tempo bom | 40% | Neutro |
| 🌧️ Chuva | 15% | ATK/DEF -10%, energia +20% |
| 🔥 Calor | 10% | Energia +50% |
| 🏟️ Lotado | 15% | ATK/DEF +10% |
| 🌙 Noturno | 10% | ATK +5%, energia -10% |
| ⚡ Clássico | 5% | ATK/DEF +15%, energia +30% |
| 📺 TV Nacional | 5% | ATK +5% |

---

## PARTE 3: PARTIDA AO VIVO

### 3.1 Pré-Jogo (Wizard de 3 Passos)

1. **Escalação**: Verifica titulares, energia baixa, setores fracos
2. **Tática & Preleção**: Escolhe tática e faz preleção ao time
3. **Confirmação**: Revisão final + condição climática revelada

### 3.2 Cronômetro & Narração

- Cronômetro de 0' a 90' (1º tempo: 0-45, 2º tempo: 45-90)
- Narração lance a lance com eventos contextuais por tática
- Placar ao vivo atualizado em tempo real
- Controles de velocidade: **1x** (200ms), **2x** (100ms), **5x** (40ms)
- Botão **Pular** para ir direto ao fim do tempo

### 3.3 Intervalo

- Placar parcial
- Opção de substituição (1 por jogo)
- Opção de mudança tática
- Inicia 2º tempo

### 3.4 Fim de Jogo

- Placar final, artilheiro, assistências
- Estatísticas do jogo
- Botão volta ao dashboard (reseta todo o state do pré-jogo)

---

## PARTE 4: MERCADO & SCOUTING

### 4.1 Abas do Mercado

| Aba | Função |
|---|---|
| **Comprar** | Lista de jogadores disponíveis. Contrata direto |
| **Vender** | Reservas vendáveis. Negociação com contra-propostas (3 rodadas) |
| **Scout** | Enviar olheiros a 5 regiões do mundo |

### 4.2 Regiões de Scouting

| Região | Tier | Custo |
|---|---|---|
| 🇧🇷 Brasil | 2 | Grátis |
| 🇦🇷 Argentina | 2 | R$ 50K |
| 🇪🇺 Europa | 1 | R$ 200K |
| 🌍 África | 3 | R$ 30K |
| 🌏 Ásia | 3 | R$ 20K |

- **Com olheiro contratado**: 5 jogadores revelados (OVR visível)
- **Sem olheiro**: 2 jogadores, OVR escondido ("??")

### 4.3 Negociação de Venda

Sistema de 3 rodadas:
1. Valor de mercado proposto
2. Contra-proposta (+15%)
3. Última chance (+15% da contra)

Se recusar as 3, negociação encerrada.

---

## PARTE 5: GESTÃO DO CLUBE

### 5.1 Elenco (SquadView)

- Tabela completa: Nome, Posição, OVR, Energia, Moral, Forma, Idade, Contrato, Lesão
- Ações: ⭐ Titular/Reserva, 📤 Empréstimo (≤23 anos), 💰 Vender, 📝 Renovar
- Traits visíveis por jogador
- Estatísticas da temporada (Gols, Assistências)

### 5.2 Staff (5 cargos)

| Cargo | Custo/sem | Efeito |
|---|---|---|
| 🏥 Fisioterapeuta | R$ 50K | -50% lesão, +5 energia/sem |
| 🔍 Olheiro | R$ 40K | Scout revela 5 jogadores com OVR |
| 💪 Prep. Físico | R$ 45K | +1 atributo no treino, menos cansaço |
| 💰 Dir. Financeiro | R$ 60K | +10% receita, -10% salários |
| 🎓 Trein. Base | R$ 35K | +1 OVR jovens, academia +1 nível |

### 5.3 Estádio (5 níveis)

| Nível | Nome | Capacidade | VIP | Ingresso | Custo upgrade |
|---|---|---|---|---|---|
| 1 | Campo Municipal | 5.000 | 100 | R$ 20 | — |
| 2 | Arena Regional | 15.000 | 500 | R$ 30 | R$ 10M |
| 3 | Estádio Moderno | 35.000 | 2.000 | R$ 40 | R$ 40M |
| 4 | Arena Premium | 55.000 | 5.000 | R$ 55 | R$ 100M |
| 5 | Templo do Futebol | 80.000 | 10.000 | R$ 70 | R$ 250M |

### 5.4 Academia de Base

- Gera jovens (15-17 anos) anualmente
- Qualidade depende do nível (1-5) e reputação
- Custo de upgrade: R$ 5M → R$ 15M → R$ 40M → R$ 100M

### 5.5 Diretoria (BoardSystem)

- **Confiança**: 0-100 (começa em 60)
- **Período de graça**: 8 semanas iniciais
- **Fatores**: Posição na liga, sequência, moral do elenco, finanças
- **Demissão**: Confiança < 10 = **GAME OVER**

| Confiança | Status |
|---|---|
| ≥ 70 | 😊 Satisfeita |
| 45-69 | 🤔 Observando |
| 25-44 | 😤 Insatisfeita |
| < 25 | 🔥 Furiosa |

---

## PARTE 6: SISTEMA DE JOGADORES

### 6.1 Atributos (5)

| Attr | Significado | Posição principal |
|---|---|---|
| FIS | Físico | Todos |
| DEF | Defesa | GOL, DEF |
| CRI | Criatividade | MEI |
| FIN | Finalização | ATA |
| REF | Reflexos | GOL |

### 6.2 OVR (Overall)

Calculado por posição:
- **GOL**: REF×0.5 + DEF×0.2 + FIS×0.3
- **DEF**: DEF×0.6 + FIS×0.25 + CRI×0.15
- **MEI**: CRI×0.5 + FIS×0.2 + FIN×0.15 + DEF×0.15
- **ATA**: FIN×0.5 + FIS×0.25 + CRI×0.25

### 6.3 Desenvolvimento

| Fase | Idade | Efeito |
|---|---|---|
| Crescimento | 16-24 | Chance de +1/+2 por semana |
| Pico | 25-30 | Estável |
| Declínio | 31+ | 4%/ano de chance de -1 |
| Aposentadoria | 35+ | 15%/ano de chance |

Personalidade afeta crescimento:
- Profissional: ×1.3
- Ambicioso: ×1.2
- Determinado: ×1.15
- Casual: ×0.9
- Preguiçoso: ×0.7

### 6.4 Forma (Hot/Cold)

Baseado nas últimas 5 partidas:
- 🔥 **Hot** (avg ≥ 0.6): +8% performance
- ❄️ **Cold** (avg ≤ -0.4): -8% performance
- Normal: sem modificador

### 6.5 Vestiário (Dressing Room)

- **Líder** (≥28 anos, moral ≥65): Estabiliza até 3 jogadores tristes (+3 moral)
- **Câncer** (4+ jogadores com moral <30): -2 moral pra todo mundo
- **Boas vibes** (6+ jogadores com moral >75): +1 moral pra todos
- **Capitão**: Jogador mais velho com moral alta (ícone ©️)

### 6.6 Contratos & Renovação

- Contrato em semanas (38 = 1 temporada)
- Renovação disponível quando ≤12 semanas restantes
- Salário negociado considera: idade, forma, personalidade, moral
- Jogador com moral <30 **recusa renovar**

### 6.7 Empréstimos

- Disponível para jogadores ≤23 anos, reservas, sem lesão
- Duração: 20 semanas
- 70% de chance de voltar melhorado (+1 a +3 OVR) se jovem
- 30% se veterano
- Fracasso: -1 OVR, -10 moral

---

## PARTE 7: COMPETIÇÕES

### 7.1 Tipos de Torneio

| Tipo | Formato | Exemplo |
|---|---|---|
| **Liga** | Pontos corridos (38 rodadas) | Liga BRA Div 1, Liga ESP Div 1 |
| **Copa** | Eliminatórias (mata-mata) | Copa do Brasil |
| **Continental** | Fase de grupos + mata-mata | Libertadores, Champions League |

### 7.2 Ligas

Uma liga por zona/divisão. Times jogam todos contra todos (ida e volta).

### 7.3 Copa do Brasil

Eliminatórias com todos os times brasileiros. Rodadas específicas ao longo da temporada.

### 7.4 Libertadores

- Top 4 BRA Div 1
- Top 4 ARG Div 1
- Top 2 URU, CHI
- Top 4 COL
- Fase de grupos (3 rodadas) → Mata-mata (3 rodadas)

### 7.5 Champions League

- Top 4 de ENG, ESP, ITA, GER, FRA
- Fase de grupos → Mata-mata

---

## PARTE 8: FINANÇAS

### 8.1 Receitas

- **Bilheteria**: Capacidade × ocupação × preço (VIP = 3x)
- **Patrocínio**: Avaliado pela divisão e reputação
- **Premiação**: Baseada na posição final

### 8.2 Despesas

- **Salários**: Soma dos salários do elenco (semanal)
- **Staff**: Soma dos salários do staff contratado
- **Scouting**: Custo por região

### 8.3 Saldo Negativo

- Diretoria perde confiança (-1/semana)
- Pode levar a demissão

---

## PARTE 9: BANCO DE DADOS

### 9.1 Regiões

| Zona | Times |
|---|---|
| 🇧🇷 BRA | Div 1, Div 2, Div 3 |
| 🇦🇷 ARG | Div 1 |
| 🇺🇾 URU | Div 1 |
| 🇨🇱 CHI | Div 1 |
| 🇨🇴 COL | Div 1 |
| 🏴 ENG | Div 1 |
| 🇪🇸 ESP | Div 1 |
| 🇮🇹 ITA | Div 1 |
| 🇩🇪 GER | Div 1 |
| 🇫🇷 FRA | Div 1 |

---

# PARTE 10: ARQUITETURA TÉCNICA

## 10.1 Stack

| Camada | Tecnologia |
|---|---|
| Build | Vite 8 |
| UI | React 19 |
| CSS | Vanilla CSS (dark theme) |
| Testes | Vitest 4 |
| Engine | JavaScript puro (sem deps) |
| Deploy | GitHub Pages (dist/) |

## 10.2 Estrutura de Arquivos

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router (52 linhas)
├── index.css                   # Design system (341 linhas)
├── context/
│   └── GameContext.jsx         # State management (46 linhas)
├── components/                 # UI (8 views, 1868 linhas)
│   ├── StartView.jsx           # Setup + seleção de time
│   ├── DashboardView.jsx       # Centro de comando (418 linhas)
│   ├── MatchView.jsx           # Partida ao vivo (581 linhas)
│   ├── SquadView.jsx           # Plantel
│   ├── MarketView.jsx          # Mercado + scouting
│   ├── StandingsView.jsx       # Classificação
│   ├── PlayerDashboardView.jsx # Dashboard modo jogador
│   └── PlayerMatchView.jsx     # Partida modo jogador
└── engine/                     # Lógica do jogo (3915 linhas)
    ├── engine.js               # Core (901 linhas)
    ├── data.js                 # Gerador de jogadores
    ├── ManagerSystems.js       # Táticas, treino, talks
    ├── PlayerDevelopment.js    # Aging, form, vestiário
    ├── PlayerTraits.js         # Traits (24 traits)
    ├── PlayerCareer.js         # Modo jogador
    ├── BoardSystem.js          # Diretoria
    ├── StadiumSystem.js        # Estádio, staff, scouting
    ├── YouthAcademy.js         # Base + empréstimos
    ├── InjurySystem.js         # Lesões
    ├── SeasonSystem.js         # Transição de temporada
    ├── PressConference.js      # Entrevistas
    ├── MatchEventsDeck.js      # Eventos de jogo
    ├── BenchEventsDeck.js      # Eventos de banco
    ├── OffPitchEventsDeck.js   # Eventos fora de campo
    ├── db/                     # Banco de times reais
    │   ├── brazil.js
    │   ├── europe.js
    │   ├── south_america.js
    │   └── index.js
    ├── decks/                  # Cards de evento por posição
    │   ├── MatchCardsATA.js
    │   ├── MatchCardsDEF.js
    │   ├── MatchCardsGOL.js
    │   └── MatchCardsMEI.js
    └── tournaments/            # Sistemas de competição
        ├── Tournament.js       # Base class
        ├── League.js           # Pontos corridos
        ├── KnockoutCup.js      # Eliminatórias
        └── ContinentalCup.js   # Grupos + mata-mata
```

## 10.3 Fluxo de Dados

```
GameContext (state global)
  ↓
  Engine (lógica pura, sem React)
  ↓
  Components (UI, leem da engine via getEngine())
  ↓
  forceUpdate() → re-render
```

**Regra fundamental**: Componentes **nunca** mutam state da engine diretamente. Sempre chamam métodos da engine (`engine.sellPlayer()`, `engine.signScoutedPlayer()`, etc).

## 10.4 Engine — Métodos Públicos

### Ciclo de Jogo
| Método | Descrição |
|---|---|
| `initGame(name, teamId, mode, scenario)` | Inicializa partida |
| `advanceWeek()` | Avança 1 semana (treino, finanças, partida) |
| `playMatch(homeId, awayId)` | Simula partida completa |
| `getTeam(id)` | Retorna time por ID |
| `getStandings(zone, div)` | Retorna classificação |
| `getTeamSectors(teamId)` | Força por setor (ATK/MEI/DEF/GOL) |

### Mercado & Scouting
| Método | Descrição |
|---|---|
| `doScouting(regionId)` | Executa scouting |
| `scoutRegionAction(regionId)` | Alias de doScouting |
| `signScoutedPlayer(index)` | Contrata jogador scoutado |
| `sellPlayer(playerId, amount)` | Vende jogador |
| `generateMarket()` | Gera lista de jogadores no mercado |

### Staff & Infraestrutura
| Método | Descrição |
|---|---|
| `hireStaff(roleId)` | Contrata membro do staff |
| `upgradeStadium()` | Upgrade do estádio |
| `upgradeAcademy()` | Upgrade da base |
| `loanPlayer(playerId)` | Empresta jogador |
| `renewContract(playerId)` | Renova contrato |

---

# PARTE 11: QA & TESTES

## 11.1 Suite de Testes

| Arquivo | Testes | Tipo |
|---|---|---|
| `tests/engine.test.js` | 17 | Unit tests (engine methods) |
| `tests/static-checks.test.js` | 20 | Source code patterns |
| **Total** | **37** | — |

## 11.2 Comandos

```bash
npm test              # Roda todos os testes
npm run test:watch    # Watch mode
npm run test:ci       # Testes + build
```

## 11.3 Bug Sweep Skill

```bash
./scripts/olefut-bug-sweep.sh          # Sweep completo
./scripts/olefut-bug-sweep.sh scan     # Só varredura
./scripts/olefut-bug-sweep.sh test     # Só testes
./scripts/olefut-bug-sweep.sh ci       # Testes + build
./scripts/olefut-bug-sweep.sh report   # Gera relatório
```

### 8 Checks Estáticos:
1. Métodos UI vs Engine (missing methods)
2. Imports mortos
3. Null-safety em eventos
4. State resets entre fases
5. Mutação direta de state
6. Timer cleanup (memory leaks)
7. Speed ref pattern
8. Mobile responsiveness

### Trigger por voz:
Diga **"caça bug"**, **"debugga"**, **"QA"** ou **"testa tudo"** ao agente.

## 11.4 Bugs Resolvidos (Histórico)

| ID | Severidade | Descrição | Fix |
|---|---|---|---|
| BUG-001 | 🔴 | `scoutRegionAction` não existia | Alias criado |
| BUG-002 | 🔴 | `signScoutedPlayer` não existia | Método implementado |
| BUG-003 | 🟡 | Speed não atualizava ticker | speedRef + restart |
| BUG-004 | 🟡 | preStep/talkDone não resetavam | Reset no fulltime |
| BUG-005 | 🟢 | Import morto no MarketView | Removido |
| BUG-006 | 🟢 | Squad mutado diretamente (Market) | engine.sellPlayer() |
| BUG-007 | 🟡 | handleBuy filter assignment | splice() |
| BUG-008 | 🟡 | SquadView mutação direta | engine.sellPlayer() |
| BUG-009 | 🟡 | skipToEnd duplicava eventos | Merge + dedup |

---

# PARTE 12: BOAS PRÁTICAS

## 12.1 Arquitetura

1. **Engine é pura**: Zero dependências de React. Pode ser testada isoladamente
2. **UI é burra**: Componentes só leem e chamam métodos. Nunca calculam lógica de jogo
3. **State via Context**: Um único `GameContext` gerencia o estado global
4. **forceUpdate()**: Padrão usado para re-render após mutações na engine

## 12.2 Código

1. **Sem mutação direta**: Sempre use métodos da engine (`engine.sellPlayer()` em vez de `team.squad = ...`)
2. **Refs para timers**: Sempre use `useRef` para `setInterval` IDs + cleanup no unmount
3. **Speed via ref**: `speedRef.current` em vez de `speed` state dentro de `setInterval`
4. **Optional chaining**: Sempre use `e?.text` ao acessar propriedades de eventos que podem ser null

## 12.3 Testes

1. **Todo bug gera ticket** → `BUGS.md`
2. **Todo ticket gera teste** → `tests/`
3. **Todo fix roda sweep** → `./scripts/olefut-bug-sweep.sh`
4. **Testes estáticos** validam padrões no source code (imports, refs, state resets)
5. **Testes unitários** validam contratos de métodos da engine

## 12.4 Git

- Prefixo `🐛` para bug fixes
- Prefixo `🛠️` para infra/tooling
- Commit detalhado com lista de bugs/testes
- Push automático após validação

## 12.5 Protocolo AKITA

O protocolo AKITA define o ciclo de qualidade:
1. **Varredura** → Scan estático do código
2. **Ticket** → Documentar em BUGS.md
3. **Fix** → Implementar correção
4. **Teste** → Criar teste automatizado
5. **Validação** → Sweep completo (scan + test + build)
6. **Commit** → Git push com relatório

---

# PARTE 13: DESIGN SYSTEM

## 13.1 Tema

- **Dark mode** com variáveis CSS customizadas
- Paleta: `--primary` (verde), `--accent` (amarelo), `--danger` (vermelho)
- Glassmorphism nos cards (`backdrop-filter: blur`)
- Animações de fade-in e hover

## 13.2 Responsividade

- Classe `.hide-mobile` esconde colunas em telas pequenas
- Tabelas com `overflow-x: auto`
- Botões com tamanho mínimo touch-friendly

## 13.3 Componentes CSS

| Classe | Uso |
|---|---|
| `.card` | Container principal |
| `.card-compact` | Card menor |
| `.btn-primary/secondary/danger` | Botões |
| `.btn-sm` | Botão pequeno |
| `.nav-tabs` | Abas de navegação |
| `.standings-table` | Tabela de classificação |
| `.event-toast` | Notificação |
| `.inline-stats` | Stats horizontais |
| `.fade-in` | Animação de entrada |

---

*Documento gerado automaticamente pelo protocolo AKITA-018/019/020.*
*Última atualização: 2026-05-07 21:36 BRT*
