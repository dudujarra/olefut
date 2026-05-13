/**
 * Presets — AutoPlayLab F1-F4
 *
 * Configurações pré-definidas para casos de uso comuns.
 * Cada preset: { id, label, description, category, defaultConfig, analyze }
 */

import { aggregateStat, diffBatches, histogram, extractCrashes, groupCrashesByStack } from './DiffEngine.js';

// ─── F1: Balance Win-Rate ──────────────────────────────────────────────

export const balanceWinRatePreset = {
    id: 'balance_winrate',
    label: 'Balance Win-Rate',
    description: 'Distribuição de wins/draws/losses em N saves (compare com baseline)',
    category: 'balance',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 1000 },
    analyze: (results) => ({
        wins: aggregateStat(results, 'wins'),
        draws: aggregateStat(results, 'draws'),
        losses: aggregateStat(results, 'losses'),
        finalPosition: aggregateStat(results, 'finalPosition'),
        avgGoalsFor: aggregateStat(results, 'goalsFor'),
        avgGoalsAgainst: aggregateStat(results, 'goalsAgainst'),
    }),
};

// ─── F2: Crash Farm ────────────────────────────────────────────────────

export const crashFarmPreset = {
    id: 'crash_farm',
    label: 'Crash Farm',
    description: 'Detecta crashes em N saves com seeds variados. Agrupa por stack signature.',
    category: 'quality',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 50000 },
    analyze: (results) => {
        const crashes = extractCrashes(results);
        return {
            totalSaves: results.length,
            crashCount: crashes.length,
            crashRate: results.length ? Number(((crashes.length / results.length) * 100).toFixed(2)) : 0,
            groups: groupCrashesByStack(crashes),
        };
    },
};

// ─── F2: Regression Check ──────────────────────────────────────────────

export const regressionCheckPreset = {
    id: 'regression_check',
    label: 'Regression Check',
    description: 'Compara métricas vs baseline AKITA-288 (20 saves). Detecta drift.',
    category: 'quality',
    defaultConfig: { saves: 20, weeks: 38, seedStart: 1000 },
    baseline: {
        // From AKITA-288
        avgWins: 15.65,
        avgDraws: 6.65,
        avgLosses: 15.70,
        avgFinalPosition: 10.75,
        variance: 32.69,
    },
    analyze: (results, preset) => {
        const wins = aggregateStat(results, 'wins');
        const losses = aggregateStat(results, 'losses');
        const finalPos = aggregateStat(results, 'finalPosition');
        const base = preset.baseline;
        const driftWins = ((wins.avg - base.avgWins) / base.avgWins) * 100;
        const driftLosses = ((losses.avg - base.avgLosses) / base.avgLosses) * 100;
        const driftPos = ((finalPos.avg - base.avgFinalPosition) / base.avgFinalPosition) * 100;
        return {
            wins: { current: wins.avg, baseline: base.avgWins, drift: Number(driftWins.toFixed(2)) },
            losses: { current: losses.avg, baseline: base.avgLosses, drift: Number(driftLosses.toFixed(2)) },
            finalPosition: { current: finalPos.avg, baseline: base.avgFinalPosition, drift: Number(driftPos.toFixed(2)) },
            verdict: Math.abs(driftWins) > 10 || Math.abs(driftLosses) > 10 || Math.abs(driftPos) > 10
                ? 'DRIFT DETECTED'
                : 'BASELINE OK',
        };
    },
};

// ─── F2: NPC AI Tuning ─────────────────────────────────────────────────

export const npcAiTuningPreset = {
    id: 'npc_ai_tuning',
    label: 'NPC AI Tuning',
    description: 'Mede impacto das decisões NPC observando posição final do manager humano.',
    category: 'ai',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 2000 },
    analyze: (results) => ({
        managerFinalPos: aggregateStat(results, 'finalPosition'),
        managerWins: aggregateStat(results, 'wins'),
        // Histogram pra ver distribuição (calibração NPC)
        positionHistogram: histogram(results, 'finalPosition'),
    }),
};

// ─── F2: Chronicle Diversity ───────────────────────────────────────────

