/**
 * BrazilianPercussion.js
 * Brazilian percussion sampler: surdo, tamborim, agogô, caixa
 * Patterns: samba, forró, axé, bossa nova
 */

export class BrazilianPercussion {
  constructor(config = {}) {
    this.config = {
      bpm: config.bpm || 120,
      ...config
    };

    // Drum samples (synthesized, can be replaced with WAV files)
    this.samples = {
      surdo_1: this.generateSurdoSample(1), // Low boom
      surdo_2: this.generateSurdoSample(2), // Higher boom
      tamborim: this.generateTamborimSample(),
      agogo: this.generateAgogoSample(),
      caixa: this.generateCaixaSample(),
      cuica: this.generateCuicaSample(),
      pandeiro: this.generatePandeirSample()
    };

    // Pattern definitions (16 sixteenth notes = 1 bar)
    this.patterns = {
      samba: this.createSambaPattern(),
      forro: this.createForroPattern(),
      axe: this.createAxePattern(),
      bossa_nova: this.createBossaNovaPattern(),
      frevo: this.createFrevoPattern()
    };
  }

  /**
   * Generate surdo sample (low boom percussion)
   * Frequency: 80-120 Hz
   */
  generateSurdoSample(pitch = 1) {
    const data = new Float32Array(44100 * 0.5); // 0.5s sample
    const freq = pitch === 1 ? 80 : 120;
    const decay = 0.3;

    for (let i = 0; i < data.length; i++) {
      const t = i / 44100;
      const envelope = Math.exp(-t / decay);
      const wave = Math.sin((2 * Math.PI * freq * t));
      data[i] = wave * envelope * 0.7;
    }

    return data;
  }

  /**
   * Generate tamborim sample (bright jingle)
   */
  generateTamborimSample() {
    const data = new Float32Array(44100 * 0.15);
    const freqs = [800, 1200, 1600];
    const decay = 0.1;

    for (let i = 0; i < data.length; i++) {
      const t = i / 44100;
      const envelope = Math.exp(-t / decay);
      let wave = 0;

      freqs.forEach(freq => {
        wave += Math.sin(2 * Math.PI * freq * t) * 0.3;
      });

      data[i] = wave * envelope;
    }

    return data;
  }

  /**
   * Generate agogô sample (clangy, metallic)
   */
  generateAgogoSample() {
    const data = new Float32Array(44100 * 0.2);
    const freq1 = 1200, freq2 = 1800;
    const decay = 0.15;

    for (let i = 0; i < data.length; i++) {
      const t = i / 44100;
      const envelope = Math.exp(-t / decay);
      const wave = (Math.sin(2 * Math.PI * freq1 * t) +
                    Math.sin(2 * Math.PI * freq2 * t) * 0.5) / 1.5;
      data[i] = wave * envelope;
    }

    return data;
  }

  /**
   * Generate caixa (snare) sample
   */
  generateCaixaSample() {
    const data = new Float32Array(44100 * 0.2);
    const decay = 0.08;

    for (let i = 0; i < data.length; i++) {
      const t = i / 44100;
      const envelope = Math.exp(-t / decay);
      // Noise burst
      const noise = Math.random() * 2 - 1;
      // Mix with sine
      const sine = Math.sin(2 * Math.PI * 200 * t);
      data[i] = (noise * 0.6 + sine * 0.4) * envelope;
    }

    return data;
  }

  /**
   * Generate cuíca sample (whistling, sliding)
   */
  generateCuicaSample() {
    const data = new Float32Array(44100 * 0.3);
    const decay = 0.25;

    for (let i = 0; i < data.length; i++) {
      const t = i / 44100;
      const envelope = Math.exp(-t / decay);
      // Frequency sweep: 800 → 1200 Hz
      const freq = 800 + (t / 0.3) * 400;
      const wave = Math.sin(2 * Math.PI * freq * t);
      data[i] = wave * envelope * 0.6;
    }

    return data;
  }

  /**
   * Generate pandeiro sample (frame drum)
   */
  generatePandeirSample() {
    const data = new Float32Array(44100 * 0.15);
    const decay = 0.12;

    for (let i = 0; i < data.length; i++) {
      const t = i / 44100;
      const envelope = Math.exp(-t / decay);
      let wave = 0;

      // Multiple tone frequencies
      [600, 1000, 1400].forEach(freq => {
        wave += Math.sin(2 * Math.PI * freq * t) * 0.25;
      });

      // Add noise
      wave += (Math.random() * 2 - 1) * 0.2;
      data[i] = wave * envelope;
    }

    return data;
  }

