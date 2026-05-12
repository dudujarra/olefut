/**
 * FloatingBugButton — v1.6
 *
 * Botão sempre visível (canto inferior direito) pra reportar bug rápido.
 * Click abre prompt + screenshot opcional via canvas.
 */

import { useState } from 'react';
import { MonitorService } from '../services/MonitorService';
import { useGame } from '../context/GameContext';
import { EfModal } from './ui/EfModal';
import { EfButton } from './ui/EfButton';
import { Bug, ChatCircleText, Note, CheckCircle } from '@phosphor-icons/react';

export function FloatingBugButton() {
    const { gameState } = useGame();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [category, setCategory] = useState('feedback');
    const [confirm, setConfirm] = useState(false);

    const monitor = MonitorService.getInstance();

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

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
                    bottom: '24px',
                    right: '24px',
                    width: '56px',
                    height: '56px',
                    backgroundColor: colors.warning,
                    color: '#000',
                    border: `2px solid #000`,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px #1B4332',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9000,
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 24px #1B4332'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px #1B4332'; }}
            >
                <Bug size={28} weight="fill" />
            </button>

            {open && (
                <EfModal
                    open={open}
                    onClose={() => setOpen(false)}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bug size={24} color={colors.warning} /> SISTEMA DE REPORT
                        </div>
                    }
                    size="md"
                    footer={!confirm && (
                        <>
                            <EfButton variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancelar</EfButton>
                            <EfButton variant="primary" size="sm" onClick={handleSubmit} disabled={!text.trim()}>Registrar</EfButton>
                        </>
                    )}
                >
                    {confirm ? (
                        <div style={{ 
                            padding: '32px', 
                            textAlign: 'center', 
                            color: colors.accent,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            <CheckCircle size={64} weight="fill" />
                            <span>REGISTRO SALVO COM SUCESSO</span>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <EfButton
                                    variant={category === 'bug' ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setCategory('bug')}
                                    style={{ flex: 1, display: 'flex', gap: '6px' }}
                                >
                                    <Bug size={16} /> BUG
                                </EfButton>
                                <EfButton
                                    variant={category === 'feedback' ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setCategory('feedback')}
                                    style={{ flex: 1, display: 'flex', gap: '6px' }}
                                >
                                    <ChatCircleText size={16} /> FEEDBACK
                                </EfButton>
                                <EfButton
                                    variant={category === 'note' ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setCategory('note')}
                                    style={{ flex: 1, display: 'flex', gap: '6px' }}
                                >
                                    <Note size={16} /> NOTA
                                </EfButton>
                            </div>

                            <textarea
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={
                                    category === 'bug' ? 'Descreva o bug: o que aconteceu? O que era esperado?' :
                                    category === 'feedback' ? 'Sua opinião sobre esta parte do jogo...' :
                                    'Nota livre — observação, ideia, lembrete para depois...'
                                }
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '0.9rem',
                                    resize: 'vertical',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = colors.secondary}
                                onBlur={e => e.target.style.borderColor = colors.border}
                            />

                            <div style={{ 
                                fontSize: '0.75rem', 
                                color: colors.textMuted, 
                                marginTop: '12px',
                                fontFamily: 'var(--font-mono)',
                                backgroundColor: '#0E1F14',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Note size={16} color={colors.secondary} />
                                Salvo localmente. Acesse o Monitor no menu principal para visualizar ou exportar.
                            </div>
                        </>
                    )}
                </EfModal>
            )}
        </>
    );
}

export default FloatingBugButton;
