/**
 * EfModal — Stitch component
 *
 * Centro tela, painel beveled, fundo escuro fade. Esc fecha.
 * Sizes: sm | md | lg | fullscreen
 */

import { useEffect } from 'react';

const SIZE_MAP = {
    sm: '320px',
    md: '480px',
    lg: '720px',
    fullscreen: '100%'
};

export function EfModal({
    open,
    onClose,
    title,
    size = 'md',
    closeOnEsc = true,
    closeOnBackdrop = true,
    children,
    footer
}) {
    useEffect(() => {
        if (!open || !closeOnEsc) return;
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, closeOnEsc, onClose]);

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'ef-modal-title' : undefined}
            onClick={closeOnBackdrop ? onClose : undefined}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--color-shadow-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '16px',
                animation: 'ef-modal-fade 200ms ease-out'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: SIZE_MAP[size] || SIZE_MAP.md,
                    maxHeight: '90vh',
                    backgroundColor: 'var(--color-panel-tone)',
                    border: '4px solid',
                    borderColor: 'var(--border-panel) var(--bg-dark) var(--bg-dark) var(--border-panel)',
                    boxShadow: '0 16px 0 var(--color-shadow-deep)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'ef-pop-in 200ms ease-out',
                    fontFamily: 'var(--font-display)',
                }}
            >
                {/* Header */}
                {title && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--bg-dark)',
                        borderBottom: '4px solid var(--color-shadow-deep)',
                        color: 'var(--text-main)',
                        textShadow: '2px 2px 0 var(--color-shadow-deep)'
                    }}>
                        <h3 id="ef-modal-title" style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            color: 'var(--accent)',
                            lineHeight: 1.5
                        }}>
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            aria-label="Fechar"
                            style={{
                                background: 'var(--danger)',
                                border: '2px solid',
                                borderColor: 'var(--color-input-error-bg) var(--color-input-error-deep) var(--color-input-error-deep) var(--color-input-error-bg)',
                                color: 'var(--text-main)',
                                fontSize: '10px',
                                fontFamily: 'var(--font-display)',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                lineHeight: 1,
                                boxShadow: '2px 2px 0 var(--color-shadow-deep)'
                            }}
                        >
                            X
                        </button>
                    </div>
                )}

                {/* Body */}
                <div style={{
                    flex: 1,
                    padding: '16px',
                    overflowY: 'auto',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    lineHeight: 1.6
                }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '4px solid var(--bg-dark)',
                        background: 'var(--color-tooltip-bg)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EfModal;