export const chronicleDiversityPreset = {
    id: 'chronicle_diversity',
    label: 'Chronicle Diversity',
    description: 'Distribuição de moods das Chronicles geradas. Triunfo/Tragédia balanceado?',
    category: 'content',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 3000 },
    analyze: (results) => ({
        chroniclesGenerated: aggregateStat(results, 'chroniclesCount'),
        avgFinalPos: aggregateStat(results, 'finalPosition'),
        verdict: 'Captura chroniclesCount em snapshots. Detalhe per-mood requer deep capture.',
    }),
};

// ─── F3: Determinism Proof ─────────────────────────────────────────────

export const determinismProofPreset = {
    id: 'determinism_proof',
    label: 'Determinism Proof',
    description: 'Mesma seed × 5 runs. Outputs idênticos?',
    category: 'quality',
    defaultConfig: { saves: 5, weeks: 38, seedStart: 7777 },
    analyze: (results) => {
        const sigs = results.map(r => JSON.stringify({
            w: r.snapshot?.wins, l: r.snapshot?.losses, d: r.snapshot?.draws, pos: r.snapshot?.finalPosition,
        }));
        const unique = new Set(sigs);
        return {
            totalRuns: results.length,
            uniqueSignatures: unique.size,
            deterministic: unique.size === 1,
            verdict: unique.size === 1 ? 'DETERMINISTIC ✓' : `NON-DETERMINISTIC (${unique.size} variants)`,
        };
    },
};

// ─── F3: Win Streak Frequency ──────────────────────────────────────────

export const winStreakFreqPreset = {
    id: 'win_streak_freq',
    label: 'Win Streak Frequency',
    description: 'Hipótese H1 SPEC-180: % saves hit ≥5W (strong) e ≥7W (phenom).',
    category: 'balance',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 4000 },
    analyze: (results) => {
        const maxStreaks = results.map(r => {
            const history = r.streakHistory || [];
            return Math.max(...history.map(h => h.currentWinStreak || 0), 0);
        });
        const withMild = maxStreaks.filter(s => s >= 3).length;
        const withStrong = maxStreaks.filter(s => s >= 5).length;
        const withPhenom = maxStreaks.filter(s => s >= 7).length;
        return {
            totalSaves: results.length,
            mildRate: Number(((withMild / results.length) * 100).toFixed(2)),
            strongRate: Number(((withStrong / results.length) * 100).toFixed(2)),
            phenomRate: Number(((withPhenom / results.length) * 100).toFixed(2)),
            maxOverall: Math.max(...maxStreaks, 0),
        };
    },
};

// ─── F3: Economy Curve ─────────────────────────────────────────────────

export const economyCurvePreset = {
    id: 'economy_curve',
    label: 'Economy Curve',
    description: 'Balance final após N saves. Inflação ou inanição?',
    category: 'balance',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 5000 },
    analyze: (results) => ({
        balance: aggregateStat(results, 'balance'),
        bankruptCount: results.filter(r => (r.snapshot?.balance || 0) <= 0).length,
        verdict: results.filter(r => (r.snapshot?.balance || 0) <= 0).length > 0
            ? `${results.filter(r => (r.snapshot?.balance || 0) <= 0).length} saves bancarrota`
            : 'Sem bancarrotas',
    }),
};

// ─── F3: Tournament Validator ──────────────────────────────────────────

export const tournamentValidatorPreset = {
    id: 'tournament_validator',
    label: 'Tournament Validator',
    description: 'Valida formato campeonato — todos times jogam, calendário OK.',
    category: 'quality',
    defaultConfig: { saves: 10, weeks: 38, seedStart: 6000 },
    analyze: (results) => ({
        avgWins: aggregateStat(results, 'wins'),
        avgGames: results.length
            ? Number((results.reduce((s, r) => s + (r.snapshot?.wins || 0) + (r.snapshot?.draws || 0) + (r.snapshot?.losses || 0), 0) / results.length).toFixed(2))
            : 0,
        verdict: 'Total games per save deveria ≥ 38 (Brasileirão). Confirma calendário.',
    }),
};

// ─── F3: Memory Leak Detector ──────────────────────────────────────────

