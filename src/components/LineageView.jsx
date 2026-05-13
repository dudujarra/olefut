/**
 * LineageView — SPEC-166: Painel Linhagem & Legado
 * Stitch v1.1 port (AKITA-390): match docs/stitch-designs/v1.1-all/82-lineageview-hall-de-lendas.html
 * Tokens-only — zero raw hex, brand fonts (Press Start 2P / Pixelify Sans / IBM Plex Mono).
 */

import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ViewOnboarding } from './ViewOnboarding';
import { EfPanel, EfButton } from './ui';
import bgNewspaper from '../assets/environments/bg_newspaper.png';
import '../styles/lineage-view.css';
import {
    TreeStructure, ArrowLeft, Trophy, Dna, Skull, Lightning,
    Star, Crown, Sword, GraduationCap, Shield, Heart
} from '@phosphor-icons/react';

const HUMILIATION_PREFIXES = ['💀', '🛡️'];
const GROWTH_PREFIXES = ['⭐', '⚡', '🔥', '📈', '💪', '🧬'];

export function filterHumiliationEvents(weekEvents) {
    if (!Array.isArray(weekEvents)) return [];
    return weekEvents.filter(e =>
        typeof e === 'string' && HUMILIATION_PREFIXES.some(p => e.startsWith(p))
    );
}

export function filterGrowthEvents(weekEvents) {
    if (!Array.isArray(weekEvents)) return [];
    return weekEvents.filter(e =>
        typeof e === 'string' && GROWTH_PREFIXES.some(p => e.startsWith(p))
    );
}

const SLOT_META = {
    idoloEterno:  { label: 'Ídolo Eterno',  icon: Crown,         criteria: 'Mais jogos + maior amor da torcida', accent: 'var(--color-secondary)' },
    carrasco:     { label: 'Carrasco',       icon: Sword,         criteria: 'Mais gols marcados contra este clube', accent: 'var(--color-danger)' },
    goleirao:     { label: 'Goleador',       icon: Trophy,        criteria: 'Maior número de gols na história', accent: 'var(--color-primary)' },
    criaDaBase:   { label: 'Cria da Base',   icon: GraduationCap, criteria: 'Formado internamente com maior impacto', accent: 'var(--color-text-primary)' },
    traidor:      { label: 'Traidor',        icon: Skull,         criteria: 'Saiu para rival direto', accent: 'var(--ef-lin-purple)' },
    lendaTragica: { label: 'Lenda Trágica', icon: Heart,         criteria: 'Lesão longa ou carreira interrompida', accent: 'var(--color-warning)' },
};

const SLOT_ORDER = ['idoloEterno', 'goleirao', 'criaDaBase', 'carrasco', 'traidor', 'lendaTragica'];

const TRAIT_META = {
    garra:           { label: 'Garra',           color: 'var(--color-danger)' },
    talento_natural: { label: 'Talento Natural', color: 'var(--color-secondary)' },
    lealdade:        { label: 'Lealdade',        color: 'var(--ef-lin-info)' },
    frieza:          { label: 'Frieza',          color: 'var(--ef-lin-purple)' },
};

