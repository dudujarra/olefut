/**
 * LineageView — SPEC-166: Painel Linhagem & Legado
 *
 * View unificada que surfa 4 sistemas atualmente invisíveis na UI:
 *  - Hall de Lendas (SPEC-078)
 *  - Heritage Traits (SPEC-079)
 *  - Humiliation Cascade (SPEC-076) — efêmero (semana atual apenas)
 *  - Growth Events (SPEC-134)         — efêmero (semana atual apenas)
 *
 * READ-ONLY: zero mudança comportamental na engine. Apenas consome dados
 * existentes em engine.hallOfLegends, team.squad[].heritageTraits, e
 * engine.weekEvents[].
 *
 * Audit gap fix: AKITA-233 + Bloco 2.2 do Foundation-First Roadmap.
 */

import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { EfPanel, EfButton } from './ui';
import bgNewspaper from '../assets/environments/bg_newspaper.png';
import {
    TreeStructure, ArrowLeft, Trophy, Dna, Skull, Lightning,
    Star, Crown, Sword, GraduationCap, Shield, Heart
} from '@phosphor-icons/react';

// ─── Filter helpers (exportados pra harness) ────────────────────────────

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

// ─── Slot metadata (label, icon, gradient) ──────────────────────────────

const SLOT_META = {
    idoloEterno:  { label: 'Ídolo Eterno',  icon: Crown,         criteria: 'Mais jogos + maior amor da torcida', accent: '#FFD700' },
    carrasco:     { label: 'Carrasco',       icon: Sword,         criteria: 'Mais gols marcados contra este clube', accent: '#FF3333' },
    goleirao:     { label: 'Goleador',       icon: Trophy,        criteria: 'Maior número de gols na história', accent: '#39FF14' },
    criaDaBase:   { label: 'Cria da Base',   icon: GraduationCap, criteria: 'Formado internamente com maior impacto', accent: '#40BAF7' },
    traidor:      { label: 'Traidor',        icon: Skull,         criteria: 'Saiu para rival direto', accent: '#8E5BFF' },
    lendaTragica: { label: 'Lenda Trágica', icon: Heart,         criteria: 'Lesão longa ou carreira interrompida', accent: '#FF8C00' },
};

const SLOT_ORDER = ['idoloEterno', 'goleirao', 'criaDaBase', 'carrasco', 'traidor', 'lendaTragica'];

const TRAIT_META = {
    garra:           { label: 'Garra',           color: '#FF3333' },
    talento_natural: { label: 'Talento Natural', color: '#FFD700' },
    lealdade:        { label: 'Lealdade',        color: '#40BAF7' },
    frieza:          { label: 'Frieza',          color: '#8E5BFF' },
};

// ─── Component ──────────────────────────────────────────────────────────

