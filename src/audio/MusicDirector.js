/**
 * MusicDirector.js
 * Runtime orchestrator: FSM + RTPC mapping + stem mixing
 * Gerencia transições entre contextos + controle de intensity em tempo real
 */

export class MusicDirector {
  constructor(config = {}) {
    this.config = {
      bpm: config.bpm || 120,
      ...config
    };

    // FSM States: dashboard, preMatch, live, postMatch
    this.state = 'dashboard';
    this.stems = {}; // Stems carregados (id → Tone.Player)
    this.faders = {}; // Volumes per stem
    this.rtpc = {
      momentum: 0.5,    // 0-1, afeta intensity
      intensity: 0.5,   // 0-1, afeta volume geral
      scoreDiff: 0      // -100 a +100, afeta tom
    };

    // Master mixer
    this.masterGain = null;
    this.filterNode = null;

    this.eventBus = config.eventBus || new MockEventBus();
    this.listeners = {};
  }

  /**
   * Init: configura Tone.js mixer + listeners
   */
  async init(Tone) {
    this.Tone = Tone;

    // Master mixer
    this.masterGain = new Tone.Gain(1.0);
    this.masterGain.toDestination();

    // Filter pra RTPC
    this.filterNode = new Tone.Filter({
      frequency: 5000,
      type: 'lowpass',
      rolloff: -12
    }).connect(this.masterGain);

    // Listeners
    this.eventBus.on('goalScored', (data) => this.onGoalScored(data));
    this.eventBus.on('cardIssued', (data) => this.onCardIssued(data));
    this.eventBus.on('gamePhaseChange', (data) => this.onGamePhaseChange(data));
    this.eventBus.on('matchEnded', (data) => this.onMatchEnded(data));
  }

  /**
   * Carrega stems pre-renderizados (AudioBuffer objects)
   */
  async loadStems(stemData) {
    // stemData: Array<{ id, buffer, vertente, duration }>
    for (const stem of stemData) {
      const player = new this.Tone.Player(stem.buffer)
        .connect(this.filterNode);

      player.loop = false;
      this.stems[stem.id] = {
        player,
        buffer: stem.buffer,
        vertente: stem.vertente,
        duration: stem.duration
      };

      this.faders[stem.id] = 1.0;
    }

    console.log(`✅ Loaded ${stemData.length} stems`);
  }

  /**
   * FSM: transiciona entre estados
   */
  transitionTo(newState) {
    console.log(`🎵 FSM: ${this.state} → ${newState}`);

    const previous = this.state;
    this.state = newState;

    // Crossfade: fade out previous, fade in new
    this.performCrossfade(previous, newState);
  }

  /**
   * Crossfade entre contextos (quantizado em bar boundary)
   */
  performCrossfade(fromState, toState, duration = 2) {
    // Quantiza pra próxima bar boundary
    const barDuration = (60 / this.config.bpm) * 4;
    const quantizeTime = this.Tone.Transport.nextSubdivision('1m');

    // Fade out stems do estado anterior
    const fromStems = this.getStemsForState(fromState);
    fromStems.forEach(stemId => {
      const stem = this.stems[stemId];
      if (stem) {
        stem.player.volume.setValueAtTime(this.faders[stemId], quantizeTime);
        stem.player.volume.linearRampToValueAtTime(0, quantizeTime + duration);
      }
    });

    // Fade in stems do novo estado
    const toStems = this.getStemsForState(toState);
    toStems.forEach(stemId => {
      const stem = this.stems[stemId];
      if (stem) {
        stem.player.volume.setValueAtTime(0, quantizeTime);
        stem.player.volume.linearRampToValueAtTime(this.faders[stemId], quantizeTime + duration);

        // Start playback
        if (!stem.player.state === 'started') {
          stem.player.start(quantizeTime);
        }
      }
    });
  }

  /**
   * Retorna stems ativos pro estado (por metadata.context)
   */
  getStemsForState(state) {
    const mapping = {
      'dashboard': 'context',
      'preMatch': 'preMatch',
      'live': 'match',
      'postMatch': 'postMatch'
    };

    const context = mapping[state] || state;
    return Object.values(this.stems)
      .filter(s => s.vertente === context || s.metadata?.context === context)
      .map(s => s.id);
  }

