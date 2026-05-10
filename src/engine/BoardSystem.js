/**
 * BoardSystem.js — Diretoria, metas e demissão
 * Inspirado em FM (board confidence) + Hattrick (patience)
 */

// NPCs da diretoria
export const BOARD_MEMBERS = {
    president: { name: "Dr. Antônio Ferreira", role: "Presidente", emoji: "🏛️", patience: 6 },
    director: { name: "Helena Vieira", role: "Diretora de Futebol", emoji: "📊", patience: 4 },
};

// Gerar objetivos baseados na divisão e orçamento
export function generateObjectives(division, balance) {
    const objectives = [];

    if (division === 1) {
        if (balance > 200000000) {
            objectives.push({ id: "title", text: "Ser campeão da liga", target: 1, metric: "position", weight: 40 });
            objectives.push({ id: "cup_semi", text: "Chegar na semifinal da Copa", target: "semi", metric: "cup", weight: 20 });
        } else {
            objectives.push({ id: "top4", text: "Terminar no Top 4", target: 4, metric: "position", weight: 40 });
        }
        objectives.push({ id: "finance", text: "Não ter saldo negativo", target: 0, metric: "balance", weight: 20 });
    } else if (division === 2) {
        objectives.push({ id: "promotion", text: "Subir para a Série A", target: 2, metric: "position", weight: 50 });
        objectives.push({ id: "finance", text: "Manter finanças saudáveis", target: 0, metric: "balance", weight: 20 });
    } else {
        objectives.push({ id: "mid_table", text: "Não ser rebaixado", target: 16, metric: "position", weight: 50 });
    }

    objectives.push({ id: "morale", text: "Manter moral do elenco acima de 40%", target: 40, metric: "morale", weight: 20 });
    return objectives;
}

export class BoardSystem {
    constructor(division, balance) {
        this.confidence = 60; // 0-100
        this.objectives = generateObjectives(division, balance);
        this.isFired = false;
        this.warningGiven = false;
        this.fireProtection = 8; // semanas de graça no início
    }

    // Atualiza confiança baseado nos resultados da semana
    updateConfidence(currentPosition, totalTeams, streak, avgMorale, balance, currentWeek) {
        if (currentWeek < this.fireProtection) return; // período de graça

        let delta = 0;

        // Resultado da posição vs objetivo
        const posObj = this.objectives.find(o => o.metric === "position");
        if (posObj) {
            if (currentPosition <= posObj.target) {
                delta += 2;
            } else if (currentPosition <= posObj.target + 4) {
                delta -= 1;
            } else {
                delta -= 2;
            }
        }

        // Streak (ordem importa: testar mais extremo primeiro)
        if (streak >= 3) delta += 2;
        else if (streak <= -5) delta -= 5;
        else if (streak <= -3) delta -= 2;

        // Moral
        if (avgMorale < 30) delta -= 2;
        else if (avgMorale > 70) delta += 1;

        // Finanças
        if (balance < 0) delta -= 1;

        this.confidence = Math.max(0, Math.min(100, this.confidence + delta));

        // Warning
        if (this.confidence < 30 && !this.warningGiven) {
            this.warningGiven = true;
        }

        // Demissão
        if (this.confidence < 10) {
            this.isFired = true;
        }
    }

    getStatus() {
        if (this.confidence >= 70) return { label: "Satisfeita", color: "#39FF14", emoji: "😊" };
        if (this.confidence >= 45) return { label: "Observando", color: "#FFD700", emoji: "🤔" };
        if (this.confidence >= 25) return { label: "Insatisfeita", color: "#FF3333", emoji: "😤" };
        return { label: "Furiosa", color: "#FF3333", emoji: "🔥" };
    }
}
