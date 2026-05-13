/**
 * TutorialView — SPEC-072
 *
 * Onboarding 5 steps. Skip allowed. Resume via Help.
 * State persisted in localStorage 'olefut_tutorial_done'.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgTutorial from '../assets/environments/bg_tutorial.png';
import { resetAllOnboarding, getSeenViews, ONBOARDING_BY_VIEW } from '../engine/OnboardingTriggers';
import '../styles/tutorial-view.css';
import {
    SoccerBall, ChartBar, Strategy, Television, Medal,
    ArrowRight, ArrowLeft, FastForward
} from '@phosphor-icons/react';

const STEPS = [
    {
        title: 'BEM-VINDO AO OLÉFUT',
        body: 'Você é o manager do seu clube brasileiro favorito. Conduza sua equipe da Série D ao topo do mundo. Decisões táticas, transferências e gestão financeira — tudo em suas mãos.',
        icon: <SoccerBall size={64} weight="duotone" color="var(--primary)" />
    },
    {
        title: 'O DASHBOARD',
        body: 'Esta é sua central de comando. Veja o estado do clube, próximo jogo, alertas e balanço. As abas laterais dão acesso ao Plantel e Mercado. Clique em "Avançar Semana" para progredir no tempo.',
        icon: <ChartBar size={64} weight="duotone" color="var(--ef-tut-info)" />
    },
    {
        title: 'TÁTICA E FORMAÇÃO',
        body: 'Antes de cada jogo, escolha sua mentalidade tática e esquema. Analise o adversário no pré-jogo e ajuste sua equipe para explorar as fraquezas oponentes.',
        icon: <Strategy size={64} weight="duotone" color="var(--accent)" />
    },
    {
        title: 'SIMULAÇÃO AO VIVO',
        body: 'Assista à narração do jogo e acompanhe as estatísticas em tempo real. Pause a qualquer momento para fazer substituições táticas e virar o placar.',
        icon: <Television size={64} weight="duotone" color="var(--danger)" />
    },
    {
        title: 'CONQUISTAS E CARREIRA',
        body: 'Sua jornada ficará na história. Acumule troféus, ganhe prestígio, mude de clube e desbloqueie as 60+ conquistas disponíveis no Hall da Fama.',
        icon: <Medal size={64} weight="duotone" color="var(--accent)" />
    }
];

const STORAGE_KEY = 'olefut_tutorial_done';

export function TutorialView() {
    const { changeView, getDashboardView } = useGame();
    const [step, setStep] = useState(0);

    const FUNNEL_KEY = 'olefut_tutorial_funnel';
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

    useEffect(() => { trackStep(0); }, [trackStep]);

    const finish = () => {
        trackStep(step);
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
            localStorage.setItem('olefut_tutorial_origin', 'completed');
        } catch { /* ignore */ }
        changeView('start');
    };

    const skip = () => {
        trackDrop(step);
        try {
            localStorage.setItem(STORAGE_KEY, 'skipped');
            localStorage.setItem('olefut_tutorial_origin', 'skipped');
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
            className="ef-anim-fade-in ef-scene-shell ef-scene-shell--centered ef-tut"
            style={{ backgroundImage: `url(${bgTutorial})` }}
        >
            <EfPanel padding="lg" className="ef-tut__panel">
                <div className="ef-anim-pop-in ef-tut__icon-box" key={`icon-${step}`}>
                    {cur.icon}
                </div>

                <div className="ef-anim-slide-up" key={`content-${step}`}>
                    <h2 className="ef-sans ef-text-main ef-tut__title">
                        {cur.title}
                    </h2>
                    <p className="ef-text-muted ef-tut__body">
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

                <div className="ef-tut__nav">
                    {step > 0 && (
                        <EfButton variant="secondary" size="lg" onClick={prev} className="ef-tut__nav-btn">
                            <ArrowLeft size={20} /> ANTERIOR
                        </EfButton>
                    )}
                    <EfButton variant="primary" size="lg" onClick={next} className={step === 0 ? 'ef-tut__nav-btn--primary-only' : 'ef-tut__nav-btn--primary-after-back'}>
                        {step < STEPS.length - 1 ? (
                            <>PRÓXIMO <ArrowRight size={20} /></>
                        ) : (
                            <>INICIAR CARREIRA <SoccerBall size={20} weight="fill" /></>
                        )}
                    </EfButton>
                </div>

                <div className="ef-tut__skip-wrap">
                    <button onClick={skip} className="ef-skip-link">
                        <FastForward size={14} /> PULAR TUTORIAL
                    </button>
                </div>

                {/* SPEC-F5.3: Replay onboarding contextual */}
                <div className="ef-tut__replay">
                    <div className="ef-tut__replay-label">
                        TUTORIAIS CONTEXTUAIS JÁ VISTOS
                    </div>
                    <div className="ef-tut__replay-list">
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
                        className="ef-tut__replay-btn"
                    >
                        REVER TUTORIAIS
                    </button>
                </div>
            </EfPanel>
        </div>
    );
}

export function isTutorialDone() {
    try {
        return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
        return false;
    }
}

export default TutorialView;
