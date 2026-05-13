/**
 * MatchScoreboard — extracted from MatchView (AKITA-319 F1.4 partial split)
 *
 * Pure presentational. Recebe state via props. Sem hooks próprios.
 *
 * Extraído pra reduzir LOC de MatchView (god-view) e isolar componente reutilizável.
 */

import { EfPanel, EfClubBadge } from './ui';

export function MatchScoreboard({
    half,
    result,
    runningScore,
    currentMinute,
    isPlaying,
    goalBurstActive,
    colors,
}) {
    if (!result) return null;
    return (
        <EfPanel padding="md" style={{ position: 'relative', marginBottom: '24px', overflow: 'hidden', border: `2px solid ${colors.border}` }}>
            {goalBurstActive && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1B4332', animation: 'pulse 1s infinite', pointerEvents: 'none', zIndex: 1 }} />
            )}

            <div className="ef-sans ef-text-accent" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 'bold', position: 'relative', zIndex: 2 }}>
                <div style={{ flex: 1, textAlign: 'right', letterSpacing: '0.1em' }}>MANDANTE</div>
                <div className="ef-mono ef-text-primary" style={{ backgroundColor: colors.bg, padding: '6px 12px', border: `1px solid ${colors.border}` }}>
                    {half}
                </div>
                <div style={{ flex: 1, textAlign: 'left', letterSpacing: '0.1em' }}>VISITANTE</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <EfClubBadge name={result.home} size="xl" />
                    <span className="ef-sans ef-text-main" style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{result.home}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="ef-score-box">
                        <div className="ef-score-box__num">{runningScore.home}</div>
                        <div className="ef-score-box__sep">-</div>
                        <div className="ef-score-box__num">{runningScore.away}</div>
                    </div>

                    <div className="ef-clock">
                        <span className={`ef-clock__time${isPlaying ? ' ef-clock__time--playing' : ''}`}>
                            {String(currentMinute).padStart(2, '0')}:00
                        </span>
                        {isPlaying && <div className="ef-clock__dot" />}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <EfClubBadge name={result.away} size="xl" />
                    <span className="ef-sans ef-text-main" style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{result.away}</span>
                </div>
            </div>
        </EfPanel>
    );
}

export default MatchScoreboard;
