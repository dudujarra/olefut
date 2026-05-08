import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Engine } from '../engine/engine';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

const SAVE_KEY = 'elifoot_save_v1';
const SAVE_VERSION = 1;

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
        if (payload.version !== SAVE_VERSION) return null;
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

// Campos engine que são instâncias de classes — skip em save (recriar na inicialização).
const ENGINE_CLASS_FIELDS = ['staff', 'board', 'legacy'];

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
