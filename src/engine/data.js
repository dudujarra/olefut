import { rng } from './rng.js';
import { calcMarketValue } from './MarketPricer.js';
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
        { name: "Paredão",      bias: { defending: 1.4, tactical: 1.1, technical: 1.0, creativity: 0.7, attacking: 0.5 } },
        { name: "Goleiro-Líbero", bias: { defending: 1.1, tactical: 1.3, technical: 1.2, creativity: 0.8, attacking: 0.6 } },
        { name: "Elástico",     bias: { defending: 1.5, tactical: 0.9, technical: 1.0, creativity: 0.8, attacking: 0.5 } },
        { name: "Comandante",   bias: { defending: 1.2, tactical: 1.4, technical: 0.9, creativity: 0.7, attacking: 0.5 } },
    ],
    DEF: [
        { name: "Xerife",       bias: { defending: 1.5, tactical: 1.2, technical: 0.8, creativity: 0.6, attacking: 0.5 } },
        { name: "Zagueiro Elegante", bias: { defending: 1.3, tactical: 1.1, technical: 1.2, creativity: 0.9, attacking: 0.6 } },
        { name: "Lateral Ofensivo", bias: { defending: 1.0, tactical: 1.1, technical: 1.2, creativity: 1.1, attacking: 1.2 } },
        { name: "Tanque",       bias: { defending: 1.4, tactical: 1.3, technical: 0.7, creativity: 0.5, attacking: 0.5 } },
        { name: "Leitor de Jogo", bias: { defending: 1.3, tactical: 1.4, technical: 0.9, creativity: 0.8, attacking: 0.5 } },
    ],
    MEI: [
        { name: "Maestro",      bias: { creativity: 1.5, technical: 1.4, attacking: 1.0, tactical: 0.8, defending: 0.6 } },
        { name: "Box-to-Box",   bias: { tactical: 1.3, defending: 1.2, technical: 1.1, attacking: 1.0, creativity: 0.9 } },
        { name: "Meia Atacante", bias: { creativity: 1.2, attacking: 1.4, technical: 1.3, tactical: 0.8, defending: 0.5 } },
        { name: "Volante",      bias: { defending: 1.4, tactical: 1.3, technical: 0.9, creativity: 0.7, attacking: 0.5 } },
        { name: "Engenheiro",   bias: { tactical: 1.4, creativity: 1.2, technical: 1.1, defending: 0.9, attacking: 0.8 } },
        { name: "Ponta Veloz",  bias: { attacking: 1.4, technical: 1.2, creativity: 1.1, tactical: 0.7, defending: 0.5 } },
    ],
    ATA: [
        { name: "Matador",      bias: { attacking: 1.6, technical: 1.1, tactical: 0.8, creativity: 0.7, defending: 0.4 } },
        { name: "Velocista",    bias: { attacking: 1.5, technical: 1.2, creativity: 0.9, tactical: 0.7, defending: 0.4 } },
        { name: "Centroavante", bias: { attacking: 1.4, tactical: 1.1, technical: 1.0, creativity: 0.8, defending: 0.5 } },
        { name: "Falso 9",     bias: { creativity: 1.4, attacking: 1.2, technical: 1.3, tactical: 1.0, defending: 0.5 } },
        { name: "Artilheiro de Área", bias: { attacking: 1.5, tactical: 1.0, technical: 0.9, creativity: 0.7, defending: 0.4 } },
        { name: "Ponta Driblador", bias: { technical: 1.5, creativity: 1.3, attacking: 1.2, tactical: 0.7, defending: 0.4 } },
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
        let isSuper = false;

        // Base range por tier (com overlap entre divisões pra realismo)
        const baseMin = Math.max(30, 85 - (tier * 14));
        const baseMax = Math.min(99, 95 - (tier * 8));

        let maxOvrForTier;
        if (tier <= 1) maxOvrForTier = 99;
        else if (tier <= 2) maxOvrForTier = 82;
        else if (tier <= 3) maxOvrForTier = 74;
        else maxOvrForTier = 66; // tier 4

        // Se injetamos um realPlayer da base do SoFIFA
        if (realPlayer) {
            age = realPlayer.age || 22;
            name = realPlayer.shortName || realPlayer.name;
            // Cap OVR by division tier so real players don't break lower divisions
            ovr = Math.min(realPlayer.ovr || 70, maxOvrForTier);
            potential = Math.max(ovr, Math.min(realPlayer.pot || ovr, maxOvrForTier + 10));
        } else {
            // Lógica procedural
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

            isSuper = forceSuper || rng() < (tier <= 1 ? 0.04 : tier <= 2 ? 0.015 : tier <= 3 ? 0.005 : 0.002);
            
            if (isSuper) {
                ovr = rng.int(Math.max(75, baseMin + 10), Math.min(99, baseMax + 15));
            } else {
                ovr = rng.int(baseMin, baseMax);
            }
            ovr = Math.min(ovr, maxOvrForTier);

            potential = isSuper ? Math.min(99, ovr + rng.int(3, 8)) : Math.min(99, ovr + (age < 22 ? rng.int(8, 25) : rng.int(0, 10)));
            name = this.generatePlayerName();
        }

        const isSuperFinal = isSuper || ovr >= 85;
        const isWonderkidFinal = !isSuperFinal && age <= 20 && (potential - ovr) >= 15;

        // Escolher identidade
        const specialtyPool = SPECIALTIES[position] || SPECIALTIES.MEI;
        const specialty = rng.pick(specialtyPool);
        specialtyName = specialty.name;

        // Distribuir os atributos ao redor do OVR para gerar assimetria no hexágono (Radar Chart)
        const stats = {};
        const statKeys = ['attacking', 'technical', 'tactical', 'defending', 'creativity'];
        
        let attrMax = isSuperFinal ? 99 : (maxOvrForTier + 8);

        for (const attr of statKeys) {
            const bias = specialty.bias[attr] || 1.0;
            let biased = Math.round(ovr * bias * (0.85 + (rng() * 0.3)));
            stats[attr] = Math.max(20, Math.min(attrMax, biased));
        }

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
            ...stats, // Espalha attacking, technical, tactical, defending, creativity direto no player
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
