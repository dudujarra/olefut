/**
 * AudioController.jsx
 * React hook component that wires MusicDirector to game state.
 *
 * - Maps gameState.view → subgenre per manual seção 3.3
 * - Lazy loads master WAVs (only when view activates)
 * - Crossfade between subgêneros on view change
 * - Init via first user interaction (iOS AudioContext gate)
 * - Renders nothing — hooks only
 */

import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

// Map game views → subgenre per manual seção 3.3
const VIEW_TO_SUBGENRE = {
  start: null,                // silent menu
  dashboard: 'deep',          // manager home — Larry Heard vibe
  player_dashboard: 'ambient',// player home — chill atmospheric
  squad: 'tech',              // PreMatch/squad management
  market: 'deep',             // market/transfers
  match: 'progressive',       // live match
  player_match: 'progressive',// live match (player mode)
  standings: 'ambient',       // standings table
  monitor: 'ambient',         // performance monitor
  press: 'funky',             // press conferences (celebratory)
  shop: 'disco',              // cosmetic shop (glory)
  achievements: 'funky',      // chronicle wins
  autoplay: 'tech',           // bot self-play
  saves: 'ambient',           // save slots
  styleguide: 'ambient',
  tutorial: 'ambient',
};

const STEMS_BASE_PATH = '/audio/fase1';

export function AudioController() {
  const { gameState } = useGame();
  const [audioStarted, setAudioStarted] = useState(false);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('audio-muted') === '1'; } catch { return false; }
  });

  const ToneRef = useRef(null);
  const currentPlayerRef = useRef(null);
  const masterGainRef = useRef(null);
  const loadedBuffersRef = useRef(new Map()); // subgenre → AudioBuffer
  const currentSubgenreRef = useRef(null);

  // Init AudioContext on first user click (iOS gate per manual caveat 4)
  useEffect(() => {
    if (audioStarted || muted) return;

    const handleFirstInteraction = async () => {
      try {
        // Dynamic import — Tone.js só no client, evita SSR issues
        const Tone = await import('tone');
        ToneRef.current = Tone;

        await Tone.start();

        // Master gain — mute control + global volume
        masterGainRef.current = new Tone.Gain(0.7).toDestination();

        setAudioStarted(true);
        console.log('🎵 AudioController initialized');
      } catch (err) {
        console.error('AudioController init failed:', err);
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [audioStarted, muted]);

  // React to view changes — load + crossfade subgenre
  useEffect(() => {
    if (!audioStarted || muted) return;

    const subgenre = VIEW_TO_SUBGENRE[gameState.view] || null;
    if (subgenre === currentSubgenreRef.current) return;

    transitionToSubgenre(subgenre);
  }, [gameState.view, audioStarted, muted]);

  // Update master mute
  useEffect(() => {
    try { localStorage.setItem('audio-muted', muted ? '1' : '0'); } catch {}
    if (masterGainRef.current && ToneRef.current) {
      masterGainRef.current.gain.rampTo(muted ? 0 : 0.7, 0.3);
    }
  }, [muted]);

  async function transitionToSubgenre(subgenre) {
    const Tone = ToneRef.current;
    if (!Tone) return;

    const previousPlayer = currentPlayerRef.current;
    currentSubgenreRef.current = subgenre;

    if (!subgenre) {
      // Silent — fade out current
      if (previousPlayer) {
        previousPlayer.volume.rampTo(-60, 1.5);
        setTimeout(() => previousPlayer.dispose(), 1600);
        currentPlayerRef.current = null;
      }
      return;
    }

    // Load buffer if not cached
    let buffer = loadedBuffersRef.current.get(subgenre);
    if (!buffer) {
      try {
        const url = `${STEMS_BASE_PATH}/${subgenre}/master.wav`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`[Audio] Master not found: ${url}`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = await Tone.getContext().decodeAudioData(arrayBuffer);
        loadedBuffersRef.current.set(subgenre, buffer);
        console.log(`🎵 Loaded ${subgenre} master (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
      } catch (err) {
        console.error(`[Audio] Load failed: ${subgenre}`, err);
        return;
      }
    }

    // Create new player
    const player = new Tone.Player({
      url: buffer,
      loop: true,
      fadeIn: 1.5,
      fadeOut: 1.5,
    }).connect(masterGainRef.current);

    player.volume.value = -60;
    player.start();
    player.volume.rampTo(0, 1.5);

    // Crossfade out previous
    if (previousPlayer) {
      previousPlayer.volume.rampTo(-60, 1.5);
      setTimeout(() => {
        try { previousPlayer.stop(); previousPlayer.dispose(); } catch {}
      }, 1700);
    }

    currentPlayerRef.current = player;
    console.log(`🎵 Transition → ${subgenre}`);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentPlayerRef.current) {
        try { currentPlayerRef.current.stop(); currentPlayerRef.current.dispose(); } catch {}
      }
    };
  }, []);

  // Render mute toggle button (small, top-right)
  return (
    <button
      onClick={() => setMuted((m) => !m)}
      title={muted ? 'Unmute music' : 'Mute music'}
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 9999,
        background: '#040805',
        border: '1px solid #F1FAEE',
        borderRadius: 4,
        color: '#fff',
        cursor: 'pointer',
        fontSize: 14,
        padding: '4px 8px',
      }}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  );
}
