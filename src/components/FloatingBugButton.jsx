/**
 * FloatingBugButton — v1.6
 *
 * Botão sempre visível (canto inferior direito) pra reportar bug rápido.
 * Click abre prompt + screenshot opcional via canvas.
 */

import React, { useState } from 'react';
import { MonitorService } from '../services/MonitorService';
import { useGame } from '../context/GameContext';
import { EfModal } from './ui/EfModal';
import { EfButton } from './ui/EfButton';

export function FloatingBugButton() {
    const { gameState } = useGame();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [category, setCategory] = useState('feedback');
    const [confirm, setConfirm] = useState(false);

    const monitor = MonitorService.getInstance();

    function handleSubmit() {
        if (!text.trim()) return;
        if (category === 'bug') {
            monitor.recordFeedback(text, null);
        } else if (category === 'feedback') {
            monitor.recordFeedback(text);
        } else if (category === 'note') {
            monitor.recordNote(text);
        }
        setText('');
        setConfirm(true);
        setTimeout(() => {
            setConfirm(false);
            setOpen(false);
        }, 1500);
    }

    if (!gameState.started) return null;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                title="Reportar bug / feedback / nota"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#FFD700',
                    color: '#000',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    fontSize: '24px',
                    zIndex: 9000,
                    transition: 'transform 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                🐛
            </button>

            {open && (
                <EfModal
                    open={open}
                    onClose={() => setOpen(false)}
                    title="🐛 Reportar"
                    size="md"
                    footer={!confirm && (
                        <>
                            <EfButton variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</EfButton>
                            <EfButton variant="primary" size="sm" onClick={handleSubmit} disabled={!text.trim()}>Salvar</EfButton>
                        </>
                    )}
                >
                    {confirm ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#39FF14' }}>
                            ✅ Registrado!
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                {['bug', 'feedback', 'note'].map(cat => (
                                    <EfButton
                                        key={cat}
                                        variant={category === cat ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setCategory(cat)}
                                    >
                                        {cat === 'bug' ? '🐛 Bug' : cat === 'feedback' ? '💬 Feedback' : '📝 Nota'}
                                    </EfButton>
                                ))}
                            </div>

                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={
                                    category === 'bug' ? 'Descreva o bug: o que aconteceu? o que esperava?' :
                                    category === 'feedback' ? 'Sua opinião sobre essa parte do jogo...' :
                                    'Nota livre — observação, ideia, lembrete...'
                                }
                                rows={5}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#0A130E',
                                    color: '#E2E8F0',
                                    border: '4px inset #111417',
                                    fontFamily: 'inherit',
                                    fontSize: '0.85rem',
                                    resize: 'vertical',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <p style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.5rem' }}>
                                Salvo localmente. Acesse Monitor (no menu) pra ver tudo + exportar JSON.
                            </p>
                        </>
                    )}
                </EfModal>
            )}
        </>
    );
}

export default FloatingBugButton;
