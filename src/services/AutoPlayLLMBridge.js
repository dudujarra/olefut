import { EngineLogger } from '../engine/EngineLogger.js';
/**
 * AutoPlayLLMBridge — LLM Integration
 *
 * Handles WebLLM instantiation and prompt execution for AutoPlay.
 * Falls back to heuristic mode if WebLLM is disabled or fails.
 */

export class AutoPlayLLMBridge {
    constructor() {
        this._mode = 'heuristic';
        this._loadStatus = 'idle';    // idle | loading | ready | error
        this._loadProgress = 0;
        this._errorMsg = null;
        this._webllmEngine = null;
    }

    status() {
        return {
            mode: this._mode,
            loadStatus: this._loadStatus,
            loadProgress: this._loadProgress,
            error: this._errorMsg,
        };
    }

    setMode(mode) {
        this._mode = mode;
        if (mode === 'heuristic') {
            this._loadStatus = 'idle';
            this._loadProgress = 0;
            this._webllmEngine = null;
            this._errorMsg = null;
        }
    }

    async init() {
        if (this._mode !== 'webllm') return;
        this._loadStatus = 'loading';
        this._loadProgress = 0;
        this._errorMsg = null;

        try {
            // Check WebGPU support first
            if (!navigator.gpu) {
                throw new Error('WebGPU não suportado neste navegador. Use Chrome 113+ ou Edge 113+.');
            }

            // Dynamic import — only downloads @mlc-ai/web-llm when needed
            const webllm = await import(/* @vite-ignore */ 'https://esm.run/@mlc-ai/web-llm');
            const engine = await webllm.CreateMLCEngine(
                'Llama-3.2-1B-Instruct-q4f16_1-MLC',
                {
                    initProgressCallback: (report) => {
                        this._loadProgress = report.progress || 0;
                        console.log(`[SPEC-119] WebLLM: ${(this._loadProgress * 100).toFixed(0)}% — ${report.text || ''}`);
                    }
                }
            );
            this._webllmEngine = engine;
            this._loadStatus = 'ready';
            this._loadProgress = 1;
            console.log('[SPEC-119] WebLLM engine ready');
        } catch (err) {
            EngineLogger.capture(err, 'AutoPlayLLMBridge.init');
            this._loadStatus = 'error';
            this._errorMsg = err.message || String(err);
            console.error('[SPEC-119] WebLLM init failed:', err);
        }
    }

    /**
     * Ask the LLM for a buy/sell decision.
     * Falls back to heuristic if not in webllm mode or engine not ready.
     */
    async decide(prompt) {
        if (this._mode === 'webllm' && this._webllmEngine && this._loadStatus === 'ready') {
            try {
                const reply = await this._webllmEngine.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 200,
                    temperature: 0.3,
                });
                return { source: 'webllm', text: reply.choices?.[0]?.message?.content || '' };
            } catch (err) {
                EngineLogger.capture(err, 'AutoPlayLLMBridge.decide');
                console.warn('[SPEC-119] WebLLM decide error, falling back:', err);
            }
        }
        // Fallback: heuristic
        return { source: 'heuristic', text: null };
    }
}
