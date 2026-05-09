# SPEC-113: Tutorial Funnel

## O que é

Em modo soak test, AutoPlay pode iniciar via tutorial flow vs skip direto. Mede % completion / drop rate por step. No contexto bot atual (skip default), reporta apenas se há tutorial accessible.

## Input

```javascript
{
  history: {
    tutorialSteps: [{ step, reached: bool, droppedAt?: string }],
    startedFromTutorial: number,
    startedFromSkip: number
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-113',
  name: 'Tutorial Funnel',
  score: 0..100,
  signals: [
    { id: 'NO_DATA', severity, msg: 'Tutorial não foi exercitado' },
    { id: 'HIGH_DROP', severity, msg: 'Step X teve N% drop' },
    { id: 'COMPLETION_OK', severity, msg: 'Tutorial completion N%' }
  ],
  startedTutorial: number,
  startedSkip: number,
  completionRate: number,
  topSignal
}
```

## Validação

- Sem data → score 50, NO_DATA ativo
- Drop > 50% num step → HIGH_DROP
- completionRate sempre 0..1
- <10ms

## Forbidden

- Side effects
