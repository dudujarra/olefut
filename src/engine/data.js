import { rng } from './rng';
import { calcMarketValue } from './MarketPricer';

export const Data = {
    firstNames: [
        "João", "Pedro", "Lucas", "Mateus", "Marcos", "Gabriel", "Rafael", "Felipe", "Thiago",
        "Bruno", "Carlos", "Eduardo", "Fernando", "Gustavo", "Henrique", "Igor", "Leonardo",
        "Vinícius", "André", "Diego", "Caio", "Murilo", "Guilherme", "Otávio", "Enzo",
        "Miguel", "Arthur", "Davi", "Samuel", "Daniel", "Luan", "Kaio", "Yuri", "Renan"
    ],
    lastNames: [
        "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Ferreira",
        "Almeida", "Ribeiro", "Araújo", "Nascimento", "Carvalho", "Martins", "Rocha",
        "Monteiro", "Barbosa", "Moura", "Gonçalves", "Cardoso", "Vieira", "Pinto",
        "Correia", "Nunes", "Teixeira", "Moreira", "Campos", "Macedo", "Ramos", "Melo"
    ],
    positions: ["GOL", "DEF", "DEF", "DEF", "DEF", "MEI", "MEI", "MEI", "ATA", "ATA", "ATA"],

    generatePlayerName() {
        const first = rng.pick(this.firstNames);
        const last = rng.pick(this.lastNames);
        return `${first} ${last}`;
    },

    generatePlayer(position, tier) {
        // tier: 1 (top) to 4 (low). Affects base attribute range.
        // SPEC-142: piso mais alto, gap menor entre divisões (era 12-13 pts, alvo 8-10)
        // Tier1: 70-83 | Tier2: 58-76 | Tier3: 46-69 | Tier4: 35-62 → OVR médio ~48 (era ~37)
        const baseMin = Math.max(35, 82 - (tier * 12));
        const baseMax = Math.min(99, 90 - (tier * 7));

        const age = rng.int(18, 35);

        const attributes = {
            FIS: rng.int(baseMin, baseMax),
            DEF: rng.int(baseMin, baseMax),
            CRI: rng.int(baseMin, baseMax),
            FIN: rng.int(baseMin, baseMax),
            REF: rng.int(baseMin, baseMax)
        };

        // Peso posicional no Overall
        let ovr;
        switch (position) {
            case "GOL": ovr = Math.floor(attributes.REF * 0.5 + attributes.DEF * 0.2 + attributes.FIS * 0.3); break;
            case "DEF": ovr = Math.floor(attributes.DEF * 0.6 + attributes.FIS * 0.25 + attributes.CRI * 0.15); break;
            case "MEI": ovr = Math.floor(attributes.CRI * 0.5 + attributes.FIS * 0.2 + attributes.FIN * 0.15 + attributes.DEF * 0.15); break;
            case "ATA": ovr = Math.floor(attributes.FIN * 0.5 + attributes.FIS * 0.25 + attributes.CRI * 0.25); break;
            default: ovr = Math.floor((attributes.FIS + attributes.DEF + attributes.CRI + attributes.FIN + attributes.REF) / 5);
        }

        // BUG-FIX: salary was negative for old low-OVR players; enforce floor
        const salary = Math.max(2000, Math.floor((ovr * ovr) * 5 + (age > 30 ? -ovr * 20 : 0)));

        // §3.2: Potential — ceiling for development. Hidden from player.
        // Higher tier → higher potential spread. Young players get more headroom.
        const potentialBonus = age < 22 ? rng.int(10, 30) : age < 27 ? rng.int(5, 15) : rng.int(0, 5);
        const potential = Math.min(99, ovr + potentialBonus);

        const value = calcMarketValue({ playerOvr: ovr, playerAge: age, playerPotential: potential, playerContract: 52, playerForm: 0 });

        return {
            id: rng.int(100000, 999999).toString(36) + rng.int(100000, 999999).toString(36),
            name: this.generatePlayerName(),
            position,
            attributes,
            ovr,
            potential,
            age,
            energy: 100,
            moral: 70 + rng.int(-10, 10),
            salary,
            value,
            isTitular: false
        };
    },

    generateSquad(tier) {
        const squad = [];
        const formation = ["GOL", "DEF", "DEF", "DEF", "DEF", "MEI", "MEI", "MEI", "ATA", "ATA", "ATA"];
        // 11 titulares
        formation.forEach((pos) => {
            const p = this.generatePlayer(pos, tier);
            p.isTitular = true;
            squad.push(p);
        });
        // 7 reservas
        const benchPositions = ["GOL", "DEF", "DEF", "MEI", "MEI", "ATA", "ATA"];
        benchPositions.forEach(pos => {
            squad.push(this.generatePlayer(pos, tier + 0.5));
        });
        return squad;
    }
};
