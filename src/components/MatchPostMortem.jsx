/**
 * MatchPostMortem — SPEC-A4 + AKITA-399 Stitch port
 *
 * Dois modos de render (backward-compatible):
 *   1. Legacy: <MatchPostMortem analysis={...} /> → painel 3-card de MatchAnalyst.
 *   2. Stitch: <MatchPostMortem matchSummary={...} /> → tela completa estilo
 *      "Resumo da Partida" (scoreboard, stats, MVP, eventos). Brand v1.1.
 *
 * Componente é "view-only": engine/hooks NÃO são tocados. Dados vêm via props.
 *
 * matchSummary shape (todos os campos opcionais — fallbacks defensivos):
 * {
 *   outcome: 'win' | 'loss' | 'draw',           // perspectiva do user team
 *   stadium: string,                              // e.g. "Maracanã"
 *   home: { name, score, isUser, crest? },
 *   away: { name, score, isUser, crest? },
 *   stats: { possessionHome, possessionAway, shotsHome, shotsAway,
 *            foulsHome, foulsAway, cornersHome, cornersAway,
 *            cardsHome: { y, r }, cardsAway: { y, r } },
 *   mvp: { name, goals, assists, rating, portrait? },
 *   events: [ { minute, type: 'goal'|'card'|'sub'|'other', text, opponent? } ],
 *   onContinue: () => void,
 * }
 */

import {
    CheckCircle,
    Warning,
    DiceSix,
    ThumbsUp,
    ThumbsDown,
    Minus,
    Shield,
    SoccerBall,
    ArrowRight,
    ChartBar,
} from '@phosphor-icons/react';

import '../styles/match-post-mortem.css';

const LUCK_ICON = {
    good: ThumbsUp,
    bad: ThumbsDown,
    neutral: Minus,
};

const LUCK_VARIANT = {
    good: 'luck-good',
    bad: 'luck-bad',
    neutral: 'luck-neutral',
};

const OUTCOME_VERDICT = {
    win: 'VITÓRIA',
    loss: 'DERROTA',
    draw: 'EMPATE',
};

function inferOutcome(summary) {
    if (!summary) return 'draw';
    if (summary.outcome) return summary.outcome;
    const userIsHome = summary.home?.isUser;
    const userIsAway = summary.away?.isUser;
    const hs = summary.home?.score ?? 0;
    const as = summary.away?.score ?? 0;
    if (hs === as) return 'draw';
    if (userIsHome) return hs > as ? 'win' : 'loss';
    if (userIsAway) return as > hs ? 'win' : 'loss';
    return hs > as ? 'win' : 'loss';
}

// ============================================================
// MODE 1 — 3-card analysis (preserva contrato SPEC-A4)
// ============================================================
function AnalysisCards({ analysis }) {
    const { best, dubious, luck } = analysis;
    const luckType = luck?.type || 'neutral';
    const LuckIcon = LUCK_ICON[luckType] || Minus;
    const luckVariant = LUCK_VARIANT[luckType] || 'luck-neutral';

    return (
        <div
            className="ef-postmortem"
            role="region"
            aria-label="Análise pós-jogo"
        >
            <div className="ef-postmortem__card ef-postmortem__card--best">
                <div className="ef-postmortem__head">
                    <CheckCircle size={16} weight="fill" />
                    <span className="ef-postmortem__label ef-postmortem__label--best">
                        MELHOR DECISÃO
                    </span>
                </div>
                <div className="ef-postmortem__title">{best?.title}</div>
                <div className="ef-postmortem__body">{best?.body}</div>
            </div>

            <div className="ef-postmortem__card ef-postmortem__card--dubious">
                <div className="ef-postmortem__head">
                    <Warning size={16} weight="fill" />
                    <span className="ef-postmortem__label ef-postmortem__label--dubious">
                        PARA REVER
                    </span>
                </div>
                <div className="ef-postmortem__title">{dubious?.title}</div>
                <div className="ef-postmortem__body">{dubious?.body}</div>
            </div>

            <div className={`ef-postmortem__card ef-postmortem__card--${luckVariant}`}>
                <div className="ef-postmortem__head">
                    <DiceSix size={16} weight="fill" />
                    <span className={`ef-postmortem__label ef-postmortem__label--${luckVariant}`}>
                        FATOR SORTE
                    </span>
                    <LuckIcon size={14} weight="bold" />
                </div>
                <div className="ef-postmortem__title">{luck?.title}</div>
                <div className="ef-postmortem__body">{luck?.body}</div>
            </div>
        </div>
    );
}

