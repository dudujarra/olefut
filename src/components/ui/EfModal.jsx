/**
 * EfModal — Stitch component
 *
 * Centro tela, painel beveled, fundo escuro fade. Esc fecha.
 * Sizes: sm | md | lg | fullscreen
 */

import React, { useEffect } from 'react';

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
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 'var(--ef-space-4)',
                animation: 'ef-modal-fade 200ms ease-out'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: SIZE_MAP[size] || SIZE_MAP.md,
                    maxHeight: '90vh',
                    background: 'var(--ef-bg-card)',
                    border: '3px solid',
                    borderColor: 'var(--ef-bevel-light) var(--ef-bevel-dark) var(--ef-bevel-dark) var(--ef-bevel-light)',
                    boxShadow: 'var(--ef-shadow-drop-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'ef-pop-in 200ms ease-out'
                }}
            >
                {/* Header */}
                {title && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--ef-space-3) var(--ef-space-4)',
                        background: 'var(--ef-color-grass-700)',
                        borderBottom: '2px solid var(--ef-bevel-dark)'
                    }}>
                        <h3 id="ef-modal-title" style={{
                            margin: 0,
                            fontSize: 'var(--ef-font-size-subtitle)',
                            fontFamily: 'var(--ef-font-family-display)',
                            color: 'var(--ef-text-hi)'
                        }}>
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            aria-label="Fechar"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--ef-text-hi)',
                                fontSize: '20px',
                                cursor: 'pointer',
                                padding: 'var(--ef-space-1) var(--ef-space-2)',
                                lineHeight: 1
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Body */}
                <div style={{
                    flex: 1,
                    padding: 'var(--ef-space-4)',
                    overflowY: 'auto',
                    color: 'var(--ef-text-hi)'
                }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: 'var(--ef-space-3) var(--ef-space-4)',
                        borderTop: '2px solid var(--ef-bevel-dark)',
                        background: 'var(--ef-bg-elev)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 'var(--ef-space-2)'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EfModal;
