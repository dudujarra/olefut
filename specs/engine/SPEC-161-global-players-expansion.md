# SPEC-161: Global Players Expansion & Free Agent Market

## Pergunta/Objetivo
Como expandir o ecossistema econômico do jogo para suportar a simulação e transação de mais de 6000 jogadores reais mundiais sem quebrar a estabilidade financeira dos clubes controlados por NPCs?

## Sintoma/Motivação (Por que foi feito)
Uma injeção massiva de milhares de novos jogadores poderia inundar o mercado, gerando desbalanceamento financeiro ou causando comportamento anômalo da Inteligência Artificial em tentar contratar atletas fora do teto financeiro e técnico da sua divisão.

## Método
- Injeção de uma base de jogadores globais (+6000 atletas de outras ligas) para compor o mercado livre (Free Agents) e bancos de reservas.
- Validação no `MarketView.jsx` e `SquadHealthMonitor.js` de que a IA (NPCs) respeita tetos orçamentários (Budget Cap) e restrições de OVR por divisão durante "emergency buys".
- Arquivos modificados:
  - `src/engine/data.js` (Aumento agressivo da database)
  - Validações passivas em `MarketView.jsx` e `SquadHealthMonitor.js`.

## Critério de Respondida
- O Mercado do jogo deve carregar sem gargalos de memória (Performance).
- Clubes de divisões inferiores não devem conseguir comprar jogadores de elite fora do seu escopo orçamentário.
- Nenhuma quebra no fluxo de rolagem de temporada (`season rollover`) devido a excedente de atletas sem clube.

## Resultado
**Implementado com sucesso no commit `f48c4f4`.** O banco de talentos global está operacional, sustentado pelas travas econômicas já existentes no motor, garantindo simulações de transferências coerentes.
