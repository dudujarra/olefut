import { useState } from 'react';
import { FormationBoard } from './FormationBoard';
import { Tooltip } from './Tooltip';
import { Help } from './Help';
import { EfClubBadge, EfPanel, EfButton, EfModal } from './ui';
import bgLockerRoom from '../assets/environments/bg_locker_room.png';
import { Sword, MapPin, Trophy, ShieldChevron, Warning, GameController, Lightbulb } from '@phosphor-icons/react';
import { suggestTactic } from '../engine/TacticSuggester';
import '../styles/pre-match-screen.css';

const SECTOR_MOD = { goalkeeper: 'gol', defense: 'def', midfield: 'mei', attack: 'ata' };

export function PreMatchScreen({ team, context, sectors, engine, onSaveLayout }) {
    const [showFormationModal, setShowFormationModal] = useState(false);

    if (!team) return null;
    const opp = context?.opponent;

    const ourForm = (engine?.managerStats?.rollingForm || []).slice(-5);

    const suggestion = (sectors && context?.oppSectors)
        ? suggestTactic({ ourSectors: sectors, oppSectors: context.oppSectors, isHome: context?.isHome ?? true })
        : null;

    const isDerby = context?.opponent?.zone === team.zone && context?.opponent?.division === team.division &&
        ['Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
         'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'].includes(context?.opponent?.name) &&
        ['Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
         'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'].includes(team.name);

    const renderSectorCell = (sec, value) => (
        <div className="ef-prematch__sector-cell">
            <div className={`ef-prematch__sector-value ef-prematch__sector-value--${SECTOR_MOD[sec]}`}>{value ?? '-'}</div>
            <div className="ef-prematch__sector-label">{sec === 'goalkeeper' ? 'GOL' : sec === 'defense' ? 'DEF' : sec === 'midfield' ? 'MEI' : 'ATA'}</div>
        </div>
    );

    return (
        <div className="ef-prematch">
            <EfPanel padding="lg" className={`ef-prematch__panel${isDerby ? ' ef-prematch__panel--derby' : ''}`}>
                {isDerby && (
                    <div className="ef-prematch__derby-banner">
                        <Warning weight="fill" /> CLÁSSICO <Warning weight="fill" />
                    </div>
                )}

                <div className={`ef-prematch__title-row${isDerby ? ' ef-prematch__title-row--derby-offset' : ''}`}>
                    <GameController size={24} color="var(--ef-prematch-info)" />
                    <h3 className="ef-prematch__title">PRÉ-JOGO — INFORMAÇÕES DA PARTIDA</h3>
                </div>

                <div className="ef-prematch__grid">
                    {/* LEFT: Nosso time */}
                    <div className="ef-prematch__team-card">
                        <div className="ef-prematch__team-identity">
                            <EfClubBadge name={team.name} size="md" />
                            <div>
                                <h4 className="ef-prematch__team-name">{team.name}</h4>
                                <div className="ef-prematch__team-side">MANDANTE</div>
                            </div>
                        </div>

                        <div className="ef-prematch__sector-grid">
                            {renderSectorCell('goalkeeper', sectors?.goalkeeper)}
                            {renderSectorCell('defense', sectors?.defense)}
                            {renderSectorCell('midfield', sectors?.midfield)}
                            {renderSectorCell('attack', sectors?.attack)}
                        </div>

                        <div className="ef-prematch__row">
                            <span className="ef-prematch__row-label">Formação Atual</span>
                            <strong className="ef-prematch__row-value">{team.formation || '4-3-3'}</strong>
                        </div>

                        <EfButton variant="secondary" className="ef-prematch__btn-full" onClick={() => setShowFormationModal(true)}>
                            <ShieldChevron size={16} /> EDITAR POSIÇÕES
                        </EfButton>

                        <div className="ef-prematch-form-row ef-prematch__form-row">
                            <span className="ef-prematch__form-label">FORMA</span>
                            {ourForm.length === 0 ? (
                                <span className="ef-prematch__form-empty">—</span>
                            ) : (
                                <div className="ef-prematch__form-pips">
                                    {ourForm.map((r, i) => {
                                        const isW = r === 'W';
                                        const isD = r === 'D';
                                        const mod = isW ? 'w' : isD ? 'd' : 'l';
                                        const label = isW ? 'V' : isD ? 'E' : 'D';
                                        return (
                                            <div key={i} className={`ef-prematch__form-pip ef-prematch__form-pip--${mod}`} aria-label={`Resultado ${label}`}>
                                                {label}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CENTER: VS */}
                    <div className="ef-prematch__center">
                        <div className="ef-prematch__vs-box">
                            <Sword size={32} color="var(--accent)" />
                        </div>

                        <div className="ef-prematch__location-wrap">
                            <div className={`ef-prematch__location-pill ef-prematch__location-pill--${context?.isHome ? 'home' : 'away'}`}>
                                <MapPin weight="fill" /> {context?.location || 'CASA'}
                            </div>
                            <div className="ef-prematch__week">
                                SEMANA {context?.seasonWeek}/38
                            </div>
                        </div>

                        {suggestion && (
                            <div className="ef-prematch-suggestion ef-prematch__suggestion" role="note" aria-label="Sugestão do auxiliar">
                                <div className="ef-prematch__suggestion-header">
                                    <Lightbulb size={14} color="var(--ef-prematch-info)" weight="fill" />
                                    <span className="ef-prematch__suggestion-label">AUXILIAR SUGERE</span>
                                </div>
                                <div className="ef-prematch__suggestion-tactic">
                                    {suggestion.tactic}
                                </div>
                                <div className="ef-prematch__suggestion-reason">
                                    {suggestion.rationale}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Adversário */}
                    <div className="ef-prematch__team-card">
                        <div className="ef-prematch__team-identity">
                            {opp?.name ? <EfClubBadge name={opp.name} size="md" /> : <div className="ef-prematch__opp-badge-fallback" />}
                            <div>
                                <h4 className="ef-prematch__team-name">{opp?.name || '—'}</h4>
                                <div className="ef-prematch__team-side">VISITANTE</div>
                            </div>
                        </div>

                        {opp && (
                            <>
                                <div className="ef-prematch__sector-grid">
                                    {renderSectorCell('goalkeeper', context.oppSectors?.goalkeeper)}
                                    {renderSectorCell('defense', context.oppSectors?.defense)}
                                    {renderSectorCell('midfield', context.oppSectors?.midfield)}
                                    {renderSectorCell('attack', context.oppSectors?.attack)}
                                </div>

                                <div className="ef-prematch__row">
                                    <span className="ef-prematch__row-label">Formação Típica</span>
                                    <strong className="ef-prematch__row-value">{opp.formation || '4-3-3'}</strong>
                                </div>
                                <div className="ef-prematch__row">
                                    <span className="ef-prematch__row-label">Estilo de Jogo</span>
                                    <strong className="ef-prematch__opp-style-value">{context.opponentStyle}</strong>
                                </div>

                                <div className="ef-prematch__tournament-box">
                                    <Trophy size={16} color="var(--accent)" /> {context.tournament}
                                </div>

                                {context.h2h && context.h2h.length > 0 && (
                                    <div className="ef-prematch__h2h-row">
                                        <span className="ef-prematch__h2h-label">H2H Recente:</span>
                                        <div className="ef-prematch__h2h-pips">
                                            {context.h2h.map((m, i) => {
                                                const ourGoals = m.home === team.id ? m.homeGoals : m.awayGoals;
                                                const theirGoals = m.home === team.id ? m.awayGoals : m.homeGoals;
                                                const result = ourGoals > theirGoals ? 'V' : ourGoals < theirGoals ? 'D' : 'E';
                                                const mod = result === 'V' ? 'v' : result === 'D' ? 'l' : 'd';
                                                return (
                                                    <div key={i} className={`ef-prematch__h2h-pip ef-prematch__h2h-pip--${mod}`} title={`${ourGoals}x${theirGoals} — Sem ${m.week ?? '?'}`}>
                                                        {result}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </EfPanel>

            {showFormationModal && (
                <EfModal
                    open={showFormationModal}
                    onClose={() => setShowFormationModal(false)}
                    title="🎯 POSICIONAMENTO TÁTICO"
                    size="lg"
                    footer={null}
                >
                    <FormationBoard
                        team={team}
                        onSave={(payload) => {
                            if (engine && engine.saveFormationLayout) {
                                engine.saveFormationLayout(payload);
                            }
                            if (onSaveLayout) onSaveLayout(payload);
                            setShowFormationModal(false);
                        }}
                    />
                </EfModal>
            )}
        </div>
    );
}

export default PreMatchScreen;
