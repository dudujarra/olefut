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
import {
    Crown, Star, Sparkle, ClipboardText, Plant,
    SoccerBall, Trophy, ChartBar, Calendar, ArrowUp, ArrowDown
} from '@phosphor-icons/react';

function RepIcon({ rep }) {
    if (rep >= 80) return <Crown size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />;
    if (rep >= 60) return <Star size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />;
    if (rep >= 40) return <Sparkle size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />;
    if (rep >= 20) return <ClipboardText size={12} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />;
    return <Plant size={12} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />;
}

const DIV_NAMES = { 1: 'Série A', 2: 'Série B', 3: 'Série C', 4: 'Série D' };
const DIV_COLOR = { 1: 'var(--accent)', 2: 'var(--color-learning-silver-stat)', 3: 'var(--color-learning-bronze-stat)', 4: 'var(--color-learning-leather)' };

function formatRep(rep) {
    if (rep >= 80) return { label: 'Lendário', color: 'var(--accent)' };
    if (rep >= 60) return { label: 'Renomado', color: 'var(--color-learning-amber-bright)' };
    if (rep >= 40) return { label: 'Conhecido', color: 'var(--color-learning-lightgreen)' };
    if (rep >= 20) return { label: 'Iniciante', color: 'var(--color-learning-skyblue)' };
    return { label: 'Desconhecido', color: 'var(--text-muted)' };
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
    const divColor = DIV_COLOR[snapshot.division] || 'var(--text-muted)';
    const titlesByDiv = snapshot.titles.reduce((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    return (
        <EfPanel variant="sunk" padding="md" style={{
            marginTop: '0.5rem',
            background: 'var(--color-forest-pulse)',
            border: '1px solid var(--accent)',
        }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span><SoccerBall size={14} weight="fill" style={{verticalAlign:'-2px',marginRight:'6px'}} />CARREIRA INFO {open ? '▼' : '▶'}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Season {snapshot.seasonNumber} · Wk {snapshot.currentWeek}
                </span>
            </div>

            {open && (
                <>
                    {/* Team header */}
                    <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'var(--color-shadow-deep)',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TIME</div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{snapshot.team.name}</div>
                            <div style={{ color: divColor, fontWeight: 700 }}>
                                {divName} ({snapshot.zone})
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>POSIÇÃO</div>
                            <div style={{ fontWeight: 700, fontSize: '1.2rem', color: snapshot.position <= 4 ? 'var(--color-success-mid)' : snapshot.position >= 17 ? 'var(--danger)' : 'var(--accent)' }}>
                                {snapshot.position}º
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SQUAD</div>
                            <div style={{ fontWeight: 700 }}>{snapshot.squadSize} jog · OVR {snapshot.avgOvr}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BALANÇO</div>
                            <div style={{ fontWeight: 700, color: snapshot.balance < 0 ? 'var(--danger)' : 'var(--color-success-mid)' }}>
                                R$ {(snapshot.balance / 1_000_000).toFixed(1)}M
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REPUTAÇÃO</div>
                            <div style={{ color: repBadge.color, fontWeight: 700 }}><RepIcon rep={snapshot.reputation} />{repBadge.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{snapshot.reputation}/100</div>
                        </div>
                    </div>

                    {/* Titles + insights row */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                <Trophy size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />TÍTULOS ({snapshot.titles.length})
                            </div>
                            {snapshot.titles.length === 0 ? (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                <ChartBar size={12} weight="bold" style={{verticalAlign:'-2px',marginRight:'4px'}} />INSIGHTS CARREIRA
                            </div>
                            <div style={{ fontSize: '0.7rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                                <span>Maior streak V:</span>
                                <strong>{snapshot.insights.longestWinStreak ?? 0}</strong>
                                <span>Maior goleada:</span>
                                <strong>{snapshot.insights.biggestWin?.score || '—'}</strong>
                                <span>Pior derrota:</span>
                                <strong style={{ color: 'var(--danger)' }}>{snapshot.insights.worstLoss?.score || '—'}</strong>
                                <span>Clean sheets:</span>
                                <strong>{snapshot.insights.cleanSheets ?? 0}</strong>
                                <span>Promoções:</span>
                                <strong style={{ color: 'var(--color-success-mid)' }}>{snapshot.insights.promotionsWon ?? 0}</strong>
                                <span>Rebaixamentos:</span>
                                <strong style={{ color: 'var(--danger)' }}>{snapshot.insights.relegationsTaken ?? 0}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Top scorers */}
                    {snapshot.topScorers.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                <SoccerBall size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />ARTILHEIROS (TEMPORADA ATUAL)
                            </div>
                            <div style={{ background: 'var(--color-shadow-deep)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Destaque o Top 1 com o Hexagon Chart */}
                                {snapshot.topScorers.length > 0 && (
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px', background: 'var(--color-bg-deep)', border: '1px solid var(--color-forest-pulse)' }}>
                                        <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                                            <HexagonChart player={snapshot.topScorers[0]} size={120} showLabels={true} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px' }}><Trophy size={11} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />DESTAQUE DA TEMPORADA</div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{snapshot.topScorers[0].name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                                {snapshot.topScorers[0].position} · OVR {snapshot.topScorers[0].ovr}
                                            </div>
                                            <div style={{ fontSize: '0.8rem' }}>
                                                <strong style={{ color: 'var(--color-success-mid)' }}>{snapshot.topScorers[0].goals}G</strong>{' '}
                                                <span style={{ color: 'var(--text-muted)' }}>
                                                    {snapshot.topScorers[0].assists}A · {snapshot.topScorers[0].apps}j
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
                                        borderBottom: i < snapshot.topScorers.length - 2 ? '1px solid var(--color-bg-deep)' : 'none'
                                    }}>
                                        <span>
                                            <strong style={{ color: 'var(--text-muted)' }}>{i + 2}.</strong>{' '}
                                            {p.name} ({p.position} · OVR {p.ovr})
                                        </span>
                                        <span>
                                            <strong style={{ color: 'var(--color-success-mid)' }}>{p.goals}G</strong>{' '}
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {p.assists}A · {p.apps}j
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
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                <Calendar size={12} weight="fill" style={{verticalAlign:'-2px',marginRight:'4px'}} />ÚLTIMAS {snapshot.seasons.length} TEMPORADAS
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '4px',
                                flexWrap: 'wrap',
                                background: 'var(--color-shadow-deep)',
                                padding: '4px',
                                }}>
                                {snapshot.seasons.map((s, i) => {
                                    const div = DIV_NAMES[s.division] || `D${s.division}`;
                                    let TitleIcon = null;
                                    if (s.title === 'Promovido') TitleIcon = ArrowUp;
                                    else if (s.title?.startsWith('Campeão')) TitleIcon = Trophy;
                                    else if (s.title === 'Rebaixado') TitleIcon = ArrowDown;
                                    return (
                                        <div key={i} style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 6px',
                                            background: TitleIcon ? 'var(--color-forest-pulse)' : 'transparent',
                                            border: TitleIcon ? '1px solid var(--accent)' : '1px solid var(--color-bg-deep)',
                                            fontFamily: 'var(--font-mono)'
                                        }} title={s.title || s.record}>
                                            {TitleIcon && <TitleIcon size={10} weight="fill" style={{verticalAlign:'-1px',marginRight:'3px'}} />}{div} · {s.position}º
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
