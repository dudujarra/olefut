# SPEC-123 — Real-Time Learning Visualization

## Goal
Visualize bot learning progress in real-time during AutoPlay. Bot já aprende (SPEC-115/116/117 + memory SPEC-122), mas user não vê. Add UI panels mostrando:

1. **Q-table top actions live** (color-coded green/red, updates per tick)
2. **Episodic memory log** (last 20 decisions+outcomes scrollable)
3. **Win-rate per-season chart** (sparkline trend)
4. **Learning curve** (Q-table size + total updates over time)
5. **Active goals indicator** (which goals fire currently)

## Implementation

### LearningPanel.jsx (new component)
- Mounts inside AutoPlayView
- Polls `controllerRef.current.brain.summary()` every 1s
- Shows live stats + sparkline

### Engine snapshots (auto)
- AutoPlayService captures per-season win rate
- Stored in `stats.seasonHistory: [{season, wins, draws, losses, transfers}]`
- Used to compute trend

### LLMContextPanel.jsx (RAG visualizer)
- Shows current memory context that LLM would receive
- Updates when brain.remember() called
- User vê exatamente o que LLM "lembra"

## Verification
- Panels visible in AutoPlayView (collapsible sections)
- Win rate sparkline updates per season transition
- Memory log shows BUY_OFFER entries from SPEC-122
- Q-table top 5 actions update with color (green positive, red negative)

## Open Questions
- Sparkline lib? → use SVG inline (zero deps)
- Persist snapshots? → localStorage append, cap 100 last seasons
