# ELIFOOT RPG — Roadmap pra virar JOGO (não codebase)

> **Data**: 2026-05-12
> **Auditor**: Claude Opus 4.7 (sessão investigativa 30min)
> **Premissa do Dudu**: técnico tá OK. Falta jogabilidade real.
> **Veredito brutal**: o sintoma da auditoria interna ("zero das 40 features tem E2E real") é o sintoma do diagnóstico maior — **o jogo é uma planilha de sistemas, não uma experiência de jogo**.

---

## 1. TL;DR — Onde estamos vs onde precisamos chegar

**O jogo hoje (player perspective).** ELIFOOT é um simulador de gestão de futebol BR de 1ª temporada que abre num menu retrô SNES, te deixa escolher 1 de 170 clubes e te derruba num dashboard com 7 painéis simultâneos (finanças, treino, tática, staff, scouting, base, diretoria) + um botão "JOGAR PARTIDA" que dispara uma simulação Top-Down sem visual de campo (apenas log textual de eventos com emoji + animações de gol). Há **modo Manager** (default) e **modo Jogador** (RPG carreira individual — sub-jogo separado e oculto, ~5% dos usuários). 13 views no sidebar — quase todas listas e tabelas; nenhuma cinemática, nenhum mini-game, nenhuma surpresa proativa. Em 2 horas você joga ~10 temporadas via "JOGAR PARTIDA → ver resultado → JOGAR PARTIDA". Não há tutorial real (5 telas de texto que terminam antes do primeiro clique no jogo), nem narrativa orgânica que conecte as semanas. O "diferencial" anunciado (5 camadas narrativas, LLM bridge, Hall de Lendas) **não tem UI ou está atrás de modo escondido**.

**O que precisa virar.** Um RPG manager BR de bolso que entrega num ciclo de 5 minutos: 1 decisão táctica com tradeoff legível, 1 partida com **dramatização** (não só log), 1 surpresa narrativa por semana (carta/notícia/proposta), 1 número subindo visível (XP / renome / cofre). Replayable porque **cada save vira história diferente** — não porque você grinda XP de 4 jogadores. Tem que ser **5-min onboardable, 1-hora satisfying, 20-hora memorável** num save. Não FM2024. Não Brasfoot. Um nicho próprio: "RPG de manager brasileiro com narrativa emergente e cartas". Compartilhável: print da Crônica do Save vira post de Reddit.

**Gap.** Toda a tecnologia pra isso já está no repo (40 sistemas, 1131 testes, MARL, LLM). O que falta é **direção de produto e tempo de fricção entre engine e jogador**. O Dudu construiu uma orquestra fenomenal mas não tem partitura — cada músico toca sua nota e ninguém ouve a sinfonia. Os 80h do BLOCO 1 (refactor) **não resolvem isso** — resolvem dívida técnica. O jogo só começa a existir no BLOCO 2 com o feature audit, e mesmo lá o foco está em "fechar gaps" não em "criar momentos memoráveis".

---

## 2. Honest competitive landscape

| Concorrente | Onde ELIFOOT GANHA | Onde ELIFOOT PERDE feio |
|---|---|---|
| **Football Manager 2024** | brevidade (FM = 50h aprendizado, ELIFOOT = 10min); BR-flavor real (170 clubes BR/SA); free; browser-zero-install | depth tático (FM tem 200+ instruções, ELIFOOT tem 8 formações × 6 táticas = 48 combos); scouting real; press conferences ricas; modding |
| **Brasfoot (clássico BR)** | UI moderna; 170 clubes reais (vs 100 do Brasfoot); narrativa de carreira; código open source | **NOSTALGIA BR** — Brasfoot tem 25 anos de saudade que ELIFOOT não vai capturar; reconhecimento de marca; já-tem-no-celular |
| **OléFút** | engine sob controle (ELIFOOT pode pivotar); SDD/qualidade engenharia | direção de arte coesa; pacing testado; comunidade existente |
| **Soccer Manager Worlds** (free indie) | offline, sem login, sem cash-grab; tema BR cultural | multiplayer; ligas online; 10 anos de polish em UX; descoberta de jogadores via marketplace |
| **Soccer Story** (indie steam) | gratuito; web-first | pixel-art coesa; mini-jogos; trilha sonora; **storyline** |

