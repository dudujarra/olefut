/**
 * DrumFillGenerator.js
 * Markov chain drum fill generation
 * Transitions between drum patterns per-vertente
 */

export class DrumFillGenerator {
  constructor(config = {}) {
    this.config = {
      seed: config.seed || Date.now(),
      ...config
    };

    // Markov states: drum pattern templates
    this.patterns = {
      straight_4_4: [1, 0, 1, 0, 1, 0, 1, 0], // kick on 1,3,5,7
      syncopated: [1, 0, 0.5, 0, 1, 0, 0.5, 0], // syncopated kick
      double_kick: [1, 1, 0, 1, 1, 0, 1, 1],
      half_time: [1, 0, 0, 0, 1, 0, 0, 0],
      shuffle: [1, 0, 0.75, 0, 1, 0, 0.75, 0]
    };

    // Transition probabilities (Markov)
    this.transitions = {
      straight_4_4: { syncopated: 0.3, double_kick: 0.2, straight_4_4: 0.5 },
      syncopated: { straight_4_4: 0.2, half_time: 0.3, syncopated: 0.4, shuffle: 0.1 },
      double_kick: { straight_4_4: 0.4, syncopated: 0.2, double_kick: 0.4 },
      half_time: { syncopated: 0.4, shuffle: 0.3, half_time: 0.3 },
      shuffle: { syncopated: 0.3, double_kick: 0.2, shuffle: 0.5 }
    };

    // Snare patterns (counter to kick)
    this.snarePatterns = {
      standard: [0, 1, 0, 1, 0, 1, 0, 1], // on 2,4,6,8
      triplet: [0, 0.5, 1, 0, 0.5, 1, 0, 0.5],
      offbeat: [0, 0, 1, 0.5, 0, 0, 1, 0.5],
      rolls: [0, 1, 1, 1, 0, 1, 1, 1]
    };

    // Hi-hat patterns (16th notes, etc)
    this.hihatPatterns = {
      closed_16th: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], // all 16ths
      off_beat: [0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5], // on &
      swing_16th: [0.5, 0.3, 0.5, 0.5, 0.3, 0.5, 0.5, 0.3], // swing feel
      open_close: [0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0] // open+close
    };

