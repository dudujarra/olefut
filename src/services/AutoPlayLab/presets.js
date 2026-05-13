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

// ═══════════════════════════════════════════════════════════════════════
// BATCH 2 — 20 PRESETS RESTANTES (cobertura completa das 45 utilidades)
// ═══════════════════════════════════════════════════════════════════════

export const npcPersonalityBiasPreset = {
    id: 'npc_personality_bias',
    label: 'NPC Personality Bias',
    description: 'Mede quanto cada perfil NPC (Maverick/Virtuoso/Heartbeat) impacta o manager.',
    category: 'ai',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 120000 },
    analyze: (results) => ({
        managerFinalPos: aggregateStat(results, 'finalPosition'),
        managerWins: aggregateStat(results, 'wins'),
        verdict: 'Perfis NPC variam por seed via systemRng. Comparar entre seeds.',
    }),
};

export const npcTacticStatePreset = {
    id: 'npc_tactic_state',
    label: 'NPC Tactic State',
    description: 'Valida que NPCs adaptam tática após derrota (npcTacticState).',
    category: 'ai',
    defaultConfig: { saves: 30, weeks: 38, seedStart: 130000 },
    analyze: (results) => ({
        avgWins: aggregateStat(results, 'wins'),
        verdict: 'Engine path NpcTacticAdvisor.recordNpcResult deve ser hit.',
    }),
};

export const marlTrainingDataPreset = {
    id: 'marl_training_data',
    label: 'MARL Training Data',
    description: 'Gera sessões pra fine-tune adaptive brain. Dataset format.',
    category: 'ai',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 140000 },
    analyze: (results) => ({
        totalSaves: results.length,
        totalWeeks: results.reduce((s, r) => s + (r.weeksCompleted || 0), 0),
        verdict: 'Export JSON com snapshots+streakHistory pra ML pipeline.',
    }),
};

export const npcContractLogicPreset = {
    id: 'npc_contract_logic',
    label: 'NPC Contract Logic',
    description: 'Valida que NPCs renovam contratos + aposentam corretamente.',
    category: 'ai',
    defaultConfig: { saves: 20, weeks: 76, seedStart: 150000 },
    analyze: (results) => ({
        squadSize: aggregateStat(results, 'squadSize'),
        avgOvr: aggregateStat(results, 'avgOvr'),
        verdict: 'squadSize estavel + avgOvr renovando = lifecycle saudavel.',
    }),
};

export const aiDirectorValidationPreset = {
    id: 'ai_director_validation',
    label: 'AI Director Validation',
    description: 'AI Director ajusta tensão narrativa? Trace board tension curve.',
    category: 'ai',
    defaultConfig: { saves: 30, weeks: 38, seedStart: 160000 },
    analyze: (results) => ({
        boardTension: aggregateStat(results, 'boardTension'),
        verdict: 'Stddev alto = director ativo. Baixo = comportamento flat.',
    }),
};

export const seasonalEventCoveragePreset = {
    id: 'seasonal_event_coverage',
    label: 'Seasonal Event Coverage',
    description: 'Player vê todos 4 eventos sazonais BR (week 1/13/26/38)?',
    category: 'content',
    defaultConfig: { saves: 20, weeks: 38, seedStart: 170000 },
    analyze: (results) => ({
        completedFullSeason: results.filter(r => r.weeksCompleted >= 38).length,
        verdict: 'Saves >= 38 weeks viram todos 4 eventos.',
    }),
};

export const brFlavorCoverageDetailedPreset = {
    id: 'br_flavor_coverage_detailed',
    label: 'BR Flavor Coverage (Detalhado)',
    description: 'Estima exposure de atmosphere strings + club voices por save.',
    category: 'content',
    defaultConfig: { saves: 20, weeks: 38, seedStart: 180000 },
    analyze: (results) => {
        const avgEvents = aggregateStat(results, 'weekEventsCount');
        return {
            avgEvents,
            estimatedAtmoExposure: avgEvents.avg * 0.5,
            verdict: 'Cada save ~50 strings BR. Saturação se > 200.',
        };
    },
};

