# SPEC-105: Narrative Coverage

## O que é

Mede % de narrações únicas usadas vs total de cards/templates disponíveis. Identifica cards nunca disparados ("dead narratives"). Score 0-100 (alto = boa cobertura).

## Input

```javascript
{
  engine,
  history: {
    matchNarrations: string[],          // narrators recentes
    eventStrings: string[]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-105',
  name: 'Narrative Coverage',
  score: 0..100,
  signals: [
    { id: 'LOW_COVERAGE', severity, msg: 'Apenas N% de narrators únicos' },
    { id: 'REPEATED_NARRATOR', severity, msg: 'Narrator X usado N vezes' }
  ],
  uniqueCount: number,
  totalCount: number,
  topNarrators: [[string, count]],
  topSignal
}
```

## Validação

- Sem narrations → score 50 (neutro)
- 100% repetições → LOW_COVERAGE severity ~1
- topNarrators retorna até 5 mais frequentes
- <10ms

## Forbidden

- Side effects
- Acessar deck completo de narradores (custoso). Usar apenas history disponível.
