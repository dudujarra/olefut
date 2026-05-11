import { rng } from './rng';
import { calcMarketValue } from './MarketPricer';
import realPlayers from '../data/realPlayers.json';

const ALL_REAL_NAMES = realPlayers.map(p => p.name);
const PLAYERS_BY_TEAM = {};
realPlayers.forEach(p => {
    if (!PLAYERS_BY_TEAM[p.team]) PLAYERS_BY_TEAM[p.team] = [];
    PLAYERS_BY_TEAM[p.team].push(p);
});

// Position translator from SoFIFA to Elifoot (GOL, DEF, MEI, ATA)
const mapSofifaPosition = (pos) => {
    pos = pos.toUpperCase();
    if (["GL", "GK"].includes(pos)) return "GOL";
    if (["ZAG", "ZC", "CB", "LE", "LD", "LB", "RB", "LWB", "RWB", "ADD", "ADE"].includes(pos)) return "DEF";
    if (["VOL", "MC", "ME", "MD", "MEI", "CDM", "CM", "LM", "RM", "CAM"].includes(pos)) return "MEI";
    return "ATA"; // CA, PE, PD, ATA, ST, LW, RW, CF
};

/**
 * MEGA PATCH: Player Identity System
 * 
 * Cada jogador é um ser ÚNICO com:
 * - Perfil de atributos assimétrico (ninguém é "flat")
 * - Especialidades que definem o estilo
 * - Personalidade que afeta crescimento
 */

// ─── APELIDOS para jogadores especiais ─────────────────────────
const NICKNAMES = [
    "Bala", "Foguete", "Tanque", "Mágico", "Parede", "Flecha", "Motor", "Raio",
    "Trovão", "Vulcão", "Gelo", "Lenda", "Canhão", "Relâmpago", "Sombra",
    "Fantasma", "Maestro", "Predador", "Leão", "Águia", "Pantera", "Falcão",
    "Torpedo", "Diamante", "Fera", "Gladiador", "Pistola", "Dinamite",
    "Muralha", "Camisa 10", "Paredão", "Velocidade", "Escudo", "Radar",
    "Catapulta", "Artilheiro", "Xerife", "Cachorro Louco", "Meia-Noite",
];

// ─── ESPECIALIDADES (definem perfil assimétrico de atributos) ───
const SPECIALTIES = {
    GOL: [
        { name: "Paredão",      bias: { REF: 1.4, FIS: 1.1, DEF: 1.2, CRI: 0.7, FIN: 0.5 } },
        { name: "Goleiro-Líbero", bias: { REF: 1.1, FIS: 1.2, DEF: 1.0, CRI: 1.1, FIN: 0.7 } },
        { name: "Elástico",     bias: { REF: 1.5, FIS: 0.9, DEF: 1.0, CRI: 0.8, FIN: 0.5 } },
        { name: "Comandante",   bias: { REF: 1.2, FIS: 1.0, DEF: 1.3, CRI: 0.9, FIN: 0.5 } },
    ],
    DEF: [
        { name: "Xerife",       bias: { DEF: 1.5, FIS: 1.2, CRI: 0.6, FIN: 0.5, REF: 0.5 } },
        { name: "Zagueiro Elegante", bias: { DEF: 1.3, CRI: 1.1, FIS: 1.0, FIN: 0.6, REF: 0.5 } },
        { name: "Lateral Ofensivo", bias: { FIS: 1.4, CRI: 1.1, DEF: 0.9, FIN: 0.8, REF: 0.5 } },
        { name: "Tanque",       bias: { DEF: 1.4, FIS: 1.3, CRI: 0.5, FIN: 0.5, REF: 0.5 } },
        { name: "Leitor de Jogo", bias: { DEF: 1.2, CRI: 1.2, FIS: 0.9, FIN: 0.6, REF: 0.5 } },
    ],
    MEI: [
        { name: "Maestro",      bias: { CRI: 1.5, FIN: 1.0, FIS: 0.8, DEF: 0.7, REF: 0.5 } },
        { name: "Box-to-Box",   bias: { FIS: 1.3, DEF: 1.1, CRI: 1.0, FIN: 0.8, REF: 0.5 } },
        { name: "Meia Atacante", bias: { CRI: 1.2, FIN: 1.3, FIS: 0.9, DEF: 0.6, REF: 0.5 } },
        { name: "Volante",      bias: { DEF: 1.4, FIS: 1.2, CRI: 0.8, FIN: 0.5, REF: 0.5 } },
        { name: "Engenheiro",   bias: { CRI: 1.3, DEF: 1.0, FIS: 1.0, FIN: 0.7, REF: 0.5 } },
        { name: "Ponta Veloz",  bias: { FIS: 1.5, CRI: 1.0, FIN: 0.9, DEF: 0.5, REF: 0.5 } },
    ],
    ATA: [
        { name: "Matador",      bias: { FIN: 1.6, FIS: 1.0, CRI: 0.8, DEF: 0.4, REF: 0.5 } },
        { name: "Velocista",    bias: { FIS: 1.5, FIN: 1.1, CRI: 0.9, DEF: 0.4, REF: 0.5 } },
        { name: "Centroavante", bias: { FIN: 1.3, FIS: 1.3, CRI: 0.7, DEF: 0.5, REF: 0.5 } },
        { name: "Falso 9",     bias: { CRI: 1.4, FIN: 1.1, FIS: 0.9, DEF: 0.5, REF: 0.5 } },
        { name: "Artilheiro de Área", bias: { FIN: 1.5, FIS: 0.9, CRI: 0.9, DEF: 0.4, REF: 0.5 } },
        { name: "Ponta Driblador", bias: { CRI: 1.3, FIS: 1.2, FIN: 1.0, DEF: 0.4, REF: 0.5 } },
    ],
};

