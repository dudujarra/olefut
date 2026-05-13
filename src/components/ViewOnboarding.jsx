/**
 * ViewOnboarding — SPEC-F5.1 wire component
 *
 * Reusable que cada view monta no topo. Detecta hasOnboardingPending,
 * renderiza overlay tooltip, marca seen ao fechar.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatCircle, X, ArrowRight } from '@phosphor-icons/react';
import {
    hasOnboardingPending,
    getOnboardingForView,
    markOnboardingSeen,
} from '../engine/OnboardingTriggers';

export function ViewOnboarding({ viewId }) {
    const [step, setStep] = useState(0);
    const [shown, setShown] = useState(false);

    // Trigger only on first mount per view
    useEffect(() => {
        if (!viewId) return;
        if (hasOnboardingPending(viewId)) {
            setShown(true);
            setStep(0);
        }
    }, [viewId]);

    const content = getOnboardingForView(viewId);
    const close = useCallback(() => {
        markOnboardingSeen(viewId);
        setShown(false);
    }, [viewId]);

    const next = useCallback(() => {
        if (!content) return close();
        if (step >= content.steps.length - 1) return close();
        setStep(s => s + 1);
    }, [step, content, close]);

    useEffect(() => {
        if (!shown) return;
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [shown, close]);

    if (!shown || !content) return null;

    const currentStep = content.steps[step] || '';
    const isLast = step >= content.steps.length - 1;

    return (
        <div
            role="dialog"
            aria-label={`Tutorial ${content.title}`}
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '24px',
                width: '300px',
                maxWidth: 'calc(100vw - 48px)',
                backgroundColor: 'var(--color-bg-deep)',
                border: '2px solid var(--info)',
                padding: '14px',
                zIndex: 200,
                boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ChatCircle size={14} color="var(--info)" weight="fill" />
                <span style={{
                    flex: 1,
                    fontSize: '0.7rem',
                    color: 'var(--info)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                }}>
                    {content.title}
                </span>
                <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar tutorial"
                    style={{ background: 'transparent', border: '1px solid var(--color-soft-border)', color: 'var(--text-main)', padding: '2px 4px', cursor: 'pointer' }}
                >
                    <X size={10} weight="bold" />
                </button>
            </div>
            <p style={{
                margin: '0 0 10px 0',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.4,
            }}>
                {currentStep}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {step + 1}/{content.steps.length}
                </span>
                <button
                    type="button"
                    onClick={next}
                    style={{
                        background: 'var(--info)',
                        color: 'var(--color-bg-deep)',
                        border: 'none',
                        padding: '5px 12px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    {isLast ? 'ENTENDI' : 'PRÓXIMA'}
                    {!isLast && <ArrowRight size={10} weight="bold" />}
                </button>
            </div>
        </div>
    );
}

export default ViewOnboarding;
