/**
 * §15.4: PWA Service — Service Worker registration + notification management.
 *
 * Features:
 * - Auto-registers SW on first load
 * - Opt-in notification permission request
 * - Schedules local notifications for game events (season summary, transfer window)
 * - Never punishes absence (offline-first, no timers)
 */

let swRegistration = null;

/**
 * Register service worker. Call once on app init.
 */
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('[PWA] Service workers not supported');
        return null;
    }

    try {
        const base = import.meta.env?.BASE_URL || '/';
        swRegistration = await navigator.serviceWorker.register(`${base}sw.js`, {
            scope: base,
        });
        console.log('[PWA] Service worker registered:', swRegistration.scope);
        return swRegistration;
    } catch (err) {
        console.warn('[PWA] SW registration failed:', err.message);
        return null;
    }
}

/**
 * Request notification permission (opt-in only).
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    const result = await Notification.requestPermission();
    return result;
}

/**
 * Show a local notification (no push server needed).
 * Only works if permission is granted.
 *
 * @param {string} title
 * @param {object} opts - { body, tag, data }
 */
export function showLocalNotification(title, opts = {}) {
    if (!swRegistration || Notification.permission !== 'granted') return;

    swRegistration.showNotification(title, {
        body: opts.body || '',
        icon: '/elifoot-web/favicon.svg',
        tag: opts.tag || 'elifoot-event',
        data: { url: opts.url || '/' },
        silent: false,
    });
}

/**
 * §15.4: Game event notification triggers.
 * Called by engine hooks at significant moments.
 */
export const GameNotifications = {
    seasonEnd(season, trophyWon) {
        const body = trophyWon
            ? `🏆 Temporada ${season} encerrada! Você é campeão!`
            : `📊 Temporada ${season} encerrada. Veja o resumo.`;
        showLocalNotification('OléFUT — Fim de Temporada', { body, tag: 'season-end' });
    },

    transferWindow() {
        showLocalNotification('OléFUT — Janela de Transferências', {
            body: '💰 Janela de transferências aberta! Reforce seu elenco.',
            tag: 'transfer-window',
        });
    },

    youthGraduated(playerName) {
        showLocalNotification('OléFUT — Novo Talento', {
            body: `⭐ ${playerName} foi promovido da base! Confira seus atributos.`,
            tag: 'youth-grad',
        });
    },

    welcomeBack(summary) {
        showLocalNotification('OléFUT — Bem-vindo de volta!', {
            body: summary || 'Seu time espera por você. Volte ao comando!',
            tag: 'welcome-back',
        });
    },
};
