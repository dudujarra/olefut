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
            className="ef-modal-backdrop"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="ef-modal-content"
                style={{ maxWidth: SIZE_MAP[size] || SIZE_MAP.md }}
            >
                {/* Header */}
                {title && (
                    <div className="ef-modal-header">
                        <h3 id="ef-modal-title" className="ef-modal-title">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            aria-label="Fechar"
                            className="ef-modal-close"
                        >
                            X
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="ef-modal-body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="ef-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EfModal;
