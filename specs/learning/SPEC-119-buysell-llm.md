# SPEC-119 — Buy/Sell Decision Engine + LLM Bridge

## Goal
Bot AutoPlay realmente compra/vende jogadores. MARKET_INQUIRY era só log; agora dispara transação real via heuristic OR WebLLM.

## Modes

### Heuristic (default, always available)
Pure function. Decides:
- BUY: position weak (avg OVR <60) + affordable (bal > 2× price) + upgrade (offer OVR > avg+5)
- SELL: player old (>32) OR reserve OR offer ≥ 1.2× value

### WebLLM (opt-in, lazy load)
- Llama 3.2 1B Instruct via @mlc-ai/web-llm
- WebGPU required
- ~2GB download first time, cached IndexedDB
- Decision via prompt: squad context + offer → JSON {buy: bool, reason: str}
- Fallback heuristic se WebLLM unavailable

## API

```js
const bridge = new LLMBridge({ mode: 'heuristic' });
await bridge.init(); // no-op for heuristic, loads model for webllm

const decision = await bridge.decideBuy({
  team: {squad, balance},
  offer: {player, amount}
});
// { buy: bool, reason: string, source: 'heuristic'|'llm' }
```

## Verification
- Heuristic test: weak ATA + rich balance + good offer → buy=true
- Heuristic test: rich club + bench player aged 33 + decent offer → sell=true
- WebLLM lazy load doesn't crash if WebGPU unavailable (fallback)
- Bot transactions update engine state correctly (squad changes, balance debits)

## Open Questions
- Model size choice: Llama 3.2 1B (~700MB compressed) vs Phi 3 mini (~2GB)?
  → 1B for v1 (faster load), upgrade later if quality insufficient.
- Decision frequency: every offer received or throttle?
  → Every offer worth >R$ 100k.
