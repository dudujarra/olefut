# Playtest B3.2 — Recrutamento + Roteiro

**Status**: PENDING — sem testers recrutados
**Target**: 5 humanos brasileiros, ~2h cada
**Bloqueador**: maior risco morte do projeto (mandamento brutal #7)
**Build alvo**: https://dudujarra.github.io/olefut/ (atual GitHub Pages) ou commit pós-PR #156

---

## Perfil ideal dos 5 testers

| # | Perfil | Por quê |
|---|--------|---------|
| 1 | **Fan futebol hardcore BR** (40+, jogou Elifoot/CM original) | Valida nostalgia + brand SNES |
| 2 | **Gamer mobile casual** (25-35) | Testa onboarding rookie |
| 3 | **Designer/dev** | Critica UI/UX + bugs |
| 4 | **Não-jogador FM** (curioso) | Mede curva aprendizado |
| 5 | **Streamer/conteúdo** | Feedback gravado + reach |

---

## Texto recrutamento

### Twitter/X
```
🎮 Procurando 5 brasileiros pra testar OléFUT — football manager 16-bit estilo SNES que tô fazendo solo desde abril/26.

Build no ar: https://dudujarra.github.io/olefut/
Sessão de ~2h via call + questionário.

Quem topa? Comenta ou DM 🇧🇷
```

### LinkedIn
```
Buscando 5 playtesters BR pra OléFUT (https://dudujarra.github.io/olefut/) —
football manager web que combina nostalgia SNES com motor de aprendizado de máquina.

Sessão estruturada ~2h: tutorial → 1 temporada → questionário NPS.

Sem pagamento (projeto pessoal/build in public) mas crédito nos credits + feedback direto comigo.

Interesse: comenta ou DM.
```

### WhatsApp grupo amigos
```
Ô pessoal! 🎮

Tô precisando de 5 testers pro meu jogo OléFUT (football manager 16-bit, link: https://dudujarra.github.io/olefut/).

Quem topa fazer um playtest de 2h comigo via call essa semana?
Sem grana, mas tu vê o jogo nascendo e teu feedback molda o produto.

Reply ✋ quem topa
```

### Discord/Reddit r/futebol r/brdev
```
[OléFUT] Football manager 16-bit BR procurando playtesters

Tô fazendo um manager web inspirado em Elifoot 98 + ISS Deluxe SNES.
Solo dev brasileiro, build in public no GitHub (github.com/dudujarra/olefut).

Procurando 5 brasileiros pra playtest estruturado de 2h:
- Tutorial guiado
- Jogar 1 temporada completa
- Questionário NPS + feedback aberto

Sem pagamento (passion project). Em troca: crédito nos credits + influência direta no produto.

Interessados: comenta com:
- Idade
- Já jogou FM/Elifoot? Qual versão?
- Disponibilidade essa semana

Link demo: https://dudujarra.github.io/olefut/
```

---

## Roteiro da sessão (2h)

### Pré-sessão (15min antes — async)
- Tester abre `https://dudujarra.github.io/olefut/`
- Browser: Chrome desktop (preferencial) ou Safari/Firefox
- Não precisa instalar nada
- Avisa Dudu via wpp/discord quando pronto

### Bloco 1 — Onboarding (30min)
1. **Sem ajuda** — tester explora 5min sozinho. Dudu cala.
   - Anota: primeiras impressões verbal ("o que isso é?", "o que faço?")
2. **Tutorial guiado** — clica tutorial 5 steps
   - Anota: clareza, ritmo, copy
3. **Cria save próprio** — escolhe time/zona/dificuldade
   - Anota: confusão, decisões intuitivas vs travadas

### Bloco 2 — Temporada (60min)
1. **Tutorial → primeira partida** (10 min real)
   - Anota: entendeu match? Card system? Substituições?
2. **5-10 jogos seguidos** (40 min)
   - Mercado entre jogos
   - Coletiva de imprensa quando aparecer
   - Manage moral, lesões, formação
3. **Trophy ou crise final temporada** (10 min)
   - Promoção/rebaixamento

### Bloco 3 — Feedback aberto (30min)
1. **Verbal livre** (15 min)
   - "O que mais te marcou?"
   - "O que te faz voltar amanhã?"
   - "O que te faz fechar e nunca mais?"
2. **Questionário NPS** (formulário Google ou notion, 15 min):
   - Recomendaria pra amigo 0-10?
   - Qual feature MAIS gostou?
   - Qual feature MAIS odiou?
   - O que mais quer ver?
   - Brand: SNES nostalgia funciona? Fontes legíveis? Cores certas?
   - Pagaria? Quanto?

---

## Métricas a coletar

| Métrica | Como medir |
|---------|------------|
| Time to first match | Cronômetro |
| Bugs encontrados | Lista |
| Confusões UX | Anota cada "como faço?" |
| NPS | Questionário 0-10 |
| Retenção declarada | "Vc voltaria amanhã?" sim/não |
| Brand reception | Pergunta direta sobre fontes/visual |

---

## Output

Cria `docs/playtest/RESULTS-{nome}-{data}.md` por tester com:
- Perfil tester
- Tempo total + breakdown blocos
- Bugs encontrados (links pra issues criadas)
- Quotes diretas
- NPS score
- Recomendações

---

## Próximos passos pós-playtest

Se NPS médio ≥ 7 → v1.0 launch GO
Se NPS 5-6 → fix top 3 problemas + retest 3 testers
Se NPS < 5 → review estratégico, possivelmente delay v1.0

---

**Created**: 2026-05-13 pós Stitch experiment closure
**Owner**: Dudu (Eduardo Jarra)
**Bloqueia**: Bloco 3 B3.2 → v1.0 launch real