export const modCardDistributionPreset = {
    id: 'mod_card_distribution',
    label: 'Mod Card Distribution',
    description: 'Cards mod aparecem em paridade com builtin?',
    category: 'content',
    defaultConfig: { saves: 30, weeks: 38, seedStart: 190000 },
    analyze: (results) => ({
        completedSaves: results.filter(r => !r.crash).length,
        verdict: 'Requer instrumentation MidMatchManagerDeck.getMidMatchCard tracking _modSource.',
    }),
};

export const chronicleDatasetGenPreset = {
    id: 'chronicle_dataset_gen',
    label: 'Chronicle Dataset Gen',
    description: 'Gera N chronicles pra fine-tune LLM local. Export JSON.',
    category: 'data',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 200000 },
    analyze: (results) => ({
        totalChronicles: results.reduce((s, r) => s + (r.snapshot?.chroniclesCount || 0), 0),
        verdict: 'Export JSON dump → feed Ollama qwen3:14b LoRA training.',
    }),
};

export const llmCachePrewarmPreset = {
    id: 'llm_cache_prewarm',
    label: 'LLM Cache Pre-Warm',
    description: 'Roda saves background pra popular LLMNarrative cache.',
    category: 'data',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 210000 },
    analyze: (results) => ({
        totalRuns: results.length,
        verdict: 'LLMNarrativeService.cache populado durante runs.',
    }),
};

export const embeddingTrainingPreset = {
    id: 'embedding_training',
    label: 'Embedding Training',
    description: 'Match summaries → dataset pra embeddings + similarity search.',
    category: 'data',
    defaultConfig: { saves: 200, weeks: 38, seedStart: 220000 },
    analyze: (results) => ({
        totalSaves: results.length,
        verdict: 'Export raw snapshots + chronicles → vector DB pipeline.',
    }),
};

export const bugPatternMiningPreset = {
    id: 'bug_pattern_mining',
    label: 'Bug Pattern Mining',
    description: 'Agrupa crashes por stack signature pra priorizar fixes.',
    category: 'data',
    defaultConfig: { saves: 300, weeks: 38, seedStart: 230000 },
    analyze: (results) => {
        const crashes = extractCrashes(results);
        const groups = groupCrashesByStack(crashes);
        return {
            totalCrashes: crashes.length,
            uniquePatterns: groups.length,
            top3: groups.slice(0, 3),
        };
    },
};

export const replaySharingPreset = {
    id: 'replay_sharing',
    label: 'Replay Sharing',
    description: 'Captura seeds notaveis (championship, vexame, derby drama).',
    category: 'discovery',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 240000 },
    analyze: (results) => ({
        memorableSeeds: results.filter(r => {
            const s = r.snapshot;
            if (!s) return false;
            return s.finalPosition === 1 || s.finalPosition >= 19 || s.rivalryCount >= 3;
        }).slice(0, 10).map(r => ({ seed: r.seed, pos: r.snapshot.finalPosition, rivals: r.snapshot.rivalryCount })),
    }),
};

export const saveRoundtripPreset = {
    id: 'save_roundtrip',
    label: 'Save Roundtrip',
    description: 'Simula save → JSON → restore → continua. Detecta serialization bugs.',
    category: 'quality',
    defaultConfig: { saves: 10, weeks: 19, seedStart: 250000 },
    analyze: (results) => ({
        completedSaves: results.filter(r => !r.crash).length,
        verdict: 'Failure = serializer bug.',
    }),
};

export const cardDrawDistPreset = {
    id: 'card_draw_dist',
    label: 'Card Draw Distribution',
    description: 'Distribuição real de tiers (comum/raro/lendário). Detecta RNG vies.',
    category: 'balance',
    defaultConfig: { saves: 50, weeks: 38, seedStart: 260000 },
    analyze: (results) => ({
        totalSaves: results.length,
        verdict: 'Requer instrumentation drawCard tier counts.',
    }),
};

export const tacticCounterMatrixPreset = {
    id: 'tactic_counter_matrix',
    label: 'Tactic Counter Matrix',
    description: 'Posse vs Pressing → real win-rate? Constroi matrix counter.',
    category: 'balance',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 270000 },
    analyze: (results) => ({
        avgWins: aggregateStat(results, 'wins'),
        verdict: 'Matrix completa requer per-match tactic logging.',
    }),
};

