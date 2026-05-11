import { rng as systemRng } from './rng.js';
// === SPEC-062 SUB-ATTRIBUTES (16 attrs in 4 groups) ===
export const SUB_ATTRIBUTES = {
    technique: ['dribbling', 'passing', 'shooting', 'firstTouch'],
    pace:      ['acceleration', 'sprintSpeed', 'agility', 'balance'],
    power:     ['strength', 'jumping', 'stamina', 'aggression'],
    vision:    ['positioning', 'decisions', 'composure', 'leadership']
};

// All 16 sub-attrs flattened
export const ALL_SUB_ATTRS = Object.values(SUB_ATTRIBUTES).flat();

// === SPEC-065 LIFESTYLE CATALOG ===
export const LIFESTYLE_CATALOG = {
    // Casa (Tier 1-3) — boost mood + actionSlots
    apartment_t1:  { type: 'house', name: 'Apartamento Simples',  cost: 50000,   moodBonus: 5,  slotBonus: 0, fansBonus: 0,  emoji: '🏢' },
    house_t2:      { type: 'house', name: 'Casa Confortável',     cost: 200000,  moodBonus: 10, slotBonus: 1, fansBonus: 0,  emoji: '🏠' },
    mansion_t3:    { type: 'house', name: 'Mansão de Luxo',       cost: 1000000, moodBonus: 15, slotBonus: 2, fansBonus: 5,  emoji: '🏰' },

    // Carro
    car_popular:   { type: 'car', name: 'Carro Popular',        cost: 30000,   moodBonus: 2,  slotBonus: 0, sponsorsBonus: 0,  emoji: '🚗' },
    car_luxo:      { type: 'car', name: 'Carro Luxo',           cost: 200000,  moodBonus: 5,  slotBonus: 0, sponsorsBonus: 5,  emoji: '🚙' },
    car_super:     { type: 'car', name: 'Super Esportivo',      cost: 2000000, moodBonus: 10, slotBonus: 0, sponsorsBonus: 20, emoji: '🏎️' },

    // Festas / lifestyle ações
    party_private: { type: 'event', name: 'Festa Privada',      cost: 10000,   moodBonus: 5,  energyPenalty: -10, fansBonus: 2,  emoji: '🎉', oneShot: true },
    charity_ngo:   { type: 'event', name: 'Doação ONG',         cost: 50000,   moodBonus: 3,  fansBonus: 10, bossBonus: 5, emoji: '❤️', oneShot: true },
    investment_stocks: { type: 'investment', name: 'Investimento Ações', cost: 100000, returnPercent: 8, moodBonus: 0, emoji: '📈', oneShot: true },
    wedding:       { type: 'event', name: 'Casamento', cost: 500000, moodBonus: 20, stabilityBonus: 10, sponsorsCut: 0.10, emoji: '💍', oneShot: true, requiresLifetimeFlag: 'unmarried' }
};

// Catálogo de Traits compráveis
export const TRAITS_CATALOG = {
    set_piece_taker: { name: "Batedor de Faltas", cost: 2000, description: "Habilidade especial em cobranças de falta", requiredBoss: 60 },
    surprise_element: { name: "Elemento Surpresa", cost: 3000, description: "Jogadas imprevisíveis que surpreendem a defesa", requiredBoss: 50 },
    sweeper_keeper: { name: "Goleiro Líbero", cost: 2500, description: "Sai da área para interceptar jogadas", requiredBoss: 70 },
    target_man: { name: "Pivô de Área", cost: 1500, description: "Domínio de bola de costas para o gol", requiredBoss: 40 },
    engine_box_to_box: { name: "Box-to-Box", cost: 2000, description: "Cobre o campo inteiro, da defesa ao ataque", requiredBoss: 55 },
};

