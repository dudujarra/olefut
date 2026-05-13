import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { EfClubBadge } from './ui/EfClubBadge';
import { EfPanel } from './ui/EfPanel';
import { EfButton } from './ui/EfButton';
import bgOffice from '../assets/environments/bg_league_table.png';
import { Trophy, CaretUp, CaretDown, AirplaneTilt, MapPin } from '@phosphor-icons/react';
import '../styles/standings-view.css';

function getZoneClass(position, totalTeams, division) {
    const isLast = position > totalTeams - 4;
    const isTop4 = position <= 4;
    const isPos5to6 = position === 5 || position === 6;

    if (division === 1) {
        if (isTop4) return 'zone-libertadores';
        if (isPos5to6) return 'zone-suda';
        if (isLast) return 'zone-rebaixamento';
    } else if (division < 4) {
        if (isTop4) return 'zone-promotion';
        if (isLast) return 'zone-rebaixamento';
    } else {
        if (isTop4) return 'zone-promotion';
    }
    return '';
}

function getZoneRowModifierClass(zoneClass) {
    if (zoneClass.includes('libertadores')) return 'ef-standings__row--zone-libertadores';
    if (zoneClass.includes('suda')) return 'ef-standings__row--zone-suda';
    if (zoneClass.includes('promotion')) return 'ef-standings__row--zone-promotion';
    if (zoneClass.includes('rebaixamento')) return 'ef-standings__row--zone-rebaixamento';
    return 'ef-standings__row--zone-default';
}

const SERIE_NAMES = { 1: 'SÉRIE A', 2: 'SÉRIE B', 3: 'SÉRIE C', 4: 'SÉRIE D' };

