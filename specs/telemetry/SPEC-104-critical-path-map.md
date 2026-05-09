# SPEC-104: Critical Path Map

## O que é

Heatmap das views/clicks acessadas pelo bot. Detecta hotspots (views muito visitadas) e dead views (zero acessos). Em modo soak test, infere critical path por mode AutoPlay.

## Input

```javascript
{
  history: {
    viewVisits: { [viewName]: count },
    clicks: { [actionId]: count },
    decisions: [{ action, week }]
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-104',
  name: 'Critical Path Map',
  score: 0..100,                    // alto = boa cobertura de paths
  signals: [
    { id: 'DEAD_VIEW', severity, msg: 'View X nunca visitada' },
    { id: 'HOTSPOT', severity, msg: 'View Y com 95% dos visits' },
    { id: 'COVERAGE_LOW', severity, msg: 'Apenas N de M views acessadas' }
  ],
  heatmap: { [viewName]: count },
  totalViews: number,
  visitedViews: number,
  topSignal
}
```

## Validação

- Sem visits → score 0, COVERAGE_LOW severity 1
- 100% views visitadas → score 100
- heatmap sempre é objeto
- <10ms

## Forbidden

- Acessar DOM (detector é puro)
- Side effects