// Personalidades — modificam facções e cartas disponíveis
export const PERSONALITIES = {
    maverick: {
        name: "Maverick",
        emoji: "🎭",
        description: "Showman. Jogadas arriscadas rendem 2x fans. Erros custam 2x boss.",
        fansMultiplier: 2.0,
        bossFailMultiplier: 2.0,
        trainXPMultiplier: 1.0,
        sponsorsGrowthMultiplier: 1.0
    },
    virtuoso: {
        name: "Virtuoso",
        emoji: "🎯",
        description: "Técnico. Treino dá +50% XP. Sponsors crescem -50%.",
        fansMultiplier: 1.0,
        bossFailMultiplier: 1.0,
        trainXPMultiplier: 1.5,
        sponsorsGrowthMultiplier: 0.5
    },
    heartbeat: {
        name: "Heartbeat",
        emoji: "🫀",
        description: "Líder. Teammates +1/semana. Nunca mais que +3 fans/evento.",
        fansMultiplier: 1.0,
        bossFailMultiplier: 1.0,
        trainXPMultiplier: 1.0,
        sponsorsGrowthMultiplier: 1.0,
        fansCap: 3,
        teammatesWeeklyBonus: 1
    }
};

// NPCs Nomeados
export const NPCS = [
    { id: "coach", name: "Marcos Oliveira", role: "Técnico", emoji: "👔", personality: "pragmatic" },
    { id: "journalist", name: "Juliana Reis", role: "Jornalista", emoji: "🎤", personality: "provocative", unlockWeek: 3 },
    { id: "fanLeader", name: "Tio Dinho", role: "Líder da Torcida", emoji: "📣", personality: "passionate", unlockWeek: 1 },
    { id: "veteran", name: "Rafael Monteiro", role: "Veterano", emoji: "🤝", personality: "mentor", unlockWeek: 2 },
    { id: "agent", name: "Patrícia Lemos", role: "Empresária", emoji: "💼", personality: "ambitious", unlockRenown: 2 },
    { id: "rival", name: "Diego Costa", role: "Rival", emoji: "⚔️", personality: "competitive", unlockWeek: 5 }
];

export class ProPlayer {
    constructor(id, name, position) {
        this.id = id;
        this.name = name;
        this.position = position || "ATA";
        this.personality = 'maverick'; // maverick | virtuoso | heartbeat
        this.age = 17;

        // Atributos base 1-100
        this.skills = {
            technique: 50,
            pace: 50,
            power: 50,
            vision: 50
        };

        // Skill progress (0-100, ao chegar em 100 o skill sobe 1 ponto)
        this.skillProgress = { technique: 0, pace: 0, power: 0, vision: 0 };

        // SPEC-062 Sub-attributes (16 attrs derived from 4 base skills)
        this.subAttrs = {};
        for (const [base, subs] of Object.entries(SUB_ATTRIBUTES)) {
            const baseVal = this.skills[base];
            subs.forEach(sub => {
                this.subAttrs[sub] = baseVal + Math.floor(systemRng() * 10 - 5);
                this.subAttrs[sub] = Math.max(1, Math.min(99, this.subAttrs[sub]));
            });
        }
        this.subAttrProgress = {};
        ALL_SUB_ATTRS.forEach(a => { this.subAttrProgress[a] = 0; });

        // SCHEMA-UNIFIED: stats root-level (matching data.js generatePlayer)
        this.attacking  = this.skills.pace;
        this.technical  = this.skills.technique;
        this.defending  = this.skills.power;
        this.creativity = this.skills.vision;
        this.tactical   = 50;

        // Energia e economia
        this.energy = 100;
        this.energyDecayRate = 5;
        this.money = 0;
        this.wage = 500;
        this.energyDrinks = 0;

        // Relacionamentos (0-100)
        this.relationships = {
            boss: 50,
            fans: 50,
            teammates: 50,
            sponsors: 50
        };

        // Slots de ação semanal (Persona 5 mechanic)
        this.actionSlots = 3;
        this.maxActionSlots = 3;

        // SPEC-065 Lifestyle
        this.lifestyle = {
            ownedHouse: null,        // 'apartment_t1' | 'house_t2' | 'mansion_t3' | null
            ownedCar: null,          // 'car_popular' | ... | null
            investments: [],         // [{ id, amount, weekStart, returnPercent }]
            isMarried: false,
            partiesThisSeason: 0,
            charitiesThisSeason: 0,
            mood: 50                 // 0-100 derived from purchases
        };

        // Renome e estrelas
        this.renown = 0;
        this.starRating = 1;
        this.seasonGoals = 0;
        this.lastWeekGoals = 0;

        // Traits
        this.traits = [];

        // Bench status
        this.isBenched = false;

        // Stress (0-100) — CK3 inspired
        this.stress = 0;
        this.mentalBreakActive = false;

        // Chain Event flags — Bomba-Relógio
        this.flags = {};

        // NPC relationships (0-100)
        this.npcRelationships = {};
        NPCS.forEach(npc => { this.npcRelationships[npc.id] = 50; });

        // Match streak tracking
        this.matchesWithoutGoal = 0;
        this.consecutiveLosses = 0;
    }

