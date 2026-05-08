import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Engine } from '../engine/engine';
import { Tournament } from '../engine/tournaments/Tournament';
import { League } from '../engine/tournaments/League';
import { KnockoutCup } from '../engine/tournaments/KnockoutCup';
import { ContinentalCup } from '../engine/tournaments/ContinentalCup';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

// AKITA-RFCT-017: SAVE_VERSION bumped 1 → 3 (FIM v1.0.5 refactor).
// AKITA-050 (v1.0.7): SAVE_VERSION 3 → 4 (Camada 2 events array foundation).
// AKITA-051 (v1.1): SAVE_VERSION 4 → 5 (Camada 5 Mito halls + retiredPlayers).
// AKITA-052 (v1.1.5): SAVE_VERSION 5 → 6 (regen inheritance traits).
// AKITA-053 (v1.2): SAVE_VERSION 6 → 7 (transição jogador→técnico + manager_president).
// AKITA-054 (v1.3): SAVE_VERSION 7 → 8 (regenLineage filhos-regens).
// AKITA-055 (v1.4): SAVE_VERSION 8 → 9 (arcs array completo + 6 named arcs).
// Saves v<9 são auto-invalidados (start fresh).
const SAVE_KEY = 'elifoot_save_v1';
const SAVE_VERSION = 9;

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
        const payload = {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            gameState,
            engine: serializeEngine(engine),
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
    '_inheritanceService'
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
}

export const GameProvider = ({ children }) => {
    const engineRef = useRef(new Engine());
    const [, setTick] = useState(0);
    const forceUpdate = () => setTick(t => t + 1);

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
        setGameState({
            started: true,
            view: mode === 'player' ? 'player_dashboard' : 'dashboard',
            manager: name,
            teamId,
            mode
        });
    };

    const changeView = (view) => {
        setGameState(prev => ({ ...prev, view }));
    };

    const saveGame = () => saveToStorage(engineRef.current, gameState);
    const resetGame = () => {
        clearStorage();
        engineRef.current = new Engine();
        setGameState({ started: false, view: 'start', manager: '', teamId: null, mode: 'manager' });
    };

    const getEngine = () => engineRef.current;

    return (
        <GameContext.Provider value={{ gameState, startGame, changeView, getEngine, forceUpdate, saveGame, resetGame }}>
            {children}
        </GameContext.Provider>
    );
};
