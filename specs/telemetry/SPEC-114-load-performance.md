# SPEC-114: Load Performance

## O que é

Mede FPS / render time / advanceWeek elapsed em modo AutoPlay ⚡ Max (1ms). Detecta UI bottleneck. Score 0-100 (alto = boa performance).

## Input

```javascript
{
  history: {
    advanceWeekTimings: number[],   // ms por advanceWeek
    detectorTimings: { [spec]: number[] },
    fps?: number[]                   // se disponível via requestAnimationFrame
  }
}
```

## Output esperado

```javascript
{
  spec: 'SPEC-114',
  name: 'Load Performance',
  score: 0..100,
  signals: [
    { id: 'SLOW_TICK', severity, msg: 'advanceWeek p95 = Nms' },
    { id: 'SLOW_DETECTOR', severity, msg: 'Detector X média Nms' },
    { id: 'FPS_DROP', severity, msg: 'FPS médio < 30' }
  ],
  advanceWeekP95: number,
  advanceWeekAvg: number,
  slowestDetector: string|null,
  topSignal
}
```

## Validação

- Sem timings → score 100 (otimista)
- p95 > 500ms → SLOW_TICK severity 1
- <10ms execução do próprio detector

## Forbidden

- Side effects
- Bloquear thread principal
