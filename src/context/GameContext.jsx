import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Engine } from '../engine/engine';
import { Tournament } from '../engine/tournaments/Tournament';
import { League } from '../engine/tournaments/League';
import { KnockoutCup } from '../engine/tournaments/KnockoutCup';
import { ContinentalCup } from '../engine/tournaments/ContinentalCup';
import { MonitorService } from '../services/MonitorService';
import { ProPlayer } from '../engine/PlayerCareer';
import { ManagerLegacy } from '../engine/SeasonSystem';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

// AKITA-RFCT-017: SAVE_VERSION bumped 1 → 3 (FIM v1.0.5 refactor).
// AKITA-050 (v1.0.7): SAVE_VERSION 3 → 4 (Camada 2 events array foundation).
// AKITA-051 (v1.1): SAVE_VERSION 4 → 5 (Camada 5 Mito halls + retiredPlayers).
// AKITA-052 (v1.1.5): SAVE_VERSION 5 → 6 (regen inheritance traits).
// AKITA-053 (v1.2): SAVE_VERSION 6 → 7 (transição jogador→técnico + manager_president).
// AKITA-054 (v1.3): SAVE_VERSION 7 → 8 (regenLineage filhos-regens).
// AKITA-055 (v1.4): SAVE_VERSION 8 → 9 (arcs array completo + 6 named arcs).
// AKITA-056 (v1.5): SAVE_VERSION 9 → 10 (chronicle export — fim roadmap v1.x).
// AKITA-127 (v1.6): SAVE_VERSION 10 → 11 (Sul-Americana + real promo/rel counts + ecosystem fix).
// Saves v<11 são auto-invalidados (start fresh).
const SAVE_KEY = 'elifoot_save_v1';
const SAVE_VERSION = 11;

/**
 * §7: CRC32 integrity checksum — detects corrupted or tampered saves.
 * Lightweight (no crypto dependency), sufficient for data-corruption detection.
 */
function crc32(str) {
    let crc = -1;
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ _crc32Table[(crc ^ str.charCodeAt(i)) & 0xff];
    }
    return (crc ^ -1) >>> 0;
}
const _crc32Table = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c;
    }
    return table;
})();

// Map class name → constructor para prototype restoration (BUG-021)
const TOURNAMENT_CLASSES = { Tournament, League, KnockoutCup, ContinentalCup };

function tournamentClassFromShape(t) {
    if (!t || typeof t !== 'object') return Tournament;
    if (t.__class && TOURNAMENT_CLASSES[t.__class]) return TOURNAMENT_CLASSES[t.__class];
    if (typeof t.level === 'number') return League;
    if (Array.isArray(t.groupWeeks)) return ContinentalCup;
    if (Array.isArray(t.roundWeeks)) return KnockoutCup;
    return Tournament;
}

// BUG-020 fix: localStorage auto-save + restore
function saveToStorage(engine, gameState) {
    try {
        const engineData = serializeEngine(engine);
        const engineJson = JSON.stringify(engineData);
        const checksum = crc32(engineJson);
        const payload = {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            checksum,
            gameState,
            engine: engineData,
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('[Save] Failed to persist state:', e);
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        if (payload.version !== SAVE_VERSION) {
            console.info(`[Save] Version mismatch (saved v${payload.version}, current v${SAVE_VERSION}). Save invalidated.`);
            return null;
        }
        // §7: Verify integrity checksum
        if (payload.checksum !== undefined && payload.engine) {
            const expected = crc32(JSON.stringify(payload.engine));
            if (payload.checksum !== expected) {
                console.warn(`[Save] Integrity check failed (expected ${expected}, got ${payload.checksum}). Save corrupted.`);
                return null;
            }
        }
        return payload;
    } catch (e) {
        console.warn('[Save] Failed to load state:', e);
        return null;
    }
}

function clearStorage() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch { /* ignore */ }
}

// Campos engine que são instâncias de classes — skip em save (recriam em constructor).
// AKITA-RFCT-017: includes services (Myth/Relationship/Narrative/Career + MatchSimulator).
// AKITA-052: includes InheritanceService.
const ENGINE_CLASS_FIELDS = [
    'staff', 'board', 'legacy',
    '_matchSimulator', '_mythService', '_relationshipService', '_narrativeService', '_careerService',
    '_inheritanceService', '_weekProcessor', '_seasonProcessor'
];

function serializeEngine(engine) {
    const safe = {};
    for (const key of Object.keys(engine)) {
        if (ENGINE_CLASS_FIELDS.includes(key)) continue;
        try {
            const v = engine[key];
            if (typeof v === 'function') continue;
            if (v instanceof Map || v instanceof Set) continue;
            JSON.stringify(v);
            safe[key] = v;
        } catch { /* skip non-serializable */ }
    }
    // Save staff state separately (just hired array)
    if (engine.staff && Array.isArray(engine.staff.hired)) {
        safe._staffHired = engine.staff.hired;
    }
    // BUG-075: save legacy separately — ManagerLegacy excluded from ENGINE_CLASS_FIELDS
    // so it was never persisted → titles/seasons lost on every reload.
    if (engine.legacy) {
        safe._legacy = {
            managerName: engine.legacy.managerName,
            reputation: engine.legacy.reputation,
            seasons: engine.legacy.seasons,
            titles: engine.legacy.titles,
            totalWins: engine.legacy.totalWins,
            totalMatches: engine.legacy.totalMatches,
        };
    }
    // BUG-021: tag tournaments com class name pra prototype restore
    if (Array.isArray(engine.tournaments)) {
        safe.tournaments = engine.tournaments.map(t => ({
            ...t,
            __class: t?.constructor?.name || 'Tournament'
        }));
    }
    return safe;
}

