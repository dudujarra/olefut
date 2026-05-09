/**
 * LongTermGoals — SPEC-102
 *
 * Widget dashboard com 3-5 goals long-term + progress bars.
 */

import React from 'react';

function buildGoals(engine, team) {
    if (!engine || !team) return [];
    const stats = engine.managerStats || {};
    const goals = [];

    // Goal 1: First league title
    const titles = engine.legacy?.titles?.length || 0;
    goals.push({
        id: 'first_title',
        label: '🏆 Primeiro Título Nacional',
        progress: Math.min(100, titles >= 1 ? 100 : (stats.wins || 0) / 30 * 100),
        achieved: titles >= 1
    });

    // Goal 2: Climb to Série A
    const division = team.division || 4;
    goals.push({
        id: 'climb_a',
        label: '⬆️ Chegar à Série A',
        progress: division <= 1 ? 100 : ((4 - division) / 3) * 100,
        achieved: division === 1,
        sub: `Atual: Série ${['A','B','C','D'][division - 1]}`
    });

    // Goal 3: 100 career goals (player team scoring)
    const totalGoalsTeam = stats.goalsScored || 0;
    goals.push({
        id: '100_goals',
        label: '⚽ 100 gols totais time',
        progress: Math.min(100, (totalGoalsTeam / 100) * 100),
        achieved: totalGoalsTeam >= 100,
        sub: `${totalGoalsTeam}/100`
    });

    // Goal 4: Libertadores qualification
    const qualifiedContinental = engine.tournaments?.some(t => t.id === 'CHAMPIONS' && t.standings?.some(s => s.teamId === team.id));
    goals.push({
        id: 'libertadores',
        label: '🌎 Libertadores',
        progress: qualifiedContinental ? 100 : Math.min(80, ((4 - division) / 3) * 80),
        achieved: qualifiedContinental,
        sub: qualifiedContinental ? 'Classificado!' : 'Precisa Top 4 Série A'
    });

    // Goal 5: Legend status
    const seasons = engine.seasonNumber || 1;
    goals.push({
        id: 'legend',
        label: '👑 Lenda do Clube (15 temporadas)',
        progress: Math.min(100, (seasons / 15) * 100),
        achieved: seasons >= 15,
        sub: `${seasons}/15 temporadas`
    });

    return goals;
}

export function LongTermGoals({ engine, team }) {
    const goals = buildGoals(engine, team);
    if (goals.length === 0) return null;

    return (
        <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎯 Objetivos da Carreira
            </h3>
            {goals.map(g => (
                <div key={g.id} style={{ marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                        <span style={{ color: g.achieved ? 'var(--primary)' : 'var(--text)' }}>
                            {g.achieved ? '✅ ' : ''}{g.label}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {g.sub || `${Math.round(g.progress)}%`}
                        </span>
                    </div>
                    <div style={{ height: '4px', background: '#1a2520', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${g.progress}%`,
                            background: g.achieved
                                ? 'linear-gradient(90deg, #6ABC3A, #FFD700)'
                                : 'linear-gradient(90deg, #3A7DCE, #6ABC3A)',
                            transition: 'width 300ms ease-out'
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default LongTermGoals;
