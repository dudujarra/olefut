# SPEC-160: Real Players Injection

## Pergunta/Objetivo
Como injetar jogadores reais de múltiplas divisões e ligas do futebol brasileiro (Série A até D) dentro do ecossistema do jogo de forma sustentável e imersiva?

## Sintoma/Motivação (Por que foi feito)
O banco de dados original continha um escopo limitado de atletas, comprometendo o realismo de longo prazo nas transferências e na flutuação das divisões. A falta de elencos autênticos do futebol brasileiro prejudicava a imersão e a competitividade do mercado simulado.

## Método
- Criação de uma ferramenta autônoma (`tools/squad-scraper`) para minerar e processar dados de elencos reais.
- Injeção de 5550 atletas reais brasileiros no banco de jogadores.
- Arquivos modificados/criados:
  - `tools/squad-scraper/` (Scripts de extração de elencos)
  - `src/engine/data.js` (Integração inicial dos elencos via importação ou mesclagem)

## Critério de Respondida
- Os elencos de times brasileiros na inicialização devem refletir os nomes reais baseados no banco injetado.
- Os atributos dos jogadores reais devem flutuar dentro da margem de `ruído` programada (±35%) para manter a assimetria visual do radar (Hexagon Chart).

## Resultado
**Implementado com sucesso no commit `395b0f7`.** A infraestrutura de scrap e injeção foi firmada, garantindo nomes e posições fidedignos para as equipes brasileiras mapeadas.
