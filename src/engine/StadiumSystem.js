/**
 * StadiumSystem.js — Estádio, Staff e Scouting
 * Inspirado em Hattrick (stadium tiers) + FM (staff roles + scouting)
 */

// ============================================================
// ESTÁDIO
// ============================================================
export const STADIUM_LEVELS = [
    { level: 1, name: "Campo Municipal", capacity: 5000, vipSeats: 100, ticketPrice: 20, upgradeCost: 0 },
    { level: 2, name: "Arena Regional", capacity: 15000, vipSeats: 500, ticketPrice: 30, upgradeCost: 10000000 },
    { level: 3, name: "Estádio Moderno", capacity: 35000, vipSeats: 2000, ticketPrice: 40, upgradeCost: 40000000 },
    { level: 4, name: "Arena Premium", capacity: 55000, vipSeats: 5000, ticketPrice: 55, upgradeCost: 100000000 },
    { level: 5, name: "Templo do Futebol", capacity: 80000, vipSeats: 10000, ticketPrice: 70, upgradeCost: 250000000 },
];

export function getStadiumInfo(level) {
    return STADIUM_LEVELS[Math.min(level, STADIUM_LEVELS.length) - 1] || STADIUM_LEVELS[0];
}

export function calculateTicketRevenue(stadiumLevel, teamReputation) {
    const stadium = getStadiumInfo(stadiumLevel);
    const occupancy = 0.4 + (teamReputation / 200); // 40%-90%
    const attendance = Math.floor(stadium.capacity * Math.min(occupancy, 0.95));
    const vipAttendance = Math.floor(stadium.vipSeats * Math.min(occupancy + 0.1, 1.0));
    const revenue = (attendance * stadium.ticketPrice) + (vipAttendance * stadium.ticketPrice * 3);
    return { attendance, vipAttendance, revenue, stadiumName: stadium.name };
}

// ============================================================
// STAFF
// ============================================================
export const STAFF_ROLES = [
    {
        id: "physio", name: "Fisioterapeuta", emoji: "🏥",
        npc: { name: "Dr. Marina Santos", personality: "metódica" },
        cost: 50000, // semanal
        effect: { injuryReduction: 0.5, energyRecoveryBonus: 5 },
        description: "Reduz chance de lesão em 50% e melhora recuperação de energia."
    },
    {
        id: "scout", name: "Olheiro", emoji: "🔍",
        npc: { name: "Carlos Mendes", personality: "observador" },
        cost: 40000,
        effect: { scoutRange: 2, revealAttributes: true },
        description: "Revela OVR e potencial de jogadores no mercado e em outros times."
    },
    {
        id: "fitness", name: "Preparador Físico", emoji: "💪",
        npc: { name: "Sérgio Tavares", personality: "exigente" },
        cost: 45000,
        effect: { trainingBoost: 1, energyDecayReduction: 3 },
        description: "Treinos rendem +1 atributo extra e jogadores cansam menos."
    },
    {
        id: "finance", name: "Diretor Financeiro", emoji: "💰",
        npc: { name: "Patrícia Lemos", personality: "conservadora" },
        cost: 60000,
        effect: { revenueBonus: 0.1, salaryNegotiation: 0.9 },
        description: "+10% de receita e -10% nos salários negociados."
    },
    {
        id: "youth_coach", name: "Treinador de Base", emoji: "🎓",
        npc: { name: "Edson Ribeiro", personality: "paciente" },
        cost: 35000,
        effect: { youthBoost: 1, academyLevelBonus: 1 },
        description: "Jovens da base chegam com +1 OVR. Academia funciona como 1 nível acima."
    },
];

export class StaffManager {
    constructor() {
        this.hired = []; // array of staff role ids
    }

    hire(roleId) {
        if (this.hired.includes(roleId)) return { success: false, msg: "Já contratado." };
        const role = STAFF_ROLES.find(r => r.id === roleId);
        if (!role) return { success: false, msg: "Cargo inválido." };
        this.hired.push(roleId);
        return { success: true, msg: `${role.emoji} ${role.npc.name} contratado como ${role.name}!`, role };
    }

    fire(roleId) {
        if (!this.hired.includes(roleId)) return { success: false, msg: "Não contratado." };
        this.hired = this.hired.filter(id => id !== roleId);
        const role = STAFF_ROLES.find(r => r.id === roleId);
        return { success: true, msg: `${role.npc.name} demitido.` };
    }

    has(roleId) { return this.hired.includes(roleId); }

    /**
     * BUG-019 fix: retorna staff member object (role + npc) ou null
     * DashboardView (tab Clube) chama getStaff(id) — antes não existia → crash.
     */
    getStaff(roleId) {
        if (!this.hired.includes(roleId)) return null;
        return STAFF_ROLES.find(r => r.id === roleId) || null;
    }

    /**
     * Retorna todos staff hired (full role objects).
     */
    getAllStaff() {
        return this.hired.map(id => STAFF_ROLES.find(r => r.id === id)).filter(Boolean);
    }

    getWeeklyCost() {
        return this.hired.reduce((sum, id) => {
            const role = STAFF_ROLES.find(r => r.id === id);
            return sum + (role ? role.cost : 0);
        }, 0);
    }

    getEffects() {
        const effects = {};
        this.hired.forEach(id => {
            const role = STAFF_ROLES.find(r => r.id === id);
            if (role) Object.assign(effects, { [id]: role.effect });
        });
        return effects;
    }
}

// ============================================================
// SCOUTING
// ============================================================
const SCOUT_REGIONS = [
    { id: "brazil", name: "🇧🇷 Brasil", tier: 2, cost: 0 },
    { id: "argentina", name: "🇦🇷 Argentina", tier: 2, cost: 50000 },
    { id: "europe", name: "🇪🇺 Europa", tier: 1, cost: 200000 },
    { id: "africa", name: "🌍 África", tier: 3, cost: 30000 },
    { id: "asia", name: "🌏 Ásia", tier: 3, cost: 20000 },
];

export { SCOUT_REGIONS };

export function scoutRegion(regionId, hasScout, Data) {
    const region = SCOUT_REGIONS.find(r => r.id === regionId);
    if (!region) return { success: false, players: [] };

    const count = hasScout ? 5 : 2;
    const players = [];

    for (let i = 0; i < count; i++) {
        const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
        const pos = positions[Math.floor(Math.random() * positions.length)];
        const player = Data.generatePlayer(pos, region.tier);

        // Sem scout, esconde detalhes
        if (!hasScout) {
            player._hidden = true;
            player._realOvr = player.ovr;
            player.ovr = '??';
        }

        player.scoutRegion = region.name;
        player.askingPrice = player.value || (5000000 + Math.floor(Math.random() * 20000000));
        players.push(player);
    }

    return { success: true, players, region };
}
