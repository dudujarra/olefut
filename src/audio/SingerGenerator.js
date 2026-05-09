/**
 * SingerGenerator.js
 * One-shot stinger sounds: goal, card, whistle, etc.
 * Tone.js synthesis (short, punchy, pre-rendered or real-time)
 */

export class SingerGenerator {
  constructor(config = {}) {
    this.config = {
      sampleRate: config.sampleRate || 44100,
      ...config
    };
    this.stingers = {};
  }

  /**
   * Pré-gera stingers via Tone.Offline
   */
  async generateAllStingers(Tone) {
    console.log('🎺 Generating stinger sounds...');

    const stingerTypes = [
      { name: 'goal', fn: this.goalStinger },
      { name: 'goal_header', fn: this.goalHeaderStinger },
      { name: 'goal_penalty', fn: this.goalPenaltyStinger },
      { name: 'goal_own', fn: this.goalOwnStinger },
      { name: 'card_yellow', fn: this.cardYellowStinger },
      { name: 'card_red', fn: this.cardRedStinger },
      { name: 'whistle_start', fn: this.whistleStartStinger },
      { name: 'whistle_halftime', fn: this.whistleHalftimeStinger },
      { name: 'whistle_end', fn: this.whistleEndStinger },
      { name: 'injury', fn: this.injuryStinger },
      { name: 'substitution', fn: this.substitutionStinger }
    ];

    for (const stinger of stingerTypes) {
      try {
        const buffer = await this.renderStinger(stinger.name, stinger.fn, Tone);
        this.stingers[stinger.name] = buffer;
        console.log(`  ✅ ${stinger.name}`);
      } catch (err) {
        console.warn(`  ⚠️ Failed to generate ${stinger.name}:`, err.message);
      }
    }

    return this.stingers;
  }

  /**
   * Renderiza stinger individual via Tone.Offline
   */
  async renderStinger(name, generatorFn, Tone) {
    const duration = 1.5; // 1.5s max per stinger
    const numSamples = this.config.sampleRate * duration;

    const offlineContext = new OfflineAudioContext(2, numSamples, this.config.sampleRate);
    const originalContext = Tone.getContext();
    Tone.setContext(new Tone.Context(offlineContext));

    try {
      const master = new Tone.Gain().toDestination();
      const now = Tone.now();

      // Call generator function to schedule notes
      generatorFn.call(this, now, master, Tone);

      // Render
      const buffer = await offlineContext.startRendering();
      Tone.setContext(originalContext);

      return buffer;
    } catch (err) {
      Tone.setContext(originalContext);
      throw err;
    }
  }