    get canAct() {
        return this.actionSlots > 0;
    }

    resetWeeklySlots() {
        this.actionSlots = this.maxActionSlots;
    }

    train(skill) {
        if (!this.canAct) return { success: false, msg: "Sem ações restantes esta semana. Avance para o jogo." };
        if (this.energy < 20) return { success: false, msg: "Energia insuficiente para treinar." };

        const roll = systemRng();
        const successChance = (this.energy / 100) * 0.8;

        if (roll > successChance) {
            this.energy = Math.max(0, this.energy - 10);
            this.actionSlots--;
            return { success: false, msg: `Falhou no treino por cansaço. (${this.actionSlots} ações restantes)` };
        }

        const xpMultiplier = PERSONALITIES[this.personality]?.trainXPMultiplier || 1.0;
        const xpGain = Math.floor(25 * xpMultiplier);
        this.skillProgress[skill] += xpGain;
        if (this.skillProgress[skill] >= 100) {
            this.skills[skill] = Math.min(99, this.skills[skill] + 1);
            this.skillProgress[skill] = 0;
        }

        this.energy = Math.max(0, this.energy - 15);
        this.actionSlots--;

        // Triângulo Impossível: treinar agrada boss, irrita fans
        this.relationships.boss = Math.min(100, this.relationships.boss + 1);
        this.relationships.fans = Math.max(0, this.relationships.fans - 1);

        return { success: true, msg: `Treino de ${skill} concluído! (${this.actionSlots} ações restantes)` };
    }

    // SPEC-062 train specific sub-attribute (granular)
    trainSubAttr(subAttr) {
        if (!this.canAct) return { success: false, msg: "Sem ações restantes esta semana." };
        if (this.energy < 20) return { success: false, msg: "Energia insuficiente para treinar." };
        if (!ALL_SUB_ATTRS.includes(subAttr)) return { success: false, msg: "Atributo inválido." };

        const roll = systemRng();
        const successChance = (this.energy / 100) * 0.85;

        if (roll > successChance) {
            this.energy = Math.max(0, this.energy - 8);
            this.actionSlots--;
            return { success: false, msg: `Falhou no treino de ${subAttr}.` };
        }

        const xpMultiplier = PERSONALITIES[this.personality]?.trainXPMultiplier || 1.0;
        const curLvl = this.subAttrs[subAttr] || 50;

        // Exponential XP cost: levels 1-50 cheap, 96-99 legendary
        let xpGain = 25 * xpMultiplier;
        if (curLvl >= 51 && curLvl <= 70) xpGain *= 0.5;
        if (curLvl >= 71 && curLvl <= 85) xpGain *= 0.25;
        if (curLvl >= 86 && curLvl <= 95) xpGain *= 0.125;
        if (curLvl >= 96) xpGain *= 0.05;
        xpGain = Math.floor(xpGain);

        this.subAttrProgress[subAttr] += xpGain;
        if (this.subAttrProgress[subAttr] >= 100) {
            this.subAttrs[subAttr] = Math.min(99, this.subAttrs[subAttr] + 1);
            this.subAttrProgress[subAttr] = 0;
        }

        this.energy = Math.max(0, this.energy - 12);
        this.actionSlots--;

        return { success: true, msg: `Treino ${subAttr} +${xpGain} XP (${this.subAttrs[subAttr]} lvl).` };
    }

