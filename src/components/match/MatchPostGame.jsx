import { CheckCircle, ChartBar, SoccerBall, Cardholder, FirstAid, MicrophoneStage, Shield } from '@phosphor-icons/react';
import { EfClubBadge, EfBanner } from '../ui';
import { TACTICS } from '../../engine/ManagerSystems';

export function MatchPostGame({
    result, narration, matchStats, engine, changeView, setPhase, setResult,
    setNarration, setDisplayedEvents, setCurrentMinute, setSubUsed,
    setTacticChanged, setPreStep, setTalkDone, banner, setBanner, getDashboardView
}) {
    const lastMatchScorers = narration.filter(n => n && n.text?.includes('⚽'));
    const lastMatchCards = narration.filter(n => n && (n.text?.includes('🟨') || n.text?.includes('🟥')));
    const motmEntry = narration.find(n => n?.text?.includes('⭐ Craque'));

    const resetMatchState = (view) => {
        setPhase('prematch');
        setResult(null);
        setNarration([]);
        setDisplayedEvents([]);
        setCurrentMinute(0);
        setSubUsed(false);
        setTacticChanged(false);
        setPreStep(1);
        setTalkDone(false);
        changeView(view);
    };

    return (
        <div className="bg-abyss text-parchment font-body-sm selection:bg-primary-container selection:text-abyss min-h-screen pt-4 pb-24 px-4 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                {banner && <EfBanner type={banner} onDismiss={() => setBanner(null)} />}

                <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-6 text-center relative overflow-hidden">
                    <div className="scanline absolute inset-0 opacity-20 pointer-events-none"></div>
                    <CheckCircle aria-hidden="true" size={48} weight="fill" className="text-primary-container mx-auto mb-4 relative z-10" />
                    <h2 className="font-headline-lg text-primary-container mb-6 relative z-10">FIM DE JOGO</h2>
                    
                    <div className="flex justify-between items-center max-w-lg mx-auto bg-abyss p-4 pixel-bevel-inset relative z-10">
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <EfClubBadge name={result?.home} size="xl" />
                            <span className="font-label-caps text-center">{result?.home}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-display-lg text-primary-container glow-primary">{result?.homeGoals}</span>
                            <span className="font-headline-md text-smoke">-</span>
                            <span className="font-display-lg text-primary-container glow-primary">{result?.awayGoals}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <EfClubBadge name={result?.away} size="xl" />
                            <span className="font-label-caps text-center">{result?.away}</span>
                        </div>
                    </div>

                    {motmEntry && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-trophy-gold/20 border border-trophy-gold px-4 py-2 relative z-10">
                            <ChartBar aria-hidden="true" size={20} weight="fill" className="text-trophy-gold" />
                            <span className="font-label-caps text-trophy-gold">{motmEntry.text}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                        <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                            <SoccerBall aria-hidden="true" size={24} className="text-parchment" />
                            <h3 className="font-label-caps text-parchment">GOLS & EVENTOS</h3>
                        </div>
                        {lastMatchScorers.length > 0 ? (
                            <div className="space-y-2">
                                {lastMatchScorers.map((s, i) => (
                                    <div key={i} className="flex gap-4 p-2 bg-abyss border border-outline-variant items-center hover:bg-outline-variant transition-colors cursor-default">
                                        <div className="font-data-mono text-primary-container">{s.minute}'</div>
                                        <div className="font-label-caps text-sm">{s.text}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-abyss p-4 text-center font-label-caps text-smoke border border-outline-variant">
                                Nenhum gol na partida.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                            <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                <ChartBar aria-hidden="true" size={24} className="text-parchment" />
                                <h3 className="font-label-caps text-parchment">ESTATÍSTICAS DA PARTIDA</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-abyss border border-outline-variant">
                                    <span className="font-label-caps text-smoke">FINALIZAÇÕES</span>
                                    <strong className="font-data-mono text-primary-container">{matchStats?.totalChances || 0}</strong>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-abyss border border-outline-variant">
                                    <span className="font-label-caps text-smoke">TÁTICA UTILIZADA</span>
                                    <strong className="font-label-caps text-parchment">{TACTICS[engine.currentTactic]?.name}</strong>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-abyss border border-outline-variant">
                                    <span className="font-label-caps text-smoke flex items-center gap-1"><Cardholder aria-hidden="true" weight="fill" /> CARTÕES</span>
                                    <strong className="font-data-mono text-secondary-container">{lastMatchCards.length}</strong>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-abyss border border-outline-variant">
                                    <span className="font-label-caps text-smoke flex items-center gap-1"><FirstAid aria-hidden="true" weight="fill" /> LESÕES</span>
                                    <strong className="font-data-mono text-danger-red">{matchStats?.injuries || 0}</strong>
                                </div>
                            </div>
                        </div>

                        {engine.board && (
                            <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                                <div className="flex items-center gap-2 border-b-2 border-outline-variant pb-2 mb-4">
                                    <Shield aria-hidden="true" size={24} className="text-parchment" />
                                    <h3 className="font-label-caps text-parchment">STATUS DA DIRETORIA</h3>
                                </div>
                                <div className="p-3 border-2 pixel-bevel-inset flex justify-between items-center bg-abyss" style={{ borderColor: engine.board.getStatus().color }}>
                                    <div className="flex flex-col">
                                        <span className="font-label-caps text-xs text-smoke">CONFIANÇA</span>
                                        <span className="font-headline-sm" style={{ color: engine.board.getStatus().color }}>{engine.board.getStatus().label}</span>
                                    </div>
                                    <div className="font-display-md" style={{ color: engine.board.getStatus().color }}>
                                        {engine.board.confidence}%
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button type="button" className="bg-surface-container-high border-2 border-outline-variant p-4 min-h-[64px] flex items-center justify-center gap-2 pixel-bevel hover:bg-outline-variant transition duration-200 ease-out active:translate-y-1 active:shadow-none font-label-caps cursor-pointer" onClick={() => resetMatchState('press')}>
                        <MicrophoneStage aria-hidden="true" size={20} /> COLETIVA PÓS-JOGO
                    </button>
                    <button type="button" className="bg-primary-container text-abyss border-2 border-on-primary p-4 min-h-[64px] flex items-center justify-center gap-2 pixel-bevel hover:brightness-110 transition duration-200 ease-out active:translate-y-1 active:shadow-none font-label-caps cursor-pointer" onClick={() => resetMatchState(getDashboardView())}>
                        <ChartBar aria-hidden="true" size={20} /> VOLTAR AO DASHBOARD
                    </button>
                </div>
            </div>

            {/* Decorative CRT Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] scanline opacity-10"></div>
            <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
        </div>
    );
}
