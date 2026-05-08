/**
 * static-checks.test.js — Verificações estáticas de source code
 * 
 * Valida padrões que não são testáveis via unit test (UI state, imports, etc)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const readSrc = (path) => readFileSync(resolve(import.meta.dirname, '..', 'src', path), 'utf-8');

describe('BUG-003: SpeedRef pattern in MatchView', () => {
    const matchView = readSrc('components/MatchView.jsx');

    it('deve usar speedRef ao invés de speed no setInterval', () => {
        expect(matchView).toContain('speedRef.current');
    });

    it('deve sincronizar speedRef quando speed muda', () => {
        expect(matchView).toContain('speedRef.current = speed');
    });

    it('deve ter tickerStateRef para restart', () => {
        expect(matchView).toContain('tickerStateRef');
    });
});

describe('BUG-004: Reset preStep/talkDone no fulltime', () => {
    const matchView = readSrc('components/MatchView.jsx');

    it('botão dashboard deve resetar preStep', () => {
        expect(matchView).toContain('setPreStep(1)');
    });

    it('botão dashboard deve resetar talkDone', () => {
        expect(matchView).toContain('setTalkDone(false)');
    });

    it('reset deve estar na mesma linha do changeView(dashboard)', () => {
        // Find the fulltime reset line
        const lines = matchView.split('\n');
        const resetLine = lines.find(l => l.includes("changeView('dashboard')") && l.includes('setPreStep'));
        expect(resetLine).toBeDefined();
    });
});

describe('BUG-005: No dead imports in MarketView', () => {
    const marketView = readSrc('components/MarketView.jsx');

    it('não deve importar generateCounterOffer', () => {
        expect(marketView).not.toContain('generateCounterOffer');
    });
});

describe('BUG-006: MarketView deve usar engine.sellPlayer', () => {
    const marketView = readSrc('components/MarketView.jsx');

    it('deve chamar engine.sellPlayer para vender', () => {
        expect(marketView).toContain('engine.sellPlayer');
    });

    it('não deve mutar team.squad diretamente', () => {
        // Should not have team.squad = team.squad.filter
        expect(marketView).not.toContain('team.squad = team.squad.filter');
    });
});

describe('Engine methods completeness', () => {
    const engineSrc = readSrc('engine/engine.js');

    it('deve ter scoutRegionAction', () => {
        expect(engineSrc).toContain('scoutRegionAction(');
    });

    it('deve ter signScoutedPlayer', () => {
        expect(engineSrc).toContain('signScoutedPlayer(');
    });

    it('deve ter sellPlayer', () => {
        expect(engineSrc).toContain('sellPlayer(');
    });

    it('deve ter doScouting', () => {
        expect(engineSrc).toContain('doScouting(');
    });
});
