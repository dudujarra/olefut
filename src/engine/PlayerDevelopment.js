/**
 * PlayerDevelopment.js — Aging, Form, Development, Retirement
 * 
 * §3 do Game Design Document — Player Development Science:
 * - Crescimento: CA → PA asymptotic (últimos 5% são os mais difíceis)
 * - Curvas de idade DIFERENTES por posição (§3.1)
 * - Physical stats declinam rápido; mental stats podem SUBIR após 30
 * - Individual variance (σ = 1-3 anos around peak)
 * - Aposentadoria: 35-40 com chance crescente (goleiros até 38)
 * - Form: hot/cold streaks baseado em performance
 */

import { rng } from './rng';
import { calcMarketValue } from './MarketPricer.js';
import { ATTRIBUTE_CATEGORIES, generateDetailedAttributes, calculateOvrFromAttributes } from './PlayerAttributes.js';

/**
 * SCHEMA-UNIFIED: Guard — garante que player tem os 5 atributos root-level.
 * Migrado de player.attributes.{FIS,DEF,CRI,FIN,REF} para player.{attacking,technical,tactical,defending,creativity}
 * para alinhar com data.js generatePlayer() que espalha stats no root do player object.
 *
 * BUG-096 fix: antes criava player.attributes fantasma com tudo em 50, causando
 * convergência de OVR para 50 ao longo das semanas. Agora opera diretamente nas
 * chaves reais que data.js gera.
 */
export function ensureAttributes(player) {
    if (!player) return player;
    
    // Migration for older saves (or generated players missing detailed attributes)
    if (!player.attributes || typeof player.attributes !== 'object' || !player.attributes.technical) {
        // Find macro position, handling both old macros and new 18-pos codes
        let macroPos = 'MEI';
        if (['GOL', 'DEF', 'MEI', 'ATA'].includes(player.position)) {
            macroPos = player.position;
        } else if (player.naturalPosition || player.position) {
            // Lazy fallback mapping to avoid cyclic dependency if getMacroPosition is not easily imported here
            const pos = player.naturalPosition || player.position;
            if (pos.startsWith('G')) macroPos = 'GOL';
            else if (['ZAG','ZAD','ZAE','LAD','LAE','ALD','ALE'].includes(pos)) macroPos = 'DEF';
            else if (['VOL','MEC','MCD','MCE','MEA','MPD','MPE'].includes(pos)) macroPos = 'MEI';
            else if (['POD','POE','CTA'].includes(pos)) macroPos = 'ATA';
        }
        
        player.attributes = generateDetailedAttributes(player.ovr || 50, macroPos, player.age || 22);
        
        // Remove legacy attributes from root
        ['attacking', 'technical', 'tactical', 'defending', 'creativity'].forEach(k => delete player[k]);
    }
    
    return player;
}

const PERSONALITY_GROWTH = {
    "Profissional": 1.3,     // treina mais, cresce mais
    "Ambicioso": 1.2,        // quer jogar, cresce se titular
    "Determinado": 1.15,     // constante
    "Casual": 0.9,           // não se esforça tanto
    "Preguiçoso": 0.7,       // mínimo esforço
    "Líder Nato": 1.25,      // MEGA PATCH: inspira e cresce junto
    "Rebelde": 1.1,          // MEGA PATCH: talentoso mas inconsistente
    "Tímido": 0.95,          // MEGA PATCH: cresce devagar mas não reclama
};

/**
 * §3.1: Position-specific age curves.
 * peak = center of peak zone, declineOnset = when physical decline begins
 * retireMin = earliest retirement age, peakVariance = σ individual spread
 */
const POSITION_AGE_CURVES = {
    ATA: { peak: 27, declineOnset: 31, retireMin: 34, peakVariance: 2 },
    MEI: { peak: 28, declineOnset: 31, retireMin: 34, peakVariance: 2 },
    DEF: { peak: 29, declineOnset: 32, retireMin: 35, peakVariance: 2 },
    GOL: { peak: 30, declineOnset: 34, retireMin: 36, peakVariance: 3 },
};

/**
 * Attribute categories are now imported from PlayerAttributes.js.
 * Physical decline fast, mental can improve. Technical stays steady.
 */

/**
 * §3.2: Processa desenvolvimento semanal de um jogador.
 * CA approaches PA asymptotically — the last 5% is hardest.
 * Not every player reaches their potential.
 *
 * Retorna um array de mensagens de mudança.
 */
