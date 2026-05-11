/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { EfButton } from './ui/EfButton';

/**
 * §12.4 Octalysis #6: Scarcity Emphasis
 * Shows urgency indicators for deadlines, rare events, limited resources
 */
export function ScarcityBanner({ engine }) {
    const team = engine?.getTeam(engine.manager?.teamId);
    if (!team) return null;

    const seasonWeek = ((engine.currentWeek - 1) % 38) + 1;
    const items = [];

    // Transfer window closing (weeks 1-4 and 20-22 are windows)
    if (seasonWeek >= 18 && seasonWeek <= 20) {
        items.push({ emoji: '⏰', text: `Janela fecha em ${22 - seasonWeek} semanas!`, color: '#f59e0b' });
    }
    if (seasonWeek >= 21 && seasonWeek <= 22) {
        items.push({ emoji: '🚨', text: 'ÚLTIMA CHANCE — janela fecha!', color: '#ef4444' });
    }

    // Budget scarcity
    if ((team.balance || 0) < 500000 && seasonWeek > 5) {
        items.push({ emoji: '💸', text: `Caixa crítico: R$${Math.round((team.balance || 0) / 1000)}k`, color: '#ef4444' });
    }

    // Expiring contracts
    const expiring = team.squad?.filter(p => p.contract && p.contract.weeksLeft <= 4) || [];
    if (expiring.length > 0) {
        items.push({ emoji: '📋', text: `${expiring.length} contrato${expiring.length > 1 ? 's' : ''} expirando!`, color: '#f59e0b' });
    }

    if (items.length === 0) return null;

    return (
        <div className="scarcity-banner">
            {items.map((item, i) => (
                <span key={i} className="scarcity-item" style={{ color: item.color }}>
                    {item.emoji} {item.text}
                </span>
            ))}
        </div>
    );
}

/**
 * §12.4 Octalysis #8: Loss Avoidance "Dread" Visual
 * Shows relegation danger zone with pulsing red when at risk
 */
export function DreadIndicator({ engine }) {
    const team = engine?.getTeam(engine.manager?.teamId);
    if (!team) return null;

    const standings = engine.getStandings(team.zone, team.division);
    const pos = standings?.findIndex(s => s.teamId === team.id);
    const total = standings?.length || 20;
    const isRelegation = pos !== undefined && pos >= total - 4;
    const isClose = pos !== undefined && pos >= total - 6 && pos < total - 4;

    const boardConf = engine.board?.confidence ?? 60;
    const isFiring = boardConf < 20;

    if (!isRelegation && !isClose && !isFiring) return null;

    return (
        <div className={`dread-indicator ${isRelegation ? 'dread-critical' : 'dread-warning'}`}>
            {isRelegation && <span className="dread-pulse">⚠️ ZONA DE REBAIXAMENTO — {total - pos}º do fundo</span>}
            {isClose && !isRelegation && <span>😰 Perto da zona — {pos + 1}º lugar</span>}
            {isFiring && <span className="dread-pulse">🔥 DIRETORIA FURIOSA — Demissão iminente ({boardConf}%)</span>}
        </div>
    );
}

/**
 * §22.7 Keyboard Navigation Hook
 * Adds keyboard shortcuts to main game views
 */
