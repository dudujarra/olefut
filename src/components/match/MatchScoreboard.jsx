import { EfClubBadge } from '../ui';

export function MatchScoreboard({ result, currentMinute, isPlaying, half, runningScore }) {
    // Match progress: 0-90' linear (45' = halftime marker)
    const progressPct = Math.min(100, Math.round((currentMinute / 90) * 100));

    return (
        <section className="relative w-full">
            <div className="bg-forest-dark pixel-bevel border-2 border-outline-variant p-4">
                <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                        <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">MANDANTE</span>
                        <div className="flex items-center gap-2">
                            <EfClubBadge name={result?.home} size="sm" />
                            <h2 className="font-headline-md text-headline-md-mobile">{result?.home}</h2>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">VISITANTE</span>
                        <div className="flex items-center gap-2">
                            <h2 className="font-headline-md text-headline-md-mobile text-right">{result?.away}</h2>
                            <EfClubBadge name={result?.away} size="sm" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-6 py-2 bg-abyss pixel-bevel-inset relative overflow-hidden">
                    <div className="scanline absolute inset-0 opacity-20"></div>
                    <span className={`font-display-lg tabular-nums text-display-lg text-primary-container glow-primary ${runningScore.home > runningScore.away ? 'animate-pulse' : ''}`}>{runningScore.home}</span>
                    <div className="flex flex-col items-center z-10">
                        <div className="px-2 py-1 bg-primary-container/10 border border-primary-container mb-1">
                            <span className={`font-data-mono tabular-nums text-primary-container ${isPlaying ? 'animate-pulse' : ''}`}>{String(currentMinute).padStart(2, '0')}'</span>
                        </div>
                        <span className="font-label-caps text-label-caps text-smoke">{half === '1º TEMPO' ? '1ºT' : '2ºT'} - LIVE</span>
                    </div>
                    <span className={`font-display-lg tabular-nums text-display-lg text-primary-container glow-primary ${runningScore.away > runningScore.home ? 'animate-pulse' : ''}`}>{runningScore.away}</span>
                </div>
            </div>
        </section>
    );
}