**Onde ELIFOOT tem chance única**: o slot **"manager BR + RPG + narrativa emergente + open source + zero install"** está VAZIO. Brasfoot é arcade-arcade, FM é simulação enciclopédica, Steam tem footy story-driven mas internacional. ELIFOOT pode ser o "Football, Tactics & Glory + sabor BR + crônica auto-gerada".

**Onde ELIFOOT perde feio HOJE**: não há "alma BR" no produto além do nome dos clubes. Não tem comemoração de gol diferente quando é o Flamengo. Não tem texto de carta que mencione "torcida de Recife", "calor de Manaus", "lama de Cuiabá". Os 170 clubes são strings + cores. **Brasilidade é só nome**.

---

## 3. Player loop atual (passo-a-passo cronometrado)

Trace baseado em leitura de `StartView.jsx`, `DashboardView.jsx`, `MatchView.jsx`, `PlayerMatchView.jsx`, `WeekProcessor.js`, `MatchSimulator.js`, `Sidebar.jsx`.

| Minuto | O que o jogador faz | Decisão real? | Comentário brutal |
|---|---|---|---|
| **0** | Vê logo OléFUT, escolhe modo (Treinador/Jogador), digita nome, escolhe 1 dos 170 clubes via dropdown, escolhe dificuldade (auto/médio/hard/sinistro), clica COMEÇAR CARREIRA | **Aparenta decisão grande** (170 clubes!) | Dropdown achatado: você não sabe se Cruzeiro Série A é diferente do Confiança Série C além de "vai ser mais difícil". Não há perfil de clube ("torcedor apaixonado", "rivalidade ferrenha com X", "orçamento mediano"). Decisão é blind. |
| **5** | Pousa em Dashboard. Vê 7 painéis (FINANÇAS, TENSÃO DIRETORIA, FORMA, PLAYBOOK 5 itens, ALERTS, NEXT MATCH, sidebar 13 views). | **Não — apenas absorção** | Cognitive overload. Playbook tem 5 itens texto antes de qualquer ação. **Não há "primeira coisa a fazer"** explícita. Sidebar de 13 views nas primeiras 5 min é assustador. |
| **30** | Clica TÁTICA → escolhe formação 4-3-3 → escolhe tática NORMAL → volta → clica PRELEÇÃO → escolhe DISCURSO MOTIVADOR → clica TREINO → escolhe RESISTÊNCIA → clica JOGAR PARTIDA | **Quase nenhuma** | Cada decisão tem 3-8 opções **sem feedback de consequência**. Tooltip de "Caneleiro: agressivo, mais cartões" mas não diz "vs Ofensivo do oponente vai te dar 30% mais chance de expulsão". Decisão é gut-feel cega. |
| **45 (1ª partida)** | PreMatch (escala XI, vê adversário OVR), clica JOGAR. Vê **log textual** (~30 eventos com emoji), score animado, gol-burst sprite, narrativa por evento ("CRAQUE de área!"). Match dura ~1 min real (ticker 200ms × 90 minutos). No intervalo pode SUBSTITUIR / MUDAR TÁTICA. | **Substituição importa** mas opacamente | NÃO HÁ campo visual. Top-down pitch existe como asset mas NÃO está integrado no MatchView. Log corre rápido, jogador lê 10% dos eventos. Lances "espetaculares" e "normais" misturados sem hierarquia visual. |
| **60** | Volta ao Dashboard. Vê "EVENTOS DA SEMANA": 1-3 mensagens emoji ("📈 João +2 OVR", "🤕 Pedro lesão 3 sem", "💰 Sponsor R$50k"). Não há nada pra **fazer** com elas. Avança próxima semana. | Decisão recorrente: aceitar/rejeitar oferta de transferência (~1 a cada 4 semanas) | Esse é o **único loop fora de partida** que tem decisão consequente. E mesmo essa: o jogador raramente sabe se o jogador é importante (sem grade de visual de plantel mostrando "estrela", "promessa"). Aceita por instinto. |
| **Hora 1** | Já jogou ~12 partidas. Plantel tem mesmas faces, mesmos números. Standings table mostra posição. Achievements tem ~3 unlocks ("Primeira vitória", "10 partidas"). Mercado: lista de jogadores random com OVR. | Decisões repetitivas: tática + treino + substituição + mercado | **Não há novidade**. Mesmas 4 abas, mesmo loop. Nenhuma rivalidade tomou forma visual. Nenhum jogador virou "ídolo do clube". Sem narrativa que conecte semanas. |
| **Hora 5** | Acabou 1ª temporada. Tela de cerimônia se ganhou troféu. **Crônica da Temporada** existe como view mas é texto solto. Promoção/rebaixamento. Reinicia próxima temp. | Decisão: continuar mesmo clube ou aceitar proposta de outro | A Crônica é **a peça mais valiosa do jogo** narrativamente e está **enterrada** na sidebar. Deveria ser **fim de temporada obrigatório** como recompensa visual. |
| **Hora 20** | Maioria dos jogadores **abandonou na hora 3-5**. Quem ficou: vê Hall de Lendas (sem UI!), Heritage Traits (sem UI!), Filhos Regens (futuro feature). Loop é o mesmo. | Replayability artificial via dificuldade | **Sem hook de retenção orgânica**. Não há "evento mensal que muda jogo". Não há razão pra jogar uma 2ª save (já que cada save começa idêntico modulo clube). |