  /**
   * RTPC: atualiza parâmetros em tempo real
   * momentum, intensity, scoreDiff → filter + volume
   */
  updateRTPC(momentum, intensity, scoreDiff) {
    this.rtpc.momentum = Math.max(0, Math.min(1, momentum));
    this.rtpc.intensity = Math.max(0, Math.min(1, intensity));
    this.rtpc.scoreDiff = Math.max(-100, Math.min(100, scoreDiff));

    // Filter cutoff: high momentum = lower cutoff (tighter)
    const cutoff = 5000 - (this.rtpc.momentum * 2000); // 3000-5000 Hz
    this.filterNode.frequency.setValueAtTime(cutoff, this.Tone.now());

    // Master volume: intensity
    this.masterGain.gain.setValueAtTime(0.5 + this.rtpc.intensity * 0.5, this.Tone.now());

    // Per-stem faders: ajusta dynamics
    this.adjustStemDynamics();
  }

  /**
   * Ajusta volumes por vertente baseado em RTPC
   */
  adjustStemDynamics() {
    const baseVolume = this.rtpc.intensity;

    Object.entries(this.stems).forEach(([id, stem]) => {
      // Vertentes mais energéticas ficam louder sob momentum alto
      let multiplier = 1.0;

      if (stem.vertente === 'tech' && this.rtpc.momentum > 0.7) {
        multiplier = 1.2;
      }
      if (stem.vertente === 'ambient' && this.rtpc.momentum < 0.3) {
        multiplier = 1.1;
      }

      this.faders[id] = baseVolume * multiplier;

      if (stem.player) {
        stem.player.volume.setValueAtTime(this.faders[id], this.Tone.now());
      }
    });
  }

  /**
   * Event handlers
   */
  onGoalScored(data) {
    console.log('⚽ GOAL!', data);
    // Trigger stinger (short celebratory stem)
    this.playStinger('goal', data.moment);

    // Boost momentum
    this.updateRTPC(
      Math.min(1, this.rtpc.momentum + 0.3),
      1.0,
      this.rtpc.scoreDiff + (data.byPlayer ? 1 : -1)
    );
  }

  onCardIssued(data) {
    console.log('🟨 Card:', data);
    this.playStinger('card', data.color);

    // Decrease intensity momentarily
    this.updateRTPC(
      this.rtpc.momentum * 0.7,
      this.rtpc.intensity * 0.8,
      this.rtpc.scoreDiff
    );
  }

  onGamePhaseChange(data) {
    console.log('📍 Phase:', data.phase);
    this.transitionTo(data.phase); // 'dashboard', 'preMatch', 'live', 'postMatch'
  }

  onMatchEnded(data) {
    console.log('🏁 Match ended:', data.result);
    this.transitionTo('postMatch');

    // Play victory/defeat stinger
    const stinger = data.result === 'victory' ? 'victory' :
                   data.result === 'defeat' ? 'defeat' : 'draw';
    this.playStinger('match_end', stinger);
  }

  /**
   * Toca stinger (one-shot sound effect)
   */
  playStinger(category, moment) {
    const stingerId = `stinger_${category}_${moment}`;
    const stem = this.stems[stingerId];

    if (stem) {
      stem.player.start(this.Tone.now());
      console.log(`🎺 Stinger: ${stingerId}`);
    } else {
      console.warn(`⚠️ Stinger not found: ${stingerId}`);
    }
  }

  /**
   * Stop all playback
   */
  stop() {
    Object.values(this.stems).forEach(stem => {
      if (stem.player) {
        stem.player.stop();
      }
    });
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stop();
    this.masterGain?.dispose?.();
    this.filterNode?.dispose?.();
    Object.values(this.stems).forEach(stem => {
      stem.player?.dispose?.();
    });
  }
}

/**
 * MockEventBus (fallback se não fornecido)
 */
class MockEventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(c => c !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}
