/**
 * SPEC-C2.3: UnifiedModeBridge
 */

export function isUnifiedMode(engine) {
    if (!engine || !engine.starPlayerId) return false;
    if (engine.mode === 'player') return false;
    
    const team = engine.getTeam(engine.manager.teamId);
    if (!team || !team.squad) return false;
    
    return team.squad.some(p => p.id === engine.starPlayerId);
}

export function buildProPlayerStub(squadPlayer) {
    if (!squadPlayer) return null;
    
    return {
        ...squadPlayer,
        _isStub: true,
        skills: {
            technique: squadPlayer.technical || 50,
            pace: squadPlayer.attacking || 50,
        },
        relationships: {
            boss: squadPlayer.bossRel || 50,
            fans: squadPlayer.fansRel || 50,
            teammates: squadPlayer.teammatesRel || 50,
        },
        careerGoals: squadPlayer.careerGoals || 0,
        seasonGoals: squadPlayer.seasonGoals || 0,
    };
}

export function getUnifiedView(engine) {
    if (!engine) {
        return { isUnified: false, manager: null, star: null, effectivePerspective: 'manager' };
    }
    
    const unified = isUnifiedMode(engine);
    let star = null;
    
    if (unified) {
        const team = engine.getTeam(engine.manager.teamId);
        const rawStar = team.squad.find(p => p.id === engine.starPlayerId);
        star = buildProPlayerStub(rawStar);
    }
    
    return {
        isUnified: unified,
        star,
        manager: engine.manager || null,
        effectivePerspective: 'manager',
    };
}

function clamp(val) {
    return Math.max(0, Math.min(100, val));
}

export function applyPlayerCardEffectToStar(engine, effect) {
    if (!effect) return { applied: false };
    if (!isUnifiedMode(engine)) return { applied: false };
    
    const team = engine.getTeam(engine.manager.teamId);
    const player = team.squad.find(p => p.id === engine.starPlayerId);
    
    const changes = {};
    
    if (effect.boss !== undefined) {
        const before = player.bossRel || 50;
        player.bossRel = clamp(before + effect.boss);
        changes.boss = { before, after: player.bossRel };
    }
    
    if (effect.fans !== undefined) {
        const before = player.fansRel || 50;
        player.fansRel = clamp(before + effect.fans);
        changes.fans = { before, after: player.fansRel };
    }
    
    if (effect.teammates !== undefined) {
        const before = player.teammatesRel || 50;
        player.teammatesRel = clamp(before + effect.teammates);
        changes.teammates = { before, after: player.teammatesRel };
    }
    
    if (effect.stress !== undefined) {
        const before = player.stress || 0;
        player.stress = clamp(before + effect.stress);
        changes.stress = { before, after: player.stress };
    }
    
    return { applied: true, changes };
}