**Resumo brutal do loop**: jogador faz **3 decisões reais por hora** (escolha tática vs adversário, aceitar/rejeitar oferta, comprar/vender no mercado). Tudo o resto é **clicar pra avançar tempo**. A partida em si é o **ponto alto** mas dura 1 min e é **lida**, não jogada. O ciclo é mais próximo de "ler texto interativo" que de "jogar futebol-manager".

---

## 4. Top 5 game design problems (NÃO bugs)

### #1 — Não tem **dramatização** da partida (mata o jogo)
A partida é o coração de qualquer manager. Em ELIFOOT ela é **logs textuais em uma coluna scrollada** sem hierarquia visual. Gol é a única coisa destacada (sprite burst + sound). Tudo o mais (chute trave, falta, drible) tem mesmo peso visual. O asset `pitch-topdown-32bit.png` existe mas **não está integrado**. Jogador não sente *eu fiz isso*, sente *o computador rolou dados*.

**Sintoma**: jogador clica "PULAR" / aumenta velocidade pra 100ms em 2 partidas. Match Engine vira loading screen.

**Causa**: prioridade foi escrever 40 sistemas em vez de fazer 1 sistema (a partida) que entrega 80% da emoção.

---

### #2 — Decisões sem feedback de consequência (mata aprendizado)
Cada escolha (tática, formação, treino, preleção) tem 3-8 opções com tooltips genéricos ("CONTRA-ATAQUE: defensivo, busca brechas"). Não há:
- **Antes**: "vs ofensivo do oponente, contra-ataque tem +20% chance de gol"
- **Durante**: nenhum overlay "VOCÊ ESCOLHEU ATTACKING, ISSO DEU CERTO"
- **Depois**: nenhum sumário "essa partida sua tática rendeu 1.4 xG"

**Sintoma**: jogador escolhe sempre a mesma tática (ou random). Não aprende. Cada partida é gut-feel.

**Causa**: o engine TEM esses números (matchStats, xG cálculo, sectors). Não há lógica de **mostrar** ao jogador no momento certo.

---

### #3 — Sidebar de 13 views = paralisia (mata onboarding)
Sidebar com DASHBOARD, PLANTEL, MERCADO, TABELA, CONQUISTAS, COLETIVA, LOJA, RIVALIDADES, LINHAGEM, CRÔNICA, SAVES, AUTOPLAY, TUTORIAL. **Treze**. Novo jogador não sabe qual é importante. Várias views são vazias na 1ª temporada (Conquistas sem trophy, Crônica em branco, Rivalidades sem H2H).

**Sintoma**: jogador clica 3 views, não acha valor, fecha o jogo.

**Causa**: cada feature ganhou sua view por completude (cada SPEC trouxe UI). Não houve hierarquia de "core gameplay" vs "menus contextuais".

**Solução de design** (não código): 4 entradas máximo na 1ª temporada — DASHBOARD, PLANTEL, TABELA, JOGAR. Outras desbloqueiam por marco (conquista, save, etc).

---

