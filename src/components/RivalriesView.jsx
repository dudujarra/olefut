import { useGame } from '../context/GameContext';
import { EfButton, EfPanel, EfClubBadge } from './ui';
import { findNextDerby } from '../engine/DerbyDetector';
import bgNewspaper from '../assets/environments/bg_newspaper.png';

import {
    Fire, ArrowLeft, Users, Trophy, TrendUp, WarningCircle, Lightning
} from '@phosphor-icons/react';

function getRivalryLabel(matchCount) {
    if (matchCount >= 10) return { label: 'CONSOLIDADA', color: '#FF3333', icon: <Fire weight="fill" />, mod: 'consolidated' };
    if (matchCount >= 6)  return { label: 'NOVO CLÁSSICO', color: '#FFD700', icon: <TrendUp weight="bold" />, mod: 'new-classic' };
    if (matchCount >= 3)  return { label: 'CRESCENDO',     color: '#FF8C00', icon: <Trophy weight="bold" />, mod: 'growing' };
    return { label: 'INÍCIO', color: '#888', icon: <WarningCircle weight="bold" />, mod: 'start' };
}

export function RivalriesView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();

    if (!engine) return (
        <div className="ef-mono ef-text-main" style={{ padding: '24px' }}>
            ENGINE NÃO INICIALIZADO.
        </div>
    );

    const team = engine.getTeam(engine.manager?.teamId);
    const rivalryHistory = engine.rivalryHistory || {};

    // SPEC-C5.2: detecta próximo derby do calendário
    const nextDerby = findNextDerby(engine, 6);
    const nextDerbyTeam = nextDerby ? engine.getTeam(nextDerby.oppTeamId) : null;

    // Build rivalry list from engine.rivalryHistory (SPEC-080 real data)
    const rivalries = Object.keys(rivalryHistory)
        .map(key => {
            const [aIdStr, bIdStr] = key.split('_');
            const aId = parseInt(aIdStr);
            const bId = parseInt(bIdStr);
            // Only show rivalries involving the player's team
            if (team && aId !== team.id && bId !== team.id) return null;
            const clubA = engine.getTeam(aId);
            const clubB = engine.getTeam(bId);
            const matches = rivalryHistory[key] || [];
            const isA = team && team.id === aId;
            const wins = matches.filter(m => isA ? m.clubAScore > m.clubBScore : m.clubBScore > m.clubAScore).length;
            const losses = matches.filter(m => isA ? m.clubAScore < m.clubBScore : m.clubBScore < m.clubAScore).length;
            const draws = matches.length - wins - losses;
            return {
                key,
                clubA,
                clubB,
                matches: matches.length,
                wins,
                draws,
                losses,
                isA,
            };
        })
        .filter(Boolean)
        .filter(r => r.clubA && r.clubB && r.matches > 0)
        .sort((x, y) => y.matches - x.matches);

    return (
        <div className="ef-anim-fade-in ef-scene-shell" style={{ backgroundImage: `url(${bgNewspaper})` }}>
            <div className="ef-view-container ef-view-container--narrow">

                {/* HEADER */}
                <EfPanel padding="lg" className="ef-view-header" style={{ borderBottom: '2px solid #FFD700' }}>
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Fire size={28} color="#FFD700" weight="fill" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">RIVALIDADES</h2>
                            <span className="ef-view-header__subtitle">CONFRONTOS HISTÓRICOS E CLÁSSICOS</span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* SPEC-C5.2: Próximo derby highlighted */}
                {nextDerby && nextDerbyTeam && (
                    <EfPanel padding="lg" style={{ border: '2px solid #FF3333', backgroundColor: '#1A0E0E' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Lightning size={28} color="#FF3333" weight="fill" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.7rem', color: '#FF3333', fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                    PRÓXIMO DERBY — SEMANA {nextDerby.week}
                                </div>
                                <div style={{ fontSize: '1.2rem', color: '#FDFBF7', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>
                                    VS {nextDerbyTeam.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#FF8C00', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                                    {nextDerby.matchCount} confrontos · {nextDerby.level.toUpperCase()}
                                </div>
                            </div>
                            <EfClubBadge name={nextDerbyTeam.name} size="lg" />
                        </div>
                    </EfPanel>
                )}

                {/* RIVALRIES LIST */}
                <EfPanel padding="lg">
                    <div className="ef-panel-cat-header ef-panel-cat-header--accent">
                        <Users size={20} /> CONFRONTOS DIRETOS ({rivalries.length})
                    </div>

                    {rivalries.length === 0 ? (
                        <div className="ef-empty-dashed">
                            NENHUMA RIVALIDADE DETECTADA. JOGUE MAIS PARTIDAS.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {rivalries.map(r => {
                                const label = getRivalryLabel(r.matches);
                                const oppTeam = r.isA ? r.clubB : r.clubA;
                                return (
                                    <div key={r.key} className={`ef-rivalry-row ef-rivalry-row--${label.mod}`}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {oppTeam?.name ? (
                                                <EfClubBadge name={oppTeam.name} size="md" />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', backgroundColor: '#0D1117' }} />
                                            )}
                                            <div>
                                                <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>
                                                    VS {(oppTeam?.name || '???')}
                                                </div>
                                                <div className="ef-mono ef-text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{r.matches} JOGOS</span> •{' '}
                                                    <span className="ef-text-primary" style={{ fontWeight: 'bold' }}>{r.wins}V</span>{' '}
                                                    <span className="ef-text-accent" style={{ fontWeight: 'bold' }}>{r.draws}E</span>{' '}
                                                    <span className="ef-text-danger" style={{ fontWeight: 'bold' }}>{r.losses}D</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ef-pill-mono" style={{ color: label.color, borderColor: label.color }}>
                                            {label.icon} {label.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </EfPanel>

                {/* Former Companions (SPEC-081) */}
                {(engine.formerCompanions?.length || 0) > 0 && (
                    <EfPanel padding="lg">
                        <div className="ef-panel-cat-header ef-panel-cat-header--info">
                            <Users size={20} /> EX-COMPANHEIROS ({engine.formerCompanions.length})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {engine.formerCompanions.map((p, i) => (
                                <div key={i} style={{
                                    backgroundColor: '#1A1F24',
                                    border: '1px solid #2D3748',
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div className="ef-sans ef-text-main" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                        {p.name}
                                        <span className="ef-mono ef-text-info" style={{ marginLeft: '8px', fontSize: '0.85rem' }}>({p.position})</span>
                                    </div>
                                    <div className="ef-pill-mono ef-text-muted">
                                        OVR {p.ovr} • TEMP {p.season || '?'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </EfPanel>
                )}
            </div>
        </div>
    );
}

export default RivalriesView;
