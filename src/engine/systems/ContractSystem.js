// SPEC-016: Contracts & Salary System
// 5 tipos contrato. Salário semanal. Late payment = stress. Bônus por gol/assist/título.

export const CONTRACT_TYPES = {
    Novato: { minSalary: 10000, maxSalary: 30000, minDuration: 1, maxDuration: 2 },
    Junior: { minSalary: 30000, maxSalary: 100000, minDuration: 2, maxDuration: 3 },
    Senior: { minSalary: 100000, maxSalary: 500000, minDuration: 3, maxDuration: 5 },
    Veterano: { minSalary: 50000, maxSalary: 300000, minDuration: 2, maxDuration: 4 },
    Lenda: { minSalary: 200000, maxSalary: 1000000, minDuration: 1, maxDuration: 2 },
};

let nextContractId = 1;

export class ContractSystem {
    constructor() {
        this.contracts = new Map(); // playerId → contract
        this.bonusesPaid = new Map(); // contractId → { gols, assists, titles }
        this.lastPaymentWeek = new Map(); // playerId → weekOfYear
    }

    offerContract({ playerId, salary, duration, type, bonuses, startWeek = 1 }) {
        const t = CONTRACT_TYPES[type];
        if (!t) return null;
        if (duration < 1 || duration > 5) return null;
        if (duration < t.minDuration || duration > t.maxDuration) return null;
        if (salary < t.minSalary || salary > t.maxSalary) return null;

        const contract = {
            contractId: `contract_${nextContractId++}`,
            playerId,
            salary,
            duration,
            type,
            startWeek,
            endWeek: startWeek + duration * 52,
            bonuses: bonuses || { perGoal: 0, perAssist: 0, championBonus: 0 },
            accepted: true,
            active: true,
        };
        this.contracts.set(playerId, contract);
        this.bonusesPaid.set(contract.contractId, {});
        return contract;
    }

    payWeeklySalary({ teamId, weekOfYear, players = [] }) {
        let totalCost = 0;
        let latePenalty = 0;
        let count = 0;
        for (const playerId of players) {
            const contract = this.contracts.get(playerId);
            if (!contract || !contract.active) continue;

            const lastPaid = this.lastPaymentWeek.get(playerId) ?? weekOfYear - 1;
            const weeksOwed = weekOfYear - lastPaid;
            if (weeksOwed > 1) {
                latePenalty += (weeksOwed - 1) * 5; // stress por week atraso
            }
            totalCost += contract.salary;
            this.lastPaymentWeek.set(playerId, weekOfYear);
            count++;
        }
        return { teamId, weekOfYear, players: count, totalCost, paid: true, latePenalty };
    }

    payGoalBonus(playerId, goalEventId = null) {
        // BUG-009 fix: usar eventId único, não goalNumber (que repetia se chamado com numbers diff)
        // Se goalEventId não passado, gera id único timestamp+random
        const contract = this.contracts.get(playerId);
        if (!contract) return 0;
        const paid = this.bonusesPaid.get(contract.contractId) || {};
        const goalKey = goalEventId !== null ? `goal_${goalEventId}` : `goal_${Object.keys(paid).filter((k) => k.startsWith('goal_')).length + 1}`;
        if (paid[goalKey]) return 0;
        paid[goalKey] = true;
        this.bonusesPaid.set(contract.contractId, paid);
        return contract.bonuses.perGoal || 0;
    }

    payChampionBonus(playerId) {
        const contract = this.contracts.get(playerId);
        if (!contract) return 0;
        const paid = this.bonusesPaid.get(contract.contractId) || {};
        if (paid.champion) return 0;
        paid.champion = true;
        this.bonusesPaid.set(contract.contractId, paid);
        return contract.bonuses.championBonus || 0;
    }

    finishContract(playerId) {
        const contract = this.contracts.get(playerId);
        if (!contract) return null;
        contract.active = false;
        return { ...contract, status: 'free_agent' };
    }

    renewContract(playerId, { salary, duration, type = 'Senior' }) {
        const old = this.contracts.get(playerId);
        if (old && old.active) return null;
        return this.offerContract({ playerId, salary, duration, type });
    }

    getContract(playerId) {
        return this.contracts.get(playerId);
    }
}
