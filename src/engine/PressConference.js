import { rng as systemRng } from './rng.js';
/**
 * PressConference.js — Coletiva de Imprensa
 * Inspirado em FM (press conferences + mind games)
 * 
 * Acontece antes de jogos grandes e após resultados extremos.
 * Respostas afetam moral, relação com torcida, e reputação.
 */

// NPC: Jornalista
export const JOURNALISTS = [
    { name: "Marcos Brito", outlet: "ESPN Brasil", emoji: "🎙️", style: "direto" },
    { name: "Ana Luíza Ferreira", outlet: "GloboEsporte", emoji: "📺", style: "provocadora" },
    { name: "Carlos Henrique", outlet: "Gazeta Press", emoji: "📰", style: "técnico" },
];

// Contextos que disparam coletiva
export function shouldTriggerPress(streak, currentWeek, position, totalTeams) {
    if (currentWeek < 3) return false;
    if (streak <= -3) return true; // sequência de derrotas
    if (streak >= 4) return true; // sequência de vitórias
    if (position <= 2) return true; // líder
    if (position >= totalTeams - 1) return true; // lanterna
    if (currentWeek === 19) return true; // meio da temporada
    if (currentWeek >= 36) return true; // reta final
    return systemRng() < 0.15; // 15% chance aleatória
}

// Perguntas baseadas no contexto
export function generateQuestion(streak, position, totalTeams, avgMorale) {
    const journalist = JOURNALISTS[Math.floor(systemRng() * JOURNALISTS.length)];

    let question;
    if (streak <= -3) {
        question = {
            context: "crise",
            text: `${journalist.name} (${journalist.outlet}): "O time vem de ${Math.abs(streak)} derrotas seguidas. O senhor se sente pressionado? Acha que vai ser demitido?"`,
            options: [
                { id: "calm", text: "🧘 \"Confio no meu trabalho. Vamos virar isso.\"", effect: { moral: 3, boardConfidence: 2 } },
                { id: "angry", text: "🔥 \"Esse tipo de pergunta não ajuda ninguém.\"", effect: { moral: -2, boardConfidence: -1, journalistRelation: -5 } },
                { id: "humble", text: "🙏 \"Reconheço que preciso melhorar. Os jogadores estão comigo.\"", effect: { moral: 5, boardConfidence: 1 } },
                { id: "deflect", text: "😏 \"Pergunte ao adversário se ele quer trocar de lugar comigo.\"", effect: { moral: 1, boardConfidence: 0, journalistRelation: -2 } },
            ]
        };
    } else if (streak >= 4) {
        question = {
            context: "invicto",
            text: `${journalist.name} (${journalist.outlet}): "Incrível sequência de ${streak} vitórias! Qual é o segredo?"`,
            options: [
                { id: "humble", text: "🙏 \"Mérito dos jogadores. Eu só organizo.\"", effect: { moral: 3, boardConfidence: 2 } },
                { id: "confident", text: "💪 \"Esse time é campeão. Podem anotar.\"", effect: { moral: 5, boardConfidence: 3 } },
                { id: "focused", text: "🎯 \"Não mudou nada. Próximo jogo é o mais importante.\"", effect: { moral: 1, boardConfidence: 1 } },
            ]
        };
    } else if (position >= totalTeams - 1) {
        question = {
            context: "rebaixamento",
            text: `${journalist.name} (${journalist.outlet}): "O time está na zona de rebaixamento. O que o senhor diz pra torcida?"`,
            options: [
                { id: "fight", text: "💪 \"Vamos lutar até o fim. Ainda dá.\"", effect: { moral: 4, boardConfidence: 1 } },
                { id: "blame", text: "😤 \"Precisamos de reforços. O elenco é curto.\"", effect: { moral: -5, boardConfidence: -3 } },
                { id: "tactical", text: "📋 \"Estou trabalhando ajustes táticos. Confiem no processo.\"", effect: { moral: 2, boardConfidence: 2 } },
            ]
        };
    } else if (avgMorale < 35) {
        question = {
            context: "moral_baixa",
            text: `${journalist.name} (${journalist.outlet}): "Boatos de insatisfação no vestiário. A relação com o elenco está abalada?"`,
            options: [
                { id: "deny", text: "🙅 \"Não existe crise. O vestiário está unido.\"", effect: { moral: -2, boardConfidence: 0 } },
                { id: "address", text: "🤝 \"Conversei com o grupo. Vamos resolver internamente.\"", effect: { moral: 5, boardConfidence: 2 } },
                { id: "threaten", text: "⚠️ \"Quem não está feliz, a porta está aberta.\"", effect: { moral: -8, boardConfidence: 1 } },
            ]
        };
    } else {
        question = {
            context: "genérico",
            text: `${journalist.name} (${journalist.outlet}): "Como avalia o momento do time? O que espera pro próximo jogo?"`,
            options: [
                { id: "optimistic", text: "😊 \"Estamos bem. O time está evoluindo a cada jogo.\"", effect: { moral: 2, boardConfidence: 1 } },
                { id: "cautious", text: "🤔 \"Temos que manter os pés no chão. Um jogo de cada vez.\"", effect: { moral: 1, boardConfidence: 1 } },
                { id: "provocative", text: "😈 \"O adversário que se prepare. Vamos com tudo.\"", effect: { moral: 3, boardConfidence: 0, opponentEffect: true } },
            ]
        };
    }

    question.journalist = journalist;
    return question;
}

/**
 * Aplica efeito da resposta na coletiva
 */
export function applyPressEffect(team, board, effect) {
    if (!team) return;

    // Moral do elenco
    if (effect.moral) {
        team.squad.forEach(p => {
            p.moral = Math.max(0, Math.min(100, (p.moral || 50) + effect.moral));
        });
    }

    // Board confidence
    if (board && effect.boardConfidence) {
        board.confidence = Math.max(0, Math.min(100, board.confidence + effect.boardConfidence));
    }
}
