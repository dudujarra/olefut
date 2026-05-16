import { useState, useRef, useEffect, useCallback } from 'react';

export function useMatchEngine(engine, changeView, getDashboardView, forceUpdateBase) {
    const [phase, setPhase] = useState('prematch'); // prematch, firsthalf, halftime, secondhalf, fulltime
    const [preStep, setPreStep] = useState(1);
    const [benchPlayers, setBenchPlayers] = useState([]);
    const [liveModalOpen, setLiveModalOpen] = useState(false);
    const [talkDone, setTalkDone] = useState(false);
    
    // Live match state
    const [result, setResult] = useState(null);
    const [narration, setNarration] = useState([]);
    const [displayedEvents, setDisplayedEvents] = useState([]);
    const [currentMinute, setCurrentMinute] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(200);
    const [half, setHalf] = useState('1º TEMPO');
    const [liveSubsCount, setLiveSubsCount] = useState(0);
    const MAX_SUBS = 3;
    
    // Interventions
    const [activeMidMatchCard, setActiveMidMatchCard] = useState(null);
    const [starImpacts, setStarImpacts] = useState([]);
    
    // Halftime / Postmatch state
    const [subUsed, setSubUsed] = useState(false);
    const [tacticChanged, setTacticChanged] = useState(false);
    const [firstHalfResult, setFirstHalfResult] = useState(null);
    const [matchStats, setMatchStats] = useState({ totalChances: 0, goals: 0, injuries: 0 });
    const [banner, setBanner] = useState(null);
    
    // Refs for timer and synchronization
    const timerRef = useRef(null);
    const eventsQueue = useRef([]);
    const endMinute = useRef(90);
    const onFinishCallback = useRef(null);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);
    const matchIdsRef = useRef(null);
    
    // Utility to get current score based on displayed events
    const getDisplayScore = useCallback(() => {
        let h = 0, a = 0;
        displayedEvents.forEach(e => {
            if (e?.text?.includes('⚽')) {
                if (e.team === result?.home) h++;
                if (e.team === result?.away) a++;
            }
        });
        return { home: h, away: a };
    }, [displayedEvents, result]);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    // Live Ticker Logic
    const startLiveTicker = useCallback((allEvents, startMin, endMin, onFinish) => {
        setIsPlaying(true);
        setDisplayedEvents([]);
        setCurrentMinute(startMin);
        setHalf(startMin < 45 ? '1º TEMPO' : '2º TEMPO');
        eventsQueue.current = [...allEvents];
        endMinute.current = endMin;
        onFinishCallback.current = onFinish;

        if (timerRef.current) clearInterval(timerRef.current);

        let currentLogicMin = startMin;

        const tick = () => {
            if (pausedRef.current) return;

            currentLogicMin++;
            if (currentLogicMin > endMinute.current) {
                clearInterval(timerRef.current);
                setIsPlaying(false);
                if (onFinishCallback.current) onFinishCallback.current();
                return;
            }

            setCurrentMinute(currentLogicMin);

            const eventsThisMinute = eventsQueue.current.filter(e => e && e.minute === currentLogicMin);
            if (eventsThisMinute.length > 0) {
                setDisplayedEvents(prev => [...prev, ...eventsThisMinute]);
                
                // Triggers mid-match interventions
                eventsThisMinute.forEach(e => {
                    if (e && e.starImpact) {
                        setStarImpacts(prev => [...prev, { id: Date.now() + Math.random(), impact: e.starImpact }]);
                        setTimeout(() => setStarImpacts(prev => prev.slice(1)), 3000);
                    }
                    if (e && e.midMatchTrigger) {
                        setPaused(true);
                        pausedRef.current = true;
                        setActiveMidMatchCard(e.midMatchTrigger);
                    }
                });
            }

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(tick, speedRef.current);
        };

        timerRef.current = setInterval(tick, speedRef.current);
    }, []);

    const skipToEnd = useCallback((allEvents, endMin, onFinish) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPaused(false);
        pausedRef.current = false;
        setCurrentMinute(endMin);
        
        // Filter events up to endMin
        const eventsToShow = allEvents.filter(e => e && e.minute <= endMin);
        setDisplayedEvents(eventsToShow);
        setIsPlaying(false);
        if (onFinish || onFinishCallback.current) {
            (onFinish || onFinishCallback.current)();
        }
    }, []);

    // Clean up
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const truncateSimResult = (simResult, maxMinute) => {
        if (!simResult) return null;
        
        const filteredEvents = simResult.events?.textLog?.filter(e => e && e.minute <= maxMinute) || [];
        
        let h = 0, a = 0;
        filteredEvents.forEach(e => {
            if (e.text?.includes('⚽')) {
                if (e.team === simResult.home) h++;
                if (e.team === simResult.away) a++;
            }
        });
        
        return {
            ...simResult,
            homeGoals: h,
            awayGoals: a,
            events: { textLog: filteredEvents },
        };
    };

    const handleLiveIntervention = useCallback((isSub) => {
        if (matchIdsRef.current && result?._baseSimResult) {
            const { homeId, awayId, isCup } = matchIdsRef.current;
            const currentRes = truncateSimResult(result._baseSimResult, currentMinute);
            
            // Re-simulate from this point
            const newRes = engine.playMatchSecondHalf(homeId, awayId, currentRes, isCup, currentMinute);
            
            const isHome = homeId === engine.playerTeamId;
            setResult(prev => ({
                ...prev,
                homeGoals: isHome ? newRes.homeGoals : newRes.awayGoals,
                awayGoals: isHome ? newRes.awayGoals : newRes.homeGoals,
                _baseSimResult: newRes
            }));
            
            const pastEvents = narration.filter(e => e && e.minute <= currentMinute);
            const newEvents = (newRes.events?.textLog || []).filter(e => e && e.minute > currentMinute);
            const allEvents = [...pastEvents, ...newEvents];
            
            setNarration(allEvents);
            eventsQueue.current = [...allEvents];

            const totalChances = allEvents.filter(e => e?.text?.includes('⚽') || e?.text?.includes('Defesa') || e?.text?.includes('salva')).length;
            const goals = allEvents.filter(e => e?.text?.includes('⚽')).length;
            setMatchStats(prev => ({ ...prev, totalChances, goals }));
        }

        setLiveModalOpen(false);
        setPaused(false);
        pausedRef.current = false;
        
        // Ensure ticker is running if it was playing
        if (isPlaying && timerRef.current) {
           // Resumes automatically due to pausedRef change
        }
    }, [engine, currentMinute, result, narration, isPlaying]);

    const handleMidMatchChoice = useCallback((choice) => {
        engine.resolveMidMatchChoice(activeMidMatchCard, choice);
        setActiveMidMatchCard(null);
        setPaused(false);
        pausedRef.current = false;
        handleLiveIntervention(false);
    }, [activeMidMatchCard, engine, handleLiveIntervention]);

    const launchMatch = useCallback(() => {
        if (!engine.schedule || engine.schedule.length === 0) {
            console.error("Nenhum jogo na rodada!");
            changeView(getDashboardView());
            return;
        }

        const match = engine.schedule.find(m => m.home === engine.playerTeamId || m.away === engine.playerTeamId);
        if (!match) {
            // Player not playing this round
            engine.playRound();
            changeView(getDashboardView());
            return;
        }

        const opponentId = match.home === engine.playerTeamId ? match.away : match.home;
        const opponent = engine.teams.find(t => t.id === opponentId);
        const homeName = match.home === engine.playerTeamId ? engine.playerTeam.name : opponent.name;
        const awayName = match.away === engine.playerTeamId ? engine.playerTeam.name : opponent.name;

        // Apply bench logic
        const playerTeam = engine.playerTeam;
        playerTeam.squad.forEach(p => p.isBench = benchPlayers.includes(p.id));

        // SPLIT-SIM PHASE 1: Simulate first half only
        const halfRes = engine.playMatchFirstHalf(match.home, match.away, match.isCup);
        
        matchIdsRef.current = { homeId: match.home, awayId: match.away, isCup: match.isCup };
        setFirstHalfResult(halfRes);

        const isHome = match.home === playerTeam.id;
        const parsedRes = {
            home: homeName,
            away: awayName,
            homeGoals: isHome ? halfRes.homeGoals : halfRes.awayGoals,
            awayGoals: isHome ? halfRes.awayGoals : halfRes.homeGoals,
            _baseSimResult: halfRes,
        };

        setResult(parsedRes);
        setNarration(halfRes.events?.textLog || []);
        
        const totalChances = (halfRes.events?.textLog || []).filter(e => e?.text?.includes('⚽') || e?.text?.includes('Defesa') || e?.text?.includes('salva')).length;
        const goals = (halfRes.events?.textLog || []).filter(e => e?.text?.includes('⚽')).length;
        setMatchStats({ totalChances, goals, injuries: (engine.weekInjuries?.length ?? 0) });

        setPhase('firsthalf');
        
        // Start ticker
        setTimeout(() => {
            startLiveTicker(halfRes.events?.textLog || [], 0, 45, () => {
                // Done with 1st half
            });
        }, 300);
    }, [engine, benchPlayers, changeView, getDashboardView, startLiveTicker]);

    return {
        // State
        phase, setPhase,
        preStep, setPreStep,
        benchPlayers, setBenchPlayers,
        liveModalOpen, setLiveModalOpen,
        talkDone, setTalkDone,
        result, setResult,
        narration, setNarration,
        displayedEvents, setDisplayedEvents,
        currentMinute, setCurrentMinute,
        isPlaying, setIsPlaying,
        paused, setPaused,
        speed, setSpeed,
        half, setHalf,
        liveSubsCount, setLiveSubsCount,
        activeMidMatchCard, setActiveMidMatchCard,
        starImpacts, setStarImpacts,
        subUsed, setSubUsed,
        tacticChanged, setTacticChanged,
        firstHalfResult, setFirstHalfResult,
        matchStats, setMatchStats,
        banner, setBanner,
        MAX_SUBS,
        matchIdsRef,
        pausedRef,
        
        // Functions
        getDisplayScore,
        startLiveTicker,
        skipToEnd,
        handleLiveIntervention,
        handleMidMatchChoice,
        launchMatch,
        truncateSimResult,
    };
}
