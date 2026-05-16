import { useState, useCallback } from 'react';
import { useMatchEngine } from './match/useMatchEngine';
import { MatchPreGame } from './match/MatchPreGame';
import { MatchLive } from './match/MatchLive';
import { MatchHalfTime } from './match/MatchHalfTime';
import { MatchPostGame } from './match/MatchPostGame';

export function MatchView({ team, engine, changeView }) {
    // For manual updates from sub-components
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);

    const getDashboardView = () => engine.isMarlActive ? 'MARL_DASHBOARD' : 'DASHBOARD';

    const matchState = useMatchEngine(engine, changeView, getDashboardView, forceUpdate);

    const getEnergyColor = (e) => {
        if (e < 40) return 'var(--color-danger)';
        if (e < 70) return 'var(--color-secondary)';
        return 'var(--color-primary)';
    };

    const sectors = {
        goalkeeper: team.squad.filter(p => p.isTitular && p.position === 'GK').reduce((acc, p) => acc + p.ovr, 0),
        defense: Math.round(team.squad.filter(p => p.isTitular && ['CB', 'LB', 'RB'].includes(p.position)).reduce((acc, p) => acc + p.ovr, 0) / Math.max(1, team.squad.filter(p => p.isTitular && ['CB', 'LB', 'RB'].includes(p.position)).length)),
        midfield: Math.round(team.squad.filter(p => p.isTitular && ['CM', 'CDM', 'CAM', 'RM', 'LM'].includes(p.position)).reduce((acc, p) => acc + p.ovr, 0) / Math.max(1, team.squad.filter(p => p.isTitular && ['CM', 'CDM', 'CAM', 'RM', 'LM'].includes(p.position)).length)),
        attack: Math.round(team.squad.filter(p => p.isTitular && ['ST', 'RW', 'LW'].includes(p.position)).reduce((acc, p) => acc + p.ovr, 0) / Math.max(1, team.squad.filter(p => p.isTitular && ['ST', 'RW', 'LW'].includes(p.position)).length))
    };

    const matchContext = engine.getCurrentMatchContext();

    switch (matchState.phase) {
        case 'prematch':
            return (
                <MatchPreGame
                    team={team}
                    engine={engine}
                    sectors={sectors}
                    preStep={matchState.preStep}
                    setPreStep={matchState.setPreStep}
                    benchPlayers={matchState.benchPlayers}
                    setBenchPlayers={matchState.setBenchPlayers}
                    liveModalOpen={matchState.liveModalOpen}
                    setLiveModalOpen={matchState.setLiveModalOpen}
                    talkDone={matchState.talkDone}
                    setTalkDone={matchState.setTalkDone}
                    changeView={changeView}
                    launchMatch={matchState.launchMatch}
                    forceUpdate={forceUpdate}
                    getDashboardView={getDashboardView}
                    matchContext={matchContext}
                />
            );
        case 'firsthalf':
        case 'secondhalf':
            return (
                <MatchLive
                    team={team}
                    engine={engine}
                    result={matchState.result}
                    half={matchState.half}
                    currentMinute={matchState.currentMinute}
                    isPlaying={matchState.isPlaying}
                    displayedEvents={matchState.displayedEvents}
                    paused={matchState.paused}
                    setPaused={matchState.setPaused}
                    pausedRef={matchState.pausedRef}
                    speed={matchState.speed}
                    setSpeed={matchState.setSpeed}
                    skipToEnd={matchState.skipToEnd}
                    narration={matchState.narration}
                    liveModalOpen={matchState.liveModalOpen}
                    setLiveModalOpen={matchState.setLiveModalOpen}
                    liveSubsCount={matchState.liveSubsCount}
                    MAX_SUBS={matchState.MAX_SUBS}
                    benchPlayers={matchState.benchPlayers}
                    setPhase={matchState.setPhase}
                    handleLiveIntervention={matchState.handleLiveIntervention}
                    handleMidMatchChoice={matchState.handleMidMatchChoice}
                    activeMidMatchCard={matchState.activeMidMatchCard}
                    setActiveMidMatchCard={matchState.setActiveMidMatchCard}
                    starImpacts={matchState.starImpacts}
                    matchIdsRef={matchState.matchIdsRef}
                    firstHalfResult={matchState.firstHalfResult}
                    getDisplayScore={matchState.getDisplayScore}
                />
            );
        case 'halftime': {
            const halfTimeData = matchState.firstHalfResult ? {
                homeGoals: matchState.firstHalfResult.homeId === team.id ? matchState.firstHalfResult.homeGoals : matchState.firstHalfResult.awayGoals,
                awayGoals: matchState.firstHalfResult.homeId === team.id ? matchState.firstHalfResult.awayGoals : matchState.firstHalfResult.homeGoals,
            } : { homeGoals: 0, awayGoals: 0 };
            
            return (
                <MatchHalfTime
                    team={team}
                    engine={engine}
                    result={matchState.result}
                    halfTimeData={halfTimeData}
                    benchPlayers={matchState.benchPlayers}
                    liveSubsCount={matchState.liveSubsCount}
                    setLiveSubsCount={matchState.setLiveSubsCount}
                    subUsed={matchState.subUsed}
                    setSubUsed={matchState.setSubUsed}
                    tacticChanged={matchState.tacticChanged}
                    setTacticChanged={matchState.setTacticChanged}
                    firstHalfResult={matchState.firstHalfResult}
                    setNarration={matchState.setNarration}
                    setResult={matchState.setResult}
                    setMatchStats={matchState.setMatchStats}
                    setPhase={matchState.setPhase}
                    startLiveTicker={matchState.startLiveTicker}
                    matchIdsRef={matchState.matchIdsRef}
                    forceUpdate={forceUpdate}
                    getEnergyColor={getEnergyColor}
                />
            );
        }
        case 'fulltime':
            return (
                <MatchPostGame
                    result={matchState.result}
                    narration={matchState.narration}
                    matchStats={matchState.matchStats}
                    engine={engine}
                    changeView={changeView}
                    setPhase={matchState.setPhase}
                    setResult={matchState.setResult}
                    setNarration={matchState.setNarration}
                    setDisplayedEvents={matchState.setDisplayedEvents}
                    setCurrentMinute={matchState.setCurrentMinute}
                    setSubUsed={matchState.setSubUsed}
                    setTacticChanged={matchState.setTacticChanged}
                    setPreStep={matchState.setPreStep}
                    setTalkDone={matchState.setTalkDone}
                    banner={matchState.banner}
                    setBanner={matchState.setBanner}
                    getDashboardView={getDashboardView}
                />
            );
        default:
            return <div>Invalid Phase</div>;
    }
}
