# SPEC-162: Playstyle Traits and Disciplinary Mechanics

## Pergunta/Objetivo
Como converter arquétipos de personalidade ("Caneleiro", "Fairplay") em mecânicas sistêmicas que influenciem diretamente o motor de simulação de partidas (Match Simulator)?

## Sintoma/Motivação (Por que foi feito)
Atributos de personalidade (Playstyles) existiam apenas como apelidos ou metadados cosméticos no UI. Para que a gestão do elenco tenha peso tático, ter "Caneleiros" ou jogadores "Sanguíneos" deve representar um risco mecânico real de receber cartões, impactando as decisões estratégicas do manager.

## Método
- Modificação na geração procedural e estática de jogadores (`data.js`) para atribuir aleatoriamente uma *trait* de `playstyle` dentre 12 possíveis.
- Refatoração do loop de eventos (`MatchSimulator.js`) para adicionar um sistema de "peso" (Weighted Probability) na distribuição de cartões amarelos e vermelhos.
- Reroll System: Para cartões vermelhos, a engine tenta esquivar de jogadores pacíficos, afunilando as expulsões para os jogadores desleais.
- Arquivos modificados:
  - `src/engine/data.js`
  - `src/services/MatchSimulator.js`
  - `src/components/SquadView.jsx` (UI para exibir a trait)

## Critério de Respondida
- Em uma simulação de múltiplos jogos (ex: 1000), um jogador "Caneleiro" deve matematicamente receber substancialmente mais cartões (amarelos e vermelhos) do que um jogador "Fairplay".
- Teste rastreado e verificável em `tests/specs/playstyles.test.js`.

## Resultado
**Implementado com sucesso no commit `7aea27f`.** A regressão matemática aponta que jogadores agressivos (Caneleiros) recebem ~10x mais cartões que os justos (Fairplay), solidificando o vínculo entre narrativa e mecânica do simulador.