    rest() {
        if (!this.canAct) return { success: false, msg: "Sem ações restantes esta semana." };

        this.energy = Math.min(100, this.energy + 30);
        this.actionSlots--;

        // Triângulo: descansar agrada boss, irrita sponsors
        this.relationships.boss = Math.min(100, this.relationships.boss + 2);
        this.relationships.sponsors = Math.max(0, this.relationships.sponsors - 2);

        return { success: true, msg: `Descansou (+30 energia). ${this.actionSlots} ações restantes.` };
    }

    buyEnergyDrink() {
        if (this.money < 100) return { success: false, msg: "Sem dinheiro para comprar energético." };
        this.money -= 100;
        this.energyDrinks++;
        return { success: true, msg: "Comprou 1 Energético." };
    }

    consumeEnergyDrink() {
        if (this.energyDrinks <= 0) return { success: false, msg: "Nenhum energético em estoque." };
        this.energyDrinks--;
        this.energy = Math.min(100, this.energy + 40);
        return { success: true, msg: "Você tomou um Energético (+40 Energia)." };
    }

    // SPEC-065 Lifestyle System
    buyLifestyle(itemId) {
        const item = LIFESTYLE_CATALOG[itemId];
        if (!item) return { success: false, msg: 'Item não encontrado.' };
        if (this.money < item.cost) return { success: false, msg: `Sem dinheiro (precisa R$ ${item.cost.toLocaleString('pt-BR')}).` };
        if (item.requiresLifetimeFlag === 'unmarried' && this.lifestyle.isMarried) {
            return { success: false, msg: 'Já está casado.' };
        }

        // Houses + cars: replace previous
        if (item.type === 'house') {
            if (this.lifestyle.ownedHouse === itemId) return { success: false, msg: 'Já possui esta casa.' };
            this.lifestyle.ownedHouse = itemId;
        } else if (item.type === 'car') {
            if (this.lifestyle.ownedCar === itemId) return { success: false, msg: 'Já possui este carro.' };
            this.lifestyle.ownedCar = itemId;
        } else if (item.type === 'event') {
            if (itemId === 'party_private') this.lifestyle.partiesThisSeason++;
            if (itemId === 'charity_ngo') this.lifestyle.charitiesThisSeason++;
            if (itemId === 'wedding') this.lifestyle.isMarried = true;
            if (item.energyPenalty) this.energy = Math.max(0, this.energy + item.energyPenalty);
        } else if (item.type === 'investment') {
            this.lifestyle.investments.push({
                id: itemId,
                amount: item.cost,
                weekStart: 0, // engine sets currentWeek context (caller)
                returnPercent: item.returnPercent
            });
        }

        // Apply effects
        this.money -= item.cost;
        if (item.moodBonus) this.lifestyle.mood = Math.min(100, this.lifestyle.mood + item.moodBonus);
        if (item.slotBonus) this.maxActionSlots += item.slotBonus;
        if (item.fansBonus) this.relationships.fans = Math.min(100, this.relationships.fans + item.fansBonus);
        if (item.bossBonus) this.relationships.boss = Math.min(100, this.relationships.boss + item.bossBonus);
        if (item.sponsorsBonus) this.relationships.sponsors = Math.min(100, this.relationships.sponsors + item.sponsorsBonus);

        return { success: true, msg: `Comprou: ${item.name} ${item.emoji}` };
    }

    // Process weekly investment returns
    processInvestments() {
        let totalReturn = 0;
        this.lifestyle.investments.forEach(inv => {
            const ret = Math.floor(inv.amount * (inv.returnPercent / 100) / 52); // weekly
            this.money += ret;
            totalReturn += ret;
        });
        return totalReturn;
    }

    buyTrait(traitId) {
        if (this.traits.includes(traitId)) return { success: false, msg: "Você já possui esse trait." };
        const trait = TRAITS_CATALOG[traitId];
        if (!trait) return { success: false, msg: "Trait não encontrado." };
        if (this.money < trait.cost) return { success: false, msg: `Dinheiro insuficiente (precisa R$ ${trait.cost}).` };
        if (this.relationships.boss < trait.requiredBoss) return { success: false, msg: `Aprovação do técnico insuficiente (precisa ${trait.requiredBoss}%).` };

        this.money -= trait.cost;
        this.traits.push(traitId);
        return { success: true, msg: `Trait "${trait.name}" adquirido!` };
    }