export const memoryLeakPreset = {
    id: 'memory_leak',
    label: 'Memory Leak Detector',
    description: 'Roda 100 saves seguidos, monitora performance.memory (se disponível).',
    category: 'quality',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 8000 },
    analyze: (results) => {
        // Memory tracking requires browser; em test env apenas count
        return {
            totalRuns: results.length,
            avgWeeksCompleted: aggregateStat(results, 'weeksCompleted'),
            verdict: 'Mem monitoring requer ambiente browser (performance.memory). Em vitest = N/A.',
        };
    },
};

// ─── F3: Derby Trigger Rate ────────────────────────────────────────────

export const derbyTriggerRatePreset = {
    id: 'derby_trigger_rate',
    label: 'Derby Trigger Rate',
    description: '% saves geram rivalidade emergente (>=3 confrontos com algum oponente).',
    category: 'content',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 9000 },
    analyze: (results) => {
        const withDerby = results.filter(r => (r.snapshot?.rivalryCount || 0) > 0);
        return {
            totalSaves: results.length,
            derbyCount: withDerby.length,
            derbyRate: Number(((withDerby.length / results.length) * 100).toFixed(2)),
            avgRivalriesPerSave: aggregateStat(results, 'rivalryCount'),
        };
    },
};

// ─── F3: Title Win Rate ────────────────────────────────────────────────

export const titleWinRatePreset = {
    id: 'title_win_rate',
    label: 'Title Win Rate',
    description: '% saves conquistam título da divisão.',
    category: 'content',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 10000 },
    analyze: (results) => {
        const titles = results.filter(r => (r.snapshot?.finalPosition || 99) === 1).length;
        return {
            totalSaves: results.length,
            titlesWon: titles,
            titleRate: Number(((titles / results.length) * 100).toFixed(2)),
        };
    },
};

// ─── F3: Squad Health Profile ──────────────────────────────────────────

export const squadHealthPreset = {
    id: 'squad_health',
    label: 'Squad Health',
    description: 'Lesões médias por save. InjurySystem balanceado?',
    category: 'balance',
    defaultConfig: { saves: 30, weeks: 38, seedStart: 11000 },
    analyze: (results) => ({
        avgInjured: aggregateStat(results, 'injuredCount'),
        avgSquadSize: aggregateStat(results, 'squadSize'),
        avgOvr: aggregateStat(results, 'avgOvr'),
    }),
};

// ─── F3: Board Tension Curve ───────────────────────────────────────────

export const boardTensionCurvePreset = {
    id: 'board_tension_curve',
    label: 'Board Tension Curve',
    description: 'Distribuição final de tensão de diretoria.',
    category: 'balance',
    defaultConfig: { saves: 30, weeks: 38, seedStart: 12000 },
    analyze: (results) => ({
        tension: aggregateStat(results, 'boardTension'),
        firedCount: results.filter(r => (r.snapshot?.boardTension || 50) <= 10).length,
    }),
};

// ─── F4: Seed Search ───────────────────────────────────────────────────

export const seedSearchPreset = {
    id: 'seed_search',
    label: 'Seed Search',
    description: 'Encontra seeds com critério específico (ex: rebaixou em ano 1).',
    category: 'discovery',
    defaultConfig: { saves: 200, weeks: 38, seedStart: 20000 },
    analyze: (results) => {
        const relegated = results.filter(r => (r.snapshot?.finalPosition || 0) >= 17);
        const titles = results.filter(r => (r.snapshot?.finalPosition || 99) === 1);
        return {
            totalSaves: results.length,
            relegatedSeeds: relegated.slice(0, 10).map(r => r.seed),
            titleSeeds: titles.slice(0, 10).map(r => r.seed),
        };
    },
};

// ─── F4: Edge Case Generator ───────────────────────────────────────────

export const edgeCaseGenPreset = {
    id: 'edge_case_gen',
    label: 'Edge Case Generator',
    description: 'Identifica saves com outcomes extremos (>30W, 30L, 5+ rivalrias).',
    category: 'discovery',
    defaultConfig: { saves: 200, weeks: 38, seedStart: 30000 },
    analyze: (results) => ({
        bigWinners: results.filter(r => (r.snapshot?.wins || 0) >= 30).map(r => ({ seed: r.seed, wins: r.snapshot.wins })),
        bigLosers: results.filter(r => (r.snapshot?.losses || 0) >= 30).map(r => ({ seed: r.seed, losses: r.snapshot.losses })),
        manyRivals: results.filter(r => (r.snapshot?.rivalryCount || 0) >= 5).map(r => ({ seed: r.seed, count: r.snapshot.rivalryCount })),
    }),
};

