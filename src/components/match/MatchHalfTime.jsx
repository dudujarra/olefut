import { Pause, Strategy, ArrowsLeftRight, CheckCircle, Play } from '@phosphor-icons/react';
import { EfClubBadge } from '../ui';
import { getFormEmoji } from '../../engine/systems/FormSystem.js';
import { TACTICS } from '../../engine/ManagerSystems';

export function MatchHalfTime({
    team, engine, result, halfTimeData, benchPlayers, liveSubsCount,
    setLiveSubsCount, subUsed, setSubUsed, tacticChanged, setTacticChanged,
    firstHalfResult, setNarration, setResult, setMatchStats, setPhase,
    startLiveTicker, matchIdsRef, forceUpdate, getEnergyColor
}) {
    const titulares = team.squad.filter(p => p.isTitular && !p.injury);
    const subs = benchPlayers.length > 0
        ? benchPlayers.map(id => team.squad.find(p => p.id === id)).filter(p => p && !p.isTitular && !p.injury && !p.suspension)
        : team.squad.filter(p => !p.isTitular && !p.injury && !p.suspension).slice(0, 5);

    return (
        <div className="bg-abyss text-parchment font-body-sm selection:bg-primary-container selection:text-abyss min-h-screen pt-4 pb-24 px-4 space-y-6">
            <div className="flex flex-col gap-6 max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-6 text-center">
                    <Pause aria-hidden="true" size={48} weight="fill" className="text-primary-container mx-auto mb-4" />
                    <h2 className="font-headline-lg text-primary-container mb-6">INTERVALO</h2>
                    
                    <div className="flex justify-between items-center max-w-lg mx-auto bg-abyss p-4 pixel-bevel-inset relative overflow-hidden">
                        <div className="scanline absolute inset-0 opacity-20 pointer-events-none"></div>
                        <div className="flex flex-col items-center gap-2 w-1/3 relative z-10">
                            <EfClubBadge name={result?.home} size="lg" />
                            <span className="font-label-caps text-center">{result?.home}</span>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <span className="font-display-lg text-primary-container glow-primary">{halfTimeData?.homeGoals ?? 0}</span>
                            <span className="font-headline-md text-smoke">-</span>
                            <span className="font-display-lg text-primary-container glow-primary">{halfTimeData?.awayGoals ?? 0}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/3 relative z-10">
                            <EfClubBadge name={result?.away} size="lg" />
                            <span className="font-label-caps text-center">{result?.away}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {!tacticChanged && (
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <Strategy aria-hidden="true" size={24} className="text-primary-container" />
                                <h3 className="font-label-caps text-primary-container">AJUSTE TÁTICO</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(TACTICS).map(([k, v]) => (
                                    <button type="button" key={k} 
                                        className={`p-2 font-label-caps text-xs border-2 pixel-bevel transition active:translate-y-1 active:shadow-none cursor-pointer ${engine.currentTactic === k ? 'bg-primary-container text-abyss border-on-primary' : 'bg-surface-container-high border-outline-variant hover:bg-outline-variant'}`}
                                        onClick={() => { engine.setTactic(k); setTacticChanged(true); forceUpdate(); }}>
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {liveSubsCount < 3 && subs.length > 0 && (
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <ArrowsLeftRight aria-hidden="true" size={24} className="text-secondary-container" />
                                <h3 className="font-label-caps text-secondary-container">SUBSTITUIÇÃO ({liveSubsCount}/3)</h3>
                            </div>

                            {!subUsed ? (
                                <>
                                    <div className="font-label-caps text-xs text-smoke mb-2">SELECIONE QUEM SAI:</div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {titulares.map(p => (
                                            <button type="button" key={p.id} className="w-full text-left p-2 bg-abyss border border-outline-variant cursor-pointer hover:bg-outline-variant transition-colors" onClick={() => setSubUsed(p)}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-label-caps"><strong>{p.position}</strong> {p.name} {p._isCaptain && '[C]'} {getFormEmoji(p.form?.trend)}</span>
                                                    <span className="font-data-mono text-primary-container">{p.ovr} OVR</span>
                                                </div>
                                                <div className="font-data-mono text-[10px] text-smoke">
                                                    <span style={{ color: getEnergyColor(p.energy) }}>COND: {p.energy}%</span> | MORAL: {p.moral || 50}%
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : typeof subUsed === 'object' ? (
                                <>
                                    <div className="flex justify-between items-center bg-abyss p-2 mb-4 border border-outline-variant">
                                        <span className="font-label-caps text-xs"><span className="text-smoke">SAINDO:</span> {subUsed.name} ({subUsed.position})</span>
                                        <button type="button" className="text-[10px] bg-danger-red text-parchment px-2 py-1 pixel-bevel cursor-pointer" onClick={() => setSubUsed(false)}>CANCELAR</button>
                                    </div>
                                    <div className="font-label-caps text-xs text-smoke mb-2">SELECIONE QUEM ENTRA:</div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {subs.map(p => (
                                            <div key={p.id} className="p-2 bg-abyss border border-outline-variant flex justify-between items-center">
                                                <div>
                                                    <div className="font-label-caps mb-1"><strong>{p.position}</strong> {p.name} {getFormEmoji(p.form?.trend)}</div>
                                                    <div className="font-data-mono text-[10px] text-smoke">
                                                        <span className="text-primary-container">{p.ovr} OVR</span> | <span style={{ color: getEnergyColor(p.energy) }}>COND: {p.energy}%</span>
                                                    </div>
                                                </div>
                                                <button type="button" className="bg-primary-container text-abyss px-3 py-1 font-label-caps text-[10px] pixel-bevel hover:brightness-110 flex items-center gap-1 cursor-pointer" onClick={() => {
                                                    subUsed.isTitular = false;
                                                    p.isTitular = true;
                                                    p.energy = Math.min(100, p.energy + 15);
                                                    setLiveSubsCount(c => c + 1);
                                                    setSubUsed(true); // true = done, shows completed state
                                                    forceUpdate();
                                                }}>
                                                    <ArrowsLeftRight aria-hidden="true" size={12} /> ENTRAR
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-abyss p-4 text-center border border-outline-variant">
                                    <CheckCircle aria-hidden="true" size={24} className="text-primary-container mx-auto mb-2" />
                                    <span className="font-label-caps text-sm text-smoke">Substituição realizada.</span>
                                    {liveSubsCount < 3 && (
                                        <button type="button" className="block mx-auto mt-4 text-[10px] bg-surface-container-high border-2 border-outline-variant px-3 py-1 pixel-bevel hover:bg-outline-variant transition-colors cursor-pointer" onClick={() => setSubUsed(false)}>
                                            MAIS UMA SUBSTITUIÇÃO
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button type="button" className="w-full bg-primary-container text-abyss border-2 border-on-primary p-4 min-h-[64px] flex items-center justify-center gap-2 pixel-bevel hover:brightness-110 transition duration-200 ease-out active:translate-y-1 active:shadow-none cursor-pointer" onClick={() => {
                    // SPLIT-SIM PHASE 2: Re-simulate second half with CURRENT squad/tactics
                    const ids = matchIdsRef.current;
                    if (ids && firstHalfResult) {
                        const secondHalf = engine.playMatchSecondHalf(ids.homeId, ids.awayId, firstHalfResult, ids.isCup);
                        const isHome = ids.homeId === team.id;

                        // Combine first + second half narration
                        // For the narration, we need the stored events from first half
                        const firstHalfEvents = result?._baseSimResult?.events?.textLog || [];
                        const secondHalfEvents = (secondHalf.events?.textLog || []).filter(e => e && e.minute > 45);
                        const allEvents = [...firstHalfEvents, ...secondHalfEvents];
                        setNarration(allEvents);

                        // Update final score
                        setResult(prev => ({
                            ...prev,
                            homeGoals: isHome ? secondHalf.homeGoals : secondHalf.awayGoals,
                            awayGoals: isHome ? secondHalf.awayGoals : secondHalf.homeGoals,
                            _baseSimResult: secondHalf,
                        }));

                        // Update match stats
                        const totalChances = allEvents.filter(e => e?.text?.includes('⚽') || e?.text?.includes('Defesa') || e?.text?.includes('salva')).length;
                        const goals = allEvents.filter(e => e?.text?.includes('⚽')).length;
                        setMatchStats({ totalChances, goals, injuries: (engine.weekInjuries?.length ?? 0) });

                        // DON'T advanceWeek here — wait for fulltime to allow live subs
                        setPhase('secondhalf');
                        setTimeout(() => startLiveTicker(allEvents, 46, 90, null), 300);
                    } else {
                        // Fallback
                        setPhase('secondhalf');
                        setTimeout(() => startLiveTicker(result?._baseSimResult?.events?.textLog || [], 46, 90, null), 300);
                    }
                }}>
                    <Play aria-hidden="true" size={24} weight="fill" /> <span className="font-headline-md">INICIAR 2º TEMPO</span>
                </button>
            </div>
            
            {/* Decorative CRT Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] scanline opacity-10"></div>
            <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
        </div>
    );
}
