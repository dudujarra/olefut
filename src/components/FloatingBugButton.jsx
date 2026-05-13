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
                className="ef-fab-bug"
            >
                <Bug size={28} weight="fill" />
            </button>

            {open && (
                <EfModal
                    open={open}
                    onClose={() => setOpen(false)}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bug size={24} color="var(--accent)" /> SISTEMA DE REPORT
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
                        <div className="ef-fab-confirm">
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
                                className="ef-fab-textarea"
                            />

                            <div className="ef-fab-hint">
                                <Note size={16} color="var(--info)" />
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