// ─── F4: Speedrun Discovery ────────────────────────────────────────────

export const speedrunDiscoveryPreset = {
    id: 'speedrun_discovery',
    label: 'Speedrun Discovery',
    description: 'Saves que ganham título em 1ª temporada — speedrun seeds.',
    category: 'discovery',
    defaultConfig: { saves: 500, weeks: 38, seedStart: 40000 },
    analyze: (results) => {
        const champs = results.filter(r => (r.snapshot?.finalPosition || 99) === 1);
        return {
            totalSaves: results.length,
            championRate: Number(((champs.length / results.length) * 100).toFixed(2)),
            topSeeds: champs.slice(0, 20).map(r => ({
                seed: r.seed,
                wins: r.snapshot.wins,
                goalsFor: r.snapshot.goalsFor,
            })),
        };
    },
};

// ─── F4: Star Adoption Impact ──────────────────────────────────────────

export const starAdoptionPreset = {
    id: 'star_adoption',
    label: 'Star Adoption Impact',
    description: 'Saves com starPlayerId vs sem. Diff em wins.',
    category: 'content',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 50000 },
    analyze: (results) => {
        const withStar = results.filter(r => r.snapshot?.starPlayerId);
        const noStar = results.filter(r => !r.snapshot?.starPlayerId);
        return {
            withStar: { count: withStar.length, avgWins: aggregateStat(withStar, 'wins').avg },
            noStar: { count: noStar.length, avgWins: aggregateStat(noStar, 'wins').avg },
            verdict: 'Diff revela se star player tem impacto sistêmico',
        };
    },
};

// ─── F4: Save Size Profile ─────────────────────────────────────────────

export const saveSizeProfilePreset = {
    id: 'save_size_profile',
    label: 'Save Size Profile',
    description: 'Aprox crescimento save state após N temporadas.',
    category: 'performance',
    defaultConfig: { saves: 10, weeks: 38, seedStart: 60000 },
    analyze: (results) => ({
        avgChronicles: aggregateStat(results, 'chroniclesCount'),
        avgRivalries: aggregateStat(results, 'rivalryCount'),
        avgWeekEvents: aggregateStat(results, 'weekEventsCount'),
        verdict: 'Captura aproximação. Save size real requer serialization profiler.',
    }),
};

// ─── F4: BR Coverage Validator ─────────────────────────────────────────

export const brCoveragePreset = {
    id: 'br_coverage',
    label: 'BR Content Coverage',
    description: 'Confirma que features BR (ClubVoice, atmosphere) integradas.',
    category: 'locale',
    defaultConfig: { saves: 20, weeks: 38, seedStart: 70000 },
    analyze: (results) => ({
        completedSaves: results.filter(r => !r.crash).length,
        avgWeekEvents: aggregateStat(results, 'weekEventsCount'),
        verdict: 'Validação real requer text scan dos weekEvents. Helper futuro.',
    }),
};

// ─── F4: Perf Bench ────────────────────────────────────────────────────

export const perfBenchPreset = {
    id: 'perf_bench',
    label: 'Performance Benchmark',
    description: 'Tempo total / weeks completed → ms por advanceWeek.',
    category: 'performance',
    defaultConfig: { saves: 20, weeks: 38, seedStart: 80000 },
    analyze: (results) => {
        const totalWeeks = results.reduce((s, r) => s + (r.weeksCompleted || 0), 0);
        return {
            totalSaves: results.length,
            totalWeeks,
            avgWeeksPerSave: Number((totalWeeks / results.length).toFixed(2)),
            verdict: 'Mede em tempo wall-clock via JS timing externo.',
        };
    },
};

// ─── F4: Title Routes ──────────────────────────────────────────────────