const PERSONALITIES = ["Profissional", "Ambicioso", "Determinado", "Casual", "Preguiçoso", "Líder Nato", "Rebelde", "Tímido"];
const FOOT = ["Destro", "Canhoto", "Ambidestro"];

export const Data = {
    generatePlayerName() {
        if (ALL_REAL_NAMES.length > 0) {
            return rng.pick(ALL_REAL_NAMES);
        }
        return `Jogador ${rng.int(1, 9999)}`;
    },

    /**
     * Gera jogador híbrido: Se passarmos um realPlayer, ele usa a base real.
     * Caso contrário, usa a geração algorítmica de atributos com especialidades.
     */
    generatePlayer(position, tier, options = {}) {
        const { forceSuper = false, forceAge = null, teamBudget = 0, realPlayer = null } = options;

        let age, ovr, potential, name, specialtyName;
        const attributes = {};

        // Se injetamos um realPlayer da base do SoFIFA
        if (realPlayer) {
            age = realPlayer.age || 22;
            ovr = realPlayer.ovr || 70;
            potential = realPlayer.pot || ovr;
            name = realPlayer.shortName || realPlayer.name;
            
            // Distribuir os atributos em volta do OVR baseado na posição
            const specialtyPool = SPECIALTIES[position] || SPECIALTIES.MEI;
            const specialty = rng.pick(specialtyPool);
            specialtyName = specialty.name;

            for (const attr of ['FIS', 'DEF', 'CRI', 'FIN', 'REF']) {
                const bias = specialty.bias[attr] || 1.0;
                let biased = Math.round(ovr * bias * (0.85 + (rng() * 0.3)));
                attributes[attr] = Math.max(20, Math.min(99, biased));
            }
        } else {
            // Lógica procedural clássica do Elifoot (reajustada com a identidade)
            const baseMin = Math.max(30, 85 - (tier * 14));
            const baseMax = Math.min(99, 95 - (tier * 8));

            if (forceAge !== null) {
                age = forceAge;
            } else {
                const ageRoll = rng();
                if (ageRoll < 0.15) age = rng.int(17, 20);
                else if (ageRoll < 0.55) age = rng.int(21, 26);
                else if (ageRoll < 0.80) age = rng.int(27, 30);
                else if (ageRoll < 0.95) age = rng.int(31, 34);
                else age = rng.int(35, 38);
            }

            const isSuper = forceSuper || rng() < (tier <= 1 ? 0.04 : tier <= 2 ? 0.015 : tier <= 3 ? 0.005 : 0.002);
            
            const specialtyPool = SPECIALTIES[position] || SPECIALTIES.MEI;
            const specialty = rng.pick(specialtyPool);
            specialtyName = specialty.name;

            let effectiveMin = isSuper ? Math.max(75, baseMin + 15) : baseMin;
            let effectiveMax = isSuper ? 99 : baseMax;

            for (const attr of ['FIS', 'DEF', 'CRI', 'FIN', 'REF']) {
                const bias = specialty.bias[attr] || 1.0;
                const raw = rng.int(effectiveMin, effectiveMax);
                let biased = Math.round(raw * bias) + rng.int(-5, 5);
                attributes[attr] = Math.max(20, Math.min(99, biased));
            }

            switch (position) {
                case "GOL": ovr = Math.floor(attributes.REF * 0.5 + attributes.DEF * 0.2 + attributes.FIS * 0.3); break;
                case "DEF": ovr = Math.floor(attributes.DEF * 0.6 + attributes.FIS * 0.25 + attributes.CRI * 0.15); break;
                case "MEI": ovr = Math.floor(attributes.CRI * 0.5 + attributes.FIS * 0.2 + attributes.FIN * 0.15 + attributes.DEF * 0.15); break;
                case "ATA": ovr = Math.floor(attributes.FIN * 0.5 + attributes.FIS * 0.25 + attributes.CRI * 0.25); break;
                default: ovr = Math.floor((attributes.FIS + attributes.DEF + attributes.CRI + attributes.FIN + (attributes.REF || 50)) / 5);
            }

            potential = isSuper ? Math.min(99, ovr + rng.int(3, 8)) : Math.min(99, ovr + (age < 22 ? rng.int(8, 25) : rng.int(0, 10)));
            name = this.generatePlayerName();
        }

        const isSuperFinal = ovr >= 85;
        const isWonderkidFinal = !isSuperFinal && age <= 20 && (potential - ovr) >= 15;

        // Físico
        const heightByPos = { GOL: [185, 200], DEF: [175, 195], MEI: [168, 185], ATA: [170, 190] };
        const [hMin, hMax] = heightByPos[position] || [170, 190];
        const height = rng.int(hMin, hMax);
        const weightBase = Math.floor(height * 0.38 + rng.int(-5, 10));

        // Salário e Valor
        const superMult = isSuperFinal ? 3.0 : isWonderkidFinal ? 1.5 : 1.0;
        const salary = Math.max(500, Math.floor((ovr * ovr) * 1.5 * superMult + (age > 30 ? -ovr * 10 : 0)));
        const value = calcMarketValue({ playerOvr: ovr, playerAge: age, playerPotential: potential, playerContract: 52, playerForm: 0 });

        let nickname = null;
        if (isSuperFinal || (isWonderkidFinal && rng() < 0.5)) {
            nickname = rng.pick(NICKNAMES);
        }

        return {
            id: rng.int(100000, 999999).toString(36) + rng.int(100000, 999999).toString(36),
            name,
            nickname,
            position,
            specialty: specialtyName,
            attributes,
            ovr,
            potential,
            age,
            height,
            weight: weightBase,
            foot: rng.pick(FOOT),
            personality: rng.pick(PERSONALITIES),
            energy: 100,
            moral: 60 + rng.int(-15, 25),
            salary,
            value,
            isTitular: false,
            isSuper: isSuperFinal,
            isWonderkid: isWonderkidFinal,
        };
    },

    /**
     * MEGA PATCH: generateSquad agora cria um elenco com DIVERSIDADE real.
     * Se o time existir no banco de dados real (PLAYERS_BY_TEAM), injeta os jogadores reais.
     * Preenche lacunas com a geração procedural avançada.
     */
    generateSquad(tier, teamBudget = 0, teamName = "") {
        const squad = [];
        const formation = ["GOL", "DEF", "DEF", "DEF", "DEF", "MEI", "MEI", "MEI", "ATA", "ATA", "ATA"];
        const benchPositions = ["GOL", "DEF", "DEF", "MEI", "MEI", "ATA", "ATA"];
        
        // Copiar os jogadores reais do time (se houver) para consumirmos durante a escalação
        let realRoster = [];
        if (teamName && PLAYERS_BY_TEAM[teamName]) {
            realRoster = [...PLAYERS_BY_TEAM[teamName]];
        }

        const pickRealPlayer = (pos) => {
            if (realRoster.length === 0) return null;
            // Tentar achar um da mesma posição exata traduzida
            let index = realRoster.findIndex(p => mapSofifaPosition(p.position) === pos);
            if (index !== -1) {
                return realRoster.splice(index, 1)[0];
            }
            // Se não achar, pega o melhor jogador restante como improviso
            realRoster.sort((a, b) => b.ovr - a.ovr);
            return realRoster.shift();
        };

        // Garantir pelo menos 1 superplayer em tier 1-2 (só para geração procedural)
        const guaranteeSuper = tier <= 2;
        let superSpawned = false;
        let wonderkidSpawned = false;

        // 11 titulares
        formation.forEach((pos, idx) => {
            const realData = pickRealPlayer(pos);
            let p;

            if (realData) {
                p = this.generatePlayer(pos, tier, { realPlayer: realData, teamBudget });
            } else {
                const options = { teamBudget };
                if (guaranteeSuper && !superSpawned && idx === (tier <= 1 ? 9 : 7)) {
                    options.forceSuper = true;
                    superSpawned = true;
                }
                if (!wonderkidSpawned && idx === 5) {
                    options.forceAge = rng.int(17, 20);
                    wonderkidSpawned = true;
                }
                p = this.generatePlayer(pos, tier, options);
            }
            p.isTitular = true;
            squad.push(p);
        });

        // 7 reservas (tier ligeiramente menor)
        benchPositions.forEach(pos => {
            const realData = pickRealPlayer(pos);
            let p;

            if (realData) {
                p = this.generatePlayer(pos, tier + 0.5, { realPlayer: realData, teamBudget });
            } else {
                p = this.generatePlayer(pos, tier + 0.5, { teamBudget });
                if (rng() < 0.3 && p.age > 25) {
                    p.age = rng.int(18, 22);
                    p.potential = Math.min(99, p.ovr + rng.int(10, 25));
                    p.isWonderkid = p.potential - p.ovr >= 15;
                }
            }
            squad.push(p);
        });

        // Se sobraram jogadores reais que não entraram nos 18, adiciona-os ao banco (limite de 25)
        while (realRoster.length > 0 && squad.length < 25) {
            const realData = realRoster.shift();
            const pos = mapSofifaPosition(realData.position);
            const p = this.generatePlayer(pos, tier + 1, { realPlayer: realData, teamBudget });
            squad.push(p);
        }

        return squad;
    }
};
