/**
 * CareerInfoPanel — SPEC-124
 *
 * Mostra info contextual da carreira do bot:
 * - Time atual + divisão
 * - Reputação manager
 * - Títulos history
 * - Top scorers all-time
 * - Promoções/rebaixamentos timeline
 * - Milestones career
 */
import { useState, useEffect } from 'react';
import { EfPanel } from '../ui/EfPanel';
import { HexagonChart } from '../HexagonChart';

const DIV_NAMES = { 1: 'Série A', 2: 'Série B', 3: 'Série C', 4: 'Série D' };
const DIV_COLOR = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32', 4: '#8B7355' };

function formatRep(rep) {
    if (rep >= 80) return { label: '👑 Lendário', color: '#FFD700' };
    if (rep >= 60) return { label: '⭐ Renomado', color: '#FFA500' };
    if (rep >= 40) return { label: '✨ Conhecido', color: '#90EE90' };
    if (rep >= 20) return { label: '📋 Iniciante', color: '#87CEEB' };
    return { label: '🌱 Desconhecido', color: '#888' };
}

export default function CareerInfoPanel({ controllerRef }) {
    const [snapshot, setSnapshot] = useState(null);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            const c = controllerRef.current;
            if (!c?.engine) return;
            const engine = c.engine;
            const team = engine.getTeam?.(engine.manager?.teamId);
            const standings = team ? engine.getStandings(team.zone, team.division) : [];
            const position = team ? (standings.findIndex(s => s.teamId === team.id) + 1) || 0 : 0;
            const stats = c.getStats?.() || {};
            const legacy = engine.legacy || {};

            // Top scorers current season (seasonGoals reset each season — realistic numbers)
            const topScorers = (team?.squad || [])
                .map(p => ({
                    ...p,
                    goals: p.career?.seasonGoals || 0,
                    assists: p.career?.seasonAssists || 0,
                    apps: p.career?.seasonApps || 0,
                    totalGoals: p.career?.totalGoals || 0,
                }))
                .filter(p => p.goals > 0 || p.totalGoals > 0)
                .sort((a, b) => b.goals - a.goals || b.totalGoals - a.totalGoals)
                .slice(0, 5);

            // Build seasonHistory promotions/relegations
            const transitions = [];
            const seasonHistory = stats.seasonHistory || [];
            for (let i = 1; i < seasonHistory.length; i++) {
                // Note: seasonHistory doesn't track division — derive from order
                // (simplification: just show season summary)
            }

            setSnapshot({
                team,
                position,
                division: team?.division || 4,
                zone: team?.zone || 'BR',
                seasonNumber: engine.seasonNumber || 1,
                currentWeek: engine.currentWeek || 0,
                balance: team?.balance || 0,
                squadSize: team?.squad?.length || 0,
                avgOvr: team?.squad?.length
                    ? Math.round(team.squad.reduce((s, p) => s + (p.ovr || 0), 0) / team.squad.length)
                    : 0,
                reputation: legacy.reputation || 30,
                titles: legacy.titles || [],
                seasons: (legacy.seasons || []).slice(-10),
                topScorers,
                insights: stats.insights || {}
            });
        }, 1000);
        return () => clearInterval(id);
    }, [controllerRef]);

    if (!snapshot || !snapshot.team) return null;

    const repBadge = formatRep(snapshot.reputation);
    const divName = DIV_NAMES[snapshot.division] || `Div ${snapshot.division}`;
    const divColor = DIV_COLOR[snapshot.division] || '#888';
    const titlesByDiv = snapshot.titles.reduce((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    return (
        <EfPanel variant="sunk" padding="md" style={{
            marginTop: '0.5rem',
            background: '#1B4332',
            border: '1px solid #FFD700',
        }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: '#FFD700',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span>🏟️ CARREIRA INFO {open ? '▼' : '▶'}</span>
                <span style={{ fontSize: '0.72rem', color: '#888' }}>
                    Season {snapshot.seasonNumber} · Wk {snapshot.currentWeek}
                </span>
            </div>

            {open && (
                <>
                    {/* Team header */}
                    <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: '#040805',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>TIME</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{snapshot.team.name}</div>
                            <div style={{ color: divColor, fontWeight: 700 }}>
                                {divName} ({snapshot.zone})
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>POSIÇÃO</div>
                            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: snapshot.position <= 4 ? '#6ABC3A' : snapshot.position >= 17 ? '#c44' : '#FFD700' }}>
                                {snapshot.position}º
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>SQUAD</div>
                            <div style={{ fontWeight: 700 }}>{snapshot.squadSize} jog · OVR {snapshot.avgOvr}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>BALANÇO</div>
                            <div style={{ fontWeight: 700, color: snapshot.balance < 0 ? '#c44' : '#6ABC3A' }}>
                                R$ {(snapshot.balance / 1_000_000).toFixed(1)}M
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>REPUTAÇÃO</div>
                            <div style={{ color: repBadge.color, fontWeight: 700 }}>{repBadge.label}</div>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>{snapshot.reputation}/100</div>
                        </div>
                    </div>

                    {/* Titles + insights row */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>
                                🏆 TÍTULOS ({snapshot.titles.length})
                            </div>
                            {snapshot.titles.length === 0 ? (
                                <div style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>
                                    Nenhum título ainda
                                </div>
                            ) : (
                                <div>
                                    {Object.entries(titlesByDiv).map(([title, count]) => (
                                        <div key={title} style={{ fontSize: '0.7rem' }}>
                                            • {title} <strong>×{count}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>
                                📊 INSIGHTS CARREIRA
                            </div>
                            <div style={{ fontSize: '0.7rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                                <span>Maior streak V:</span>
                                <strong>{snapshot.insights.longestWinStreak ?? 0}</strong>
                                <span>Maior goleada:</span>
                                <strong>{snapshot.insights.biggestWin?.score || '—'}</strong>
                                <span>Pior derrota:</span>
                                <strong style={{ color: '#c44' }}>{snapshot.insights.worstLoss?.score || '—'}</strong>
                                <span>Clean sheets:</span>
                                <strong>{snapshot.insights.cleanSheets ?? 0}</strong>
                                <span>Promoções:</span>
                                <strong style={{ color: '#6ABC3A' }}>{snapshot.insights.promotionsWon ?? 0}</strong>
                                <span>Rebaixamentos:</span>
                                <strong style={{ color: '#c44' }}>{snapshot.insights.relegationsTaken ?? 0}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Top scorers */}
                    {snapshot.topScorers.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>
                                ⚽ ARTILHEIROS (TEMPORADA ATUAL)
                            </div>
                            <div style={{ background: '#040805', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Destaque o Top 1 com o Hexagon Chart */}
                                {snapshot.topScorers.length > 0 && (
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px', background: '#0A140C', border: '1px solid #1B4332' }}>
                                        <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                                            <HexagonChart player={snapshot.topScorers[0]} size={120} showLabels={true} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#FFD700', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px' }}>🏆 DESTAQUE DA TEMPORADA</div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FDFBF7' }}>{snapshot.topScorers[0].name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                                                {snapshot.topScorers[0].position} · OVR {snapshot.topScorers[0].ovr}
                                            </div>
                                            <div style={{ fontSize: '0.8rem' }}>
                                                <strong style={{ color: '#6ABC3A' }}>{snapshot.topScorers[0].goals} ⚽</strong>{' '}
                                                <span style={{ color: '#888' }}>
                                                    {snapshot.topScorers[0].assists}🅰️ · {snapshot.topScorers[0].apps}j
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Lista dos demais artilheiros */}
                                {snapshot.topScorers.slice(1).map((p, i) => (
                                    <div key={i + 1} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.7rem',
                                        padding: '4px',
                                        borderBottom: i < snapshot.topScorers.length - 2 ? '1px solid #0E1F14' : 'none'
                                    }}>
                                        <span>
                                            <strong style={{ color: '#888' }}>{i + 2}.</strong>{' '}
                                            {p.name} ({p.position} · OVR {p.ovr})
                                        </span>
                                        <span>
                                            <strong style={{ color: '#6ABC3A' }}>{p.goals} ⚽</strong>{' '}
                                            <span style={{ color: '#888' }}>
                                                {p.assists}🅰️ · {p.apps}j
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Last seasons compact */}
                    {snapshot.seasons.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>
                                📅 ÚLTIMAS {snapshot.seasons.length} TEMPORADAS
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '4px',
                                flexWrap: 'wrap',
                                background: '#040805',
                                padding: '4px',
                                }}>
                                {snapshot.seasons.map((s, i) => {
                                    const div = DIV_NAMES[s.division] || `D${s.division}`;
                                    const titleEmoji = s.title === 'Promovido' ? '⬆️' : s.title?.startsWith('Campeão') ? '🏆' : s.title === 'Rebaixado' ? '⬇️' : '';
                                    return (
                                        <div key={i} style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 6px',
                                            background: titleEmoji ? '#1B4332' : 'transparent',
                                            border: titleEmoji ? '1px solid #FFD700' : '1px solid #0E1F14',
                                            fontFamily: 'monospace'
                                        }} title={s.title || s.record}>
                                            {titleEmoji} {div} · {s.position}º
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </EfPanel>
    );
}