    this.rng = this.seededRandom(this.config.seed);
  }

  /**
   * Generate drum fill (4 bars de transição)
   */
  generateFill(vertente, currentPattern = 'straight_4_4', bars = 4) {
    const fillBars = [];

    // Bar 1-3: transition via Markov
    let pattern = currentPattern;
    for (let bar = 0; bar < bars - 1; bar++) {
      const nextPattern = this.selectNextPattern(pattern);
      fillBars.push({
        bar: bar + 1,
        kick: this.patterns[nextPattern],
        snare: this.selectSnarePattern(nextPattern, vertente),
        hihat: this.selectHihatPattern(vertente),
        notes: this.generateFillNotes(vertente, bar, bars)
      });
      pattern = nextPattern;
    }

    // Bar 4: climax (double kick, snare rolls)
    fillBars.push({
      bar: bars,
      kick: this.patterns.double_kick,
      snare: this.snarePatterns.rolls,
      hihat: this.hihatPatterns.closed_16th,
      notes: this.generateFillNotes(vertente, bars - 1, bars, true)
    });

    return {
      vertente,
      bars,
      pattern,
      fills: fillBars,
      metadata: {
        startPattern: currentPattern,
        endPattern: pattern,
        complexity: this.calculateComplexity(fillBars)
      }
    };
  }

  /**
   * Markov: próximo padrão
   */
  selectNextPattern(currentPattern) {
    const transitions = this.transitions[currentPattern];
    if (!transitions) return 'straight_4_4';

    const roll = this.rng();
    let cumulative = 0;

    for (const [pattern, prob] of Object.entries(transitions)) {
      cumulative += prob;
      if (roll < cumulative) {
        return pattern;
      }
    }

    return currentPattern;
  }

  /**
   * Select snare pattern apropriado pro kick
   */
  selectSnarePattern(kickPattern, vertente) {
    if (kickPattern === 'double_kick') return this.snarePatterns.offbeat;
    if (kickPattern === 'half_time') return this.snarePatterns.rolls;
    if (kickPattern === 'shuffle') return this.snarePatterns.triplet;
    return this.snarePatterns.standard;
  }

  /**
   * Select hi-hat apropriado per-vertente
   */
  selectHihatPattern(vertente) {
    const patterns = {
      deep: this.hihatPatterns.closed_16th,
      tech: this.hihatPatterns.off_beat,
      progressive: this.hihatPatterns.swing_16th,
      funky: this.hihatPatterns.open_close,
      ambient: [0, 0, 0.2, 0, 0, 0, 0.2, 0] // minimal
    };

    return patterns[vertente] || this.hihatPatterns.closed_16th;
  }

  /**
   * Generate melodic notes pra fill (ascending/descending)
   */
  generateFillNotes(vertente, barNum, totalBars, isClimax = false) {
    const melodyMap = {
      deep: ['C4', 'D4', 'E4', 'F#4', 'G4'],
      tech: ['G3', 'A3', 'B3', 'C#4', 'D#4'],
      progressive: ['E4', 'F#4', 'G#4', 'A4', 'B4'],
      funky: ['C4', 'D4', 'E4', 'F4', 'G4'],
      ambient: ['G3', 'B3', 'D4']
    };

    const notes = melodyMap[vertente] || melodyMap.deep;
    const progression = [];

    if (isClimax) {
      // Climax: rapid ascending
      for (let i = 0; i < 8; i++) {
        progression.push({
          note: notes[i % notes.length],
          position: i / 8,
          duration: 0.25
        });
      }
    } else {
      // Normal fill: slower progression
      const step = Math.floor(barNum / totalBars * notes.length);
      for (let i = 0; i < 4; i++) {
        progression.push({
          note: notes[(step + i) % notes.length],
          position: i * 0.25,
          duration: 0.5
        });
      }
    }

    return progression;
  }

  /**
   * Calculate fill complexity (0-1)
   */
  calculateComplexity(fillBars) {
    let complexity = 0;

    fillBars.forEach(bar => {
      // Count active drums
      const kickCount = bar.kick.filter(v => v > 0).length;
      const snareCount = bar.snare.filter(v => v > 0).length;
      const hihatCount = bar.hihat.filter(v => v > 0).length;

      complexity += (kickCount + snareCount + hihatCount) / 24;
    });

    return Math.min(1, complexity / fillBars.length);
  }

  /**
   * Render fill via Tone.js
   */
  async renderFill(fillData, Tone) {
    const duration = fillData.bars * (60 / this.config.bpm) * 4; // 4 beats/bar
    const numSamples = 44100 * duration;

    const offlineContext = new OfflineAudioContext(2, numSamples, 44100);
    const originalContext = Tone.getContext();
    Tone.setContext(new Tone.Context(offlineContext));

    try {
      const master = new Tone.Gain().toDestination();
      const now = Tone.now();

      // Kick synth
      const kick = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0 }
      }).connect(master);

      // Snare synth
      const snare = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.08, release: 0.01 },
        harmonicity: 10,
        resonance: 700
      }).connect(master);

      // Hi-hat
      const hihat = new Tone.MetalSynth({
        frequency: 400,
        envelope: { attack: 0.001, decay: 0.04, release: 0 },
        harmonicity: 15,
        resonance: 900
      }).connect(master);

      // Melody
      const melody = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square', width: 0.6 },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.15 }
      }).connect(master);

      const beatDuration = 60 / this.config.bpm;

      fillData.fills.forEach((bar, barIdx) => {
        const barStart = now + barIdx * beatDuration * 4;

        // Kick
        bar.kick.forEach((velocity, beatIdx) => {
          if (velocity > 0) {
            kick.triggerAttackRelease('C1', '0.1', barStart + beatIdx * beatDuration * 0.5);
          }
        });

        // Snare
        bar.snare.forEach((velocity, beatIdx) => {
          if (velocity > 0) {
            snare.triggerAttackRelease('16n', barStart + beatIdx * beatDuration * 0.5);
          }
        });

        // Hi-hat
        bar.hihat.forEach((velocity, beatIdx) => {
          if (velocity > 0) {
            hihat.triggerAttackRelease('32n', barStart + beatIdx * beatDuration * 0.5);
          }
        });

        // Melody notes
        bar.notes.forEach(note => {
          const noteStart = barStart + note.position * beatDuration * 4;
          melody.triggerAttackRelease(
            note.note,
            note.duration,
            noteStart
          );
        });
      });

      const buffer = await offlineContext.startRendering();
      Tone.setContext(originalContext);

      return buffer;
    } catch (err) {
      Tone.setContext(originalContext);
      throw err;
    }
  }

  /**
   * Seeded RNG (Mulberry32)
   */
  seededRandom(seed) {
    return function() {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
