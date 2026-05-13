/**
 * MatchPostMortem — SPEC-A4
 *
 * Painel 3-card analise pos-jogo. Renderiza output de MatchAnalyst.analyzeMatch().
 */

import { CheckCircle, Warning, DiceSix, ThumbsUp, ThumbsDown, Minus } from '@phosphor-icons/react';

const LUCK_ICON = {
    good: ThumbsUp,
    bad: ThumbsDown,
    neutral: Minus,
};

const LUCK_COLOR = {
    good: 'var(--primary)',
    bad: 'var(--danger)',
    neutral: 'var(--accent)',
};

export function MatchPostMortem({ analysis }) {
    if (!analysis) return null;
    const { best, dubious, luck } = analysis;

    const LuckIcon = LUCK_ICON[luck?.type || 'neutral'] || Minus;
    const luckColor = LUCK_COLOR[luck?.type || 'neutral'];

    return (
        <div
            className="ef-postmortem"
            role="region"
            aria-label="Análise pós-jogo"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginTop: '16px',
                marginBottom: '16px',
            }}
        >
            {/* Best decision */}
            <div className="ef-postmortem__card" style={{
                padding: '12px',
                backgroundColor: 'var(--color-bg-deep)',
                border: '1px solid var(--primary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle size={16} color="var(--primary)" weight="fill" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.05em' }}>MELHOR DECISÃO</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {best?.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                    {best?.body}
                </div>
            </div>

            {/* Dubious decision */}
            <div className="ef-postmortem__card" style={{
                padding: '12px',
                backgroundColor: 'var(--color-bg-deep)',
                border: '1px solid var(--accent)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Warning size={16} color="var(--accent)" weight="fill" />
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.05em' }}>PARA REVER</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {dubious?.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                    {dubious?.body}
                </div>
            </div>

            {/* Luck */}
            <div className="ef-postmortem__card" style={{
                padding: '12px',
                backgroundColor: 'var(--color-bg-deep)',
                border: `1px solid ${luckColor}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <DiceSix size={16} color={luckColor} weight="fill" />
                    <span style={{ fontSize: '0.7rem', color: luckColor, fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.05em' }}>FATOR SORTE</span>
                    <LuckIcon size={14} color={luckColor} weight="bold" />
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {luck?.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                    {luck?.body}
                </div>
            </div>
        </div>
    );
}

export default MatchPostMortem;
