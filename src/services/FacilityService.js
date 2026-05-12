// AKITA-RFCT-019.5: extract facility (academy/stadium) + staff from engine.
//
// Stateless service. Recebe engine como contexto, muta state in-place.
//
// Métodos:
// - triggerYouthIntake (youth academy intake)
// - upgradeAcademy
// - upgradeStadium
// - hireStaff
// - fireStaff

import { generateYouthIntake, getAcademyUpgradeCost } from '../engine/YouthAcademy';
import { getStadiumInfo } from '../engine/StadiumSystem';

export class FacilityService {
    constructor() {
        // Stateless
    }

    /**
     * Youth intake — generates novos jogadores via academia.
     */
    triggerYouthIntake(engine) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return [];
        const youths = generateYouthIntake(engine.academyLevel, team.division === 1 ? 80 : team.division === 2 ? 50 : 30);
        youths.forEach(y => team.squad.push(y));
        return youths;
    }

    /**
     * Upgrade academia (max nível 5). Cost progride.
     */
    upgradeAcademy(engine) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team || engine.academyLevel >= 5) return { success: false, msg: 'Nível máximo atingido.' };
        const cost = getAcademyUpgradeCost(engine.academyLevel);
        if (team.balance < cost) return { success: false, msg: `Saldo insuficiente. Custo: R$ ${(cost/1000000).toFixed(0)}M` };
        team.balance -= cost;
        engine.academyLevel++;
        return { success: true, msg: `Base melhorada para nível ${engine.academyLevel}! Custo: R$ ${(cost/1000000).toFixed(0)}M` };
    }

    /**
     * Upgrade estádio (max nível 5).
     */
    upgradeStadium(engine) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team || engine.stadiumLevel >= 5) return { success: false, msg: 'Nível máximo.' };
        const next = getStadiumInfo(engine.stadiumLevel + 1);
        const cost = next.upgradeCost || 999999999;
        if (team.balance < cost) return { success: false, msg: `Saldo insuficiente. Custo: R$ ${(cost/1000000).toFixed(0)}M` };
        team.balance -= cost;
        engine.stadiumLevel++;
        const info = getStadiumInfo(engine.stadiumLevel);
        return { success: true, msg: `Estádio melhorado para "${info.name}" (${info.capacity.toLocaleString()} lugares)!` };
    }

    /**
     * Hire staff (delegate to StaffManager).
     */
    hireStaff(engine, roleId) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        return engine.staff.hire(roleId);
    }

    /**
     * Fire staff (delegate to StaffManager).
     */
    fireStaff(engine, roleId) {
        return engine.staff.fire(roleId);
    }
}
