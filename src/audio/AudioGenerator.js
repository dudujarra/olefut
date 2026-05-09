/**
 * AudioGenerator.js
 * Orchestrates 72-track generation: metadata + MIDI + SUNO prompts
 * (Tone.js synthesis happens in browser or via Suno API)
 */

import { MidiBuilder } from './MidiBuilder.js';
import { SunoPromptGenerator } from './SunoPromptGenerator.js';

export class AudioGenerator {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || 'public/audio',
      dryRun: config.dryRun || false,
      seed: config.seed || Date.now(),
      ...config
    };
    this.tracks = [];
    this.manifest = {
      totalCount: 0,
      vertentes: {},
      categories: {}
    };
  }

  async generate() {
    console.log('🎵 Starting audio generation...');
    const startTime = Date.now();

    try {
      // Tier 1: Context (4 fixed)
      await this.generateContextTracks();
      console.log(`✅ Context tracks: ${this.tracks.length}`);

      // Tier 2: Pre-Match (2)
      await this.generatePreMatchTracks();
      console.log(`✅ Pre-match tracks: ${this.tracks.length}`);

      // Tier 3: Match (50 base grooves)
      await this.generateMatchTracks();
      console.log(`✅ Match tracks: ${this.tracks.length}`);

      // Tier 4: Post-Match (9)
      await this.generatePostMatchTracks();
      console.log(`✅ Post-match tracks: ${this.tracks.length}`);

      // Tier 5: Narrative (6)
      await this.generateNarrativeTracks();
      console.log(`✅ Narrative tracks: ${this.tracks.length}`);

      // Tier 6: Admin (1)
      await this.generateAdminTracks();
      console.log(`✅ Admin tracks: ${this.tracks.length}`);

      // Build manifest
      this.buildManifest();

      const elapsed = Date.now() - startTime;
      console.log(`\n🎉 Generation complete: ${this.tracks.length} tracks in ${(elapsed / 1000).toFixed(2)}s`);

      return this.buildOutput();
    } catch (error) {
      console.error('❌ Generation failed:', error);
      return {
        generated: { tracks: [], manifest: {} },
        validation: { passed: false, errors: [error.message], warnings: [] },
        sunoPrompts: []
      };
    }
  }

  async generateContextTracks() {
    const contexts = [
      { id: 'context_start_menu', moment: 'start_menu', vertente: 'progressive' },
      { id: 'context_dashboard', moment: 'dashboard', vertente: 'deep' },
      { id: 'context_player_home', moment: 'player_home', vertente: 'ambient' },
      { id: 'context_chronicle', moment: 'chronicle', vertente: 'progressive' }
    ];

    for (const ctx of contexts) {
      const track = await this.synthesizeTrack({
        id: ctx.id,
        vertente: ctx.vertente,
        bpm: this.bpmFor(ctx.vertente),
        context: 'context',
        moment: ctx.moment,
        duration: 3 // 3 minutes
      });
      this.tracks.push(track);
    }
  }

  async generatePreMatchTracks() {
    const preMatches = [
      { id: 'prematch_formation', moment: 'formation', vertente: 'tech', bpm: 128 },
      { id: 'prematch_buildup', moment: 'stadium_entry', vertente: 'progressive', bpm: 125 }
    ];

    for (const pm of preMatches) {
      const track = await this.synthesizeTrack({
        id: pm.id,
        vertente: pm.vertente,
        bpm: pm.bpm,
        context: 'preMatch',
        moment: pm.moment,
        duration: 2.5
      });
      this.tracks.push(track);
    }
  }

  async generateMatchTracks() {
    // 50 base grooves with momentum variations
    const importances = ['routine', 'important', 'critical'];
    const grooveCount = 50;

    for (let i = 0; i < grooveCount; i++) {
      const vertente = this.selectVertenteProbabilistic(i);
      const importance = importances[i % importances.length];
      const momentumFactor = (i % 10) / 10; // 0.0 - 0.9

      // Generate 3 phases: start, mid, end
      for (let phase = 1; phase <= 3; phase++) {
        const track = await this.synthesizeTrack({
          id: `match_base_${String(i).padStart(2, '0')}_phase${phase}`,
          vertente,
          bpm: this.bpmFor(vertente),
          context: 'match',
          moment: phase === 1 ? 'first_half' : phase === 2 ? 'mid_game' : 'final_push',
          duration: 2,
          personalization: {
            momentumFactor,
            phaseOfMatch: phase,
            importance
          }
        });
        this.tracks.push(track);
      }
    }
  }

  async generatePostMatchTracks() {
    // 3 base outcomes × 3 importance levels = 9
    const outcomes = ['victory', 'defeat', 'draw'];
    const importances = ['routine', 'important', 'critical'];

    for (const outcome of outcomes) {
      for (const importance of importances) {
        const vertente = outcome === 'victory' ? 'funky' :
                        outcome === 'defeat' ? 'ambient' : 'progressive';

        const track = await this.synthesizeTrack({
          id: `postmatch_${outcome}_${importance}`,
          vertente,
          bpm: this.bpmFor(vertente),
          context: 'postMatch',
          moment: outcome,
          duration: 1.5,
          personalization: { importance }
        });
        this.tracks.push(track);
      }
    }
  }

  async generateNarrativeTracks() {
    const narratives = [
      { id: 'narrative_injury', moment: 'injury', vertente: 'ambient' },
      { id: 'narrative_promotion', moment: 'promotion', vertente: 'progressive' },
      { id: 'narrative_peak', moment: 'peak', vertente: 'progressive' },
      { id: 'narrative_legend', moment: 'legend', vertente: 'progressive' },
      { id: 'narrative_first_win', moment: 'first_win', vertente: 'funky' },
      { id: 'narrative_relegation', moment: 'relegation', vertente: 'ambient' }
    ];

    for (const narrative of narratives) {
      const track = await this.synthesizeTrack({
        id: narrative.id,
        vertente: narrative.vertente,
        bpm: this.bpmFor(narrative.vertente),
        context: 'narrative',
        moment: narrative.moment,
        duration: 3
      });
      this.tracks.push(track);
    }
  }

  async generateAdminTracks() {
    const track = await this.synthesizeTrack({
      id: 'admin_transition',
      vertente: 'ambient',
      bpm: 110,
      context: 'admin',
      moment: 'menu_transition',
      duration: 3
    });
    this.tracks.push(track);
  }

  async synthesizeTrack(trackConfig) {
    const {
      id,
      vertente,
      bpm,
      context,
      moment,
      duration,
      personalization = {}
    } = trackConfig;

    // Generate MIDI metadata
    const midiDuration = Math.ceil(duration / 4); // convert seconds to bars
    const midiData = MidiBuilder.buildMidi(vertente, bpm, midiDuration);
    const midiBuffer = MidiBuilder.toBuffer(midiData);

    // Generate Suno prompt
    const sunoPrompt = SunoPromptGenerator.generatePrompt({
      id,
      vertente,
      bpm,
      context,
      moment,
      personalization
    });

    // Metadata only (no actual WAV synthesis in Node)
    // WAV files generated via Suno API or browser Tone.js
    return {
      id,
      filename: `${id}.wav`,
      vertente,
      duration,
      bpm,
      midiBase: `${id}.mid`,
      waveform: null, // Generated via Suno
      metadata: {
        context,
        moment,
        personalization,
        sunoPrompt,
        synthesis: {
          oscs: this.oscsFor(vertente),
          effects: ['reverb', 'delay', 'distortion', 'compressor'],
          masterChain: 'synth → effects → compressor → limiter → output'
        }
      }
    };
  }


  bpmFor(vertente) {
    const bpms = {
      'deep': 115,
      'tech': 128,
      'progressive': 122,
      'funky': 124,
      'ambient': 105
    };
    return bpms[vertente] || 120;
  }

  oscsFor(vertente) {
    const oscs = {
      'deep': ['sawtooth', 'triangle', 'sine'],
      'tech': ['sine', 'square', 'sawtooth'],
      'progressive': ['sine', 'square', 'sawtooth', 'triangle'],
      'funky': ['square', 'sawtooth', 'triangle'],
      'ambient': ['triangle', 'sine']
    };
    return oscs[vertente] || ['sine'];
  }

  selectVertenteProbabilistic(index) {
    // Distribute vertentes: deep=12, tech=18, prog=20, funky=15, ambient=7
    const distributions = [
      ...Array(12).fill('deep'),
      ...Array(18).fill('tech'),
      ...Array(20).fill('progressive'),
      ...Array(15).fill('funky'),
      ...Array(7).fill('ambient')
    ];
    return distributions[index % distributions.length];
  }

  buildManifest() {
    const categories = {
      context: 0,
      preMatch: 0,
      match: 0,
      postMatch: 0,
      narrative: 0,
      admin: 0
    };

    const vertentes = {
      deep: 0,
      tech: 0,
      progressive: 0,
      funky: 0,
      ambient: 0
    };

    for (const track of this.tracks) {
      const ctx = track.metadata.context;
      if (categories.hasOwnProperty(ctx)) {
        categories[ctx]++;
      }
      if (vertentes.hasOwnProperty(track.vertente)) {
        vertentes[track.vertente]++;
      }
    }

    this.manifest = {
      totalCount: this.tracks.length,
      vertentes,
      categories
    };
  }

  buildOutput() {
    const sunoPrompts = SunoPromptGenerator.generateBatch(this.tracks);

    return {
      generated: {
        tracks: this.tracks,
        manifest: this.manifest
      },
      validation: {
        passed: this.tracks.length >= 72,
        errors: this.tracks.length < 72 ? [`Only ${this.tracks.length} tracks generated, need 72+`] : [],
        warnings: []
      },
      sunoPrompts
    };
  }
}
