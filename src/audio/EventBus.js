/**
 * EventBus.js
 * Desacoplamento: jogo emite eventos → música reage
 * Pub-sub architecture, singleton pattern
 */

export class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe a um evento
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);

    // Retorna unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe de um evento
   */
  off(event, callback) {
    if (!this.listeners[event]) return;

    this.listeners[event] = this.listeners[event].filter(c => c !== callback);
  }

  /**
   * Emit um evento
   */
  emit(event, data = {}) {
    if (!this.listeners[event]) {
      // No listeners registered — expected when audio system isn't initialized
      return;
    }

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`❌ Error in event listener (${event}):`, err);
      }
    });
  }

  /**
   * List all registered events
   */
  getEvents() {
    return Object.keys(this.listeners);
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners = {};
  }
}

/**
 * Singleton instance
 */
export const eventBus = new EventBus();

/**
 * Enum de eventos suportados
 */
export const GameEvents = {
  // Match events
  MATCH_STARTED: 'matchStarted',
  MATCH_ENDED: 'matchEnded',
  GOAL_SCORED: 'goalScored',
  CARD_ISSUED: 'cardIssued',
  WHISTLE_BLOWN: 'whistleBlown',

  // Gameplay events
  GAME_PHASE_CHANGE: 'gamePhaseChange', // 'preMatch' → 'live' → 'postMatch'
  PLAYER_SUBSTITUTED: 'playerSubstituted',
  INJURY_OCCURRED: 'injuryOccurred',
  MOMENTUM_CHANGED: 'momentumChanged',

  // UI events
  MENU_OPENED: 'menuOpened',
  MENU_CLOSED: 'menuClosed',
  DASHBOARD_VIEWED: 'dashboardViewed',

  // Audio system events
  MUSIC_STATE_CHANGE: 'musicStateChange'
};

/**
 * Helper: emit com struct padrão
 */
export function emitGameEvent(event, payload = {}) {
  const timestamp = Date.now();
  eventBus.emit(event, {
    timestamp,
    ...payload
  });
}