export function LineageView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();
    const [tab, setTab] = useState('hall');

    if (!engine) {
        return (
            <div className="ef-mono ef-text-main ef-lin__error">
                ENGINE NÃO INICIALIZADO.
            </div>
        );
    }

    const team = engine.getTeam(engine.manager?.teamId);

    const hall = engine.hallOfLegends || { slots: {}, filledCount: 0 };
    const filledCount = hall.filledCount || Object.keys(hall.slots || {}).length;

    const heritagePlayers = (team?.squad || []).filter(
        p => p.heritageTraits && (p._heritageApplied || p.age <= 21)
    );

    const weekEvents = engine.weekEvents || [];
    const humiliationEvents = filterHumiliationEvents(weekEvents);
    const growthEvents = filterGrowthEvents(weekEvents);

    const tabs = [
        { id: 'hall',        label: 'HALL DE LENDAS', icon: Crown,         count: filledCount },
        { id: 'heritage',    label: 'HERANÇA',         icon: Dna,           count: heritagePlayers.length },
        { id: 'humiliation', label: 'HUMILHAÇÕES',     icon: Skull,         count: humiliationEvents.length },
        { id: 'growth',      label: 'CRESCIMENTOS',    icon: Lightning,     count: growthEvents.length },
    ];

    return (
        <div className="ef-anim-fade-in ef-scene-shell ef-lin" style={{ backgroundImage: `url(${bgNewspaper})` }}>
            <ViewOnboarding viewId="lineage" />
            <div className="ef-view-container">

                <EfPanel padding="lg" className="ef-view-header ef-lin__header">
                    <div className="ef-view-header__identity">
                        <div className="ef-view-header__icon-box">
                            <TreeStructure size={28} className="ef-lin__header-icon" />
                        </div>
                        <div>
                            <h2 className="ef-view-header__title">LINHAGEM &amp; LEGADO</h2>
                            <span className="ef-view-header__subtitle">
                                MITOS, HERANÇAS, VEXAMES E EVOLUÇÕES DE {(team?.name || 'SEU CLUBE').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                <div className="ef-lineage-tabs">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <EfButton
                                key={t.id}
                                variant={active ? 'primary' : 'secondary'}
                                onClick={() => setTab(t.id)}
                                aria-pressed={active}
                            >
                                <Icon size={16} /> {t.label}
                                {t.count > 0 && (
                                    <span className={`ef-tab-badge${active ? ' ef-tab-badge--active' : ''}`}>
                                        {t.count}
                                    </span>
                                )}
                            </EfButton>
                        );
                    })}
                </div>

                {tab === 'hall' && <HallTab hall={hall} />}
                {tab === 'heritage' && <HeritageTab players={heritagePlayers} hasHall={filledCount > 0} />}
                {tab === 'humiliation' && <HumiliationTab events={humiliationEvents} week={engine.currentWeek} />}
                {tab === 'growth' && <GrowthTab events={growthEvents} week={engine.currentWeek} />}
            </div>
        </div>
    );
}

