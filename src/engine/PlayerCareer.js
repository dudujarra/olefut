// Catálogo de Traits compráveis
const TRAITS_CATALOG = {
    set_piece_taker: { name: "Batedor de Faltas", cost: 2000, description: "Habilidade especial em cobranças de falta", requiredBoss: 60 },
    surprise_element: { name: "Elemento Surpresa", cost: 3000, description: "Jogadas imprevisíveis que surpreendem a defesa", requiredBoss: 50 },
    sweeper_keeper: { name: "Goleiro Líbero", cost: 2500, description: "Sai da área para interceptar jogadas", requiredBoss: 70 },
    target_man: { name: "Pivô de Área", cost: 1500, description: "Domínio de bola de costas para o gol", requiredBoss: 40 },
    engine_box_to_box: { name: "Box-to-Box", cost: 2000, description: "Cobre o campo inteiro, da defesa ao ataque", requiredBoss: 55 },
};

export class ProPlayer {
    constructor(id, name, position) {
        this.id = id;
        this.name = name;
        this.position = position || "ATA";
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

        this.skillProgress[skill] += 25;
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
}
