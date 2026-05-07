import React, { createContext, useContext, useState, useRef } from 'react';
import { Engine } from '../engine/engine';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const engineRef = useRef(new Engine());
    const [, setTick] = useState(0);
    const forceUpdate = () => setTick(t => t + 1);

    const [gameState, setGameState] = useState({
        started: false,
        view: 'start',
        manager: '',
        teamId: null,
        mode: 'manager'
    });

    const startGame = (name, teamId, scenario = 'livre', mode = 'manager', position = 'ATA', personality = 'maverick') => {
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

    const getEngine = () => engineRef.current;

    return (
        <GameContext.Provider value={{ gameState, startGame, changeView, getEngine, forceUpdate }}>
            {children}
        </GameContext.Provider>
    );
};
