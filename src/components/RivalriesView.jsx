import { useGame } from '../context/GameContext';
import { ViewOnboarding } from './ViewOnboarding';
import { EfButton, EfPanel, EfClubBadge } from './ui';
import { findNextDerby } from '../engine/DerbyDetector';
import bgNewspaper from '../assets/environments/bg_newspaper.png';
import '../styles/rivalries-view.css';

import {
    Fire, ArrowLeft, Trophy, TrendUp, WarningCircle, Lightning,
    UserCircle, Sword, ListBullets
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
    const seasonLabel = engine.season ? `TEMPORADA ${engine.season}` : 'TEMPORADA ATUAL';

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

    const companions = engine.formerCompanions || [];

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
                            <span className="ef-view-header__subtitle">
                                MANTÉM OS AMIGOS PERTO E OS INIMIGOS NO CAMPO
                            </span>
                        </div>
                    </div>
                    <div className="ef-riv__header-right">
                        <span className="ef-riv__season-pill">{seasonLabel}</span>
                        <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                            <ArrowLeft size={16} /> SAIR
                        </EfButton>
                    </div>
                </EfPanel>

                {nextDerby && nextDerbyTeam && (
                    <section className="ef-riv__derby-feature">
                        <div className="ef-riv__derby-banner">
                            <Lightning size={14} weight="fill" /> ALERTA DE DÉRBI
                        </div>
                        <div className="ef-riv__derby-grid">
                            <div className="ef-riv__derby-text">
                                <h3 className="ef-riv__derby-title">PRÓXIMO DERBY</h3>
                                <p className="ef-riv__derby-desc">
                                    A rivalidade aquece. {team?.name || 'O teu clube'} e {nextDerbyTeam.name} se enfrentam
                                    em uma semana decisiva da temporada.
                                </p>
                                <div className="ef-riv__derby-meta">
                                    <div className="ef-riv__derby-meta-row">
                                        <Lightning size={14} weight="fill" />
                                        <span>SEMANA {nextDerby.week}</span>
                                    </div>
                                    <div className="ef-riv__derby-meta-row ef-riv__derby-meta-row--accent">
                                        <Fire size={14} weight="fill" />
                                        <span>
                                            {nextDerby.matchCount} CONFRONTOS · {nextDerby.level.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="ef-riv__derby-vs">
                                <div className="ef-riv__derby-vs-side">
                                    <EfClubBadge name={team?.name || 'CASA'} size="lg" />
                                    <span className="ef-riv__derby-vs-name">{team?.name || 'CASA'}</span>
                                </div>
                                <span className="ef-riv__derby-vs-x">VS</span>
                                <div className="ef-riv__derby-vs-side ef-riv__derby-vs-side--away">
                                    <EfClubBadge name={nextDerbyTeam.name} size="lg" />
                                    <span className="ef-riv__derby-vs-name ef-riv__derby-vs-name--away">
                                        {nextDerbyTeam.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <EfPanel padding="lg">
                    <div className="ef-panel-cat-header ef-panel-cat-header--accent">
                        <ListBullets size={20} /> LISTA DE ADVERSÁRIOS ({rivalries.length})
                    </div>

                    {rivalries.length === 0 ? (
                        <div className="ef-empty-dashed">
                            NENHUMA RIVALIDADE DETECTADA. JOGUE MAIS PARTIDAS.
                        </div>
                    ) : (
                        <div className="ef-riv__grid">
                            {rivalries.map(r => {
                                const label = getRivalryLabel(r.matches);
                                const oppTeam = r.isA ? r.clubB : r.clubA;
                                return (
                                    <article
                                        key={r.key}
                                        className={`ef-riv-card ef-riv-card--${label.mod}`}
                                    >
                                        <header className="ef-riv-card__head">
                                            <div className="ef-riv-card__identity">
                                                {oppTeam?.name ? (
                                                    <EfClubBadge name={oppTeam.name} size="md" />
                                                ) : (
                                                    <div className="ef-riv__badge-fallback" />
                                                )}
                                                <div className="ef-riv-card__title-wrap">
                                                    <h4 className="ef-riv-card__name">
                                                        {(oppTeam?.name || '???').toUpperCase()}
                                                    </h4>
                                                    <span className={`ef-riv-card__label ef-riv-card__label--${label.mod}`}>
                                                        {label.icon} {label.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </header>
                                        <div className="ef-riv-card__stats">
                                            <div className="ef-riv-card__stat">
                                                <span className="ef-riv-card__stat-label">VITÓRIAS</span>
                                                <span className="ef-riv-card__stat-value ef-riv-card__stat-value--win">
                                                    {r.wins}
                                                </span>
                                            </div>
                                            <div className="ef-riv-card__stat ef-riv-card__stat--mid">
                                                <span className="ef-riv-card__stat-label">EMPATES</span>
                                                <span className="ef-riv-card__stat-value">{r.draws}</span>
                                            </div>
                                            <div className="ef-riv-card__stat">
                                                <span className="ef-riv-card__stat-label">DERROTAS</span>
                                                <span className="ef-riv-card__stat-value ef-riv-card__stat-value--loss">
                                                    {r.losses}
                                                </span>
                                            </div>
                                        </div>
                                        <footer className="ef-riv-card__foot">
                                            <Sword size={12} weight="bold" />
                                            <span>{r.matches} JOGOS</span>
                                        </footer>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </EfPanel>

                {companions.length > 0 && (
                    <section className="ef-riv__companions">
                        <div className="ef-panel-cat-header ef-panel-cat-header--info">
                            <UserCircle size={20} weight="fill" /> EX-COMPANHEIROS EM CAMPO ADVERSÁRIO ({companions.length})
                        </div>
                        <div className="ef-riv__companions-scroll">
                            {companions.map((p, i) => (
                                <article key={`${p.name}-${i}`} className="ef-riv__companion-card">
                                    <header className="ef-riv__companion-head">
                                        <div className="ef-riv__companion-avatar">
                                            <UserCircle size={42} weight="duotone" />
                                        </div>
                                        <div className="ef-riv__companion-title">
                                            <h5 className="ef-riv__companion-name">{p.name}</h5>
                                            <span className="ef-riv__companion-pos">{p.position}</span>
                                        </div>
                                    </header>
                                    <div className="ef-riv__companion-meta">
                                        <div className="ef-riv__companion-row">
                                            <span className="ef-riv__companion-key">OVR</span>
                                            <span className="ef-riv__companion-val ef-riv__companion-val--primary">
                                                {p.ovr}
                                            </span>
                                        </div>
                                        <div className="ef-riv__companion-row">
                                            <span className="ef-riv__companion-key">SAÍDA</span>
                                            <span className="ef-riv__companion-val">
                                                TEMP {p.season || '?'}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

export default RivalriesView;
