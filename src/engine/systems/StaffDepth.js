/**
 * StaffDepth — SPEC-063
 *
 * 8 staff roles with 6 attributes each. Affects training quality, scouting accuracy, injury rate.
 */

export const STAFF_ROLES = {
    assistant_manager: {
        id: 'assistant_manager',
        name: 'Assistente Técnico',
        emoji: '🧑‍🏫',
        baseSalary: 25000,
        attrs: ['tactics', 'motivation', 'leadership', 'mental_attr', 'discipline', 'judging']
    },
    coach_atk: {
        id: 'coach_atk',
        name: 'Treinador de Ataque',
        emoji: '⚔️',
        baseSalary: 18000,
        attrs: ['attacking', 'shooting', 'crossing', 'set_pieces', 'tactics', 'motivation']
    },
    coach_def: {
        id: 'coach_def',
        name: 'Treinador de Defesa',
        emoji: '🛡️',
        baseSalary: 18000,
        attrs: ['defending', 'tackling', 'positioning', 'set_pieces', 'tactics', 'motivation']
    },
    gk_coach: {
        id: 'gk_coach',
        name: 'Treinador de Goleiros',
        emoji: '🧤',
        baseSalary: 15000,
        attrs: ['goalkeeping', 'distribution', 'shotstopping', 'aerial', 'discipline', 'judging']
    },
    fitness_coach: {
        id: 'fitness_coach',
        name: 'Preparador Físico',
        emoji: '💪',
        baseSalary: 14000,
        attrs: ['fitness', 'stamina', 'strength', 'recovery', 'injury_prevention', 'science']
    },
    scout: {
        id: 'scout',
        name: 'Olheiro',
        emoji: '🔍',
        baseSalary: 12000,
        attrs: ['judging', 'world_knowledge', 'youth_potential', 'positions', 'level_assess', 'adaptability']
    },
    physio: {
        id: 'physio',
        name: 'Fisioterapeuta',
        emoji: '🏥',
        baseSalary: 10000,
        attrs: ['physiotherapy', 'sports_science', 'injury_prevention', 'recovery', 'judging', 'motivation']
    },
    analyst: {
        id: 'analyst',
        name: 'Analista de Dados',
        emoji: '📊',
        baseSalary: 11000,
        attrs: ['data_analysis', 'tactics', 'opposition_scouting', 'judging', 'reasoning', 'world_knowledge']
    }
};

export function generateStaffMember(roleId, level = 'medium') {
    const role = STAFF_ROLES[roleId];
    if (!role) return null;

    const baseLevel = { junior: 50, medium: 65, senior: 80, elite: 90 }[level] || 65;
    const variance = 15;

    const attrs = {};
    role.attrs.forEach(a => {
        attrs[a] = Math.max(30, Math.min(99, baseLevel + (Math.random() * variance * 2 - variance)));
        attrs[a] = Math.round(attrs[a]);
    });

    const salaryMult = { junior: 0.5, medium: 1.0, senior: 2.5, elite: 5.0 }[level] || 1.0;

    return {
        id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: roleId,
        name: generateStaffName(),
        age: 35 + Math.floor(Math.random() * 25),
        level,
        attrs,
        salary: Math.round(role.baseSalary * salaryMult),
        contractWeeks: 52 + Math.floor(Math.random() * 104)
    };
}

function generateStaffName() {
    const firsts = ['João', 'Carlos', 'Roberto', 'Antonio', 'Fernando', 'Marcos', 'Paulo', 'Eduardo', 'Ricardo', 'Luiz', 'Sérgio', 'Gustavo'];
    const lasts = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Pereira', 'Almeida', 'Ferreira', 'Rodrigues', 'Carvalho', 'Mendes'];
    return `${firsts[Math.floor(Math.random() * firsts.length)]} ${lasts[Math.floor(Math.random() * lasts.length)]}`;
}

export function calculateAttrAvg(staffMember) {
    if (!staffMember || !staffMember.attrs) return 0;
    const vals = Object.values(staffMember.attrs);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}
