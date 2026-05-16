/**
 * Form system — tracks últimas 5 participações em jogos
 * Cada jogador tem player.form = { last5: [1,0,-1,1,0], trend: 'hot'|'cold'|'normal' }
 */

export function initForm(player) {
    if (!player.form) {
        player.form = { last5: [], trend: 'normal' };
    }
}

export function updateForm(player, result) {
    initForm(player);
    // result: 1 = bom (titular em vitória/gol), 0 = neutro, -1 = ruim (derrota)
    player.form.last5.push(result);
    if (player.form.last5.length > 5) player.form.last5.shift();

    const avg = player.form.last5.length > 0
        ? player.form.last5.reduce((s, v) => s + v, 0) / player.form.last5.length
        : 0;
    if (avg >= 0.6) player.form.trend = 'hot';
    else if (avg <= -0.4) player.form.trend = 'cold';
    else player.form.trend = 'normal';
}

export function getFormEmoji(trend) {
    if (trend === 'hot') return '[HOT]';
    if (trend === 'cold') return '[COLD]';
    return '';
}

export function getFormModifier(trend) {
    if (trend === 'hot') return 1.08;   // +8% em performance
    if (trend === 'cold') return 0.92;  // -8%
    return 1.0;
}
