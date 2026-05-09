/**
 * LLMBridge — SPEC-119
 *
 * Decision engine for AutoPlay bot buy/sell. Two modes:
 * - heuristic: pure function rules (default, always available)
 * - webllm: in-browser LLM via @mlc-ai/web-llm (opt-in, WebGPU required)
 *
 * Bridge falls back to heuristic if WebLLM init fails or model unloaded.
 *
 * Usage:
 *   const bridge = new LLMBridge({ mode: 'heuristic' });
 *   await bridge.init();
 *   const decision = await bridge.decideBuy(team, offer);
 *   // { buy: bool, reason: string, source: 'heuristic'|'llm' }
 */

const STORAGE_KEY = 'elifoot_llm_mode';

/**
 * HEURISTIC: Should bot buy this player?
 */
export function decideBuyHeuristic(team, offer) {
    if (!team?.squad || !offer?.player || !offer?.amount) {
        return { buy: false, reason: 'invalid input', source: 'heuristic' };
    }
    const position = offer.player.position;
    const positionPlayers = team.squad.filter(p => p.position === position);
    const avgPositionOVR = positionPlayers.length > 0
        ? positionPlayers.reduce((s, p) => s + (p.ovr || 0), 0) / positionPlayers.length
        : 0;
    const offerOVR = offer.player.ovr || 0;

    const isPositionWeak = avgPositionOVR < 60;
    const isAffordable = (team.balance || 0) > offer.amount * 2;
    const isUpgrade = offerOVR > avgPositionOVR + 5;
    const squadHasRoom = team.squad.length < 25;

    const buy = isPositionWeak && isAffordable && isUpgrade && squadHasRoom;
    const reason = !buy
        ? `skip: weak=${isPositionWeak} aff=${isAffordable} up=${isUpgrade} room=${squadHasRoom}`
        : `${position} weak (avg ${avgPositionOVR.toFixed(0)}) → buy ${offerOVR}OVR`;

    return { buy, reason, source: 'heuristic' };
}

/**
 * HEURISTIC: Should bot sell this player given offer?
 */
export function decideSellHeuristic(team, offer) {
    if (!team?.squad || !offer?.player || !offer?.amount) {
        return { sell: false, reason: 'invalid input', source: 'heuristic' };
    }
    const player = offer.player;
    const positionPlayers = team.squad.filter(p => p.position === player.position);
    const isReserve = !player.isTitular;
    const isOld = (player.age || 25) > 32;
    const isOverpay = offer.amount >= (player.value || 1_000_000) * 1.2;
    const positionDeep = positionPlayers.length > 4;

    const sell = (isReserve && isOverpay) || (isOld && positionDeep) || isOverpay;
    const reason = sell
        ? `sell: reserve=${isReserve} old=${isOld} overpay=${isOverpay} deep=${positionDeep}`
        : 'keep';

    return { sell, reason, source: 'heuristic' };
}

export class LLMBridge {
    constructor({ mode = 'heuristic' } = {}) {
        this.mode = this._restoreMode() || mode;
        this.engine = null;          // WebLLM engine instance
        this.modelReady = false;
        this.loadProgress = 0;
        this.loadStatus = 'idle';
    }

    _restoreMode() {
        try {
            if (typeof localStorage === 'undefined') return null;
            return localStorage.getItem(STORAGE_KEY);
        } catch { return null; }
    }

    setMode(mode) {
        this.mode = mode;
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, mode);
        } catch { /* ignore */ }
    }

    /**
     * Lazy init for WebLLM. No-op for heuristic.
     */
    async init() {
        if (this.mode !== 'webllm') return;
        if (this.modelReady) return;
        if (typeof navigator === 'undefined' || !navigator.gpu) {
            this.loadStatus = 'no-webgpu';
            this.mode = 'heuristic';
            return;
        }
        try {
            this.loadStatus = 'loading';
            const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
            this.engine = await CreateMLCEngine(
                'Llama-3.2-1B-Instruct-q4f32_1-MLC',
                {
                    initProgressCallback: (info) => {
                        this.loadProgress = info.progress || 0;
                        this.loadStatus = info.text || 'loading';
                    }
                }
            );
            this.modelReady = true;
            this.loadStatus = 'ready';
        } catch (err) {
            this.loadStatus = `error: ${err.message}`;
            this.mode = 'heuristic';
            this.modelReady = false;
        }
    }

    /**
     * Decide buy.
     */
    async decideBuy(team, offer) {
        if (this.mode === 'webllm' && this.modelReady) {
            try {
                return await this._llmDecide('buy', team, offer);
            } catch {
                // fallback heuristic
            }
        }
        return decideBuyHeuristic(team, offer);
    }

    async decideSell(team, offer) {
        if (this.mode === 'webllm' && this.modelReady) {
            try {
                return await this._llmDecide('sell', team, offer);
            } catch {
                // fallback heuristic
            }
        }
        return decideSellHeuristic(team, offer);
    }

    async _llmDecide(kind, team, offer) {
        const positionPlayers = (team.squad || []).filter(p => p.position === offer.player.position);
        const avgOVR = positionPlayers.length > 0
            ? positionPlayers.reduce((s, p) => s + (p.ovr || 0), 0) / positionPlayers.length
            : 0;

        const prompt = `You are a football manager bot. Decide whether to ${kind === 'buy' ? 'BUY' : 'SELL'} this player.

Squad context:
- Total players: ${team.squad?.length || 0}
- Balance: R$ ${((team.balance || 0) / 1_000_000).toFixed(0)}M
- ${offer.player.position} avg OVR: ${avgOVR.toFixed(0)}

Offer:
- Player: ${offer.player.name || 'Unknown'} (${offer.player.position}, age ${offer.player.age || '?'}, OVR ${offer.player.ovr || '?'})
- Amount: R$ ${(offer.amount / 1_000_000).toFixed(1)}M

Reply ONLY with JSON: {"${kind}": true|false, "reason": "short string"}`;

        const response = await this.engine.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 100
        });
        const text = response.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[^}]*\}/);
        if (!match) {
            return kind === 'buy'
                ? decideBuyHeuristic(team, offer)
                : decideSellHeuristic(team, offer);
        }
        const parsed = JSON.parse(match[0]);
        return {
            [kind]: !!parsed[kind],
            reason: parsed.reason || 'llm decision',
            source: 'llm'
        };
    }

    status() {
        return {
            mode: this.mode,
            modelReady: this.modelReady,
            loadProgress: this.loadProgress,
            loadStatus: this.loadStatus
        };
    }
}