### #4 — Brasilidade é **só nome de clube** (mata diferencial)
O texto da auditoria interna afirma "Brazilian flavor", mas:
- Nenhum evento referencia cultura BR (carnaval, copa do nordeste, virada de jogo no Maracanã)
- Press conference perguntas são genéricas ("Como vê o adversário?") — não tem "Como reagiu à torcida na Vila?"
- StateChampionship.js (Paulistão, Carioca!) está **órfão**, zero imports
- Nomes de jogadores random não têm sabor (poderia ter "Júnior", "Tite", "Zico" como base)
- Música é Tone.js sintética, não samba/funk/forró/sertanejo

**Sintoma**: ELIFOOT é "manager BR" só pela bandeira no menu. Um inglês jogando não sentiria diferença vs um espanhol.

**Causa**: Brasilidade está nos **dados** (170 clubes) mas não na **experiência**. Falta camada cultural.

---

### #5 — Modo Jogador (RPG carreira) é **jogo escondido dentro do jogo**
PlayerMatchView é onde a fantasia RPG vive (decisões "ATAQUE / DRIBLE / ARRISCA TIRO", relações com técnico/torcida/empresário, NPCs nomeados, stress system). É a mecânica mais singular do produto. **E está atrás de um toggle no menu inicial que 95% nunca vai ver**. Audit interna confirma: "Bench Events, OffPitch Events, NPCs Nomeados, Stress, Chain Flags só acessíveis em modo jogador".

**Sintoma**: o melhor do jogo é invisível.

**Causa**: o modo manager virou o "main game" por inércia (foi o primeiro a ser construído). Mas o modo RPG é o que diferencia. Decisão arquitetural errada: deveria ser **um jogo só** que oscila entre macro (gestão) e micro (decisões in-match).

---

## 5. Top 5 unique strengths to amplify

### #1 — A **partida com cartas RPG** (40 cartas tiered + drawCard renown gate)
O sistema `MatchEventsDeck` desenha cartas com pesos por raridade (60% comum / 25% incomum / 12% raro / 3% lendária) gateadas por estrelas de renome. Isso é **legitimamente fresh** — nem FM nem Brasfoot têm isso. Hoje a carta vira só uma linha de texto no log. **Amplificar**: virar **momento congelado** no jogo (pause, modal grande, animação, escolha do treinador "ARRISCAR | SEGURAR | SUBSTITUIR") — vide PlayerMatchView que já faz isso em modo jogador.

### #2 — **Crônica do Save** (auto-gerada, parchment, exportável)
View Crônica existe, templates por temporada existem (`ChronicleSystem.js`). É **a feature mais shareable** do jogo. Print da Crônica vira post de Reddit de uma temporada que viveu (subida da série D, jogador que virou ídolo, derby ganho 4×0). **Amplificar**: tornar fim-de-temporada obrigatório (não opcional na sidebar); permitir export PNG/PDF; dar handles narrativos extras (LLM bridge!).

### #3 — **170 clubes reais** + **cores oficiais** + **club badges pixel-art**
13 spritesheets, 170 clubes, cores reais. Visualmente o jogo é IDENTIFICÁVEL — você vê o escudo do Náutico aparecer no scoreboard. **Amplificar**: dar **identidade visual aos clubes em momentos** (cerimônia troféu do Vasco usa cores Vasco; carta lendária quando você é Palmeiras tem texto "verde-laranja sob a chuva"). Hoje é genérico.

### #4 — **LLM bridge** (WebLLM browser-side, zero API cost)
SPEC-119, SPEC-167. Sistema que pode gerar narrativa pós-jogo, conselho do auxiliar, reação da diretoria — tudo offline no navegador. **Diferencial real** que nenhum manager tem. **Amplificar**: usar pra **3 use cases concretos memoráveis** (não 30 features): (a) crônica de partida pós-jogo com referência ao seu plantel real; (b) conselho do auxiliar antes do jogo decisivo; (c) frase do torcedor após classificação. Hoje LLM existe mas só roda em advice opcional.

### #5 — **SDD + AKITA rigor**
Não-feature, é meta. Mas é o único projeto manager BR open-source com 1131 testes, 120 specs, golden master, AKITA discipline. **Amplificar**: comunidade. Modders podem **adicionar clubes, cartas, NPCs, narrativas** via PR. Brasfoot é fechado. FM é fechado. ELIFOOT pode ser o "Skyrim do manager BR" via comunidade open. Hoje GitHub está público mas sem **convite explícito a moddar** + sem **API pra adicionar carta sem editar engine**.

