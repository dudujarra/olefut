import { useRef, useEffect } from 'react';
import { SoccerBall, ArrowsLeftRight, FirstAid, Play, Pause, FastForward, Strategy, CheckCircle } from '@phosphor-icons/react';
import { MatchScoreboard } from './MatchScoreboard';
import MatchHighlightVideo from '../MatchHighlightVideo';
import { LiveSquadEditModal } from '../LiveSquadEditModal';
import MidMatchCardModal from '../MidMatchCardModal';
import StarImpactToast from '../StarImpactToast';

export function MatchLive({
    team, engine, result, half, currentMinute, isPlaying, displayedEvents,
    paused, setPaused, pausedRef, speed, setSpeed, skipToEnd, narration,
    liveModalOpen, setLiveModalOpen, liveSubsCount, MAX_SUBS,
    benchPlayers, setPhase,
    handleLiveIntervention, handleMidMatchChoice, activeMidMatchCard, setActiveMidMatchCard,
    starImpacts, matchIdsRef, firstHalfResult, getDisplayScore
}) {
    const logRef = useRef(null);

    // Auto-scroll narration log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [displayedEvents]);

    const runningScore = getDisplayScore();

    return (
        <div className="bg-abyss text-parchment font-body-sm selection:bg-primary-container selection:text-abyss min-h-screen pt-4 pb-24 px-4 space-y-6">
            <MatchScoreboard 
                result={result} 
                currentMinute={currentMinute} 
                isPlaying={isPlaying} 
                half={half} 
                runningScore={runningScore} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <section className="md:col-span-2">
                    <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant relative overflow-hidden h-[400px]">
                        <div className="absolute inset-0 p-4">
                            <div className="w-full h-full border-2 border-primary-container/30 relative flex items-center justify-center bg-pitch-green">
                                {/* Pitch Markings */}
                                <div className="absolute inset-x-0 top-0 h-1/4 border-b-2 border-primary-container/30"></div>
                                <div className="absolute inset-x-0 bottom-0 h-1/4 border-t-2 border-primary-container/30"></div>
                                <div className="absolute h-full w-0 border-l-2 border-primary-container/30 left-1/2"></div>
                                <div className="absolute w-20 h-20 border-2 border-primary-container/30 rounded-full"></div>
                                
                                {/* Match Highlight Video overlay */}
                                {displayedEvents.length > 0 && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                                        <MatchHighlightVideo 
                                            event={displayedEvents[displayedEvents.length - 1]} 
                                            isHomeAttacking={true} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute top-6 left-6 px-3 py-1 bg-abyss/80 backdrop-blur-sm border-2 border-outline-variant font-label-caps text-label-caps z-20">
                            MINIMALIST FIELD v1.0
                        </div>
                    </div>
                </section>

                <section className="md:col-span-1 flex flex-col gap-4">
                    <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant flex-1 min-h-[300px] flex flex-col">
                        <div className="bg-surface-container-high px-4 py-2 border-b-2 border-outline-variant">
                            <h3 className="font-label-caps text-label-caps text-primary-container">MATCH LOG</h3>
                        </div>
                        <div className="p-4 space-y-4 flex-1 overflow-y-auto" ref={logRef}>
                            {displayedEvents.map((n, i) => {
                                const isGoal = n?.text?.includes('⚽');
                                const isCard = n?.text?.includes('🟨') || n?.text?.includes('🟥');
                                const isRed = n?.text?.includes('🟥');
                                const isSub = n?.text?.includes('🔄');
                                const isInjury = n?.text?.includes('🤕');

                                return (
                                    <div key={i} className={`flex items-center gap-4 p-2 bg-abyss/50 border-b border-forest-dark relative overflow-hidden group hover:bg-forest-dark transition-colors`}>
                                        <div className="scanline absolute inset-0 opacity-5"></div>
                                        <div className={`p-2 border ${isGoal ? 'bg-trophy-gold/20 border-trophy-gold' : isRed ? 'bg-danger-red/20 border-danger-red' : isCard ? 'bg-secondary-container/20 border-secondary-container' : 'bg-primary-container/10 border-primary-container/30'}`}>
                                            {isGoal && <SoccerBall aria-hidden="true" weight="fill" className="text-trophy-gold" size={16} />}
                                            {isRed && <div className="w-4 h-6 bg-danger-red shadow-[0_0_8px_rgba(255,51,51,0.5)]"></div>}
                                            {(!isRed && isCard) && <div className="w-4 h-6 bg-secondary-container shadow-[0_0_8px_rgba(255,219,60,0.5)]"></div>}
                                            {isSub && <ArrowsLeftRight aria-hidden="true" className="text-primary-container" size={16} />}
                                            {isInjury && <FirstAid aria-hidden="true" weight="fill" className="text-danger-red" size={16} />}
                                            {(!isGoal && !isCard && !isSub && !isInjury) && <div className="w-4 h-4 rounded-full bg-primary-container/50"></div>}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-data-mono text-sm text-parchment">{n?.text}</span>
                                            <span className="font-label-caps text-[10px] text-smoke">{n?.minute}'</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button type="button"
                    onClick={() => { const next = !paused; setPaused(next); pausedRef.current = next; if (next) setLiveModalOpen(true); }}
                    className="bg-forest-dark border-2 border-outline-variant p-4 min-h-[64px] flex flex-col items-center justify-center gap-2 pixel-bevel hover:bg-primary-container group transition duration-200 ease-out active:translate-y-1 active:shadow-none cursor-pointer">
                    <ArrowsLeftRight aria-hidden="true" className="text-primary-container group-hover:text-abyss" size={24} weight="fill" />
                    <span className="font-label-caps text-[10px] group-hover:text-abyss">SUBSTITUIR</span>
                    <span className="font-data-mono text-[10px] text-smoke group-hover:text-abyss/70 tabular-nums">{liveSubsCount}/{MAX_SUBS}</span>
                </button>
                <button type="button"
                    onClick={() => { const next = !paused; setPaused(next); pausedRef.current = next; if (next) setLiveModalOpen(true); }}
                    className="bg-forest-dark border-2 border-outline-variant p-4 min-h-[64px] flex flex-col items-center justify-center gap-2 pixel-bevel hover:bg-primary-container group transition duration-200 ease-out active:translate-y-1 active:shadow-none cursor-pointer">
                    <Strategy aria-hidden="true" className="text-primary-container group-hover:text-abyss" size={24} weight="fill" />
                    <span className="font-label-caps text-[10px] group-hover:text-abyss">TÁTICA</span>
                </button>
                <button type="button"
                    onClick={() => { const next = !paused; setPaused(next); pausedRef.current = next; }}
                    className="bg-forest-dark border-2 border-outline-variant p-4 min-h-[64px] flex flex-col items-center justify-center gap-2 pixel-bevel hover:bg-danger-red group transition duration-200 ease-out active:translate-y-1 active:shadow-none cursor-pointer">
                    {paused ? <Play aria-hidden="true" className="text-danger-red group-hover:text-abyss" size={24} weight="fill" /> : <Pause aria-hidden="true" className="text-danger-red group-hover:text-abyss" size={24} weight="fill" />}
                    <span className="font-label-caps text-[10px] group-hover:text-abyss">{paused ? 'RETOMAR' : 'PAUSAR'}</span>
                </button>
                <div className="flex flex-col gap-2">
                    <div className="bg-forest-dark border-2 border-outline-variant p-2 flex justify-around items-center pixel-bevel">
                        <button type="button" className={`p-1 cursor-pointer ${!paused && speed === 400 ? 'text-primary-container border-b-2 border-primary-container' : 'text-smoke hover:text-parchment'}`} onClick={() => { setSpeed(400); setPaused(false); pausedRef.current = false; }}>
                            <span className="font-label-caps text-xs">1x</span>
                        </button>
                        <button type="button" className={`p-1 cursor-pointer ${!paused && speed === 200 ? 'text-primary-container border-b-2 border-primary-container' : 'text-smoke hover:text-parchment'}`} onClick={() => { setSpeed(200); setPaused(false); pausedRef.current = false; }}>
                            <span className="font-label-caps text-xs">2x</span>
                        </button>
                        <button type="button" className={`p-1 cursor-pointer ${!paused && speed === 80 ? 'text-primary-container border-b-2 border-primary-container' : 'text-smoke hover:text-parchment'}`} onClick={() => { setSpeed(80); setPaused(false); pausedRef.current = false; }}>
                            <span className="font-label-caps text-xs">5x</span>
                        </button>
                    </div>
                    <button type="button"
                        onClick={() => skipToEnd(narration, half === '1º TEMPO' ? 45 : 90, null)}
                        className="bg-forest-dark border-2 border-outline-variant p-2 min-h-[44px] flex items-center justify-center gap-2 pixel-bevel hover:bg-primary-container group transition duration-200 ease-out active:translate-y-1 active:shadow-none flex-1 cursor-pointer">
                        <FastForward aria-hidden="true" className="text-primary-container group-hover:text-abyss" size={16} weight="fill" />
                        <span className="font-label-caps text-[10px] group-hover:text-abyss">PULAR PARA O FIM</span>
                    </button>
                </div>
            </section>

            <div className="flex justify-center mt-4 pb-8">
                {half === '1º TEMPO' ? (
                    <button type="button" disabled={isPlaying} onClick={() => setPhase('halftime')} className="bg-primary-container text-abyss border-2 border-on-primary p-4 px-8 min-h-[64px] flex items-center justify-center gap-2 pixel-bevel hover:brightness-110 transition duration-200 ease-out active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        <Pause aria-hidden="true" weight="fill" size={20} /> <span className="font-headline-md">INTERVALO</span>
                    </button>
                ) : (
                    <button type="button" disabled={isPlaying} onClick={() => {
                        if (matchIdsRef.current && result?._baseSimResult) {
                            engine.resolveHumanMatch(result._baseSimResult);
                            engine.advanceWeek();
                        }
                        setPhase('fulltime');
                    }} className="bg-primary-container text-abyss border-2 border-on-primary p-4 px-8 min-h-[64px] flex items-center justify-center gap-2 pixel-bevel hover:brightness-110 transition duration-200 ease-out active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        <CheckCircle aria-hidden="true" weight="fill" size={20} /> <span className="font-headline-md">FIM DE JOGO</span>
                    </button>
                )}
            </div>

            {liveModalOpen && (
                <LiveSquadEditModal
                    team={team}
                    engine={engine}
                    currentMinute={currentMinute}
                    liveSubsCount={liveSubsCount}
                    maxSubs={MAX_SUBS}
                    benchPlayerIds={benchPlayers}
                    onSubMade={() => handleLiveIntervention(true)}
                    onTacticChanged={() => handleLiveIntervention(false)}
                    onClose={() => { setLiveModalOpen(false); setPaused(false); pausedRef.current = false; }}
                />
            )}

            {activeMidMatchCard && (
                <MidMatchCardModal
                    card={activeMidMatchCard}
                    onChoose={handleMidMatchChoice}
                    onClose={() => {
                        setActiveMidMatchCard(null);
                        setPaused(false);
                        pausedRef.current = false;
                    }}
                />
            )}

            <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {starImpacts.map(entry => (
                    <StarImpactToast
                        key={entry.id}
                        impact={entry.impact}
                    />
                ))}
            </div>

            {/* Decorative CRT Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] scanline opacity-10"></div>
            <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
        </div>
    );
}
