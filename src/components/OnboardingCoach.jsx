/**
 * OnboardingCoach — SPEC-A2
 *
 * Overlay coach que mostra 4 dicas sequenciais durante semana 1 da 1ª temporada.
 * Não-bloqueante, dismissable, persiste em localStorage.
 *
 * Substitui falha do TutorialView (texto pré-jogo ignorado). Aqui é DENTRO do jogo.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, X, ChatCircle } from '@phosphor-icons/react';

const STORAGE_KEY_DONE = 'elifoot_onboarding_done';
const STORAGE_KEY_STEP = 'elifoot_onboarding_step';

const STEPS = [
    {
        id: 1,
        title: 'BEM-VINDO, TÉCNICO',
        body: 'Este é seu DASHBOARD. Tudo que importa começa aqui.',
    },
    {
        id: 2,
        title: 'PRÉ-JOGO',
        body: 'Escolha FORMAÇÃO e TÁTICA antes de cada partida. Adversário diferente, decisão diferente.',
    },
    {
        id: 3,
        title: 'PARTIDA',
        body: 'Clique JOGAR PARTIDA pra simular. Dura cerca de 1 minuto.',
    },
    {
        id: 4,
        title: 'CICLO',
        body: 'Veja resultado, ajuste plantel, próxima semana. Boa sorte!',
    },
];

export function OnboardingCoach({ show, onComplete }) {
    const [step, setStep] = useState(() => {
        try {
            const stored = parseInt(localStorage.getItem(STORAGE_KEY_STEP) || '1', 10);
            return Number.isFinite(stored) && stored >= 1 && stored <= STEPS.length ? stored : 1;
        } catch {
            return 1;
        }
    });
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY_DONE) === 'true'; }
        catch { return false; }
    });

    const markDone = useCallback(() => {
        try { localStorage.setItem(STORAGE_KEY_DONE, 'true'); }
        catch { /* localStorage unavailable */ }
        setDismissed(true);
        if (typeof onComplete === 'function') onComplete();
    }, [onComplete]);

    const persistStep = useCallback((n) => {
        try { localStorage.setItem(STORAGE_KEY_STEP, String(n)); }
        catch { /* noop */ }
    }, []);

    const handleNext = useCallback(() => {
        if (step >= STEPS.length) {
            markDone();
            return;
        }
        const next = step + 1;
        setStep(next);
        persistStep(next);
    }, [step, markDone, persistStep]);

    const handleClose = useCallback(() => {
        markDone();
    }, [markDone]);

    // ESC closes
    useEffect(() => {
        if (!show || dismissed) return;
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, dismissed, handleClose]);

    if (!show || dismissed) return null;

    const current = STEPS[step - 1];
    const isLast = step === STEPS.length;

    return (
        <div
            className="ef-onboarding-coach"
            role="dialog"
            aria-labelledby="ef-onboarding-title"
            aria-describedby="ef-onboarding-body"
        >
            <div className="ef-onboarding-coach__header">
                <span className="ef-onboarding-coach__icon" aria-hidden>
                    <ChatCircle size={16} weight="fill" />
                </span>
                <span id="ef-onboarding-title" className="ef-onboarding-coach__title">
                    {current.title}
                </span>
                <button
                    type="button"
                    className="ef-onboarding-coach__close"
                    onClick={handleClose}
                    aria-label="Fechar onboarding"
                >
                    <X size={14} weight="bold" />
                </button>
            </div>

            <p id="ef-onboarding-body" className="ef-onboarding-coach__body">
                {current.body}
            </p>

            <div className="ef-onboarding-coach__footer">
                <span className="ef-onboarding-coach__progress">
                    {step}/{STEPS.length}
                </span>
                <button
                    type="button"
                    className="ef-onboarding-coach__next"
                    onClick={handleNext}
                >
                    {isLast ? 'ENTENDI' : 'PRÓXIMA'}
                    {!isLast && <ArrowRight size={14} weight="bold" />}
                </button>
            </div>
        </div>
    );
}

export default OnboardingCoach;

// ─── helpers exportados para testes ───
export const _onboardingInternals = {
    STORAGE_KEY_DONE,
    STORAGE_KEY_STEP,
    STEPS,
};
