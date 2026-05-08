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

        // Atributos do jogador no squad do time (para a Engine usar)
        this.attributes = {
            FIS: this.skills.pace,
            DEF: this.skills.power,
            CRI: this.skills.vision,
            FIN: this.skills.technique,
            REF: 50
        };

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

        const roll = Math.random();
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