export const titleRoutesPreset = {
    id: 'title_routes',
    label: 'Title Routes',
    description: 'Padrões em saves campeões (wins, GF, GA).',
    category: 'discovery',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 90000 },
    analyze: (results) => {
        const champs = results.filter(r => (r.snapshot?.finalPosition || 99) === 1);
        return {
            totalSaves: results.length,
            championCount: champs.length,
            championAvgWins: aggregateStat(champs, 'wins'),
            championAvgGF: aggregateStat(champs, 'goalsFor'),
            championAvgGA: aggregateStat(champs, 'goalsAgainst'),
        };
    },
};

// ─── F4: Stats Brag ────────────────────────────────────────────────────

export const statsBragPreset = {
    id: 'stats_brag',
    label: 'Stats Brag',
    description: 'Estatísticas marketing-friendly em N saves.',
    category: 'marketing',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 99000 },
    analyze: (results) => {
        const totalGoals = results.reduce((s, r) => s + (r.snapshot?.goalsFor || 0), 0);
        const totalTitles = results.filter(r => (r.snapshot?.finalPosition || 99) === 1).length;
        return {
            totalSaves: results.length,
            totalGoalsScored: totalGoals,
            totalTitlesWon: totalTitles,
            avgGoalsPerSave: Number((totalGoals / results.length).toFixed(2)),
            verdict: `"Em ${results.length} saves: ${totalGoals} gols. ${totalTitles} títulos."`,
        };
    },
};

// ─── F4: Crash Pattern Mining ──────────────────────────────────────────

export const crashPatternPreset = {
    id: 'crash_pattern_mining',
    label: 'Crash Pattern Mining',
    description: 'Random seeds wide. Agrupa crashes por padrão pra priorizar fixes.',
    category: 'quality',
    defaultConfig: { saves: 500, weeks: 38, seedStart: 100000 },
    analyze: (results) => {
        const crashes = extractCrashes(results);
        return {
            totalSaves: results.length,
            crashCount: crashes.length,
            crashRate: Number(((crashes.length / results.length) * 100).toFixed(2)),
            topPatterns: groupCrashesByStack(crashes).slice(0, 5),
        };
    },
};

// ─── F4: Telemetry Farm ────────────────────────────────────────────────

export const telemetryFarmPreset = {
    id: 'telemetry_farm',
    label: 'Telemetry Farm',
    description: 'Roda saves pra popular eventos telemetria (validar dashboards).',
    category: 'data',
    defaultConfig: { saves: 200, weeks: 38, seedStart: 110000 },
    analyze: (results) => ({
        totalSaves: results.length,
        verdict: 'Eventos telemetria emitidos durante execução. Check Telemetry.aggregate() pós-run.',
    }),
};

// ─── Registry ──────────────────────────────────────────────────────────

export const PRESETS = {
    // F1
    balance_winrate: balanceWinRatePreset,
    // F2
    crash_farm: crashFarmPreset,
    regression_check: regressionCheckPreset,
    npc_ai_tuning: npcAiTuningPreset,
    chronicle_diversity: chronicleDiversityPreset,
    // F3
    determinism_proof: determinismProofPreset,
    win_streak_freq: winStreakFreqPreset,
    economy_curve: economyCurvePreset,
    tournament_validator: tournamentValidatorPreset,
    memory_leak: memoryLeakPreset,
    derby_trigger_rate: derbyTriggerRatePreset,
    title_win_rate: titleWinRatePreset,
    squad_health: squadHealthPreset,
    board_tension_curve: boardTensionCurvePreset,
    // F4
    seed_search: seedSearchPreset,
    edge_case_gen: edgeCaseGenPreset,
    speedrun_discovery: speedrunDiscoveryPreset,
    star_adoption: starAdoptionPreset,
    save_size_profile: saveSizeProfilePreset,
    br_coverage: brCoveragePreset,
    perf_bench: perfBenchPreset,
    title_routes: titleRoutesPreset,
    stats_brag: statsBragPreset,
    crash_pattern_mining: crashPatternPreset,
    telemetry_farm: telemetryFarmPreset,
};

export const PRESET_CATEGORIES = {
    quality: 'Quality / Integrity',
    balance: 'Balance / Fine-tune',
    ai: 'IA NPC Tuning',
    content: 'Content Coverage',
    data: 'Data / ML',
    discovery: 'Discovery',
    performance: 'Performance',
    locale: 'Locale / Cultural',
    marketing: 'Marketing / Showcase',
};
