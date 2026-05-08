/**
 * TutorialView — SPEC-072
 *
 * Onboarding 5 steps. Skip allowed. Resume via Help.
 * State persisted in localStorage 'elifoot_tutorial_done'.
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const STEPS = [
    {
        title: '⚽ Bem-vindo ao ELIFOOT',
        body: 'Você é treinador (ou jogador) de futebol brasileiro. Conduza seu clube/jogador da Série D ao topo do mundo. Decisões táticas, transferências, narrativa profunda — tudo seu.',
        icon: '🎮'
    },
    {
        title: '📊 Dashboard',
        body: 'Tela principal: vê estado do clube, próximo jogo, alertas, balanço. Aba "Treinamento", "Mercado", "Plantel" pra ações específicas. Botão "Avançar Semana" toca o tempo.',
        icon: '📊'
    },
    {
        title: '🎯 Tática + Formação',
        body: 'Antes de cada jogo, escolha tática (6 estilos) + formação (8 esquemas). Pré-jogo mostra adversário forte/fraco em cada setor. Ajuste pra explorar fraquezas.',
        icon: '⚔️'
    },
    {
        title: '⚽ Match Live',
        body: 'Assista narração ao vivo + scoreboard. Pode pausar e fazer substituição (até 5/jogo). Eventos importantes mostram banner full-screen (gol, hat-trick, defesa épica).',
        icon: '🥅'
    },
    {
        title: '🏆 Conquistas + Lifestyle',
        body: 'Modo Jogador: gaste seu dinheiro em casa, carro, festas, caridade. Compre traits especiais. Veja conquistas (60+) na tela "Conquistas". Bom jogo!',
        icon: '🎖️'
    }
];

const STORAGE_KEY = 'elifoot_tutorial_done';

export function TutorialView() {
    const { changeView, getDashboardView } = useGame();
    const [step, setStep] = useState(0);

    const finish = () => {
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
        changeView('start');
    };

    const skip = () => {
        try { localStorage.setItem(STORAGE_KEY, 'skipped'); } catch { /* ignore */ }
        changeView('start');
    };

    const next = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
        else finish();
    };

    const prev = () => {
        if (step > 0) setStep(step - 1);
    };

    const cur = STEPS[step];

    return (
        <div className="main-content fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            gap: '1.5rem'
        }}>
            <div className="card ef-anim-pop-in" style={{
                padding: '2rem',
                maxWidth: '600px',
                width: '90%',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }} className="ef-anim-pulse-glow">
                    {cur.icon}
                </div>
                <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>{cur.title}</h2>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem', color: 'var(--text)' }}>
                    {cur.body}
                </p>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem'
                }}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: '40px',
                                height: '6px',
                                borderRadius: '3px',
                                background: i === step ? 'var(--accent)' : i < step ? 'var(--primary)' : 'var(--border-subtle, #2a3530)',
                                transition: 'background 200ms ease-out'
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={prev}>← Anterior</button>
                    )}
                    <button className="btn btn-primary" onClick={next}>
                        {step < STEPS.length - 1 ? 'Próximo →' : '🎮 Começar!'}
                    </button>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Etapa {step + 1} de {STEPS.length} • <button
                        onClick={skip}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                        }}
                    >Pular tutorial</button>
                </div>
            </div>
        </div>
    );
}

// Helper: check tutorial state
export function isTutorialDone() {
    try {
        return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
        return false;
    }
}

export default TutorialView;