export function useKeyboardNav({ changeView, onAdvanceWeek, currentView }) {
    useEffect(() => {
        const handler = (e) => {
            // Don't capture when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case ' ': // Space = advance week (if on dashboard)
                case 'Enter':
                    if (currentView === 'dashboard' && onAdvanceWeek) {
                        e.preventDefault();
                        onAdvanceWeek();
                    }
                    break;
                case '1': changeView?.('dashboard'); break;
                case '2': changeView?.('squad'); break;
                case '3': changeView?.('market'); break;
                case '4': changeView?.('standings'); break;
                case '5': changeView?.('press'); break;
                case 'Escape': changeView?.('dashboard'); break;
                default: break;
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [changeView, onAdvanceWeek, currentView]);
}

/**
 * §22.4 Ironman Mode
 * Save behavior utilities for single-slot autosave
 */
export const IronmanMode = {
    isActive: () => {
        try { return localStorage.getItem('elifoot_ironman') === 'true'; } catch { return false; } // storage unavailable
    },
    activate: () => {
        try { localStorage.setItem('elifoot_ironman', 'true'); } catch { /* ignore */ }
    },
    deactivate: () => {
        try { localStorage.removeItem('elifoot_ironman'); } catch { /* ignore */ }
    },
    /**
     * In ironman mode, autosave after every match week.
     * Seed is stored in save to prevent save-scumming.
     */
    autoSave: (engine, saveFunc) => {
        if (!IronmanMode.isActive()) return;
        if (typeof saveFunc === 'function') {
            saveFunc();
        }
    },
};

/**
 * §17 Tutorial Guide — Step-by-step guided tutorial overlay
 */
const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        target: null,
        title: 'Bem-vindo ao OléFUT! ⚽',
        text: 'Você é o novo treinador. Vamos aprender o básico em 5 passos rápidos.',
        action: null,
    },
    {
        id: 'formation',
        target: 'Táticas',
        title: '1️⃣ Escolha sua Formação',
        text: 'Role até a seção de táticas e escolha uma formação. 4-3-3 é equilibrada para começar.',
        action: 'Clique em uma formação',
    },
    {
        id: 'training',
        target: 'Treino',
        title: '2️⃣ Treine o Elenco',
        text: 'Treinos semanais melhoram os atributos dos jogadores. Escolha um tipo de treino.',
        action: 'Clique em um treino',
    },
    {
        id: 'play',
        target: 'Jogar',
        title: '3️⃣ Avance a Semana',
        text: 'Clique no botão "Jogar Rodada" para simular a partida. Observe o resultado!',
        action: 'Clique em Jogar Rodada',
    },
    {
        id: 'adjust',
        target: null,
        title: '4️⃣ Reaja e Ajuste',
        text: 'Depois do jogo, leia os eventos, verifique lesões, e ajuste a tática se necessário.',
        action: null,
    },
    {
        id: 'done',
        target: null,
        title: '5️⃣ Pronto! 🎉',
        text: 'Você domina o básico. Explore transferências, base, e scouts para ir além. Boa sorte, treinador!',
        action: null,
    },
];

export function TutorialOverlay({ visible, onDismiss }) {
    const [step, setStep] = useState(0);

    if (!visible) return null;

    const current = TUTORIAL_STEPS[step];
    const isLast = step === TUTORIAL_STEPS.length - 1;

    return (
        <div className="tutorial-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="tutorial-card">
                <div className="tutorial-progress">
                    {TUTORIAL_STEPS.map((_, i) => (
                        <span key={i} className={`tutorial-dot ${i <= step ? 'active' : ''}`} />
                    ))}
                </div>
                <h3 className="tutorial-title">{current.title}</h3>
                <p className="tutorial-text">{current.text}</p>
                {current.action && (
                    <p className="tutorial-action">👉 {current.action}</p>
                )}
                <div className="tutorial-buttons" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <EfButton variant="secondary" size="sm" onClick={() => {
                        try { localStorage.setItem('elifoot_tutorial_done', 'true'); } catch { /* storage full */ }
                        onDismiss();
                    }}>Pular tutorial</EfButton>
                    <EfButton variant="primary" size="sm" onClick={() => {
                        if (isLast) {
                            try { localStorage.setItem('elifoot_tutorial_done', 'true'); } catch { /* storage full */ }
                            onDismiss();
                        } else {
                            setStep(s => s + 1);
                        }
                    }}>{isLast ? 'Começar!' : 'Próximo →'}</EfButton>
                </div>
            </div>
        </div>
    );
}

/**
 * §17 Session Time Metrics
 * Tracks session duration and actions per minute
 */
export class SessionMetrics {
    constructor() {
        this.startTime = Date.now();
        this.actions = 0;
        this.matchesPlayed = 0;
    }

    recordAction() { this.actions++; }
    recordMatch() { this.matchesPlayed++; }

    getMetrics() {
        const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
        return {
            sessionMinutes: Math.round(elapsed * 10) / 10,
            actionsPerMinute: elapsed > 0 ? Math.round((this.actions / elapsed) * 10) / 10 : 0,
            matchesPerMinute: elapsed > 0 ? Math.round((this.matchesPlayed / elapsed) * 10) / 10 : 0,
            avgSecondsPerMatch: this.matchesPlayed > 0
                ? Math.round((elapsed * 60) / this.matchesPlayed) : 0,
        };
    }

    /** §12.1 — "One More Match" check: are sessions under 5 min per match? */
    isCoreLoopFast() {
        const m = this.getMetrics();
        return m.avgSecondsPerMatch > 0 && m.avgSecondsPerMatch < 300; // < 5 min
    }
}