function HallTab({ hall }) {
    return (
        <EfPanel padding="lg" className="ef-anim-slide-down">
            <h3 className="ef-panel-subhead">6 SLOTS PERMANENTES POR CLUBE</h3>
            <p className="ef-panel-intro">
                Slots recomputados ao fim de cada temporada com base em apps, gols, base, transferências.
                Quando preenchidos, viram fonte de DNA pra novos regens (ver aba HERANÇA).
            </p>
            <div className="ef-hall-grid">
                {SLOT_ORDER.map(slotKey => {
                    const meta = SLOT_META[slotKey];
                    const Icon = meta.icon;
                    const filled = hall.slots?.[slotKey];
                    const accent = filled ? meta.accent : 'var(--color-text-secondary)';
                    return (
                        <div
                            key={slotKey}
                            className={`ef-hall-slot${filled ? ' ef-hall-slot--filled' : ''}`}
                            style={{ borderColor: accent, color: accent }}
                        >
                            <div className="ef-hall-slot__inner" style={{ borderColor: accent }}>
                                <div className="ef-hall-slot__icon-wrap">
                                    <Icon
                                        size={56}
                                        color={accent}
                                        weight={filled ? 'fill' : 'regular'}
                                    />
                                </div>
                                <span
                                    className="ef-hall-slot__pill"
                                    style={{ background: accent }}
                                >
                                    {meta.label.toUpperCase()}
                                </span>
                                {filled ? (
                                    <>
                                        <div className="ef-hall-slot__name">
                                            {filled.playerName}
                                        </div>
                                        <div
                                            className="ef-hall-slot__stats"
                                            style={{ borderTopColor: accent }}
                                        >
                                            <div className="ef-hall-slot__stat-block">
                                                <span className="ef-hall-slot__stat-label" style={{ color: accent }}>JOGOS</span>
                                                <span className="ef-hall-slot__stat-value">{filled.stats?.apps ?? 0}</span>
                                            </div>
                                            <div className="ef-hall-slot__stat-block">
                                                <span className="ef-hall-slot__stat-label" style={{ color: accent }}>GOLS</span>
                                                <span className="ef-hall-slot__stat-value">{filled.stats?.goals ?? 0}</span>
                                            </div>
                                            {slotKey === 'carrasco' && (
                                                <div className="ef-hall-slot__stat-block">
                                                    <span className="ef-hall-slot__stat-label" style={{ color: accent }}>v/CLUBE</span>
                                                    <span className="ef-hall-slot__stat-value">{filled.stats?.goalsVsThisClub ?? 0}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="ef-hall-slot__placeholder">—</div>
                                        <div
                                            className="ef-hall-slot__criteria"
                                            style={{ borderTopColor: accent }}
                                        >
                                            {meta.criteria}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </EfPanel>
    );
}

function HeritageTab({ players, hasHall }) {
    if (players.length === 0) {
        return (
            <EfPanel padding="lg" className="ef-anim-slide-down">
                <div className="ef-empty-state">
                    <Dna size={48} color="var(--color-text-secondary)" className="ef-empty-state__icon" />
                    <p className="ef-empty-state__title">
                        AGUARDANDO PRÓXIMA GERAÇÃO
                    </p>
                    {hasHall ? (
                        <p className="ef-empty-state__p ef-empty-state__p--last">
                            Hall preenchido. Quando a base trouxer regens (idade ≤ 18) ao fim da temporada,
                            o DNA das lendas será aplicado automaticamente.
                        </p>
                    ) : (
                        <p className="ef-empty-state__p ef-empty-state__p--last">
                            O Hall de Lendas ainda está vazio. Conquiste títulos, mantenha jogadores no
                            clube por muitas temporadas, e o sistema canonizará os mitos. Aí os jovens
                            começam a herdar traços.
                        </p>
                    )}
                </div>
            </EfPanel>
        );
    }

    return (
        <EfPanel padding="lg" className="ef-anim-slide-down">
            <h3 className="ef-panel-subhead">
                {players.length} REGEN{players.length > 1 ? 'S' : ''} COM DNA DE LENDA
            </h3>
            <p className="ef-panel-intro">
                Traits base 30. Slots preenchidos no Hall contribuem bônus +20 a +40 (60% chance por slot).
            </p>
            <div className="ef-heritage-list">
                {players.map(p => (
                    <div key={p.id} className="ef-heritage-card">
                        <div className="ef-heritage-card__row">
                            <div className="ef-heritage-card__identity">
                                <Dna size={18} color="var(--color-primary)" weight="fill" />
                                <span className="ef-heritage-card__name">{p.name}</span>
                            </div>
                            <div className="ef-heritage-card__meta">
                                <span>{p.age} anos</span>
                                <span>OVR {p.ovr}</span>
                                {p.position && <span>{p.position}</span>}
                            </div>
                        </div>
                        <div className="ef-heritage-traits">
                            {Object.entries(TRAIT_META).map(([traitKey, traitMeta]) => {
                                const value = p.heritageTraits?.[traitKey] ?? 30;
                                const pct = Math.max(0, Math.min(100, value));
                                return (
                                    <div key={traitKey} className="ef-heritage-trait">
                                        <div className="ef-heritage-trait__label">
                                            <span>{traitMeta.label.toUpperCase()}</span>
                                            <span className="ef-heritage-trait__value" style={{ color: traitMeta.color }}>{value}</span>
                                        </div>
                                        <div className="ef-heritage-bar">
                                            <div
                                                className="ef-heritage-bar__fill"
                                                style={{ width: `${pct}%`, backgroundColor: traitMeta.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </EfPanel>
    );
}

function HumiliationTab({ events, week }) {
    if (events.length === 0) {
        return (
            <EfPanel padding="lg" className="ef-anim-slide-down">
                <div className="ef-empty-state">
                    <Shield size={48} color="var(--color-primary)" className="ef-empty-state__icon" />
                    <p className="ef-empty-state__title">
                        SEM VEXAMES NA SEMANA {week ?? '—'}
                    </p>
                    <p className="ef-empty-state__p">
                        Eventos de humilhação aparecem aqui quando o time leva goleada
                        (diferença ≥ 4 gols). Vai da cascata leve até ultimato presidencial.
                    </p>
                    <p className="ef-empty-state__p ef-empty-state__p--last ef-empty-state__p--small">
                        Eventos são efêmeros — só visíveis na semana que ocorrem.
                        Resumo de temporada fica na CRÔNICA.
                    </p>
                </div>
            </EfPanel>
        );
    }

    return (
        <EfPanel padding="lg" className="ef-anim-slide-down">
            <h3 className="ef-panel-subhead ef-panel-subhead--danger">
                {events.length} EVENTO{events.length > 1 ? 'S' : ''} NA SEMANA {week ?? '—'}
            </h3>
            <p className="ef-panel-intro">
                Cascata disparada por goleada (diff ≥ 4). Severidade: nível 1 (moral + imprensa),
                nível 2 (presidente + protesto), nível 3 (transfer requests + ultimato).
            </p>
            <div className="ef-event-list">
                {events.map((evt, idx) => {
                    const isSurvival = evt.startsWith('🛡️');
                    return (
                        <div
                            key={idx}
                            className={`ef-event-row ${isSurvival ? 'ef-event-row--primary' : 'ef-event-row--danger'}`}
                        >
                            {evt}
                        </div>
                    );
                })}
            </div>
        </EfPanel>
    );
}

function GrowthTab({ events, week }) {
    if (events.length === 0) {
        return (
            <EfPanel padding="lg" className="ef-anim-slide-down">
                <div className="ef-empty-state">
                    <Star size={48} color="var(--color-text-secondary)" className="ef-empty-state__icon" />
                    <p className="ef-empty-state__title">
                        SEM EVOLUÇÕES NA SEMANA {week ?? '—'}
                    </p>
                    <p className="ef-empty-state__p">
                        Eventos de crescimento (breakthrough, hot streak, peak season) aparecem
                        aqui quando ocorrem. Chance por semana:
                    </p>
                    <p className="ef-empty-state__p ef-empty-state__p--last ef-empty-state__p--small ef-lin__empty-block">
                        • Jovens (&lt;21): 4% por semana<br/>
                        • Peak (23-27, &gt;15 jogos): 8%<br/>
                        • Treino intenso: 12% (≥4 treinos recentes)<br/>
                        • Hot streak: 6% após 5+ vitórias seguidas
                    </p>
                </div>
            </EfPanel>
        );
    }

    return (
        <EfPanel padding="lg" className="ef-anim-slide-down">
            <h3 className="ef-panel-subhead ef-panel-subhead--primary">
                {events.length} EVOLUÇÃO{events.length > 1 ? 'ÕES' : ''} NA SEMANA {week ?? '—'}
            </h3>
            <p className="ef-panel-intro">
                ⭐ youth_breakthrough · 🔥 hot_streak · 📈 peak_season · 💪 training_breakthrough · 🧬 heritage
            </p>
            <div className="ef-event-list">
                {events.map((evt, idx) => {
                    const isNegative = evt.includes('-') && !evt.includes('+');
                    return (
                        <div
                            key={idx}
                            className={`ef-event-row ${isNegative ? 'ef-event-row--accent' : 'ef-event-row--primary'}`}
                        >
                            {evt}
                        </div>
                    );
                })}
            </div>
        </EfPanel>
    );
}

export default LineageView;