export function LineageView() {
    const { getEngine, changeView, getDashboardView } = useGame();
    const engine = getEngine();
    const [tab, setTab] = useState('hall');

    const colors = {
        bg: '#0D1117',
        panelBg: '#161B22',
        panelElevated: '#1A1F24',
        border: '#2D3748',
        text: '#FDFBF7',
        textMuted: '#8E9E94',
        accent: '#39FF14',
        secondary: '#40BAF7',
        warning: '#FFD700',
        danger: '#FF3333'
    };

    const fontMono = { fontFamily: 'var(--font-mono)' };

    if (!engine) {
        return (
            <div style={{ padding: '24px', color: colors.text, fontFamily: 'var(--font-mono)' }}>
                ENGINE NÃO INICIALIZADO.
            </div>
        );
    }

    const team = engine.getTeam(engine.manager?.teamId);

    const hall = engine.hallOfLegends || { slots: {}, filledCount: 0 };
    const filledCount = hall.filledCount || Object.keys(hall.slots || {}).length;

    // Heritage: regens jovens com traits aplicados.
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
        <div className="ef-anim-fade-in" style={{
            backgroundImage: `url(${bgNewspaper})`,
            imageRendering: 'pixelated',
            WebkitImageRendering: 'pixelated',
            backgroundColor: colors.bg,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100dvh',
            padding: '24px',
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            overflowY: 'auto'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* HEADER */}
                <EfPanel padding="lg" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `2px solid ${colors.warning}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px',
                            backgroundColor: colors.panelElevated,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            border: `1px solid ${colors.border}`
                        }}>
                            <TreeStructure size={28} color={colors.warning} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', color: colors.text, fontWeight: 'bold' }}>
                                LINHAGEM &amp; LEGADO
                            </h2>
                            <span style={{ ...fontMono, fontSize: '0.8rem', color: colors.textMuted }}>
                                MITOS, HERANÇAS, VEXAMES E EVOLUÇÕES DE {(team?.name || 'SEU CLUBE').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <EfButton variant="secondary" size="md" onClick={() => changeView(getDashboardView())}>
                        <ArrowLeft size={16} /> SAIR
                    </EfButton>
                </EfPanel>

                {/* TABS */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                                    <span style={{
                                        marginLeft: '8px',
                                        backgroundColor: active ? '#000' : colors.panelElevated,
                                        color: active ? colors.accent : colors.text,
                                        padding: '2px 8px',
                                        ...fontMono,
                                        fontSize: '0.7rem',
                                        border: `1px solid ${colors.border}`
                                    }}>
                                        {t.count}
                                    </span>
                                )}
                            </EfButton>
                        );
                    })}
                </div>

                {/* TAB CONTENT */}
                {tab === 'hall' && <HallTab hall={hall} colors={colors} fontMono={fontMono} />}
                {tab === 'heritage' && <HeritageTab players={heritagePlayers} hasHall={filledCount > 0} colors={colors} fontMono={fontMono} />}
                {tab === 'humiliation' && <HumiliationTab events={humiliationEvents} colors={colors} fontMono={fontMono} week={engine.currentWeek} />}
                {tab === 'growth' && <GrowthTab events={growthEvents} colors={colors} fontMono={fontMono} week={engine.currentWeek} />}
            </div>
        </div>
    );
}

// ─── Tab: Hall ──────────────────────────────────────────────────────────

function HallTab({ hall, colors, fontMono }) {
    return (
        <EfPanel padding="lg" className="ef-anim-slide-down">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: colors.warning, ...fontMono }}>
                6 SLOTS PERMANENTES POR CLUBE
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.8rem', color: colors.textMuted, ...fontMono, lineHeight: 1.6 }}>
                Slots recomputados ao fim de cada temporada com base em apps, gols, base, transferências.
                Quando preenchidos, viram fonte de DNA pra novos regens (ver aba HERANÇA).
            </p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
            }}>
                {SLOT_ORDER.map(slotKey => {
                    const meta = SLOT_META[slotKey];
                    const Icon = meta.icon;
                    const filled = hall.slots?.[slotKey];
                    return (
                        <div
                            key={slotKey}
                            style={{
                                padding: '14px',
                                backgroundColor: colors.panelElevated,
                                border: filled ? `2px solid ${meta.accent}` : `1px dashed ${colors.border}`,
                                opacity: filled ? 1 : 0.65,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon size={20} color={filled ? meta.accent : colors.textMuted} weight={filled ? 'fill' : 'regular'} />
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '0.85rem',
                                    color: filled ? colors.text : colors.textMuted,
                                    fontFamily: 'var(--font-sans)',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.05em'
                                }}>
                                    {meta.label.toUpperCase()}
                                </h3>
                            </div>
                            {filled ? (
                                <>
                                    <div style={{
                                        fontSize: '1rem',
                                        color: meta.accent,
                                        ...fontMono,
                                        fontWeight: 'bold'
                                    }}>
                                        {filled.playerName}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        fontSize: '0.7rem',
                                        color: colors.textMuted,
                                        ...fontMono
                                    }}>
                                        <span>JOGOS: {filled.stats?.apps ?? 0}</span>
                                        <span>GOLS: {filled.stats?.goals ?? 0}</span>
                                        {slotKey === 'carrasco' && (
                                            <span>v/CLUBE: {filled.stats?.goalsVsThisClub ?? 0}</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '1.4rem', color: colors.textMuted, ...fontMono }}>—</div>
                                    <div style={{ fontSize: '0.7rem', color: colors.textMuted, ...fontMono, lineHeight: 1.5 }}>
                                        {meta.criteria}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </EfPanel>
    );
}

// ─── Tab: Heritage ──────────────────────────────────────────────────────

function HeritageTab({ players, hasHall, colors, fontMono }) {
    if (players.length === 0) {
        return (
            <EfPanel padding="lg" className="ef-anim-slide-down">
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: colors.textMuted,
                    ...fontMono,
                    fontSize: '0.85rem',
                    lineHeight: 1.8
                }}>
                    <Dna size={48} color={colors.textMuted} style={{ marginBottom: '16px' }} />
                    <p style={{ margin: '0 0 8px 0', color: colors.text, fontSize: '0.95rem', fontWeight: 'bold' }}>
                        AGUARDANDO PRÓXIMA GERAÇÃO
                    </p>
                    {hasHall ? (
                        <p style={{ margin: 0 }}>
                            Hall preenchido. Quando a base trouxer regens (idade ≤ 18) ao fim da temporada,
                            o DNA das lendas será aplicado automaticamente.
                        </p>
                    ) : (
                        <p style={{ margin: 0 }}>
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: colors.warning, ...fontMono }}>
                {players.length} REGEN{players.length > 1 ? 'S' : ''} COM DNA DE LENDA
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.8rem', color: colors.textMuted, ...fontMono, lineHeight: 1.6 }}>
                Traits base 30. Slots preenchidos no Hall contribuem bônus +20 a +40 (60% chance por slot).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {players.map(p => (
                    <div
                        key={p.id}
                        style={{
                            padding: '14px',
                            backgroundColor: colors.panelElevated,
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Dna size={18} color={colors.accent} weight="fill" />
                                <span style={{
                                    fontSize: '0.95rem',
                                    color: colors.text,
                                    fontWeight: 'bold',
                                    ...fontMono
                                }}>
                                    {p.name}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                fontSize: '0.7rem',
                                color: colors.textMuted,
                                ...fontMono
                            }}>
                                <span>{p.age} anos</span>
                                <span>OVR {p.ovr}</span>
                                {p.position && <span>{p.position}</span>}
                            </div>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '10px'
                        }}>
                            {Object.entries(TRAIT_META).map(([traitKey, traitMeta]) => {
                                const value = p.heritageTraits?.[traitKey] ?? 30;
                                const pct = Math.max(0, Math.min(100, value));
                                return (
                                    <div key={traitKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.7rem',
                                            color: colors.textMuted,
                                            ...fontMono
                                        }}>
                                            <span>{traitMeta.label.toUpperCase()}</span>
                                            <span style={{ color: traitMeta.color, fontWeight: 'bold' }}>{value}</span>
                                        </div>
                                        <div style={{
                                            height: '6px',
                                            backgroundColor: colors.bg,
                                            border: `1px solid ${colors.border}`,
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                backgroundColor: traitMeta.color,
                                                transition: 'width 0.3s ease'
                                            }} />
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

// ─── Tab: Humiliation ───────────────────────────────────────────────────

function HumiliationTab({ events, colors, fontMono, week }) {
    if (events.length === 0) {
        return (
            <EfPanel padding="lg" className="ef-anim-slide-down">
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: colors.textMuted,
                    ...fontMono,
                    fontSize: '0.85rem',
                    lineHeight: 1.8
                }}>
                    <Shield size={48} color={colors.accent} style={{ marginBottom: '16px' }} />
                    <p style={{ margin: '0 0 8px 0', color: colors.text, fontSize: '0.95rem', fontWeight: 'bold' }}>
                        SEM VEXAMES NA SEMANA {week ?? '—'}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                        Eventos de humilhação aparecem aqui quando o time leva goleada
                        (diferença ≥ 4 gols). Vai da cascata leve até ultimato presidencial.
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem' }}>
                        Eventos são efêmeros — só visíveis na semana que ocorrem.
                        Resumo de temporada fica na CRÔNICA.
                    </p>
                </div>
            </EfPanel>
        );
    }

    return (
        <EfPanel padding="lg" className="ef-anim-slide-down">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: colors.danger, ...fontMono }}>
                {events.length} EVENTO{events.length > 1 ? 'S' : ''} NA SEMANA {week ?? '—'}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.8rem', color: colors.textMuted, ...fontMono, lineHeight: 1.6 }}>
                Cascata disparada por goleada (diff ≥ 4). Severidade: nível 1 (moral + imprensa),
                nível 2 (presidente + protesto), nível 3 (transfer requests + ultimato).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map((evt, idx) => {
                    const isSurvival = evt.startsWith('🛡️');
                    const accent = isSurvival ? colors.accent : colors.danger;
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '12px 14px',
                                backgroundColor: colors.panelElevated,
                                borderLeft: `4px solid ${accent}`,
                                fontSize: '0.85rem',
                                color: colors.text,
                                ...fontMono,
                                lineHeight: 1.5
                            }}
                        >
                            {evt}
                        </div>
                    );
                })}
            </div>
        </EfPanel>
    );
}

// ─── Tab: Growth ────────────────────────────────────────────────────────

function GrowthTab({ events, colors, fontMono, week }) {
    if (events.length === 0) {
        return (
            <EfPanel padding="lg" className="ef-anim-slide-down">
                <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: colors.textMuted,
                    ...fontMono,
                    fontSize: '0.85rem',
                    lineHeight: 1.8
                }}>
                    <Star size={48} color={colors.textMuted} style={{ marginBottom: '16px' }} />
                    <p style={{ margin: '0 0 8px 0', color: colors.text, fontSize: '0.95rem', fontWeight: 'bold' }}>
                        SEM EVOLUÇÕES NA SEMANA {week ?? '—'}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                        Eventos de crescimento (breakthrough, hot streak, peak season) aparecem
                        aqui quando ocorrem. Chance por semana:
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', textAlign: 'left', display: 'inline-block' }}>
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
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: colors.accent, ...fontMono }}>
                {events.length} EVOLUÇÃO{events.length > 1 ? 'ÕES' : ''} NA SEMANA {week ?? '—'}
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.8rem', color: colors.textMuted, ...fontMono, lineHeight: 1.6 }}>
                ⭐ youth_breakthrough · 🔥 hot_streak · 📈 peak_season · 💪 training_breakthrough · 🧬 heritage
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.map((evt, idx) => {
                    const isNegative = evt.includes('-') && !evt.includes('+');
                    const accent = isNegative ? colors.warning : colors.accent;
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '12px 14px',
                                backgroundColor: colors.panelElevated,
                                borderLeft: `4px solid ${accent}`,
                                fontSize: '0.85rem',
                                color: colors.text,
                                ...fontMono,
                                lineHeight: 1.5
                            }}
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
