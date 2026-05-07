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
        const first = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
        const last = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
        return `${first} ${last}`;
    },

    generatePlayer(position, tier) {
        // tier: 1 (top) to 4 (low). Affects base attribute range.
        const baseMin = Math.max(20, 80 - (tier * 15));
        const baseMax = Math.min(99, 95 - (tier * 10));
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const age = rand(18, 35);

        const attributes = {
            FIS: rand(baseMin, baseMax),
            DEF: rand(baseMin, baseMax),
            CRI: rand(baseMin, baseMax),
            FIN: rand(baseMin, baseMax),
            REF: rand(baseMin, baseMax)
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

        const salary = Math.floor((ovr * ovr) * 5 + (age > 30 ? -ovr * 20 : 0));
        const value = Math.floor(salary * (35 - age) * 2);

        return {
            id: Math.random().toString(36).substr(2, 9),
            name: this.generatePlayerName(),
            position,
            attributes,
            ovr,
            age,
            energy: 100,
            moral: 70 + rand(-10, 10),
            salary,
            value: Math.max(100000, value),
            isTitular: false
        };
    },

    generateSquad(tier) {
        const squad = [];
        const formation = ["GOL", "DEF", "DEF", "DEF", "DEF", "MEI", "MEI", "MEI", "ATA", "ATA", "ATA"];
        // 11 titulares
        formation.forEach((pos, i) => {
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