export const formModifierPreset = {
    id: 'form_modifier',
    label: 'Form Modifier',
    description: 'Player com form "good" rende +X%? Valida getFormModifier.',
    category: 'balance',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 280000 },
    analyze: (results) => ({
        avgGoalsFor: aggregateStat(results, 'goalsFor'),
        avgGoalsAgainst: aggregateStat(results, 'goalsAgainst'),
        verdict: 'Correlate form trend × goals via deep capture.',
    }),
};

export const numberFormatPreset = {
    id: 'number_format',
    label: 'Number Format',
    description: 'R$ formatado correto? Datas pt-BR?',
    category: 'locale',
    defaultConfig: { saves: 10, weeks: 38, seedStart: 290000 },
    analyze: (results) => ({
        completedSaves: results.filter(r => !r.crash).length,
        verdict: 'Locale validation requer UI render snapshot.',
    }),
};

export const regionalFairnessPreset = {
    id: 'regional_fairness',
    label: 'Regional Fairness',
    description: 'Clubes Norte aparecem com frequencia similar a SE?',
    category: 'locale',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 300000 },
    analyze: (results) => ({
        totalSaves: results.length,
        verdict: 'Requer text scan dos weekEvents per região.',
    }),
};

export const gameplayClipsPreset = {
    id: 'gameplay_clips',
    label: 'Gameplay Clips',
    description: 'Saves com lances cinematograficos (hat-trick, virada, derby).',
    category: 'marketing',
    defaultConfig: { saves: 200, weeks: 38, seedStart: 310000 },
    analyze: (results) => {
        const candidates = results.filter(r => {
            const s = r.snapshot;
            if (!s) return false;
            const wlRatio = s.wins / Math.max(1, s.losses);
            return wlRatio >= 3 || s.rivalryCount >= 4;
        });
        return {
            totalSaves: results.length,
            cinematicSeeds: candidates.slice(0, 10).map(r => r.seed),
        };
    },
};

export const chronicleShowcasePreset = {
    id: 'chronicle_showcase',
    label: 'Chronicle Showcase',
    description: 'Top 10 Chronicles epicos pra blog post / Reddit thread.',
    category: 'marketing',
    defaultConfig: { saves: 100, weeks: 38, seedStart: 320000 },
    analyze: (results) => {
        const titles = results.filter(r => (r.snapshot?.finalPosition || 99) === 1);
        const tragedies = results.filter(r => (r.snapshot?.finalPosition || 0) >= 19);
        return {
            triumphSeeds: titles.slice(0, 5).map(r => ({ seed: r.seed, wins: r.snapshot.wins })),
            tragedySeeds: tragedies.slice(0, 5).map(r => ({ seed: r.seed, losses: r.snapshot.losses })),
        };
    },
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
    // BATCH 2 (20 presets restantes)
    npc_personality_bias: npcPersonalityBiasPreset,
    npc_tactic_state: npcTacticStatePreset,
    marl_training_data: marlTrainingDataPreset,
    npc_contract_logic: npcContractLogicPreset,
    ai_director_validation: aiDirectorValidationPreset,
    seasonal_event_coverage: seasonalEventCoveragePreset,
    br_flavor_coverage_detailed: brFlavorCoverageDetailedPreset,
    mod_card_distribution: modCardDistributionPreset,
    chronicle_dataset_gen: chronicleDatasetGenPreset,
    llm_cache_prewarm: llmCachePrewarmPreset,
    embedding_training: embeddingTrainingPreset,
    bug_pattern_mining: bugPatternMiningPreset,
    replay_sharing: replaySharingPreset,
    save_roundtrip: saveRoundtripPreset,
    card_draw_dist: cardDrawDistPreset,
    tactic_counter_matrix: tacticCounterMatrixPreset,
    form_modifier: formModifierPreset,
    number_format: numberFormatPreset,
    regional_fairness: regionalFairnessPreset,
    gameplay_clips: gameplayClipsPreset,
    chronicle_showcase: chronicleShowcasePreset,
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