export function StandingsView() {
    const { gameState, changeView, getEngine } = useGame();
    const engine = getEngine();
    const userTeam = engine.getTeam(gameState.teamId);
    const [activeZone, setActiveZone] = useState(userTeam?.zone || 'BRA');
    const [activeDiv, setActiveDiv] = useState(userTeam?.division || 1);
    // SPEC-168: estadual tab
    const [activeState, setActiveState] = useState(null);

    // SPEC-168: detectar estaduais ativos (Tournament.id em STATE_CHAMPIONSHIPS map)
    const stateTournaments = useMemo(
        () => (engine.tournaments || []).filter(
            t => t && ['paulistao', 'carioca', 'mineiro', 'gaucho'].includes(t.id)
        ),
        [engine]
    );

    // SPEC-169 (Bloco 3.3): standings/zones/divs memoizados pra evitar re-compute em renders frequentes (hover, tooltips).
    const standings = useMemo(
        () => activeState
            ? (stateTournaments.find(t => t.id === activeState)?.getStandings?.() || [])
            : engine.getStandings(activeZone, activeDiv),
        [engine, activeState, activeZone, activeDiv, stateTournaments]
    );
    const zones = useMemo(
        () => [...new Set(engine.teams.map(t => t.zone))],
        [engine]
    );
    const divs = useMemo(
        () => [...new Set(engine.teams.filter(t => t.zone === activeZone).map(t => t.division))].sort(),
        [engine, activeZone]
    );

    const back = gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    return (
        <div className="ef-anim-fade-in ef-layout-pitch ef-standings" style={{ backgroundImage: `url(${bgOffice})` }}>
            <div className="ef-layout-container ef-standings__container">

                {/* HERO PANEL */}
                <EfPanel variant="elev" padding="md" className="ef-flex-row ef-standings__hero-panel">
                    <div className="ef-flex-row">
                        <Trophy size={32} color="var(--primary)" weight="duotone" />
                        <div>
                            <h2 className="ef-sans ef-standings__hero-title">
                                Classificação
                            </h2>
                            <div className="ef-mono ef-text-muted ef-standings__hero-meta">
                                {activeState
                                    ? (stateTournaments.find(t => t.id === activeState)?.name || activeState.toUpperCase())
                                    : `${activeZone} / ${SERIE_NAMES[activeDiv] || `DIV ${activeDiv}`}`}
                            </div>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="sm" onClick={() => changeView(back)}>VOLTAR</EfButton>
                </EfPanel>

                {/* BENTO CONTROLS */}
                <EfPanel variant="sunk" padding="sm" className="ef-flex-row-wrap ef-standings__controls">
                    <div className="ef-standings__control-group">
                        <MapPin size={16} color="var(--text-muted)" />
                        {zones.map(z => (
                            <EfButton
                                key={z}
                                variant={activeZone === z ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => { setActiveZone(z); setActiveDiv(1); setActiveState(null); }}
                                className="ef-standings__btn-zone"
                            >
                                {z}
                            </EfButton>
                        ))}
                    </div>
                    {divs.length > 1 && (
                        <div className="ef-standings__control-group ef-standings__control-group--divs">
                            <Trophy size={16} color="var(--text-muted)" />
                            {divs.map(d => (
                                <EfButton
                                    key={d}
                                    variant={!activeState && activeDiv === d ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => { setActiveDiv(d); setActiveState(null); }}
                                    className="ef-standings__btn-div"
                                >
                                    {SERIE_NAMES[d] || `DIV ${d}`}
                                </EfButton>
                            ))}
                        </div>
                    )}
                </EfPanel>

                {/* SPEC-168: estaduais brasileiros (jan-abril, weeks 1-16) */}
                {activeZone === 'BRA' && stateTournaments.length > 0 && (
                    <EfPanel variant="sunk" padding="sm" className="ef-flex-row-wrap ef-standings__states">
                        <Trophy size={16} color="var(--text-muted)" />
                        <span className="ef-mono ef-text-muted ef-standings__states-label">ESTADUAIS</span>
                        {stateTournaments.map(st => (
                            <EfButton
                                key={st.id}
                                variant={activeState === st.id ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setActiveState(activeState === st.id ? null : st.id)}
                                className="ef-standings__btn-state"
                            >
                                {st.name}
                            </EfButton>
                        ))}
                    </EfPanel>
                )}

                {/* LEGEND BENTO */}
                <EfPanel variant="sunk" padding="sm" className="ef-flex-row-wrap ef-standings__legend">
                    {activeState && (
                        <div className="ef-legend-chip">
                            <Trophy size={14} color="var(--accent)" weight="fill" />
                            <span className="ef-text-muted">TOP 4 → SEMIFINAIS</span>
                        </div>
                    )}
                    {!activeState && activeDiv === 1 && (
                        <>
                            <div className="ef-legend-chip">
                                <AirplaneTilt size={14} weight="fill" className="ef-standings__legend-icon--libertadores" />
                                <span className="ef-text-muted">LIBERTADORES</span>
                            </div>
                            <div className="ef-legend-chip">
                                <AirplaneTilt size={14} weight="fill" className="ef-standings__legend-icon--suda" />
                                <span className="ef-text-muted">SUL-AMERICANA</span>
                            </div>
                        </>
                    )}
                    {!activeState && activeDiv > 1 && activeDiv <= 4 && (
                        <div className="ef-legend-chip">
                            <CaretUp size={16} weight="bold" className="ef-standings__legend-icon--promotion" />
                            <span className="ef-text-muted">ACESSO</span>
                        </div>
                    )}
                    {!activeState && activeDiv < 4 && (
                        <div className="ef-legend-chip">
                            <CaretDown size={16} weight="bold" className="ef-standings__legend-icon--rebaixamento" />
                            <span className="ef-text-muted">REBAIXAMENTO</span>
                        </div>
                    )}
                </EfPanel>

                {/* TABLE */}
                <div className="ef-panel ef-panel-default ef-panel-p-none ef-standings__table-wrap">
                    <table className="ef-table">
                        <thead className="ef-standings__table-head">
                            <tr>
                                <th className="ef-standings__th--pos">#</th>
                                <th className="ef-standings__th--team">TIME</th>
                                <th title="Pontos" className="ef-standings__th ef-standings__th--points">P</th>
                                <th title="Jogos" className="ef-standings__th">J</th>
                                <th title="Vitórias" className="ef-standings__th ef-standings__th--wins">V</th>
                                <th title="Empates" className="ef-standings__th ef-standings__th--draws">E</th>
                                <th title="Derrotas" className="ef-standings__th ef-standings__th--losses">D</th>
                                <th title="Gols Pró" className="ef-standings__th">GP</th>
                                <th title="Gols Contra" className="ef-standings__th">GC</th>
                                <th title="Saldo" className="ef-standings__th">SG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((s, i) => {
                                const t = engine.getTeam(s.teamId);
                                const pos = i + 1;
                                // SPEC-168: state championships — top 4 vão pra semis, sem prom/releg
                                const zoneClass = activeState
                                    ? (pos <= 4 ? 'zone-promotion' : '')
                                    : getZoneClass(pos, standings.length, activeDiv);
                                const isUser = s.teamId === userTeam?.id;
                                const zoneRowClass = getZoneRowModifierClass(zoneClass);
                                const stripeClass = isUser
                                    ? 'ef-standings__row--user'
                                    : (i % 2 === 0 ? 'ef-standings__row--even' : 'ef-standings__row--odd');

                                const sg = s.goalsFor - s.goalsAgainst;
                                return (
                                    <tr key={s.teamId} className={`ef-standings__row ${zoneRowClass} ${stripeClass}`}>
                                        <td className={`ef-mono ef-standings__cell ${pos <= 4 ? 'ef-text-accent' : 'ef-text-muted'}`}>
                                            {pos}
                                        </td>
                                        <td className="ef-standings__cell--team">
                                            <div className="ef-standings__team-wrap">
                                                {t?.name && <EfClubBadge name={t.name} size="sm" />}
                                                <span className={`ef-sans ${isUser ? 'ef-standings__team-name--user' : 'ef-standings__team-name'}`}>
                                                    {t?.name || `TIME ${s.teamId}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="ef-mono ef-text-accent ef-standings__cell ef-standings__cell--points">{s.points}</td>
                                        <td className="ef-mono ef-text-muted ef-standings__cell">{s.played}</td>
                                        <td className="ef-mono ef-text-primary ef-standings__cell">{s.won}</td>
                                        <td className="ef-mono ef-text-accent ef-standings__cell">{s.drawn}</td>
                                        <td className="ef-mono ef-text-danger ef-standings__cell">{s.lost}</td>
                                        <td className="ef-mono ef-text-muted ef-standings__cell">{s.goalsFor}</td>
                                        <td className="ef-mono ef-text-muted ef-standings__cell">{s.goalsAgainst}</td>
                                        <td className={`ef-mono ef-standings__cell ef-standings__cell--diff ${sg >= 0 ? 'ef-text-primary' : 'ef-text-danger'}`}>
                                            {sg >= 0 ? '+' : ''}{sg}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
