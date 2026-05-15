import { useState } from 'react';
import { FormationBoard } from './FormationBoard';
import { EfClubBadge, EfButton, EfModal } from './ui';
import { MapPin, Trophy, ShieldChevron, Warning, GameController, Lightbulb, ChartBar, Sword, CurrencyDollar, Ticket, CheckCircle, Gavel } from '@phosphor-icons/react';
import { suggestTactic } from '../engine/TacticSuggester';
import { MATCH_BONUS_TIERS } from '../engine/MatchBonusSystem';
import { TICKET_POLICIES } from '../engine/TicketPricingSystem';
import '../styles/pre-match-screen.css';
import '../styles/elifoot-classic.css';

const SECTOR_KEYS = [
    { key: 'goalkeeper', label: 'GOL' },
    { key: 'defense', label: 'DEF' },
    { key: 'midfield', label: 'MEI' },
    { key: 'attack', label: 'ATA' },
];

const DERBY_CLUBS = [
    'Flamengo', 'Fluminense', 'Vasco', 'Botafogo',
    'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
    'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro',
];

function computeWinProbability(ourSectors, oppSectors, isHome) {
    if (!ourSectors || !oppSectors) return null;
    const ourTotal = (ourSectors.goalkeeper || 0) + (ourSectors.defense || 0) + (ourSectors.midfield || 0) + (ourSectors.attack || 0);
    const oppTotal = (oppSectors.goalkeeper || 0) + (oppSectors.defense || 0) + (oppSectors.midfield || 0) + (oppSectors.attack || 0);
    if (ourTotal + oppTotal === 0) return null;
    const homeBoost = isHome ? 5 : -5;
    const ourScore = ourTotal + homeBoost;
    const rawPct = Math.round((ourScore / (ourScore + oppTotal)) * 100);
    const our = Math.max(20, Math.min(80, rawPct));
    return { our, opp: 100 - our };
}

