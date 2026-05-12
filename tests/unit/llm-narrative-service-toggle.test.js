/**
 * SPEC-174 — LLMNarrativeService toggle harness
 *
 * Verifies the public toggle API + localStorage persistence + lazy-load.
 * Default is template-only; user opt-in via enableLLM() persists in
 * localStorage and lazy-loads the WebLLM bridge.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LLMNarrativeService, __internals } from '../../src/services/LLMNarrativeService.js';

const STORAGE_KEY = __internals.LLM_TOGGLE_STORAGE_KEY;
const HAS_LS = typeof localStorage !== 'undefined';

function clearStorage() {
    try { if (HAS_LS) localStorage.removeItem(STORAGE_KEY); } catch { /* jsdom / fresh */ }
}

describe('SPEC-174: LLM toggle — defaults & basic flag', () => {
    beforeEach(() => clearStorage());

    it('isLLMEnabled() defaults to false with no opt-in', () => {
        const svc = new LLMNarrativeService({ skipPersistence: true });
        expect(svc.isLLMEnabled()).toBe(false);
    });

    it('enableLLM() flips flag to true and disableLLM() flips it back', async () => {
        const svc = new LLMNarrativeService({ skipPersistence: true });
        // Use injected loader so we never touch dynamic import / real WebLLM.
        const FakeBridge = class {
            constructor() { this._mode = 'heuristic'; this._loadStatus = 'idle'; }
            setMode(m) { this._mode = m; }
            status() { return { mode: this._mode, loadStatus: this._loadStatus }; }
            async init() { this._loadStatus = 'ready'; }
            async decide() { return { source: 'webllm', text: '' }; }
        };
        const loader = vi.fn(async () => ({ AutoPlayLLMBridge: FakeBridge }));
        const result = await svc.enableLLM({ bridgeLoader: loader });
        expect(result.ok).toBe(true);
        expect(svc.isLLMEnabled()).toBe(true);
        expect(loader).toHaveBeenCalledTimes(1);

        svc.disableLLM();
        expect(svc.isLLMEnabled()).toBe(false);
    });
});

describe.skipIf(!HAS_LS)('SPEC-174: localStorage persistence', () => {
    beforeEach(() => clearStorage());

    it('enableLLM() writes "1" to localStorage', async () => {
        const svc = new LLMNarrativeService();
        const FakeBridge = class {
            setMode() {} status() { return { mode: 'webllm', loadStatus: 'ready' }; }
            async init() {}
        };
        await svc.enableLLM({ bridgeLoader: async () => ({ AutoPlayLLMBridge: FakeBridge }) });
        expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('disableLLM() removes the localStorage key', async () => {
        localStorage.setItem(STORAGE_KEY, '1');
        const svc = new LLMNarrativeService();
        expect(svc.isLLMEnabled()).toBe(true);
        svc.disableLLM();
        expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    });

    it('constructor reads persisted toggle from localStorage', () => {
        localStorage.setItem(STORAGE_KEY, '1');
        const svc = new LLMNarrativeService();
        expect(svc.isLLMEnabled()).toBe(true);
    });

    it('constructor honors explicit opts.enableLLM over localStorage', () => {
        localStorage.setItem(STORAGE_KEY, '1');
        const svc = new LLMNarrativeService({ enableLLM: false });
        expect(svc.isLLMEnabled()).toBe(false);
    });
});

describe('SPEC-174: managerAdvice returns template when LLM disabled', () => {
    beforeEach(() => clearStorage());

    it('returns a non-empty BR-PT template without touching the bridge', async () => {
        const decide = vi.fn();
        const bridge = {
            status: () => ({ mode: 'webllm', loadStatus: 'ready' }),
            decide,
        };
        // Inject a bridge but keep LLM disabled — service should ignore it.
        const svc = new LLMNarrativeService({ bridge, enableLLM: false, skipPersistence: true });
        const text = await svc.managerAdvice({
            ownTeam: { name: 'Flamengo', avgOvr: 75, formation: '4-3-3', currentTactic: 'Pressing' },
            opponent: { name: 'Vasco', avgOvr: 70 },
            position: 3,
            totalTeams: 20,
        });
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThanOrEqual(20);
        expect(decide).not.toHaveBeenCalled();
        const meta = svc.getLastMeta();
        expect(meta).toBeTruthy();
        expect(meta.source).toBe('template');
    });
});

describe('SPEC-174: lazy bridge bootstrap', () => {
    beforeEach(() => clearStorage());

    it('enableLLM() instantiates the bridge via loader and calls setMode + init', async () => {
        const setMode = vi.fn();
        const init = vi.fn(async () => {});
        const FakeBridge = vi.fn(function FakeBridge() {
            this.setMode = setMode;
            this.init = init;
            this.status = () => ({ mode: 'webllm', loadStatus: 'ready' });
        });
        const loader = vi.fn(async () => ({ AutoPlayLLMBridge: FakeBridge }));
        const svc = new LLMNarrativeService({ skipPersistence: true });
        const result = await svc.enableLLM({ bridgeLoader: loader });
        expect(result.ok).toBe(true);
        expect(FakeBridge).toHaveBeenCalledTimes(1);
        expect(setMode).toHaveBeenCalledWith('webllm');
        expect(init).toHaveBeenCalledTimes(1);
        // Bridge should be remembered — getLLMStatus reflects ready state.
        const status = svc.getLLMStatus();
        expect(status.enabled).toBe(true);
        expect(status.bridgeReady).toBe(true);
    });

    it('enableLLM() returns { ok: false, error } when loader throws — toggle stays graceful', async () => {
        const svc = new LLMNarrativeService({ skipPersistence: true });
        const loader = async () => { throw new Error('CDN offline'); };
        const result = await svc.enableLLM({ bridgeLoader: loader });
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/CDN offline/);
        // Flag stays true (user requested it) but service falls back to templates.
        expect(svc.isLLMEnabled()).toBe(true);
        const text = await svc.managerAdvice({
            ownTeam: { name: 'X', avgOvr: 60, formation: '4-4-2', currentTactic: 'Normal' },
            opponent: { name: 'Y', avgOvr: 60 },
            position: 5, totalTeams: 20,
        });
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThanOrEqual(20);
        expect(svc.getLastMeta().source).toBe('template');
    });

    it('disableLLM() after enable keeps the cached bridge for instant re-enable', async () => {
        const FakeBridge = vi.fn(function FakeBridge() {
            this.setMode = () => {};
            this.init = vi.fn(async () => {});
            this.status = () => ({ mode: 'webllm', loadStatus: 'ready' });
        });
        const loader = vi.fn(async () => ({ AutoPlayLLMBridge: FakeBridge }));
        const svc = new LLMNarrativeService({ skipPersistence: true });
        await svc.enableLLM({ bridgeLoader: loader });
        svc.disableLLM();
        await svc.enableLLM({ bridgeLoader: loader });
        // Loader called only once: bridge already cached on second enable.
        expect(loader).toHaveBeenCalledTimes(1);
        expect(FakeBridge).toHaveBeenCalledTimes(1);
    });
});
