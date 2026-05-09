/**
 * integration-example.js
 * How to integrate MusicDirector + EventBus into your game
 * Copy patterns below into your game logic
 */

import * as Tone from 'tone';
import { MusicDirector, eventBus, GameEvents, emitGameEvent } from './index.js';

/**
 * Example: Initialize audio system on game boot
 */
export async function initAudioSystem() {
  console.log('🎵 Initializing audio system...');

  const music = new MusicDirector({
    bpm: 120,
    eventBus
  });

  await music.init(Tone);

  // Load pre-rendered stems from metadata
  try {
    const metaRes = await fetch('/audio/metadata.json');
    const { generated } = await metaRes.json();

    // Convert metadata tracks to AudioBuffer objects
    // In real scenario, you'd load WAV files from public/audio/stems/
    const stemData = await Promise.all(
      generated.tracks.slice(0, 10) // Load first 10 for demo
        .map(track => loadStemAsAudioBuffer(track.id))
    );

    await music.loadStems(stemData);
    console.log(`✅ Loaded ${stemData.length} stems`);
  } catch (err) {
    console.warn('⚠️ Could not load stems:', err.message);
  }

  return music;
}

/**
 * Example: Game loop integration
 * Call this from your game's main update loop
 */
export function updateAudioFromGameState(music, gameState) {
  // Extract game parameters
  const { momentum, intensity, score } = gameState;

  // Update RTPC (real-time parameter control)
  music.updateRTPC(
    momentum,   // 0-1, player momentum
    intensity,  // 0-1, match intensity
    score.us - score.opponent // scoreDiff
  );
}

/**
 * Example: Handle match events
 */
export function setupAudioEventListeners(music) {
  // Goal scored
  eventBus.on(GameEvents.GOAL_SCORED, (data) => {
    console.log('⚽ Goal! Updating music...');
    // MusicDirector reacts automatically, but you can add custom logic
    // e.g., trigger achievement sound, visual FX, etc.
  });

  // Card issued
  eventBus.on(GameEvents.CARD_ISSUED, (data) => {
    console.log(`🟨 ${data.color} card!`);
    // Music decreases intensity automatically
  });

  // Phase change
  eventBus.on(GameEvents.GAME_PHASE_CHANGE, (data) => {
    console.log(`📍 Phase: ${data.phase}`);
    // FSM transitions automatically
  });

  // Match ended
  eventBus.on(GameEvents.MATCH_ENDED, (data) => {
    console.log(`🏁 Match ended: ${data.result}`);
    // Victory/defeat stinger plays automatically
  });
}

/**
 * Example: Emit game events from your game logic
 */
export function emitAudioEventFromGame(eventType, payload) {
  switch (eventType) {
    case 'goal':
      emitGameEvent(GameEvents.GOAL_SCORED, {
        byPlayer: true,
        moment: Date.now(),
        ...payload
      });
      break;

    case 'card':
      emitGameEvent(GameEvents.CARD_ISSUED, {
        color: payload.color, // 'yellow' | 'red'
        player: payload.playerName,
        ...payload
      });
      break;

    case 'whistle':
      emitGameEvent(GameEvents.WHISTLE_BLOWN, {
        type: payload.type, // 'start' | 'halftime' | 'end'
        ...payload
      });
      break;

    case 'phase':
      emitGameEvent(GameEvents.GAME_PHASE_CHANGE, {
        phase: payload.phase, // 'dashboard' | 'preMatch' | 'live' | 'postMatch'
        ...payload
      });
      break;

    case 'match-end':
      emitGameEvent(GameEvents.MATCH_ENDED, {
        result: payload.result, // 'victory' | 'defeat' | 'draw'
        score: payload.score,
        ...payload
      });
      break;
  }
}

/**
 * Example: Load single stem as AudioBuffer
 * (In real scenario, fetch actual WAV file from public/audio/stems/)
 */
async function loadStemAsAudioBuffer(trackId) {
  // Demo: generate silence buffer of correct duration
  const audioContext = Tone.getContext().rawContext;
  const buffer = audioContext.createBuffer(2, 44100 * 2, 44100); // 2 seconds

  return {
    id: trackId,
    buffer,
    vertente: 'tech',
    duration: 2
  };
}

/**
 * Example: Full game flow
 */
export async function gameFlowExample() {
  // Boot
  const music = await initAudioSystem();
  setupAudioEventListeners(music);

  // Simulate game progression
  const gameState = {
    phase: 'dashboard',
    momentum: 0.5,
    intensity: 0.5,
    score: { us: 0, opponent: 0 }
  };

  // Dashboard
  music.transitionTo('dashboard');
  emitGameEvent(GameEvents.MUSIC_STATE_CHANGE, { state: 'dashboard' });

  // After 3s, start match
  await sleep(3000);
  emitAudioEventFromGame('phase', { phase: 'preMatch' });

  // After 2s, live match
  await sleep(2000);
  emitAudioEventFromGame('phase', { phase: 'live' });

  // Simulate match events
  await sleep(5000);
  gameState.momentum = 0.8;
  updateAudioFromGameState(music, gameState);

  // Goal!
  await sleep(3000);
  gameState.score.us = 1;
  emitAudioEventFromGame('goal', { byPlayer: true });

  // Continue match...
  // etc.

  console.log('✅ Game flow example complete');
}

/**
 * Helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-run example if this file is main
if (import.meta.url === `file://${process.argv[1]}`) {
  gameFlowExample().catch(console.error);
}
