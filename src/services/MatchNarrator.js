import { TACTIC_NARRATION } from '../engine/systems/NarrativeSystem.js';
import { drawCard } from '../engine/MatchEventsDeck.js';
import { rng as systemRng } from '../engine/rng.js';

export class MatchNarrator {
    /**
     * Traduz uma lista de Raw DTO Events gerados pelo MatchSimulator
     * em um textLog rico com strings dinâmicas, emojis e cartas narrativas.
     */
    static translate(rawEvents, homeTeam, awayTeam, homeTactic, awayTactic) {
        const textLog = [];
        
        const homeNarr = TACTIC_NARRATION[homeTactic] || TACTIC_NARRATION.normal;
        const awayNarr = TACTIC_NARRATION[awayTactic] || TACTIC_NARRATION.normal;

        for (const evt of rawEvents) {
            const min = evt.minute || 0;

            switch (evt.type) {
                case 'weather':
                    textLog.push({ minute: min, text: `🌍 Clima Local: ${evt.weatherText || '⛅ Tempo Bom'}` });
                    break;
                case 'condition':
                    textLog.push({ minute: min, text: evt.name });
                    break;
                case 'tactic':
                    textLog.push({ minute: min, text: `📋 Tática: ${evt.name}` });
                    break;
                case 'pre_match':
                case 'club_entry':
                    textLog.push({ minute: min, text: evt.text });
                    break;
                case 'filler': {
                    const narrFiller = evt.isHomeAttacking ? homeNarr : awayNarr;
                    const fillerTemplate = narrFiller.filler[Math.floor(systemRng() * narrFiller.filler.length)];
                    textLog.push({
                        minute: min,
                        text: fillerTemplate.replace('{atk}', evt.attTeam).replace('{def}', evt.defTeam)
                    });
                    break;
                }
                case 'chance': {
                    const narr = evt.isHomeAttacking ? homeNarr : awayNarr;
                    const chanceTemplate = narr.chance[Math.floor(systemRng() * narr.chance.length)];
                    const goalTemplate = narr.goal[Math.floor(systemRng() * narr.goal.length)];
                    const saveTemplate = narr.save[Math.floor(systemRng() * narr.save.length)];

                    let chanceText = chanceTemplate.replace('{atk}', evt.attTeam).replace('{def}', evt.defTeam);
                    let goalText = goalTemplate.replace('{atk}', evt.scorerName).replace('{def}', evt.defTeam);
                    let saveText = saveTemplate.replace('{atk}', evt.attTeam).replace('{def}', evt.defTeam);

                    // emergent narrative card integration
                    if (evt.scorerName && systemRng() < 0.15) {
                        const renown = Math.floor(Math.max(0, evt.scorerOvr - 50) / 10);
                        const card = drawCard(evt.scorerPosition, renown);
                        if (card && card.options && card.options.length > 0) {
                            const option = card.options[Math.floor(systemRng() * card.options.length)];
                            const tierEmoji = card.tier === 'legendary' ? '🌟' : card.tier === 'rare' ? '🔥' : card.tier === 'uncommon' ? '⚡' : '🃏';
                            chanceText = `${tierEmoji} [${card.tier.toUpperCase()}] ${evt.scorerName}: ${card.text} → "${option.label}"`;
                            goalText = option.successText;
                            saveText = option.failText;
                        }
                    }

                    textLog.push({ minute: min, text: chanceText });

                    if (evt.isGoal) {
                        const assistText = evt.assistName ? ` (assist: ${evt.assistName})` : '';
                        const setPieceLabel = evt.isSetPiece ? ' 🎯 (Alvo de Bola Parada!)' : '';
                        textLog.push({
                            minute: min,
                            text: `⚽ ${goalText}${assistText}${setPieceLabel} (${evt.homeGoals} x ${evt.awayGoals})`
                        });
                    } else {
                        textLog.push({ minute: min, text: saveText });
                    }
                    break;
                }
                case 'card': {
                    textLog.push({ minute: min, text: `🟨 Falta dura de ${evt.player}! Cartão amarelo para o ${evt.pStyle || 'jogador'} do ${evt.team}!` });
                    break;
                }
                case 'own_goal': {
                    textLog.push({ minute: min, text: `😱 GOL CONTRA! ${evt.unluckyDefName} (${evt.unluckyTeamName}) desviou para o próprio gol! (${evt.homeGoals} x ${evt.awayGoals})` });
                    break;
                }
                case 'var': {
                    textLog.push({ minute: min, text: `📺 VAR! ${evt.decision} para ${evt.affectedTeamName}!` });
                    if (evt.isGoal) {
                        textLog.push({ minute: min, text: `⚽ GOOOOL de pênalti! (${evt.homeGoals} x ${evt.awayGoals})` });
                    }
                    break;
                }
                case 'injury': {
                    textLog.push({ minute: min, text: `🤕 ${evt.injuredName} (${evt.injTeamName}) saiu de maca! Lesão durante o jogo!` });
                    break;
                }
                case 'red_card': {
                    const pStyleTxt = evt.pStyle ? ` (Conhecido por ser ${evt.pStyle})` : '';
                    textLog.push({ minute: min, text: `🟥 EXPULSO! ${evt.expelledName}${pStyleTxt} do ${evt.redTeamName} recebeu vermelho direto por agressão!` });
                    break;
                }
                case 'penalties_tie':
                    textLog.push({ minute: min, text: `⚖️ Empate! Decisão nos Pênaltis!` });
                    break;
                case 'penalties_win':
                    textLog.push({ minute: min, text: `🏆 ${evt.teamName} VENCE nos pênaltis!${evt.note}` });
                    break;
                case 'motm':
                    textLog.push({ minute: min, text: `⭐ Craque do Jogo: ${evt.name}` });
                    break;
                case 'leader':
                    textLog.push({ minute: min, text: `👔 ${evt.name} inspira o vestiário!` });
                    break;
            }
        }

        return textLog;
    }
}
