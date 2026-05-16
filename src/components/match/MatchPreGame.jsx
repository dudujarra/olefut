import { UserList, Strategy, CheckCircle, ListNumbers, ArrowsLeftRight, Warning, SkipForward, ArrowLeft, Megaphone, Shield, SoccerBall } from '@phosphor-icons/react';
import { getFormEmoji } from '../../engine/systems/FormSystem.js';
import { TACTICS, FORMATIONS, TEAM_TALKS } from '../../engine/ManagerSystems';
import { EfClubBadge } from '../ui';
import { PreMatchScreen } from '../PreMatchScreen';

export function MatchPreGame({
    team, engine, sectors, preStep, setPreStep, benchPlayers, setBenchPlayers,
    liveModalOpen, setLiveModalOpen, talkDone, setTalkDone, changeView, launchMatch,
    forceUpdate, getDashboardView, matchContext
}) {
    const titulares = team.squad.filter(p => p.isTitular && !p.injury);
    const lowEnergy = titulares.filter(p => p.energy < 40);
    const cond = engine.matchCondition;
    const tactic = TACTICS[engine.currentTactic];

    const getEnergyColor = (e) => {
        if (e < 40) return 'var(--color-danger)';
        if (e < 70) return 'var(--color-secondary)';
        return 'var(--color-primary)';
    };

    return (
        <div className="bg-abyss text-parchment font-body-sm min-h-screen pt-4 pb-24 px-4 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {matchContext && (
                    <PreMatchScreen
                        team={team}
                        context={matchContext}
                        sectors={sectors}
                        engine={engine}
                        onSaveLayout={() => forceUpdate()}
                    />
                )}

                {/* STEPS NAVIGATION */}
                <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4 flex justify-between items-center overflow-x-auto gap-4">
                    {[
                        { step: 1, label: 'ESCALAÇÃO', icon: <UserList aria-hidden="true" size={20} /> },
                        { step: 2, label: 'TÁTICA', icon: <Strategy aria-hidden="true" size={20} /> },
                        { step: 3, label: 'CONFIRMAÇÃO', icon: <CheckCircle aria-hidden="true" size={20} /> }
                    ].map(({ step, label, icon }) => {
                        const isActive = preStep === step;
                        const isDone = preStep > step;
                        return (
                            <div key={step} className={`flex items-center gap-2 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-30'}`}>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isActive ? 'bg-primary-container text-abyss border-primary-container glow-primary' : isDone ? 'bg-forest text-primary-container border-primary-container' : 'bg-abyss text-smoke border-smoke'}`}>
                                    {isDone ? <CheckCircle aria-hidden="true" weight="fill" /> : icon}
                                </div>
                                <span className={`font-label-caps ${isActive ? 'text-primary-container' : 'text-smoke'}`}>{label}</span>
                            </div>
                        );
                    })}
                </div>

                {preStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <ListNumbers aria-hidden="true" size={24} className="text-secondary-container" />
                                <h3 className="font-label-caps text-secondary-container">SETORES DO PLANTEL</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-parchment">{sectors.goalkeeper}</div><div className="font-label-caps text-xs text-smoke">GOL</div></div>
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-info">{sectors.defense}</div><div className="font-label-caps text-xs text-smoke">DEF</div></div>
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-primary-container">{sectors.midfield}</div><div className="font-label-caps text-xs text-smoke">MEI</div></div>
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-danger-red">{sectors.attack}</div><div className="font-label-caps text-xs text-smoke">ATA</div></div>
                            </div>
                        </div>

                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex justify-between items-center border-b-2 border-outline-variant pb-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <UserList aria-hidden="true" size={24} className="text-info" />
                                    <h3 className="font-label-caps text-info">TITULARES ({titulares.length})</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" className="bg-surface-container-high border border-outline-variant text-xs px-2 py-1 min-h-[44px] font-label-caps flex items-center gap-1 hover:bg-outline-variant transition-colors duration-200 ease-out cursor-pointer" onClick={() => {
                                        const res = engine.autoPickSquad();
                                        if (res.success) setBenchPlayers(res.bench);
                                    }}>
                                        <Strategy aria-hidden="true" size={16} /> AUTO
                                    </button>
                                    <button type="button" className="bg-primary-container text-abyss border border-primary-container text-xs px-2 py-1 min-h-[44px] font-label-caps flex items-center gap-1 hover:brightness-110 transition duration-200 ease-out cursor-pointer" onClick={() => setLiveModalOpen(true)}>
                                        <ArrowsLeftRight aria-hidden="true" size={16} /> SUBSTITUIR
                                    </button>
                                </div>
                            </div>
                            
                            {lowEnergy.length > 0 && (
                                <div className="bg-danger-red/20 border border-danger-red text-danger-red p-2 mb-4 text-xs font-label-caps flex items-center gap-1">
                                    <Warning aria-hidden="true" /> {lowEnergy.length} COM ENERGIA BAIXA
                                </div>
                            )}
                            
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {titulares.map(p => (
                                    <div key={p.id} className={`flex justify-between items-center p-2 border border-outline-variant ${p.energy < 40 ? 'bg-danger-red/10 border-danger-red/50' : 'bg-abyss'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 text-center font-label-caps text-xs text-smoke bg-surface-container-high py-1">{p.position}</div>
                                            <div className="font-sans text-sm">
                                                {p.name} {p._isCaptain && '[C]'} {getFormEmoji(p.form?.trend)}
                                            </div>
                                        </div>
                                        <div className="text-right tabular-nums">
                                            <div className="font-data-mono text-primary-container">{p.ovr} OVR</div>
                                            <div className="font-data-mono text-[10px]" style={{ color: getEnergyColor(p.energy) }}>COND: {p.energy}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* === BANCO DE RESERVAS === */}
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <ArrowsLeftRight aria-hidden="true" size={24} className="text-secondary-container" />
                                <h3 className="font-label-caps text-secondary-container">BANCO DE RESERVAS ({benchPlayers.length}/5)</h3>
                            </div>

                            {(() => {
                                const benchList = benchPlayers.map(id => team.squad.find(p => p.id === id)).filter(Boolean);
                                const availableForBench = team.squad.filter(p => !p.isTitular && !p.injury && !p.suspension && !benchPlayers.includes(p.id)).sort((a, b) => b.ovr - a.ovr);

                                return (
                                    <>
                                        {benchList.length > 0 && (
                                            <div className="space-y-2 mb-4">
                                                {benchList.map(p => (
                                                    <div key={p.id} className="flex justify-between items-center p-2 bg-abyss border border-outline-variant">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 text-center font-label-caps text-xs text-smoke bg-surface-container-high py-1">{p.position}</div>
                                                            <div>
                                                                <div className="font-sans text-sm">{p.name} {p._isCaptain && '[C]'} {getFormEmoji(p.form?.trend)}</div>
                                                                <div className="font-data-mono text-[10px] text-smoke">
                                                                    OVR: <span className="text-parchment">{p.ovr}</span> | <span style={{ color: getEnergyColor(p.energy) }}>COND: {p.energy}%</span> | MORAL: {p.moral || 50}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button type="button" className="bg-surface-container-high border border-outline-variant text-[10px] px-2 py-1 font-label-caps hover:bg-danger-red/20 hover:text-danger-red hover:border-danger-red" onClick={() => setBenchPlayers(prev => prev.filter(id => id !== p.id))}>
                                                            X REMOVER
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {benchPlayers.length < 5 && availableForBench.length > 0 && (
                                            <>
                                                <div className="font-label-caps text-xs text-smoke mb-2">ADICIONAR AO BANCO:</div>
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                                    {availableForBench.slice(0, 10).map(p => (
                                                        <div key={p.id} className="flex justify-between items-center p-2 bg-abyss/50 border border-outline-variant opacity-70 hover:opacity-100 transition-opacity">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 text-center font-label-caps text-xs text-smoke bg-surface-container-high py-1">{p.position}</div>
                                                                <div>
                                                                    <div className="font-sans text-sm">{p.name} {getFormEmoji(p.form?.trend)}</div>
                                                                    <div className="font-data-mono text-[10px] text-smoke">
                                                                        OVR: <span className="text-parchment">{p.ovr}</span> | <span style={{ color: getEnergyColor(p.energy) }}>COND: {p.energy}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button type="button" className="bg-primary-container text-abyss border border-primary-container text-[10px] px-2 py-1 font-label-caps hover:brightness-110" onClick={() => setBenchPlayers(prev => [...prev, p.id])}>
                                                                + BANCO
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {benchList.length === 0 && (
                                            <div className="bg-abyss p-4 text-center font-label-caps text-smoke border border-outline-variant">
                                                Nenhum jogador selecionado para o banco.
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="flex gap-4">
                            <button type="button" className="flex-1 bg-surface-container-high border-2 border-outline-variant p-3 min-h-[44px] flex items-center justify-center gap-2 font-label-caps hover:bg-outline-variant transition-colors duration-200 ease-out cursor-pointer" onClick={() => changeView(getDashboardView())}>
                                <ArrowLeft aria-hidden="true" size={16} /> VOLTAR
                            </button>
                            <button type="button" className="flex-1 bg-primary-container text-abyss border-2 border-on-primary p-3 min-h-[44px] flex items-center justify-center gap-2 font-label-caps hover:brightness-110 transition duration-200 ease-out cursor-pointer" onClick={() => setPreStep(2)}>
                                PRÓXIMO: TÁTICA <SkipForward aria-hidden="true" size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {preStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <Strategy aria-hidden="true" size={24} className="text-info" />
                                <h3 className="font-label-caps text-info">FORMAÇÃO</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-6">
                                {Object.keys(FORMATIONS).map(f => (
                                    <button type="button" key={f} 
                                        className={`p-2 min-h-[44px] font-label-caps text-sm border-2 pixel-bevel transition duration-200 ease-out active:translate-y-1 active:shadow-none cursor-pointer ${team.formation === f ? 'bg-info text-abyss border-info glow-info' : 'bg-surface-container-high border-outline-variant hover:bg-outline-variant text-smoke'}`}
                                        onClick={() => { engine.setFormation(f); forceUpdate(); }}>{f}</button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <Shield aria-hidden="true" size={24} className="text-primary-container" />
                                <h3 className="font-label-caps text-primary-container">ESTILO TÁTICO</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {Object.entries(TACTICS).map(([k, v]) => (
                                    <button type="button" key={k} 
                                        className={`p-2 min-h-[44px] font-label-caps text-xs border-2 pixel-bevel transition duration-200 ease-out active:translate-y-1 active:shadow-none cursor-pointer ${engine.currentTactic === k ? 'bg-primary-container text-abyss border-on-primary glow-primary' : 'bg-surface-container-high border-outline-variant hover:bg-outline-variant text-smoke'}`}
                                        onClick={() => { engine.setTactic(k); forceUpdate(); }}>{v.name}</button>
                                ))}
                            </div>
                            <p className="text-smoke text-sm font-sans bg-abyss p-3 border border-outline-variant">
                                {TACTICS[engine.currentTactic]?.description}
                            </p>
                        </div>

                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <Megaphone aria-hidden="true" size={24} className="text-secondary-container" />
                                <h3 className="font-label-caps text-secondary-container">PRELEÇÃO</h3>
                            </div>
                            {talkDone ? (
                                <div className="bg-primary-container/20 border border-primary-container text-primary-container p-4 text-center font-label-caps flex items-center justify-center gap-2">
                                    <CheckCircle aria-hidden="true" size={24} /> PRELEÇÃO REALIZADA COM SUCESSO!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {TEAM_TALKS.map(t => (
                                        <button type="button" key={t.id} className="bg-surface-container-high border-2 border-outline-variant p-2 min-h-[44px] font-label-caps text-xs hover:bg-outline-variant transition-colors duration-200 ease-out cursor-pointer text-left flex items-center justify-between group" onClick={() => { engine.doTeamTalk(t.id); setTalkDone(true); forceUpdate(); }}>
                                            <span>{t.name}</span>
                                            <Megaphone aria-hidden="true" size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary-container" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button type="button" className="flex-1 bg-surface-container-high border-2 border-outline-variant p-3 min-h-[44px] flex items-center justify-center gap-2 font-label-caps hover:bg-outline-variant transition-colors duration-200 ease-out cursor-pointer" onClick={() => setPreStep(1)}>
                                <ArrowLeft aria-hidden="true" size={16} /> VOLTAR: ESCALAÇÃO
                            </button>
                            <button type="button" className="flex-1 bg-primary-container text-abyss border-2 border-on-primary p-3 min-h-[44px] flex items-center justify-center gap-2 font-label-caps hover:brightness-110 transition duration-200 ease-out cursor-pointer" onClick={() => setPreStep(3)}>
                                PRÓXIMO: CONFIRMAR <CheckCircle aria-hidden="true" size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {preStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-6 text-center">
                            <EfClubBadge name={team.name} size="xl" className="mx-auto mb-4" />
                            <h2 className="font-headline-lg text-parchment mb-2">{team.name}</h2>
                            <div className="flex justify-center gap-4 font-label-caps mb-6 text-sm">
                                <span className="text-primary-container border border-primary-container/30 bg-primary-container/10 px-2 py-1">{team.formation}</span>
                                <span className="text-info border border-info/30 bg-info/10 px-2 py-1">{tactic?.name}</span>
                            </div>

                            {cond && <div className="text-danger-red font-label-caps text-xs mb-6 bg-danger-red/10 border border-danger-red p-2 inline-block">CONDIÇÃO: {cond.name}</div>}

                            <div className="grid grid-cols-4 gap-2 mb-6">
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-parchment">{sectors.goalkeeper}</div><div className="font-label-caps text-xs text-smoke">GOL</div></div>
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-info">{sectors.defense}</div><div className="font-label-caps text-xs text-smoke">DEF</div></div>
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-primary-container">{sectors.midfield}</div><div className="font-label-caps text-xs text-smoke">MEI</div></div>
                                <div className="bg-abyss p-2 border border-outline-variant"><div className="font-display-md text-danger-red">{sectors.attack}</div><div className="font-label-caps text-xs text-smoke">ATA</div></div>
                            </div>

                            <div className={`p-3 font-label-caps text-sm flex items-center justify-center gap-2 border ${talkDone ? 'bg-primary-container/20 border-primary-container text-primary-container' : 'bg-danger-red/20 border-danger-red text-danger-red'}`}>
                                {talkDone ? <><CheckCircle aria-hidden="true" size={20} /> PRELEÇÃO CONFIRMADA</> : <><Warning aria-hidden="true" size={20} /> ATENÇÃO: SEM PRELEÇÃO REALIZADA</>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button type="button" className="w-full bg-primary-container text-abyss border-2 border-on-primary p-6 min-h-[64px] flex items-center justify-center gap-3 pixel-bevel hover:brightness-110 transition duration-200 ease-out active:translate-y-2 active:shadow-none cursor-pointer" onClick={launchMatch}>
                                <SoccerBall aria-hidden="true" size={32} weight="fill" className="animate-spin-slow" /> <span className="font-headline-lg">INICIAR PARTIDA</span>
                            </button>
                            <div className="flex gap-4">
                                <button type="button" className="flex-1 bg-surface-container-high border-2 border-outline-variant p-3 min-h-[44px] flex items-center justify-center gap-2 font-label-caps hover:bg-outline-variant transition-colors duration-200 ease-out cursor-pointer" onClick={() => setPreStep(2)}>
                                    <ArrowLeft aria-hidden="true" size={16} /> VOLTAR: TÁTICA
                                </button>
                                <button type="button" className="flex-1 bg-surface-container-high border-2 border-outline-variant p-3 min-h-[44px] flex items-center justify-center gap-2 font-label-caps text-danger-red hover:bg-danger-red/20 hover:border-danger-red transition-colors duration-200 ease-out cursor-pointer" onClick={() => changeView(getDashboardView())}>
                                    CANCELAR E VOLTAR
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