export function PreMatchScreen({ team, context, sectors, engine, onSaveLayout }) {
    const [showFormationModal, setShowFormationModal] = useState(false);
    const [selectedBicho, setSelectedBicho] = useState(engine?.pendingMatchBonus?.tierId || 'none');
    const [selectedTicket, setSelectedTicket] = useState(engine?.ticketPolicy || 'normal');
    const [bichoMsg, setBichoMsg] = useState('');
    const [ticketMsg, setTicketMsg] = useState('');

    const handleBichoChange = (tierId) => {
        if (!engine) return;
        const result = engine.setMatchBonus(tierId);
        setSelectedBicho(tierId);
        setBichoMsg(result.msg || '');
    };

    const handleTicketChange = (policyId) => {
        if (!engine) return;
        const result = engine.setTicketPolicy(policyId);
        setSelectedTicket(policyId);
        setTicketMsg(result.msg || '');
    };

    if (!team) return null;
    const opp = context?.opponent;
    const oppSectors = context?.oppSectors;

    const ourForm = (engine?.managerStats?.rollingForm || []).slice(-5);

    const suggestion = (sectors && oppSectors)
        ? suggestTactic({ ourSectors: sectors, oppSectors, isHome: context?.isHome ?? true })
        : null;

    const isDerby = !!(opp
        && opp.zone === team.zone
        && opp.division === team.division
        && DERBY_CLUBS.includes(opp.name)
        && DERBY_CLUBS.includes(team.name));

    const winProb = computeWinProbability(sectors, oppSectors, context?.isHome ?? true);

    const renderSectorBar = ({ key, label }, src) => {
        const value = src?.[key];
        const pct = Math.max(0, Math.min(100, value ?? 0));
        return (
            <div key={key} className="ef-prematch__bar-row">
                <div className="ef-prematch__bar-meta">
                    <span className="ef-prematch__bar-label">{label}</span>
                    <span className="ef-prematch__bar-value">{value ?? '-'}</span>
                </div>
                <div className="ef-prematch__bar-track">
                    {/* eslint-disable-next-line no-restricted-syntax */}
                    <div className="ef-prematch__bar-fill" style={{ width: `${pct}%` }} /* dynamic per-instance: width depends on sector score */ />
                </div>
            </div>
        );
    };

    return (
        <div className="ef-prematch">
            {/* TITLE BLOCK — neon accent bar + page title */}
            <header className="ef-prematch__title-block">
                <h1 className="ef-prematch__page-title">PRÉ-JOGO</h1>
                <p className="ef-prematch__page-sub">
                    {(context?.isHome ? 'CASA' : 'FORA')} {context?.seasonWeek ? `• SEMANA ${context.seasonWeek}/38` : ''} {context?.tournament ? `• ${context.tournament}` : ''}
                </p>
            </header>

            {/* HERO — VS card with team sides */}
            <section className={`ef-prematch__hero${isDerby ? ' ef-prematch__hero--derby' : ''}`}>
                {isDerby && (
                    <div className="ef-prematch__derby-banner">
                        <Warning weight="fill" /> CLÁSSICO <Warning weight="fill" />
                    </div>
                )}

                <div className="ef-prematch__hero-grid">
                    {/* LEFT: Our team */}
                    <div className="ef-prematch__side ef-prematch__side--ours">
                        <div className="ef-prematch__crest ef-prematch__crest--ours">
                            <EfClubBadge name={team.name} size="lg" />
                        </div>
                        <h2 className="ef-prematch__team-name">{team.name}</h2>
                        <p className="ef-prematch__team-tag ef-prematch__team-tag--ours">
                            {team.formation || '4-3-3'}
                        </p>

                        <div className="ef-prematch__bars">
                            {SECTOR_KEYS.map(s => renderSectorBar(s, sectors))}
                        </div>
                    </div>

                    {/* CENTER: VS + Win Probability */}
                    <div className="ef-prematch__center">
                        <div className="ef-prematch__vs">VS</div>

                        {winProb ? (
                            <div className="ef-prematch__prob">
                                <div className="ef-prematch__prob-title">
                                    <ChartBar size={14} weight="fill" /> PROBABILIDADE
                                </div>
                                <div className="ef-prematch__prob-bar">
                                    {/* eslint-disable-next-line no-restricted-syntax */}
                                    <div className="ef-prematch__prob-our" style={{ width: `${winProb.our}%` }} /* dynamic per-instance: derived from sector totals */ />
                                    {/* eslint-disable-next-line no-restricted-syntax */}
                                    <div className="ef-prematch__prob-opp" style={{ width: `${winProb.opp}%` }} /* dynamic per-instance: derived from sector totals */ />
                                    <div className="ef-prematch__prob-overlay">
                                        <span className="ef-prematch__prob-our-label">{winProb.our}%</span>
                                        <span className="ef-prematch__prob-opp-label">{winProb.opp}%</span>
                                    </div>
                                </div>
                                {opp?.name && (
                                    <p className="ef-prematch__prob-foot">
                                        ADVERSÁRIO: {opp.name.toUpperCase()} ({winProb.opp}%)
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="ef-prematch__vs-icon" aria-hidden>
                                <Sword size={28} />
                            </div>
                        )}

                        <div className="ef-prematch__location-wrap">
                            <div className={`ef-prematch__location-pill ef-prematch__location-pill--${context?.isHome ? 'home' : 'away'}`}>
                                <MapPin weight="fill" /> {context?.location || 'CASA'}
                            </div>
                            {context?.tournament && (
                                <div className="ef-prematch__tournament">
                                    <Trophy size={12} weight="fill" /> {context.tournament}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Opponent */}
                    <div className="ef-prematch__side ef-prematch__side--opp">
                        <div className="ef-prematch__crest ef-prematch__crest--opp">
                            {opp?.name ? <EfClubBadge name={opp.name} size="lg" /> : <div className="ef-prematch__crest-fallback" />}
                        </div>
                        <h2 className="ef-prematch__team-name">{opp?.name || '—'}</h2>
                        <p className="ef-prematch__team-tag ef-prematch__team-tag--opp">
                            {opp?.formation || '4-3-3'}
                        </p>

                        {opp && (
                            <div className="ef-prematch__bars">
                                {SECTOR_KEYS.map(s => renderSectorBar(s, oppSectors))}
                            </div>
                        )}

                        {context?.opponentStyle && (
                            <div className="ef-prematch__style-box">
                                <span className="ef-prematch__style-label">ESTILO TÁTICO</span>
                                <span className="ef-prematch__style-value">{context.opponentStyle.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* FORMATION + SUGGESTION ROW */}
            <section className="ef-prematch__row-grid">
                <div className="ef-prematch__formation-card">
                    <div className="ef-prematch__card-title">
                        <GameController size={16} weight="fill" /> FORMAÇÃO ATUAL
                    </div>
                    <div className="ef-prematch__formation-value">{team.formation || '4-3-3'}</div>
                    <EfButton variant="secondary" className="ef-prematch__edit-btn" onClick={() => setShowFormationModal(true)}>
                        <ShieldChevron size={16} /> EDITAR POSIÇÕES
                    </EfButton>
                </div>

                {suggestion && (
                    <div className="ef-prematch__suggestion" role="note" aria-label="Sugestão do auxiliar">
                        <div className="ef-prematch__card-title ef-prematch__card-title--info">
                            <Lightbulb size={16} weight="fill" /> AUXILIAR SUGERE
                        </div>
                        <div className="ef-prematch__suggestion-tactic">{suggestion.tactic}</div>
                        <div className="ef-prematch__suggestion-reason">{suggestion.rationale}</div>
                    </div>
                )}
            </section>

            {/* H2H + FORM ROW */}
            {(ourForm.length > 0 || (context?.h2h && context.h2h.length > 0)) && (
                <section className="ef-prematch__h2h-card">
                    <div className="ef-prematch__h2h-head">
                        <ChartBar size={20} weight="fill" />
                        <div>
                            <h3 className="ef-prematch__h2h-title">ÚLTIMOS JOGOS</h3>
                            <p className="ef-prematch__h2h-sub">Forma recente {opp?.name ? `e confrontos vs ${opp.name}` : ''}</p>
                        </div>
                    </div>

                    {ourForm.length > 0 && (
                        <div className="ef-prematch__pip-row">
                            <span className="ef-prematch__pip-label">FORMA</span>
                            <div className="ef-prematch__pips">
                                {ourForm.map((r, i) => {
                                    const isW = r === 'W';
                                    const isD = r === 'D';
                                    const mod = isW ? 'v' : isD ? 'd' : 'l';
                                    const label = isW ? 'V' : isD ? 'E' : 'D';
                                    return (
                                        <div key={i} className={`ef-prematch__pip ef-prematch__pip--${mod}`} aria-label={`Resultado ${label}`}>
                                            {label}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {context?.h2h && context.h2h.length > 0 && (
                        <div className="ef-prematch__pip-row">
                            <span className="ef-prematch__pip-label">H2H</span>
                            <div className="ef-prematch__pips">
                                {context.h2h.map((m, i) => {
                                    const ourGoals = m.home === team.id ? m.homeGoals : m.awayGoals;
                                    const theirGoals = m.home === team.id ? m.awayGoals : m.homeGoals;
                                    const result = ourGoals > theirGoals ? 'V' : ourGoals < theirGoals ? 'D' : 'E';
                                    const mod = result === 'V' ? 'v' : result === 'D' ? 'l' : 'd';
                                    return (
                                        <div
                                            key={i}
                                            className={`ef-prematch__pip ef-prematch__pip--${mod}`}
                                            title={`${ourGoals}x${theirGoals} — Sem ${m.week ?? '?'}`}
                                        >
                                            {result}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* ELIFOOT CLASSIC: BICHO (Match Bonus) */}
            <section className="ef-prematch__classic-section">
                <div className="ef-bicho">
                    <div className="ef-bicho__title">
                        <CurrencyDollar size={18} weight="fill" /> BICHO (PREMIAÇÃO)
                    </div>
                    <div className="ef-bicho__tiers">
                        {MATCH_BONUS_TIERS.map(tier => {
                            const isActive = selectedBicho === tier.id;
                            const titulares = (team.squad || []).filter(p => p.isTitular && !p.injury);
                            const totalCost = tier.costPerPlayer * titulares.length;
                            return (
                                <div
                                    key={tier.id}
                                    className={`ef-bicho__tier${isActive ? ' ef-bicho__tier--active' : ''}`}
                                    onClick={() => handleBichoChange(tier.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isActive}
                                    onKeyDown={e => e.key === 'Enter' && handleBichoChange(tier.id)}
                                >
                                    {isActive && <CheckCircle size={16} weight="fill" className="ef-bicho__check" />}
                                    <div className="ef-bicho__tier-name">{tier.emoji} {tier.name}</div>
                                    {tier.costPerPlayer > 0 ? (
                                        <>
                                            <div className="ef-bicho__tier-cost">R$ {(totalCost / 1000).toFixed(0)}K total</div>
                                            <div className="ef-bicho__tier-buff">+{Math.round(tier.ovrBuff * 100)}% setores</div>
                                            <div className="ef-bicho__tier-risk">Derrota: {tier.frustrationPenalty} moral</div>
                                        </>
                                    ) : (
                                        <div className="ef-bicho__tier-cost">Sem custo</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {bichoMsg && (
                        <div className={`ef-bicho__summary${selectedBicho !== 'none' ? ' ef-bicho__summary--warn' : ''}`}>
                            <Gavel size={14} /> {bichoMsg}
                        </div>
                    )}
                </div>
            </section>

            {/* ELIFOOT CLASSIC: TICKET PRICING */}
            <section className="ef-prematch__classic-section">
                <div className="ef-ticket">
                    <div className="ef-ticket__title">
                        <Ticket size={18} weight="fill" /> POLÍTICA DE INGRESSOS
                    </div>
                    <div className="ef-ticket__options">
                        {TICKET_POLICIES.map(policy => {
                            const isActive = selectedTicket === policy.id;
                            const priceMod = policy.priceMultiplier;
                            const attendMod = policy.attendanceMultiplier;
                            const homeMod = policy.homeAdvantageBoost;
                            return (
                                <div
                                    key={policy.id}
                                    className={`ef-ticket__option${isActive ? ' ef-ticket__option--active' : ''}`}
                                    onClick={() => handleTicketChange(policy.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isActive}
                                    onKeyDown={e => e.key === 'Enter' && handleTicketChange(policy.id)}
                                >
                                    {isActive && <CheckCircle size={16} weight="fill" className="ef-ticket__check" />}
                                    <div className="ef-ticket__option-header">
                                        <span className="ef-ticket__option-name">{policy.emoji} {policy.name}</span>
                                    </div>
                                    <div className="ef-ticket__stat-row">
                                        <div className="ef-ticket__stat">
                                            <span className="ef-ticket__stat-label">Renda</span>
                                            <span className={`ef-ticket__stat-value ${priceMod > 1 ? 'ef-ticket__stat-value--up' : priceMod < 1 ? 'ef-ticket__stat-value--down' : 'ef-ticket__stat-value--neutral'}`}>
                                                {priceMod > 1 ? '+' : ''}{Math.round((priceMod - 1) * 100)}%
                                            </span>
                                        </div>
                                        <div className="ef-ticket__stat">
                                            <span className="ef-ticket__stat-label">Público</span>
                                            <span className={`ef-ticket__stat-value ${attendMod > 1 ? 'ef-ticket__stat-value--up' : attendMod < 1 ? 'ef-ticket__stat-value--down' : 'ef-ticket__stat-value--neutral'}`}>
                                                {attendMod > 1 ? '+' : ''}{Math.round((attendMod - 1) * 100)}%
                                            </span>
                                        </div>
                                        <div className="ef-ticket__stat">
                                            <span className="ef-ticket__stat-label">Casa</span>
                                            <span className={`ef-ticket__stat-value ${homeMod > 1 ? 'ef-ticket__stat-value--up' : homeMod < 1 ? 'ef-ticket__stat-value--down' : 'ef-ticket__stat-value--neutral'}`}>
                                                {homeMod > 1 ? '+' : homeMod < 1 ? '' : ''}{Math.round((homeMod - 1) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ef-ticket__option-desc">{policy.description}</div>
                                </div>
                            );
                        })}
                    </div>
                    {ticketMsg && (
                        <div className="ef-bicho__summary">
                            <Ticket size={14} /> {ticketMsg}
                        </div>
                    )}
                </div>
            </section>

            {showFormationModal && (
                <EfModal
                    open={showFormationModal}
                    onClose={() => setShowFormationModal(false)}
                    title="POSICIONAMENTO TÁTICO"
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