    receiveWage() {
        this.money += this.wage;
    }

    playMatch(minutesPlayed, goalsScored, matchWon) {
        // Energy cost proportional to minutes
        this.energy = Math.max(0, this.energy - (minutesPlayed * 0.5));
        this.seasonGoals += goalsScored;

        // Fans reaction
        if (goalsScored > 0) {
            this.relationships.fans = Math.min(100, this.relationships.fans + (goalsScored * 5));
        }
        if (matchWon) {
            this.relationships.boss = Math.min(100, this.relationships.boss + 2);
            this.relationships.teammates = Math.min(100, this.relationships.teammates + 1);
        } else {
            this.relationships.boss = Math.max(0, this.relationships.boss - 1);
        }
    }

    updateStarRating() {
        if (this.renown >= 50) this.starRating = 5;
        else if (this.renown >= 30) this.starRating = 4;
        else if (this.renown >= 15) this.starRating = 3;
        else if (this.renown >= 5) this.starRating = 2;
        else this.starRating = 1;
    }

    checkBenchStatus() {
        this.isBenched = this.energy < 20 || this.relationships.boss < 30;
    }

    // === STRESS SYSTEM (CK3) ===
    addStress(amount, reason) {
        this.stress = Math.min(100, this.stress + amount);
        if (this.stress >= 75 && !this.mentalBreakActive) {
            this.mentalBreakActive = true;
        }
        return { stress: this.stress, mentalBreak: this.mentalBreakActive, reason };
    }

    resolveMentalBreak(choice) {
        // choice: 'party' | 'isolation' | 'therapy'
        switch (choice) {
            case 'party':
                this.stress = Math.max(0, this.stress - 40);
                this.relationships.boss = Math.max(0, this.relationships.boss - 10);
                this.relationships.fans = Math.min(100, this.relationships.fans + 5);
                break;
            case 'isolation':
                this.stress = Math.max(0, this.stress - 30);
                this.relationships.teammates = Math.max(0, this.relationships.teammates - 8);
                break;
            case 'therapy':
                this.stress = Math.max(0, this.stress - 20);
                this.money -= 2000;
                break;
        }
        this.mentalBreakActive = false;
    }

    // === CHAIN EVENT FLAGS (CK3 Bomba-Relógio) ===
    setFlag(flagId, data = true) {
        this.flags[flagId] = { value: data, setWeek: this._currentWeek || 0 };
    }

    hasFlag(flagId) {
        return !!this.flags[flagId];
    }

    clearFlag(flagId) {
        delete this.flags[flagId];
    }

    // === PERSONALITY-AWARE WEEKLY TICK ===
    applyWeeklyPersonalityEffects() {
        const p = PERSONALITIES[this.personality];
        if (!p) return;
        if (p.teammatesWeeklyBonus) {
            this.relationships.teammates = Math.min(100, this.relationships.teammates + p.teammatesWeeklyBonus);
        }
    }

    // Stress from match streaks
    updateStreaks(goalsScored, matchWon) {
        if (goalsScored === 0) {
            this.matchesWithoutGoal++;
            if (this.matchesWithoutGoal >= 3) this.addStress(5, 'Seca de gols');
        } else {
            this.matchesWithoutGoal = 0;
        }
        if (!matchWon) {
            this.consecutiveLosses++;
            if (this.consecutiveLosses >= 3) this.addStress(10, 'Sequência de derrotas');
        } else {
            this.consecutiveLosses = 0;
            this.stress = Math.max(0, this.stress - 3); // Vitória alivia
        }
    }

    // Get stress efficiency penalty (affects training and card resolution)
    get stressEfficiency() {
        if (this.stress >= 75) return 0.6;
        if (this.stress >= 50) return 0.8;
        if (this.stress >= 25) return 0.9;
        return 1.0;
    }
}
