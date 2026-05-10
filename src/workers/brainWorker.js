/**
 * brainWorker — MARL Fase 7
 *
 * Web Worker que processa decisões de múltiplos bots NPC em paralelo.
 * Roda fora da main thread para não travar a UI durante:
 *   - Tactic decisions (encodeState + pickAction) para N times
 *   - Reward observation (observe)
 *   - Batch Q-table updates
 *
 * Protocolo de mensagens:
 *   Main → Worker:
 *     { type: 'BATCH_DECIDE', teams: [{ id, ctx, brainState, actions }] }
 *     { type: 'BATCH_OBSERVE', observations: [{ id, stateKey, action, reward, nextStateKey }] }
 *     { type: 'SERIALIZE', brainStates: Object }
 *
 *   Worker → Main:
 *     { type: 'DECISIONS', results: [{ id, action, emotional }] }
 *     { type: 'OBSERVED', count: number }
 *     { type: 'SERIALIZED', data: string, bytes: number }
 *     { type: 'ERROR', message: string }
 */

// ─── LIGHTWEIGHT BRAIN (no imports, self-contained) ──────────
// The worker needs a minimal Q-learning engine that doesn't depend
// on any DOM or module imports. We inline the core algorithm.

/**
 * Epsilon-greedy action selection from a Q-table slice.
 * @param {Object} qValues — { action: qValue, ... }
 * @param {string[]} availableActions
 * @param {number} epsilon — exploration rate (0-1)
 * @returns {string} chosen action
 */
function epsilonGreedy(qValues, availableActions, epsilon) {
    if (!availableActions || availableActions.length === 0) return null;

    // Explore
    if (Math.random() < epsilon) {
        return availableActions[Math.floor(Math.random() * availableActions.length)];
    }

    // Exploit — pick action with highest Q-value
    let bestAction = availableActions[0];
    let bestQ = qValues[bestAction] ?? 0;
    for (let i = 1; i < availableActions.length; i++) {
        const a = availableActions[i];
        const q = qValues[a] ?? 0;
        if (q > bestQ) {
            bestQ = q;
            bestAction = a;
        }
    }
    return bestAction;
}

/**
 * Q-Learning update: Q(s,a) += α * (r + γ * max(Q(s')) - Q(s,a))
 */
function qUpdate(qTable, stateKey, action, reward, nextStateKey, alpha = 0.15, gamma = 0.9) {
    if (!qTable[stateKey]) qTable[stateKey] = {};
    const currentQ = qTable[stateKey][action] ?? 0;

    // Max Q for next state
    let maxNextQ = 0;
    if (nextStateKey && qTable[nextStateKey]) {
        const nextQs = Object.values(qTable[nextStateKey]);
        if (nextQs.length > 0) maxNextQ = Math.max(...nextQs);
    }

    qTable[stateKey][action] = currentQ + alpha * (reward + gamma * maxNextQ - currentQ);
}

/**
 * Encodes a state context into a compact string key.
 * Must mirror the encodeState() from AdaptiveBrain.js
 */
function encodeState(ctx) {
    const pos = ctx.position ?? 10;
    const tier = pos <= 4 ? 'TOP' : pos <= 10 ? 'MID' : 'BOT';
    const bal = (ctx.balance ?? 0) > 20_000_000 ? 'RICH' : (ctx.balance ?? 0) > 5_000_000 ? 'OK' : 'POOR';
    const form = (ctx.formAvg ?? 50) > 60 ? 'HOT' : (ctx.formAvg ?? 50) < 40 ? 'COLD' : 'WARM';
    const res = ctx.lastResult === 'W' ? 'W' : ctx.lastResult === 'L' ? 'L' : 'D';
    return `${tier}_${bal}_${form}_${res}`;
}

// ─── MESSAGE HANDLER ─────────────────────────────────────────

self.onmessage = function (e) {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'BATCH_DECIDE': {
                // payload.teams = [{ id, ctx, qTable, epsilon, actions }]
                const results = (payload.teams || []).map(t => {
                    const stateKey = encodeState(t.ctx);
                    const qValues = t.qTable?.[stateKey] || {};
                    const action = epsilonGreedy(qValues, t.actions, t.epsilon || 0.2);
                    return { id: t.id, action, stateKey };
                });
                self.postMessage({ type: 'DECISIONS', results });
                break;
            }

            case 'BATCH_OBSERVE': {
                // payload.observations = [{ id, qTable, stateKey, action, reward, nextStateKey }]
                let count = 0;
                for (const obs of (payload.observations || [])) {
                    if (!obs.qTable) continue;
                    qUpdate(obs.qTable, obs.stateKey, obs.action, obs.reward, obs.nextStateKey);
                    count++;
                }
                self.postMessage({ type: 'OBSERVED', count });
                break;
            }

            case 'SERIALIZE': {
                // payload.brainStates = { teamId: { qTable, visitCount, ... } }
                const data = JSON.stringify(payload.brainStates || {});
                self.postMessage({ type: 'SERIALIZED', data, bytes: data.length });
                break;
            }

            case 'PING': {
                self.postMessage({ type: 'PONG', timestamp: Date.now() });
                break;
            }

            default:
                self.postMessage({ type: 'ERROR', message: `Unknown message type: ${type}` });
        }
    } catch (err) {
        self.postMessage({ type: 'ERROR', message: err.message || String(err) });
    }
};