  /**
   * Stinger: GOAL (celebração energética)
   */
  goalStinger(now, master, Tone) {
    // Synth: ascending tones (triumphant)
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0, release: 0.2 }
    }).connect(master);

    // Rising melody: C4 → E4 → G4 → C5
    synth.triggerAttackRelease('C4', '0.15', now + 0.0);
    synth.triggerAttackRelease('E4', '0.15', now + 0.2);
    synth.triggerAttackRelease('G4', '0.15', now + 0.4);
    synth.triggerAttackRelease('C5', '0.4', now + 0.6);

    // Percussion: kick + snare
    const perc = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
      harmonicity: 8,
      resonance: 800
    }).connect(master);

    perc.triggerAttackRelease('16n', now + 0.0);
    perc.triggerAttackRelease('16n', now + 0.3);
    perc.triggerAttackRelease('16n', now + 0.6);
  }

  /**
   * Stinger: GOAL HEADER (impactante, aéreo)
   */
  goalHeaderStinger(now, master, Tone) {
    const bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.1 }
    }).connect(master);

    // Deep kick + rising tone
    bass.triggerAttackRelease('C2', '0.5', now);
    bass.triggerAttackRelease('G3', '0.3', now + 0.3);

    const stab = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0, release: 0.1 }
    }).connect(master);

    stab.triggerAttackRelease(['C4', 'E4', 'G4'], '0.3', now + 0.1);
  }

  /**
   * Stinger: GOAL PENALTY (tensão + alívio)
   */
  goalPenaltyStinger(now, master, Tone) {
    const synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.03, decay: 0.5, sustain: 0, release: 0.2 }
    }).connect(master);

    // Tense rising, then release
    synth.triggerAttackRelease('D3', '0.2', now);
    synth.triggerAttackRelease('E3', '0.2', now + 0.2);
    synth.triggerAttackRelease('F#3', '0.2', now + 0.4);
    synth.triggerAttackRelease('B4', '0.5', now + 0.6); // Relief burst
  }

  /**
   * Stinger: GOAL OWN (horror/drama)
   */
  goalOwnStinger(now, master, Tone) {
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.6, sustain: 0, release: 0.3 }
    }).connect(master);

    // Descending ominous
    synth.triggerAttackRelease('G4', '0.3', now);
    synth.triggerAttackRelease('F4', '0.3', now + 0.2);
    synth.triggerAttackRelease('D#4', '0.5', now + 0.4);
    synth.triggerAttackRelease('C3', '0.4', now + 0.8); // Deep shock
  }

  /**
   * Stinger: YELLOW CARD (warning tension)
   */
  cardYellowStinger(now, master, Tone) {
    const synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.05, release: 0.1 }
    }).connect(master);

    // Harsh beep
    synth.triggerAttackRelease('A4', '0.2', now);
    synth.triggerAttackRelease('A4', '0.2', now + 0.25);
    synth.triggerAttackRelease('A#4', '0.3', now + 0.5);
  }

  /**
   * Stinger: RED CARD (grave danger)
   */
  cardRedStinger(now, master, Tone) {
    const bass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 }
    }).connect(master);

    // Deep alarming tone
    bass.triggerAttackRelease('C2', '0.5', now);
    bass.triggerAttackRelease('C2', '0.5', now + 0.3);

    const stab = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
    }).connect(master);

    stab.triggerAttackRelease('G#4', '0.3', now + 0.15);
  }

  /**
   * Stinger: WHISTLE START (bright, energetic)
   */
  whistleStartStinger(now, master, Tone) {
    const whistle = new Tone.MetalSynth({
      frequency: 800,
      envelope: { attack: 0.01, decay: 0.3, release: 0.1 },
      harmonicity: 12,
      resonance: 1000,
      octaves: 2
    }).connect(master);

    whistle.triggerAttackRelease('8n', now);
    whistle.triggerAttackRelease('8n', now + 0.4);
  }

  /**
   * Stinger: WHISTLE HALFTIME (transitional)
   */
  whistleHalftimeStinger(now, master, Tone) {
    const whistle = new Tone.MetalSynth({
      frequency: 700,
      envelope: { attack: 0.02, decay: 0.4, release: 0.1 },
      harmonicity: 10,
      resonance: 900,
      octaves: 1
    }).connect(master);

    whistle.triggerAttackRelease('4n', now);
    whistle.triggerAttackRelease('4n', now + 0.5);
    whistle.triggerAttackRelease('4n', now + 1.0);
  }

  /**
   * Stinger: WHISTLE END (definitive)
   */
  whistleEndStinger(now, master, Tone) {
    const whistle = new Tone.MetalSynth({
      frequency: 900,
      envelope: { attack: 0.01, decay: 0.5, release: 0.2 },
      harmonicity: 14,
      resonance: 1100,
      octaves: 2
    }).connect(master);

    whistle.triggerAttackRelease('2n', now);
  }

  /**
   * Stinger: INJURY (sad, concerning)
   */
  injuryStinger(now, master, Tone) {
    const pad = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0, release: 0.3 }
    }).connect(master);

    pad.triggerAttackRelease('C3', '0.6', now);
    pad.triggerAttackRelease('E#3', '0.5', now + 0.2);
  }

  /**
   * Stinger: SUBSTITUTION (neutral transition)
   */
  substitutionStinger(now, master, Tone) {
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 }
    }).connect(master);

    synth.triggerAttackRelease('F#4', '0.2', now);
    synth.triggerAttackRelease('A4', '0.2', now + 0.15);
  }

  /**
   * Toca stinger do cache (pre-rendered)
   */
  playStinger(stingerId, Tone) {
    const buffer = this.stingers[stingerId];
    if (!buffer) {
      console.warn(`⚠️ Stinger not found: ${stingerId}`);
      return null;
    }

    const player = new Tone.Player(buffer).toDestination();
    player.start(Tone.now());

    return player;
  }
}