  /**
   * Samba pattern (2-3-2 rhythm)
   */
  createSambaPattern() {
    return {
      name: 'samba',
      timeline: [
        { drum: 'surdo_1', positions: [0, 6, 12] }, // 1, 4, 7
        { drum: 'surdo_2', positions: [2, 8, 14] }, // 2.5, 5, 8.5
        { drum: 'tamborim', positions: [1, 3, 5, 7, 9, 11, 13, 15] }, // all off
        { drum: 'agogo', positions: [3, 7, 11, 15] },
        { drum: 'caixa', positions: [4, 12] }
      ],
      tempo_offset: 0
    };
  }

  /**
   * Forró pattern (simple, 2/4)
   */
  createForroPattern() {
    return {
      name: 'forro',
      timeline: [
        { drum: 'surdo_1', positions: [0, 8] },
        { drum: 'tamborim', positions: [2, 6, 10, 14] },
        { drum: 'pandeiro', positions: [1, 5, 9, 13] },
        { drum: 'caixa', positions: [4, 12] }
      ],
      tempo_offset: 0.1 // Forró has swing
    };
  }

  /**
   * Axé pattern (Bahian carnival)
   */
  createAxePattern() {
    return {
      name: 'axe',
      timeline: [
        { drum: 'surdo_1', positions: [0, 4, 8, 12] },
        { drum: 'tamborim', positions: [1, 3, 5, 7, 9, 11, 13, 15] },
        { drum: 'agogo', positions: [2, 6, 10, 14] },
        { drum: 'caixa', positions: [3, 7, 11, 15] },
        { drum: 'cuica', positions: [0.5, 8.5] } // Occasional slides
      ],
      tempo_offset: 0
    };
  }

  /**
   * Bossa nova pattern (sophisticated swing)
   */
  createBossaNovaPattern() {
    return {
      name: 'bossa_nova',
      timeline: [
        { drum: 'surdo_2', positions: [0, 6, 12] }, // Lighter surdo
        { drum: 'tamborim', positions: [1.5, 4.5, 9.5, 12.5] }, // Syncopated
        { drum: 'pandeiro', positions: [2, 8, 10, 14] },
        { drum: 'caixa', positions: [3.5, 11.5] } // Off-beat caixa
      ],
      tempo_offset: 0.3 // Strong swing
    };
  }

  /**
   * Frevo pattern (quick, playful)
   */
  createFrevoPattern() {
    return {
      name: 'frevo',
      timeline: [
        { drum: 'tamborim', positions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }, // Rapid fire
        { drum: 'surdo_1', positions: [0, 8] },
        { drum: 'agogo', positions: [2, 4, 6, 10, 12, 14] },
        { drum: 'cuica', positions: [3, 11] }
      ],
      tempo_offset: 0
    };
  }

  /**
   * Render pattern via Tone.js
   */
  async renderPattern(patternName, bars = 4, Tone) {
    const pattern = this.patterns[patternName];
    if (!pattern) {
      console.warn(`⚠️ Pattern not found: ${patternName}`);
      return null;
    }

    const beatDuration = 60 / this.config.bpm;
    const barDuration = beatDuration * 4; // 4 beats per bar
    const duration = bars * barDuration;
    const numSamples = 44100 * duration;

    const offlineContext = new OfflineAudioContext(2, numSamples, 44100);
    const originalContext = Tone.getContext();
    Tone.setContext(new Tone.Context(offlineContext));

    try {
      const master = new Tone.Gain().toDestination();
      const now = Tone.now();

      // Create sample buffers
      const sampleBuffers = {};
      for (const [name, data] of Object.entries(this.samples)) {
        const audioBuffer = offlineContext.createBuffer(1, data.length, 44100);
        audioBuffer.getChannelData(0).set(data);
        sampleBuffers[name] = audioBuffer;
      }

      // Render pattern for each bar
      for (let bar = 0; bar < bars; bar++) {
        pattern.timeline.forEach(({ drum, positions }) => {
          positions.forEach(pos => {
            const sampleTime = now + bar * barDuration + (pos / 16) * barDuration;
            const player = new Tone.Player(sampleBuffers[drum]).connect(master);
            player.start(sampleTime);
          });
        });
      }

      const buffer = await offlineContext.startRendering();
      Tone.setContext(originalContext);

      return buffer;
    } catch (err) {
      Tone.setContext(originalContext);
      throw err;
    }
  }

  /**
   * Get pattern matching vertente
   */
  getPatternForVertente(vertente) {
    const mapping = {
      funky: 'samba',
      deep: 'bossa_nova',
      tech: 'axe',
      progressive: 'forro',
      ambient: 'bossa_nova'
    };

    return mapping[vertente] || 'samba';
  }
}
