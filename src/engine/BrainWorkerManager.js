/**
 * BrainWorkerManager — MARL Fase 7
 *
 * Gerencia o Web Worker para processamento batch de decisões NPC.
 * A engine chama este manager em vez de rodar pickAction() inline.
 *
 * Fluxo:
 *   1. engine.advanceWeek() → BrainWorkerManager.batchDecide(teams)
 *   2. Manager serializa contextos e Q-tables dos NPCs
 *   3. Posta mensagem BATCH_DECIDE ao worker
 *   4. Worker retorna decisões em ~1-5ms
 *   5. Manager aplica decisões nos times
 *
 * Fallback: se Web Worker não disponível, processa inline (sync).
 */

import { npcTacticDecision, shouldUseFullBrain } from '../services/learning/NpcManagerAI.js';

export class BrainWorkerManager {
    constructor() {
        this.worker = null;
        this.ready = false;
        this._pendingCallbacks = new Map();
        this._callbackId = 0;
    }

    /**
     * Inicializa o Web Worker. Silencioso se não suportado.
     */
    init() {
        if (typeof Worker === 'undefined') {
            this.ready = false;
            return;
        }

        try {
            this.worker = new Worker(
                new URL('../workers/brainWorker.js', import.meta.url),
                { type: 'module' }
            );

            this.worker.onmessage = (e) => this._handleMessage(e.data);
            this.worker.onerror = () => {
                this.ready = false;
                this.worker = null;
            };

            // Ping to verify worker is alive
            this.worker.postMessage({ type: 'PING', payload: {} });
            this.ready = true;
        } catch {
            this.ready = false;
            this.worker = null;
        }
    }

    /**
     * Processa decisões de tática para todos os NPC teams.
     * Se worker disponível → async batch. Senão → sync inline.
     *
     * @param {Array<Object>} npcTeams — times NPC com brain
     * @param {Object} engine — referência ao Engine
     * @returns {Promise<Array<{id: number, tactic: string}>>}
     */
    async batchDecide(npcTeams, engine) {
        if (!this.ready || !this.worker) {
            // Fallback: sync inline processing
            return npcTeams.map(t => {
                const result = npcTacticDecision(t, engine);
                return { id: t.id, tactic: result.tactic };
            });
        }

        // Serialize team contexts for worker
        const playerDiv = engine.getTeam(engine.manager?.teamId)?.division || 1;
        const teamsPayload = npcTeams
            .filter(t => t.brain && shouldUseFullBrain(t, playerDiv))
            .map(t => ({
                id: t.id,
                ctx: {
                    position: 10, // simplified — full ctx would require standings
                    balance: t.balance || 0,
                    formAvg: 50,
                    lastResult: t.npcTacticState?.recentResults?.[0] || '-',
                },
                qTable: t.brain.qTable,
                epsilon: t.brain.epsilon,
                actions: ['TACTIC_normal', 'TACTIC_attacking', 'TACTIC_defensive', 'TACTIC_counter']
            }));

        if (teamsPayload.length === 0) return [];

        return new Promise((resolve) => {
            const cbId = this._callbackId++;
            const timeout = setTimeout(() => {
                this._pendingCallbacks.delete(cbId);
                // Timeout fallback: use sync
                resolve(npcTeams.map(t => {
                    const result = npcTacticDecision(t, engine);
                    return { id: t.id, tactic: result.tactic };
                }));
            }, 500); // 500ms timeout

            this._pendingCallbacks.set(cbId, { resolve, timeout });

            this.worker.postMessage({
                type: 'BATCH_DECIDE',
                payload: { teams: teamsPayload, cbId }
            });
        });
    }

    _handleMessage(data) {
        if (data.type === 'PONG') {
            this.ready = true;
            return;
        }

        if (data.type === 'DECISIONS') {
            // Find and resolve any pending callback
            for (const [cbId, cb] of this._pendingCallbacks) {
                clearTimeout(cb.timeout);
                cb.resolve(data.results.map(r => ({
                    id: r.id,
                    tactic: (r.action || '').replace('TACTIC_', '') || 'normal'
                })));
                this._pendingCallbacks.delete(cbId);
                break; // one at a time
            }
            return;
        }

        if (data.type === 'ERROR') {
            console.warn('[BrainWorkerManager] Worker error:', data.message);
        }
    }

    /**
     * Cleanup worker.
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.ready = false;
        this._pendingCallbacks.clear();
    }
}