function restoreEngine(engine, snapshot) {
    if (!snapshot) return;
    for (const [key, val] of Object.entries(snapshot)) {
        if (key === '_staffHired') continue;
        if (ENGINE_CLASS_FIELDS.includes(key)) continue;
        try {
            engine[key] = val;
        } catch { /* skip */ }
    }
    // BUG-021 fix: re-attach tournament prototypes
    if (Array.isArray(engine.tournaments)) {
        engine.tournaments = engine.tournaments.map(rawT => {
            if (!rawT) return rawT;
            const ClassConstructor = tournamentClassFromShape(rawT);
            const restored = Object.create(ClassConstructor.prototype);
            for (const [k, v] of Object.entries(rawT)) {
                if (k === '__class') continue;
                restored[k] = v;
            }
            return restored;
        });
    }
    // Restore staff hired list (preserva StaffManager class)
    if (snapshot._staffHired && engine.staff) {
        engine.staff.hired = [...snapshot._staffHired];
    }
    // BUG-075 fix: restore ManagerLegacy instance from saved plain object
    if (snapshot._legacy) {
        const ld = snapshot._legacy;
        const ml = new ManagerLegacy(ld.managerName || '');
        ml.reputation = ld.reputation ?? 30;
        ml.seasons = ld.seasons ?? [];
        ml.titles = ld.titles ?? [];
        ml.totalWins = ld.totalWins ?? 0;
        ml.totalMatches = ld.totalMatches ?? 0;
        engine.legacy = ml;
    }
    // BUG-024 fix: rehydrate ProPlayer prototype after JSON restore.
    // Save loses class methods (hasFlag/setFlag/etc); OffPitchEventsDeck triggers crash.
    if (engine.proPlayer && typeof engine.proPlayer.hasFlag !== 'function') {
        try {
            Object.setPrototypeOf(engine.proPlayer, ProPlayer.prototype);
            if (!engine.proPlayer.flags) engine.proPlayer.flags = {};
        } catch { /* ignore — defensive filter in deck consumers also catches */ }
    }
}

export const GameProvider = ({ children }) => {
    const engineRef = useRef(new Engine());
    const [, setTick] = useState(0);
    const forceUpdate = () => setTick(t => t + 1);

    // v1.7: Auto-instrument engine for monitor (sem user action)
    React.useEffect(() => {
        try {
            MonitorService.getInstance().instrumentEngine(engineRef.current);
        } catch { /* ignore */ }
    }, []);

    // BUG-020: try restore on mount
    const restored = loadFromStorage();
    const [gameState, setGameState] = useState(
        restored?.gameState || {
            started: false,
            view: 'start',
            manager: '',
            teamId: null,
            mode: 'manager'
        }
    );

    useEffect(() => {
        if (restored?.engine) {
            restoreEngine(engineRef.current, restored.engine);
            forceUpdate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-save em mudança gameState
    useEffect(() => {
        if (gameState.started) {
            saveToStorage(engineRef.current, gameState);
        }
    }, [gameState]);

    const startGame = (name, teamId, scenario = 'livre', mode = 'manager', position = 'ATA', personality = 'maverick') => {
        clearStorage(); // limpa save antigo ao começar nova carreira
        engineRef.current.initGame(name, teamId, mode, scenario, position);
        if (mode === 'player' && engineRef.current.proPlayer) {
            engineRef.current.proPlayer.personality = personality;
        }
        try {
            MonitorService.getInstance().recordGameplay('GAME_START', {
                name, teamId, scenario, mode, position, personality
            });
            // Re-instrument após initGame (alguns métodos podem ter sido reset)
            MonitorService.getInstance().instrumentEngine(engineRef.current);
        } catch { /* ignore */ }
        setGameState({
            started: true,
            view: mode === 'player' ? 'player_dashboard' : 'dashboard',
            manager: name,
            teamId,
            mode
        });
    };

    const changeView = (view) => {
        try {
            MonitorService.getInstance().recordGameplay('NAV', {
                from: gameState.view,
                to: view
            });
        } catch { /* ignore */ }
        setGameState(prev => ({ ...prev, view }));
    };

    // BUG-022 fix: mode-aware dashboard route (avoid player→manager unintended switch)
    const getDashboardView = () => gameState.mode === 'player' ? 'player_dashboard' : 'dashboard';

    const saveGame = () => saveToStorage(engineRef.current, gameState);
    const resetGame = () => {
        clearStorage();
        engineRef.current = new Engine();
        setGameState({ started: false, view: 'start', manager: '', teamId: null, mode: 'manager' });
    };

    const getEngine = () => engineRef.current;

    return (
        <GameContext.Provider value={{ gameState, startGame, changeView, getEngine, forceUpdate, saveGame, resetGame, getDashboardView }}>
            {children}
        </GameContext.Provider>
    );
};
