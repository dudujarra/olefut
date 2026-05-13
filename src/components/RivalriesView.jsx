import { useGame } from '../context/GameContext';
import { ViewOnboarding } from './ViewOnboarding';
import { EfButton, EfPanel, EfClubBadge } from './ui';
import { findNextDerby } from '../engine/DerbyDetector';
import bgNewspaper from '../assets/environments/bg_newspaper.png';
import '../styles/rivalries-view.css';

import {
    Fire, ArrowLeft, Users, Trophy, TrendUp, WarningCircle, Lightning
} from '@phosphor-icons/react';

function getRivalryLabel(matchCount) {
    if (matchCount >= 10) return { label: 'CONSOLIDADA', icon: <Fire weight="fill" />, mod: 'consolidated' };
    if (matchCount >= 6)  return { label: 'NOVO CLÁSSICO', icon: <TrendUp weight="bold" />, mod: 'new-classic' };
    if (matchCount >= 3)  return { label: 'CRESCENDO',     icon: <Trophy weight="bold" />, mod: 'growing' };
    return { label: 'INÍCIO', icon: <WarningCircle weight="bold" />, mod: 'start' };
}

export function RivalriesView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();

    if (!engine) return (
        <div className="ef-mono ef-text-main ef-riv__error">
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
        <div className="ef-anim-fade-in ef-scene-shell ef-riv" style={{ backgroundImage: `url(${bgNewspaper})` }}>
            <ViewOnboarding viewId="rivalries" />
            <div className="ef-view-container ef-view-container--narrow">

                <EfPanel padding="lg" className="ef-view-header ef-riv__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <Fire size={28} weight="fill" className="ef-riv__header-icon" />
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

                {nextDerby && nextDerbyTeam && (
                    <EfPanel padding="lg" className="ef-riv__derby">
                        <div className="ef-riv__derby-row">
                            <Lightning size={28} color="var(--danger)" weight="fill" />
                            <div className="ef-riv__derby-body">
                                <div className="ef-riv__derby-label">
                                    PRÓXIMO DERBY — SEMANA {nextDerby.week}
                                </div>
                                <div className="ef-riv__derby-title">
                                    VS {nextDerbyTeam.name}
                                </div>
                                <div className="ef-riv__derby-meta">
                                    {nextDerby.matchCount} confrontos · {nextDerby.level.toUpperCase()}
                                </div>
                            </div>
                            <EfClubBadge name={nextDerbyTeam.name} size="lg" />
                        </div>
                    </EfPanel>
                )}

                <EfPanel padding="lg">
                    <div className="ef-panel-cat-header ef-panel-cat-header--accent">
                        <Users size={20} /> CONFRONTOS DIRETOS ({rivalries.length})
                    </div>

                    {rivalries.length === 0 ? (
                        <div className="ef-empty-dashed">
                            NENHUMA RIVALIDADE DETECTADA. JOGUE MAIS PARTIDAS.
                        </div>
                    ) : (
                        <div className="ef-riv__list">
                            {rivalries.map(r => {
                                const label = getRivalryLabel(r.matches);
                                const oppTeam = r.isA ? r.clubB : r.clubA;
                                return (
                                    <div key={r.key} className={`ef-rivalry-row ef-rivalry-row--${label.mod}`}>
                                        <div className="ef-riv__row-identity">
                                            {oppTeam?.name ? (
                                                <EfClubBadge name={oppTeam.name} size="md" />
                                            ) : (
                                                <div className="ef-riv__badge-fallback" />
                                            )}
                                            <div>
                                                <div className="ef-sans ef-text-main ef-riv__row-name">
                                                    VS {(oppTeam?.name || '???')}
                                                </div>
                                                <div className="ef-mono ef-text-muted ef-riv__row-stats">
                                                    <span>{r.matches} JOGOS</span> •{' '}
                                                    <span className="ef-text-primary ef-riv__stat-bold">{r.wins}V</span>{' '}
                                                    <span className="ef-text-accent ef-riv__stat-bold">{r.draws}E</span>{' '}
                                                    <span className="ef-text-danger ef-riv__stat-bold">{r.losses}D</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`ef-pill-mono ef-riv__pill--${label.mod}`}>
                                            {label.icon} {label.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </EfPanel>

                {(engine.formerCompanions?.length || 0) > 0 && (
                    <EfPanel padding="lg">
                        <div className="ef-panel-cat-header ef-panel-cat-header--info">
                            <Users size={20} /> EX-COMPANHEIROS ({engine.formerCompanions.length})
                        </div>
                        <div className="ef-riv__companions-grid">
                            {engine.formerCompanions.map((p, i) => (
                                <div key={i} className="ef-riv__companion-card">
                                    <div className="ef-sans ef-text-main ef-riv__companion-name">
                                        {p.name}
                                        <span className="ef-mono ef-text-info ef-riv__companion-pos">({p.position})</span>
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
