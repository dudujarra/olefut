import { useState } from 'react';
import { FormationBoard } from './FormationBoard';
import { Tooltip } from './Tooltip';
import { Help } from './Help';
import { EfClubBadge, EfPanel, EfButton, EfModal } from './ui';
import bgLockerRoom from '../assets/environments/bg_locker_room.png';
import { Sword, MapPin, Trophy, ShieldChevron, Warning, GameController, Lightbulb } from '@phosphor-icons/react';
import { suggestTactic } from '../engine/TacticSuggester';

export function PreMatchScreen({ team, context, sectors, engine, onSaveLayout }) {
    const [showFormationModal, setShowFormationModal] = useState(false);

    if (!team) return null;
    const opp = context?.opponent;

    // SPEC-A3: forma WWLDD (últimos 5 do nosso time)
    const ourForm = (engine?.managerStats?.rollingForm || []).slice(-5);

    // SPEC-A3: sugestão tática auxiliar
    const suggestion = (sectors && context?.oppSectors)
        ? suggestTactic({ ourSectors: sectors, oppSectors: context.oppSectors, isHome: context?.isHome ?? true })
        : null;

    // Detect derby
    const isDerby = context?.opponent?.zone === team.zone && context?.opponent?.division === team.division &&
        ['Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
         'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'].includes(context?.opponent?.name) &&
        ['Flamengo', 'Fluminense', 'Vasco', 'Botafogo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
         'Grêmio', 'Internacional', 'Atlético-MG', 'Cruzeiro'].includes(team.name);

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
        danger: '#FF3333',
        derby: '#D62828'
    };

    return (
        <div style={{ width: '100%' }}>
            <EfPanel padding="lg" style={{ 
                border: isDerby ? `2px solid ${colors.derby}` : `1px solid ${colors.border}`,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {isDerby && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        padding: '6px',
                        backgroundColor: colors.derby,
                        color: '#FFF',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '0.1em',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Warning weight="fill" /> CLÁSSICO <Warning weight="fill" />
                    </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', marginTop: isDerby ? '24px' : '0' }}>
                    <GameController size={24} color={colors.secondary} />
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', color: colors.text }}>PRÉ-JOGO — INFORMAÇÕES DA PARTIDA</h3>
                </div>

                <div style={{
                    display:'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap:'24px',
                    alignItems:'start'
                }}>
                    {/* LEFT: Nosso time */}
                    <div style={{ backgroundColor: colors.panelElevated, padding: '16px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <EfClubBadge name={team.name} size="md" />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: colors.text, fontFamily: 'var(--font-sans)' }}>{team.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>MANDANTE</div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', backgroundColor: colors.bg, padding: '12px', border: `1px solid ${colors.border}` }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.warning, fontFamily: 'var(--font-mono)' }}>{sectors?.goalkeeper ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>GOL</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.secondary, fontFamily: 'var(--font-mono)' }}>{sectors?.defense ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>DEF</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.accent, fontFamily: 'var(--font-mono)' }}>{sectors?.midfield ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>MEI</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.danger, fontFamily: 'var(--font-mono)' }}>{sectors?.attack ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>ATA</div></div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>Formação Atual</span>
                            <strong style={{ color: colors.text, fontFamily: 'var(--font-mono)' }}>{team.formation || '4-3-3'}</strong>
                        </div>
                        
                        <EfButton variant="secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowFormationModal(true)}>
                            <ShieldChevron size={16} /> EDITAR POSIÇÕES
                        </EfButton>

                        {/* SPEC-A3: forma WWLDD */}
                        <div className="ef-prematch-form-row" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>FORMA</span>
                            {ourForm.length === 0 ? (
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>—</span>
                            ) : (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {ourForm.map((r, i) => {
                                        const isW = r === 'W';
                                        const isD = r === 'D';
                                        const bg = isW ? colors.accent : isD ? colors.warning : colors.danger;
                                        const label = isW ? 'V' : isD ? 'E' : 'D';
                                        return (
                                            <div key={i} style={{
                                                width: '20px', height: '20px',
                                                backgroundColor: bg, color: '#000',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 'bold'
                                            }} aria-label={`Resultado ${label}`}>
                                                {label}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CENTER: VS */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingTop: '24px' }}>
                        <div style={{ backgroundColor: colors.bg, padding: '16px', border: `2px solid ${colors.warning}`, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px' }}>
                            <Sword size={32} color={colors.warning} />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: colors.panelElevated, border: `1px solid ${context?.isHome ? colors.accent : colors.danger}`, color: context?.isHome ? colors.accent : colors.danger, fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <MapPin weight="fill" /> {context?.location || 'CASA'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>
                                SEMANA {context?.seasonWeek}/38
                            </div>
                        </div>

                        {/* SPEC-A3: sugestão tática do auxiliar */}
                        {suggestion && (
                            <div className="ef-prematch-suggestion" style={{
                                marginTop: '12px',
                                padding: '10px',
                                backgroundColor: colors.panelElevated,
                                border: `1px solid ${colors.secondary}`,
                                maxWidth: '220px',
                            }} role="note" aria-label="Sugestão do auxiliar">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <Lightbulb size={14} color={colors.secondary} weight="fill" />
                                    <span style={{ fontSize: '0.7rem', color: colors.secondary, fontFamily: 'var(--font-sans)', fontWeight: 'bold', letterSpacing: '0.05em' }}>AUXILIAR SUGERE</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: colors.text, fontFamily: 'var(--font-sans)', fontWeight: 'bold', marginBottom: '4px' }}>
                                    {suggestion.tactic}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>
                                    {suggestion.rationale}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Adversário */}
                    <div style={{ backgroundColor: colors.panelElevated, padding: '16px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            {opp?.name ? <EfClubBadge name={opp.name} size="md" /> : <div style={{ width: '48px', height: '48px', backgroundColor: colors.bg, }} />}
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: colors.text, fontFamily: 'var(--font-sans)' }}>{opp?.name || '—'}</h4>
                                <div style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-mono)' }}>VISITANTE</div>
                            </div>
                        </div>
                        
                        {opp && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', backgroundColor: colors.bg, padding: '12px', border: `1px solid ${colors.border}` }}>
                                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.warning, fontFamily: 'var(--font-mono)' }}>{context.oppSectors?.goalkeeper ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>GOL</div></div>
                                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.secondary, fontFamily: 'var(--font-mono)' }}>{context.oppSectors?.defense ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>DEF</div></div>
                                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.accent, fontFamily: 'var(--font-mono)' }}>{context.oppSectors?.midfield ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>MEI</div></div>
                                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: colors.danger, fontFamily: 'var(--font-mono)' }}>{context.oppSectors?.attack ?? '-'}</div><div style={{ fontSize: '0.7rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>ATA</div></div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>Formação Típica</span>
                                        <strong style={{ color: colors.text, fontFamily: 'var(--font-mono)' }}>{opp.formation || '4-3-3'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>Estilo de Jogo</span>
                                        <strong style={{ color: colors.secondary, fontFamily: 'var(--font-sans)' }}>{context.opponentStyle}</strong>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: colors.text, fontFamily: 'var(--font-sans)', backgroundColor: colors.bg, padding: '8px', border: `1px solid ${colors.border}` }}>
                                    <Trophy size={16} color={colors.warning} /> {context.tournament}
                                </div>
                                
                                {context.h2h && context.h2h.length > 0 && (
                                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontFamily: 'var(--font-sans)' }}>H2H Recente:</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {context.h2h.map((m, i) => {
                                                const ourGoals = m.home === team.id ? m.homeGoals : m.awayGoals;
                                                const theirGoals = m.home === team.id ? m.awayGoals : m.homeGoals;
                                                const result = ourGoals > theirGoals ? 'V' : ourGoals < theirGoals ? 'D' : 'E';
                                                const bg = result === 'V' ? colors.accent : result === 'D' ? colors.danger : colors.warning;
                                                return (
                                                    <div key={i} style={{
                                                        width: '24px', height: '24px', backgroundColor: bg,
                                                        color: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold'
                                                    }} title={`${ourGoals}x${theirGoals} — Sem ${m.week ?? '?'}`}>
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