export function processPlayerDevelopment(player) {
    ensureAttributes(player); // BUG-096: guard contra attributes undefined
    const changes = [];
    const personalityMod = PERSONALITY_GROWTH[player.personality] || 1.0;
    const curve = POSITION_AGE_CURVES[player.position] || POSITION_AGE_CURVES.MEI;

    // Individual variance: cada jogador tem ±variance anos de offset
    // Deterministic per player using id hash (não muda entre semanas)
    const playerVariance = player._peakVariance ?? 0;

    const effectivePeak = curve.peak + playerVariance;
    const effectiveDecline = curve.declineOnset + playerVariance;

    // Helper to get random category and attribute for growth
    const getRandomAttrPath = () => {
        const catKeys = Object.keys(ATTRIBUTE_CATEGORIES);
        // Exclude goalkeeping for outfield players, and vice versa if we wanted to be strict
        const cat = rng.pick(catKeys);
        if (cat === 'goalkeeping' && player.position !== 'GOL') return null; // Don't train GK stats for outfield
        const attr = rng.pick(ATTRIBUTE_CATEGORIES[cat]);
        return { cat, attr };
    };

    // === CRESCIMENTO NATURAL (pre-peak) ===
    if (player.age < effectivePeak) {
        // §3.2: Gap entre PA e CA determina growth rate (asymptotic)
        const potential = player.potential || (player.ovr + 15);
        const gap = Math.max(0, potential - (player.ovr || 50));

        const ageBonus = player.age < 20 ? 1.5 : player.age < 23 ? 1.2 : 1.0;
        const gapFactor = gap > 20 ? 0.30 : gap > 10 ? 0.18 : gap > 5 ? 0.10 : 0.04;
        const growthChance = gapFactor * personalityMod * ageBonus;

        if (rng.chance(growthChance)) {
            // Multiple stats can grow at once when young
            const numGrowths = player.age < 20 ? rng.int(1, 3) : 1;
            for (let i = 0; i < numGrowths; i++) {
                const path = getRandomAttrPath();
                if (path) {
                    const { cat, attr } = path;
                    const oldVal = player.attributes[cat][attr];
                    const ceiling = 20; // 1-20 scale
                    if (oldVal < ceiling) {
                        player.attributes[cat][attr] = oldVal + 1;
                        changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: oldVal + 1 });
                    }
                }
            }
        }
    }

    // === DECLÍNIO (post-peak, position-specific) ===
    if (player.age >= effectiveDecline) {
        const yearsOverDecline = player.age - effectiveDecline;

        // Physical attributes: decline sharply (§3.1)
        const physDeclineChance = yearsOverDecline * 0.08; 
        ATTRIBUTE_CATEGORIES.physical.forEach(attr => {
            if (rng.chance(physDeclineChance)) {
                const oldVal = player.attributes.physical[attr];
                if (oldVal > 1) {
                    const drop = yearsOverDecline >= 3 && rng.chance(0.5) ? 2 : 1;
                    player.attributes.physical[attr] = Math.max(1, oldVal - drop);
                    changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player.attributes.physical[attr] });
                }
            }
        });

        // Technical attributes: decline very slowly (§3.1)
        const techDeclineChance = yearsOverDecline * 0.02; 
        ATTRIBUTE_CATEGORIES.technical.forEach(attr => {
            if (rng.chance(techDeclineChance)) {
                const oldVal = player.attributes.technical[attr];
                if (oldVal > 5) {
                    player.attributes.technical[attr] -= 1;
                    changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player.attributes.technical[attr] });
                }
            }
        });

        // Mental attributes: can IMPROVE past peak! (§3.1)
        const mentalGrowthChance = 0.05 * personalityMod;
        ATTRIBUTE_CATEGORIES.mental.forEach(attr => {
            if (rng.chance(mentalGrowthChance)) {
                const oldVal = player.attributes.mental[attr];
                if (oldVal < 20) {
                    player.attributes.mental[attr] += 1;
                    changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: player.attributes.mental[attr] });
                }
            }
        });
    }

    // === APOSENTADORIA (position-aware) ===
    if (player.age >= curve.retireMin) {
        const yearsOverRetireMin = player.age - curve.retireMin;
        const retireChance = (yearsOverRetireMin + 1) * 0.12;
        if (rng.chance(retireChance)) {
            player._retired = true;
            changes.push({ type: 'retirement', player: player.name, age: player.age });
        }
    }
    // BUG-079: safety cap — force-retire if age > 42 (probability of reaching this
    // naturally is ~0, so any player here escaped the stochastic retirement system).
    if (!player._retired && player.age > 42) {
        player._retired = true;
        changes.push({ type: 'retirement', player: player.name, age: player.age });
    }

    // Assign individual peak variance on first run (deterministic from id)
    if (player._peakVariance === undefined) {
        // Hash player id to get ±variance consistently
        const hash = typeof player.id === 'string'
            ? player.id.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
            : (player.id || 0);
        player._peakVariance = (Math.abs(hash) % (curve.peakVariance * 2 + 1)) - curve.peakVariance;
    }

    // Recalc OVR based on attributes
    const macroPos = ['GOL', 'DEF', 'MEI', 'ATA'].includes(player.position) ? player.position : 'MEI';
    player.ovr = calculateOvrFromAttributes(player.attributes, macroPos);

    return changes;
}

/**
 * Envelhece jogadores 1 ano. Chamar 1x por temporada.
 */
export function ageSquad(squad) {
    const events = [];
    squad.forEach(p => {
        p.age++;
        if (p.age >= 35) {
            events.push(`🎂 ${p.name} fez ${p.age} anos. A aposentadoria se aproxima.`);
        }
    });
    return events;
}



function recalcOvr(player) {
    ensureAttributes(player); // SCHEMA-UNIFIED: guard root-level attrs
    // Weighted OVR por posição usando schema unificado 38 atributos
    const macroPos = ['GOL', 'DEF', 'MEI', 'ATA'].includes(player.position) ? player.position : 'MEI';
    player.ovr = calculateOvrFromAttributes(player.attributes, macroPos);

    // Hedonic Pricing recalculation upon OVR change
    player.marketValue = calcMarketValue({
        playerOvr: player.ovr,
        playerAge: player.age || 25,
        playerPotential: player.potential,
        playerContract: player.contract?.weeksLeft ?? 26,
        playerForm: player.form?.trend || 0
    });
}