// ============================================================
// MODE 2 — Full match summary (Stitch port)
// ============================================================
function MatchSummary({ summary }) {
    const outcome = inferOutcome(summary);
    const verdict = OUTCOME_VERDICT[outcome] || 'PARTIDA';
    const home = summary.home || { name: '—', score: 0 };
    const away = summary.away || { name: '—', score: 0 };
    const stats = summary.stats || {};
    const mvp = summary.mvp;
    const events = Array.isArray(summary.events) ? summary.events : [];
    const stadium = summary.stadium || '';

    const homeWon = (home.score ?? 0) > (away.score ?? 0);
    const awayWon = (away.score ?? 0) > (home.score ?? 0);

    return (
        <section
            className="ef-postmortem-screen"
            role="region"
            aria-label="Resumo da partida"
        >
            {/* Headline */}
            <header className="ef-postmortem-screen__headline">
                <h1 className={`ef-postmortem-screen__verdict ef-postmortem-screen__verdict--${outcome}`}>
                    {verdict}
                </h1>
                <p className="ef-postmortem-screen__subtitle">
                    Partida Encerrada{stadium ? ` • ${stadium}` : ''}
                </p>
            </header>

            {/* Scoreboard */}
            <section className="ef-postmortem-screen__scoreboard" aria-label="Placar">
                <div className="ef-postmortem-screen__team">
                    <div className="ef-postmortem-screen__crest" aria-hidden="true">
                        <Shield size={40} weight="duotone" />
                    </div>
                    <h2 className="ef-postmortem-screen__team-name">{home.name}</h2>
                </div>

                <div className="ef-postmortem-screen__score">
                    <span className={`ef-postmortem-screen__score-num${homeWon ? ' ef-postmortem-screen__score-num--winner' : ''}`}>
                        {home.score ?? 0}
                    </span>
                    <span className="ef-postmortem-screen__score-sep">-</span>
                    <span className={`ef-postmortem-screen__score-num${awayWon ? ' ef-postmortem-screen__score-num--winner' : ''}`}>
                        {away.score ?? 0}
                    </span>
                </div>

                <div className="ef-postmortem-screen__team">
                    <div className="ef-postmortem-screen__crest" aria-hidden="true">
                        <Shield size={40} weight="duotone" />
                    </div>
                    <h2 className="ef-postmortem-screen__team-name">{away.name}</h2>
                </div>
            </section>

            {/* Bento: stats + MVP */}
            <div className="ef-postmortem-screen__bento">
                {/* Stats panel */}
                <section className="ef-postmortem-screen__panel" aria-label="Estatísticas">
                    <div className="ef-postmortem-screen__panel-head">
                        <h3 className="ef-postmortem-screen__panel-title">ESTATÍSTICAS</h3>
                        <ChartBar size={20} weight="bold" />
                    </div>

                    {/* Possession */}
                    {(stats.possessionHome != null || stats.possessionAway != null) && (
                        <div className="ef-postmortem-screen__possession">
                            <div className="ef-postmortem-screen__possession-labels">
                                <span>Posse de Bola</span>
                                <div className="ef-postmortem-screen__possession-values">
                                    <span className="ef-postmortem-screen__possession-value--home">
                                        {stats.possessionHome ?? 0}%
                                    </span>
                                    <span>{stats.possessionAway ?? 0}%</span>
                                </div>
                            </div>
                            <div className="ef-postmortem-screen__possession-bar">
                                {/* eslint-disable-next-line no-restricted-syntax */}
                                <div className="ef-postmortem-screen__possession-fill--home" style={{ width: `${stats.possessionHome ?? 50}%` }} /* dynamic per-match data */ />
                                {/* eslint-disable-next-line no-restricted-syntax */}
                                <div className="ef-postmortem-screen__possession-fill--away" style={{ width: `${stats.possessionAway ?? 50}%` }} /* dynamic per-match data */ />
                            </div>
                        </div>
                    )}

                    {/* Stats grid */}
                    <div className="ef-postmortem-screen__stats-grid">
                        <div className="ef-postmortem-screen__stat ef-postmortem-screen__stat--bordered">
                            <span className="ef-postmortem-screen__stat-label">Finalizações</span>
                            <span className="ef-postmortem-screen__stat-value ef-postmortem-screen__stat-value--accent">
                                {stats.shotsHome ?? 0} / {stats.shotsAway ?? 0}
                            </span>
                        </div>
                        <div className="ef-postmortem-screen__stat">
                            <span className="ef-postmortem-screen__stat-label">Faltas</span>
                            <span className="ef-postmortem-screen__stat-value">
                                {stats.foulsHome ?? 0} / {stats.foulsAway ?? 0}
                            </span>
                        </div>
                        <div className="ef-postmortem-screen__stat ef-postmortem-screen__stat--bordered">
                            <span className="ef-postmortem-screen__stat-label">Escanteios</span>
                            <span className="ef-postmortem-screen__stat-value ef-postmortem-screen__stat-value--accent">
                                {stats.cornersHome ?? 0} / {stats.cornersAway ?? 0}
                            </span>
                        </div>
                        <div className="ef-postmortem-screen__stat">
                            <span className="ef-postmortem-screen__stat-label">Cartões (A/V)</span>
                            <span className="ef-postmortem-screen__stat-value ef-postmortem-screen__stat-value--warn">
                                {stats.cardsHome?.y ?? 0}/{stats.cardsHome?.r ?? 0} / {stats.cardsAway?.y ?? 0}/{stats.cardsAway?.r ?? 0}
                            </span>
                        </div>
                    </div>
                </section>

                {/* MVP panel */}
                {mvp && (
                    <section className="ef-postmortem-screen__mvp" aria-label="Homem do jogo">
                        {mvp.rating != null && (
                            <div className="ef-postmortem-screen__mvp-rating">{mvp.rating}</div>
                        )}
                        <h3 className="ef-postmortem-screen__mvp-title">HOMEM DO JOGO</h3>
                        <div className="ef-postmortem-screen__mvp-portrait" aria-hidden="true">
                            {mvp.portrait
                                ? <img src={mvp.portrait} alt="" className="ef-postmortem-screen__mvp-portrait-img" />
                                : (mvp.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <p className="ef-postmortem-screen__mvp-name">{mvp.name || '—'}</p>
                        <p className="ef-postmortem-screen__mvp-stat">
                            {(mvp.goals ?? 0)} {mvp.goals === 1 ? 'Gol' : 'Gols'}
                            {mvp.assists != null ? ` • ${mvp.assists} ${mvp.assists === 1 ? 'Assistência' : 'Assistências'}` : ''}
                        </p>
                    </section>
                )}
            </div>

            {/* Events */}
            {events.length > 0 && (
                <section className="ef-postmortem-screen__events" aria-label="Eventos da partida">
                    <h3 className="ef-postmortem-screen__events-title">EVENTOS DA PARTIDA</h3>
                    <ul className="ef-postmortem-screen__events-list">
                        {events.map((ev, i) => {
                            const oppMod = ev.opponent ? '--opp' : '';
                            return (
                                <li key={i} className="ef-postmortem-screen__event">
                                    <span className={`ef-postmortem-screen__event-min${oppMod ? ' ef-postmortem-screen__event-min--opp' : ''}`}>
                                        {ev.minute}
                                    </span>
                                    <span className="ef-postmortem-screen__event-icon" aria-hidden="true">
                                        <SoccerBall size={20} weight={ev.opponent ? 'regular' : 'fill'} />
                                    </span>
                                    <span
                                        className={`ef-postmortem-screen__event-text${oppMod ? ' ef-postmortem-screen__event-text--opp' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: ev.text || '' }}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Continue */}
            {typeof summary.onContinue === 'function' && (
                <div className="ef-postmortem-screen__actions">
                    <button
                        type="button"
                        className="ef-postmortem-screen__continue"
                        onClick={summary.onContinue}
                    >
                        CONTINUAR
                        <ArrowRight size={20} weight="bold" />
                    </button>
                </div>
            )}
        </section>
    );
}

// ============================================================
// Public component
// ============================================================
export function MatchPostMortem({ analysis, matchSummary }) {
    if (matchSummary) return <MatchSummary summary={matchSummary} />;
    if (analysis) return <AnalysisCards analysis={analysis} />;
    return null;
}

export default MatchPostMortem;
