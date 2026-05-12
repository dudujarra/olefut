/**
 * TutorialView — SPEC-072
 *
 * Onboarding 5 steps. Skip allowed. Resume via Help.
 * State persisted in localStorage 'elifoot_tutorial_done'.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgTutorial from '../assets/environments/bg_tutorial.png';
import { resetAllOnboarding, getSeenViews, ONBOARDING_BY_VIEW } from '../engine/OnboardingTriggers';
import {
    SoccerBall, ChartBar, Strategy, Television, Medal,
    ArrowRight, ArrowLeft, FastForward
} from '@phosphor-icons/react';

const STEPS = [
    {
        title: 'BEM-VINDO AO OLÉ FUT',
        body: 'Você é o manager do seu clube brasileiro favorito. Conduza sua equipe da Série D ao topo do mundo. Decisões táticas, transferências e gestão financeira — tudo em suas mãos.',
        icon: <SoccerBall size={64} weight="duotone" color="#39FF14" />
    },
    {
        title: 'O DASHBOARD',
        body: 'Esta é sua central de comando. Veja o estado do clube, próximo jogo, alertas e balanço. As abas laterais dão acesso ao Plantel e Mercado. Clique em "Avançar Semana" para progredir no tempo.',
        icon: <ChartBar size={64} weight="duotone" color="#40BAF7" />
    },
    {
        title: 'TÁTICA E FORMAÇÃO',
        body: 'Antes de cada jogo, escolha sua mentalidade tática e esquema. Analise o adversário no pré-jogo e ajuste sua equipe para explorar as fraquezas oponentes.',
        icon: <Strategy size={64} weight="duotone" color="#FFD700" />
    },
    {
        title: 'SIMULAÇÃO AO VIVO',
        body: 'Assista à narração do jogo e acompanhe as estatísticas em tempo real. Pause a qualquer momento para fazer substituições táticas e virar o placar.',
        icon: <Television size={64} weight="duotone" color="#FF3333" />
    },
    {
        title: 'CONQUISTAS E CARREIRA',
        body: 'Sua jornada ficará na história. Acumule troféus, ganhe prestígio, mude de clube e desbloqueie as 60+ conquistas disponíveis no Hall da Fama.',
        icon: <Medal size={64} weight="duotone" color="#FFD700" />
    }
];

const STORAGE_KEY = 'elifoot_tutorial_done';

export function TutorialView() {
    const { changeView, getDashboardView } = useGame();
    const [step, setStep] = useState(0);

    // --- AUDIT-FIX #16: Tutorial Funnel Tracking for SPEC-113 ---
    const FUNNEL_KEY = 'elifoot_tutorial_funnel';
    const tracked = useRef(new Set());

    const trackStep = useCallback((idx) => {
        if (tracked.current.has(idx)) return;
        tracked.current.add(idx);
        try {
            const raw = localStorage.getItem(FUNNEL_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.push({ step: STEPS[idx]?.title || `Step ${idx}`, stepIndex: idx, reached: true, reachedAt: Date.now() });
            localStorage.setItem(FUNNEL_KEY, JSON.stringify(arr));
        } catch { /* ignore */ }
    }, []);

    const trackDrop = useCallback((idx) => {
        try {
            const raw = localStorage.getItem(FUNNEL_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            arr.push({ step: STEPS[idx]?.title || `Step ${idx}`, stepIndex: idx, reached: true, droppedAt: Date.now() });
            localStorage.setItem(FUNNEL_KEY, JSON.stringify(arr));
        } catch { /* ignore */ }
    }, []);

    // Track step 0 on mount
    useEffect(() => { trackStep(0); }, [trackStep]);

    const finish = () => {
        trackStep(step);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
            localStorage.setItem('elifoot_tutorial_origin', 'completed');
        } catch { /* ignore */ }
        changeView('start');
    };

    const skip = () => {
        trackDrop(step);
        try {
            localStorage.setItem(STORAGE_KEY, 'skipped');
            localStorage.setItem('elifoot_tutorial_origin', 'skipped');
        } catch { /* ignore */ }
        changeView('start');
    };

    const next = () => {
        trackStep(step);
        if (step < STEPS.length - 1) setStep(step + 1);
        else finish();
    };

    const prev = () => {
        if (step > 0) setStep(step - 1);
    };

    const cur = STEPS[step];

    return (
        <div
            className="ef-anim-fade-in ef-scene-shell ef-scene-shell--centered"
            style={{ backgroundImage: `url(${bgTutorial})` }}
        >
            <EfPanel padding="lg" style={{
                maxWidth: '600px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '24px',
                borderTop: '4px solid #40BAF7'
            }}>
                <div className="ef-anim-pop-in" key={`icon-${step}`} style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: '#0D1117',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #2D3748',
                    boxShadow: '0 0 30px #111417'
                }}>
                    {cur.icon}
                </div>

                <div className="ef-anim-slide-up" key={`content-${step}`}>
                    <h2 className="ef-sans ef-text-main" style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: '900' }}>
                        {cur.title}
                    </h2>
                    <p className="ef-text-muted" style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
                        {cur.body}
                    </p>
                </div>

                <div className="ef-stepbar">
                    {STEPS.map((_, i) => {
                        const cls = i === step
                            ? 'ef-stepbar__pip ef-stepbar__pip--current'
                            : i < step
                                ? 'ef-stepbar__pip ef-stepbar__pip--past'
                                : 'ef-stepbar__pip';
                        return <div key={i} className={cls} />;
                    })}
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
                    {step > 0 && (
                        <EfButton variant="secondary" size="lg" onClick={prev} style={{ flex: 1 }}>
                            <ArrowLeft size={20} /> ANTERIOR
                        </EfButton>
                    )}
                    <EfButton variant="primary" size="lg" onClick={next} style={{ flex: step === 0 ? 1 : 2 }}>
                        {step < STEPS.length - 1 ? (
                            <>PRÓXIMO <ArrowRight size={20} /></>
                        ) : (
                            <>INICIAR CARREIRA <SoccerBall size={20} weight="fill" /></>
                        )}
                    </EfButton>
                </div>

                <div style={{ marginTop: '8px' }}>
                    <button onClick={skip} className="ef-skip-link">
                        <FastForward size={14} /> PULAR TUTORIAL
                    </button>
                </div>

                {/* SPEC-F5.3: Replay onboarding contextual */}
                <div style={{ marginTop: '24px', borderTop: '1px solid #2D3748', paddingTop: '16px', width: '100%' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8E9E94', fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        TUTORIAIS CONTEXTUAIS JÁ VISTOS
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#FDFBF7', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
                        {getSeenViews().length === 0 ? 'Nenhum ainda.' : getSeenViews().map(v => ONBOARDING_BY_VIEW[v]?.title || v).join(' · ')}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== 'undefined' && window.confirm('Resetar TODOS os tutoriais? Eles voltarão a aparecer ao abrir cada view.')) {
                                resetAllOnboarding();
                                if (typeof window !== 'undefined') window.location.reload();
                            }
                        }}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#40BAF7',
                            border: '1px solid #40BAF7',
                            padding: '6px 14px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                        }}
                    >
                        REVER TUTORIAIS
                    </button>
                </div>
            </EfPanel>
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