---

## 6. Roadmap REALISTA pra game

> **Premissa de tempo**: Dudu trabalha sozinho com agentes (Claude + Antigravity). ~10-15h/semana sustainable (não burnout). Domingo OFF (mandamento brutal #10).
>
> **Premissa de escopo**: ELIFOOT não vai ser FM. Tem que ser **um jogo claro, focado, lançável**. Cada fase abaixo entrega VALOR ao player, não dívida técnica zerada.
>
> **Premissa de SDD**: todo bullet vira SPEC + harness antes de codar. Mas as SPECS são curtas (1-page max) e focadas em **outcome jogável**, não "wire-up de feature".

---

### **Fase A — Tornar JOGÁVEL** (15h, 2 semanas)

**Objetivo**: novo jogador BR baixa o link, joga 1 hora, **entende o que tá fazendo e por quê**, e não fecha por confusão.

| # | Entregável | Horas | Por quê |
|---|---|---|---|
| A1 | **Primeira-temporada-easy mode**: sidebar reduzida a 4 entradas (DASHBOARD, PLANTEL, TABELA, AVANÇAR). Outras 9 escondidas até "marco de desbloqueio" (vencer 5 jogos, fim de temporada, etc — sistema já existe em `ViewUnlockSystem.js`, apenas não está calibrado pra novato) | 2h | Sidebar atual mata onboarding. Vide problema #3. |
| A2 | **Onboarding interativo de 90 segundos** dentro do Dashboard 1ª temp: 4 tooltips contextuais que aparecem em sequência ao clicar (estilo Civilization advisors). Não é a TutorialView atual (que é antes do jogo) — é **DURANTE** o jogo. Conteúdo: (1) "este é seu plantel — clique pra ver formação", (2) "esta é a tática — escolha antes de jogar", (3) "JOGAR PARTIDA roda 1 minuto", (4) "veja o resultado e ajuste". | 3h | TutorialView atual é texto antes do jogo, ninguém lê. Aprendizado é por fazer. |
| A3 | **Match Day Pre-screen overhaul**: tela pré-jogo mostra (a) escudo + cor do meu time vs adversário, (b) "FORMA recente" 5 últimas partidas dos 2 lados com WWLDD, (c) "PONTO FORTE" do adversário ("Ataque 78 — Caneleiro"), (d) sugestão tática 1-frase do auxiliar ("recomendo Defensivo"). **Decide já antes de entrar no Match**. | 3h | Hoje PreMatchScreen mostra OVR e nada acionável. Decisão táctica fica isolada. |
| A4 | **"Painel decisão" pós-partida (15s screen)**: tela meio-fim-de-partida que mostra **3 destaques** (1 escolha boa, 1 escolha duvidosa, 1 sorte/azar). Texto curto. Player aprende causa-efeito. | 4h | Hoje o pós-jogo cai direto no Dashboard. Causa-efeito invisível. |
| A5 | **Calibração de dificuldade da 1ª temporada** (não da engine — do **fluxo**): garantir que primeiro jogo tem 75%+ chance de empate ou vitória (não 50/50), pra player não desistir. Implementa via leve handicap inicial que decai. | 3h | UX literature: primeira sessão precisa de win pra reter. Spec rough: opponent boost -10% nas 3 primeiras partidas. |

**Saída da Fase A**: novo jogador joga 5 partidas sem perder, **entende** o que cada decisão faz, **decide ficar** para a 6ª.

---

### **Fase B — Tornar PRAZEROSO** (35h, 4-5 semanas)

**Objetivo**: 1 hora vira **uma história**. Jogador sente **agência**, vê **progressão visível**, encontra **surpresa**.

| # | Entregável | Horas | Por quê |
|---|---|---|---|
| B1 | **Match dramatization**: integrar `pitch-topdown-32bit.png` no MatchView como pano de fundo + posicionar **bola animada** em sprite quando há gol/escanteio/falta (não simulação real, só "ponto de movimento"). Eventos críticos pausam ticker e mostram modal grande (tipo PlayerMatchView). Eventos comuns passam rápido. **Hierarquia visual**. | 8h | Problema #1. Match precisa virar coisa de assistir, não de ler. |
| B2 | **Match decisions during play** (em-match cards no modo MANAGER também): a cada ~15min de jogo virtual, 1 carta surge ("seu lateral está exausto — substituir? arriscar?"). Hoje só modo Jogador tem isso. Trazer pro Manager via `BenchEventsDeck` adaptado. Modal pausa, jogador decide, jogo continua. | 6h | Faltam decisões DURANTE o jogo no modo Manager. Player vira espectador. |
| B3 | **Crônica do Save como fim-de-temporada obrigatório**: ao terminar 38ª rodada, abre Crônica em FULL-SCREEN com (a) capa pixel-art do clube, (b) 5 parágrafos auto-gerados via LLMNarrativeService, (c) destaques numéricos (gols, MOTM, derby ganho), (d) BOTÃO **EXPORTAR PNG**. | 8h | Crônica está enterrada. Vire o **payoff** da temporada. Compartilhável = marketing orgânico. |
| B4 | **Hall de Lendas + Heritage Traits UI única** (LineageView já existe, está vazia): painel mostra (a) últimas 5 lendas do clube (foto pixel-art + posição + temporadas + frase), (b) traits ativos no plantel atual herdados de jogadores anteriores, (c) "Tempo do clube" mosaico de momentos passados. **Visualiza progressão multi-save**. | 6h | 4 sistemas (Hall, Heritage, Chronicle, Lineage) existem em engine, ZERO UI. Player não sabe que existem. |
| B5 | **Decisões com feedback de consequência** (problema #2): tooltip dinâmico em FORMAÇÃO mostra "previsão" baseada em adversário ("4-3-3 vs 5-4-1 do Náutico: vantagem ataque +12%"). Cálculo é o mesmo que o engine já faz internamente. Apenas SURFACE no UI. | 4h | Hoje o engine calcula TACTIC_COUNTERS mas player não vê. |
| B6 | **Brazilianidade — Camada 1 (cosmética)**: nomes de cartas/eventos passam por filtro BR ("aplausos do Maraca", "torcida do Beira-Rio", "tarde quente em Cuiabá"). 30-50 strings substituídas em `MatchCards*.js`. Press conference: 10 perguntas com tom brasileiro. | 3h | Problema #4. Quick win cultural. |

**Saída da Fase B**: 1 hora de jogo = 1 narrativa pessoal contada via Crônica. Replayable porque a história muda. Jogador volta pra próxima temp.

---

### **Fase C — Tornar MEMORÁVEL** (60h, 7-8 semanas)

**Objetivo**: 20 horas de save = história que jogador conta pro amigo. Replayability orgânica. Comunidade nascente.

| # | Entregável | Horas | Por quê |
|---|---|---|---|
| C1 | **LLM Bridge real (3 use cases concretos, não 30)**: (a) Crônica de Partida pós-jogo (gera 2 parágrafos com nomes dos seus jogadores e o que aconteceu), (b) Conselho do Auxiliar pré-jogo decisivo (3 frases reagindo à situação), (c) Reação da Diretoria após resultado (4 tons: euforia / orgulho / inquietação / fúria). **NÃO** usar LLM pra coisas decorativas — usar pra **momentos memoráveis**. | 12h | LLM é diferencial real do jogo. Hoje só roda em advice opcional. |
| C2 | **Modo unificado: Manager-com-Player** (problema #5): jogador vira **manager + 1 jogador estrela**. Sub-decisões in-match (cartas) afetam carreira do jogador estrela, decisões macro (mercado, tática) afetam clube. Remove a divisão modo-manager-vs-modo-jogador. Migration: novos saves nascem unificados. | 14h | A invisibilidade do modo jogador é o erro arquitetural mais caro. Reunificar = dobrar a profundidade do produto. |
| C3 | **StateChampionship wire-up** (Paulistão, Carioca, Mineiro, Gauchão): integrar em calendário, abertura de temporada (jan-abril). Aba Estadual em StandingsView. Decisões: priorizar estadual ou descansar pra estréia da Série? **Identidade cultural BR**. | 10h | SPEC-168 existe. Engine órfã. Wire-up estimado em 10h é alto-impacto. |
| C4 | **Mod-friendly hooks**: API simples pra adicionar cartas customizadas via JSON (`/public/mods/cards/MyCard.json`). Documentação com 1 exemplo. **Conviting modders BR** (Reddit r/futebol pode contribuir). | 8h | Diferencial vs Brasfoot fechado. Multiplica conteúdo sem trabalho do Dudu. |
| C5 | **Rivalidades emergentes visíveis**: RivalryUpgradeSystem existe. UI mostra "DERBYS DO SEU CLUBE" com H2H histórico no save (V-E-D + gols), próximo confronto highlighted, "carta especial" disparada em derby ("o Maracanã treme"). | 6h | Camada 3 narrativa, hoje dados internos sem expressão. |
| C6 | **Sistema de eventos seasonais BR**: 4 eventos por ano (Janeiro: pré-temporada com confraternização; Junho: pausa Copa América; Outubro: Dia das Crianças categoria base; Dezembro: balanço fim de ano). Cada evento entrega: 1 carta narrativa + 1 escolha + 1 bônus/penalidade. Reusa OffPitchEventsDeck. | 10h | Hoje calendário tem "pausa FIFA" mas é mecânica, não narrativa. Eventos sazonais = reason pra jogar manhã/noite diferente. |

**Saída da Fase C**: jogador conta a história do save pra amigo. Posta print da Crônica no Twitter. Quer começar 2ª save com clube diferente pra ver nova narrativa.

---

### **Fase D — Lançamento + crescimento** (ongoing)

| # | Entregável | Por quê |
|---|---|---|
| D1 | **Marketing real**: 1 thread Twitter por semana mostrando uma história gerada pelo save de um beta-tester. Cross-post Reddit r/futebol e r/footballmanager. | Build in public funciona. Mas requer histórias reais, não devlog. |
| D2 | **Comunidade**: Discord pequeno (5-10 membros bola-de-neve), criação coletiva de cartas (mod-friendly da Fase C). Feedback loop público. | Comunidade nascente é flywheel. Mod = retention. |
| D3 | **Content updates trimestrais**: 1 update por trimestre com NEW: 1 deck de cartas (10 novas), 1 mecânica BR (ex: Copa do Nordeste), 1 melhoria visual. Não vira FM update treadmill — só o suficiente pra reativar players. | Hattrick faz isso há 25 anos. Indie pode fazer trimestral. |
| D4 | **Itch.io page + GitHub release tags + APK Android (capacitor wrap)**: distribuição além do GitHub Pages. APK = nostalgia Brasfoot. | Distribuição = descoberta. APK BR é canal cultural. |
| D5 | **Telemetry leve (opt-in)**: quanto tempo jogadores jogam, em que temporada abandonam, que dificuldade escolhem. Vira input pra Fase C+. | Sem dados = chuta. Não viralizou? Por quê? Telemetry diz. |

---

## 7. Anti-recommendations (NÃO fazer)

### Não-1 — **NÃO terminar BLOCO 1 refactor inteiro antes de mexer em gameplay**
O MASTER-ROADMAP-FOUNDATION-FIRST diz "zero feature nova até BLOCO 1 terminar". 80h de refactor (RFCT-005..017 + AutoPlay split + bundle opt + doc auto-gen). Engine.js hoje tem 437 linhas — **já está abaixo do DoD de 400**. AutoPlay split já tirou 1280→490 LOC. **A premissa de "bloqueante" não é mais verdadeira**. Continuar refactor enquanto jogo não tem dramatization de partida é **rearrumar móveis num apartamento sem porta**. Recomenda: **interleave** — 1 PR refactor : 2 PRs gameplay. Não bloquear gameplay.

### Não-2 — **NÃO escrever 60 SPECS retroativas pra "fechar audit"**
A AKITA-FEATURE-AUDIT lista 18 features yellow + 11 red. Tentação: spec cada uma, escrever harness, fechar gap. **Vai gastar 60h sem mover ponteiro do jogo**. Em vez: aceitar que algumas features (LiveOps, NewsSystem, etc) são **mortas — deletar**. Outras (Heritage, Hall, Humiliation) são **engine sem UI** — ou ganhe UI **agregada** (B4 do roadmap acima, 1 view única) ou aceite que ficam invisíveis (delete spec).

### Não-3 — **NÃO tentar virar FM2024**
Tem ~1000 mecânicas, 200 instruções táticas, 50 ligas internacionais. ELIFOOT no caminho dessa direção morre por ambição. **Manter o escopo BR + RPG + Crônica**. Cortar features que não servem essa identidade (ex: Continental Cup ampla é nice-to-have, não core). FM tem 25 anos de polish e empresa de 200 pessoas. Indie BR sozinho não compete em depth, compete em **alma**.

---

## 8. First 10 hours of work plan (próxima sessão, concrete)

**Premissa**: Dudu pode rodar 1 sessão de 4h + 2 sessões de 3h essa semana. ~10h total.

### Sessão 1 (4h) — A1+A2 (sidebar reduzida + onboarding 90s)

1. **SPEC-A1**: documentar "ViewUnlockSystem calibrado pra novato" — sidebar 1ª temp mostra só 4 entradas (DASHBOARD, PLANTEL, TABELA, JOGAR no dashboard). Marcos de unlock: 1ª vitória → COLETIVA; fim temp → CRÔNICA + CONQUISTAS; 5 contratações → MERCADO já tava; 2ª temp → SAVES; etc.
2. **Implementar** em `ViewUnlockSystem.js` + `Sidebar.jsx`. Tests: spec test verifica que `getViewAccess('press')` retorna `false` na semana 1.
3. **SPEC-A2**: documentar onboarding 90s — array de 4 tooltips contextuais, trigger no `DashboardView` 1ª-temp `seasonWeek === 1`.
4. **Implementar** com componente `<OnboardingCoach>` que reusa `Tooltip` existente. Dismissable. Persist em localStorage `elifoot_onboarding_done`.
5. **Test harness**: regression test que simula primeiro clique de novo player, verifica que tooltip 1 aparece.
6. **PR único**: "AKITA-X: A1+A2 — sidebar reduzida + onboarding 90s". Commit lints, build, test verde.

### Sessão 2 (3h) — A3 (PreMatch overhaul)

1. **SPEC-A3**: PreMatchScreen mostra (a) escudos com cores, (b) forma WWLDD 5 últimos, (c) sector forte do oponente, (d) sugestão tática 1-frase.
2. **Implementar** consultando `engine.managerStats.rollingForm` (já existe) + `engine.getTeamSectors(oppId)` + texto template.
3. **Tests**: SPEC test que PreMatchScreen renderiza sugestão tática quando oponente é defensivo.
4. **PR**: "AKITA-X+1: A3 — PreMatch decision-ready".

### Sessão 3 (3h) — A4 (pós-partida painel decisão) + buffer pra polish

1. **SPEC-A4**: nova tela `<MatchPostMortem>` que aparece entre FIM DE JOGO e volta-pro-Dashboard. 3 cards: melhor decisão, decisão duvidosa, sorte/azar. Texto auto-gerado de templates baseado em matchStats + eventos.
2. **Implementar** componente + integração em MatchView phase 'fulltime' → opcional show (botão "VER ANÁLISE" antes de "VOLTAR").
3. **Tests**: gerar matchStats sintética, verificar que componente renderiza 3 cards com texto coerente.
4. **PR**: "AKITA-X+2: A4 — MatchPostMortem painel decisão".

**Saída das 10h**: BLOCO 1 (gameplay) Fase A 80% completa. Onboarding melhor em 1 semana. Próxima sessão (semana seguinte): A5 calibração + entrar em B1 (match dramatization).

---

## Conclusão brutal (para o Dudu)

ELIFOOT tem **infraestrutura de jogo AAA** num **conteúdo de jogo demo**. Os 1131 testes, 120 specs, 40 sistemas, AKITA discipline — são o **palco mais ensaiado do mundo pra um show que ainda não foi escrito**. A próxima inversão é simples: **pare de construir o palco**, comece a escrever as cenas.

A boa notícia: o palco aguenta. O motor é sólido. Não vai quebrar quando você apertar. A má notícia: o BLOCO 1 do MASTER-ROADMAP está te enganando — não é "fundação faltando", é "produto inexistente". Continue refatorando 5h por semana sustainable, mas **as outras 5-10h são pra game design, não pra dívida técnica**.

10h específicas próxima sessão estão acima. Começa hoje. Não escreva mais SPEC retroativa de feature antiga. Escreva SPEC do **primeiro jogador BR que vai abrir o link, jogar 1 hora, e mandar print da Crônica pra alguém**. Esse é o jogo.

— Claude Opus 4.7, 30 min focados, sem bullshit.
