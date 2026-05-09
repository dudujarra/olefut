/**
 * SunoPromptGenerator.js
 * Generate contextualized SUNO prompts from track metadata
 */

export class SunoPromptGenerator {
  static generatePrompt(trackData) {
    const {
      id,
      vertente,
      bpm,
      context,
      moment,
      personalization = {},
      synthesis = {}
    } = trackData;

    switch (context) {
      case 'menu':
        return this.menuPrompt(vertente, bpm, moment, personalization);
      case 'match':
        return this.matchPrompt(vertente, bpm, moment, personalization);
      case 'postMatch':
        return this.postMatchPrompt(vertente, bpm, moment, personalization);
      case 'narrative':
        return this.narrativePrompt(vertente, bpm, moment, personalization);
      case 'admin':
        return this.adminPrompt(vertente, bpm);
      default:
        return this.defaultPrompt(vertente, bpm);
    }
  }

  static menuPrompt(vertente, bpm, moment, personalization) {
    const momentText = {
      'start_menu': 'epic, inspiring, stadium entrance',
      'dashboard': 'warm, professional, manager perspective',
      'player_home': 'inspiring, dramatic, hero journey',
      'chronicle': 'epic, narrativ, legend hall'
    };

    const moods = {
      'deep': 'introspective warm house vibe',
      'tech': 'industrial techno precision',
      'progressive': 'building epic crescendo',
      'funky': 'groovy brazilian house',
      'ambient': 'atmospheric ambient house'
    };

    return `${vertente} house, ${bpm} BPM, ${momentText[moment] || 'epic'}, ` +
      `${moods[vertente]}, 16-bit SNES synth warmth, ` +
      `${this.instrumentationFor(vertente)}, ` +
      `loopable 8 bars, 3:00`;
  }

  static matchPrompt(vertente, bpm, moment, personalization) {
    const { momentumFactor = 0.5, phaseOfMatch = 1, importance = 'routine' } = personalization;

    const phaseText = {
      1: 'first half setup groove',
      2: 'middle game intensity, pushing rhythm',
      3: phaseText => momentumFactor > 0.7 ? 'climax final push energy' : 'tense final moments'
    };

    const importanceText = {
      'routine': 'relaxed house groove',
      'important': 'elevated intensity, focus',
      'critical': 'maximum pressure, dramatic buildup'
    };

    const intensityDec = momentumFactor > 0.7 ? 'driving, powerful' :
                        momentumFactor > 0.3 ? 'balanced, flowing' : 'tense, defensive';

    return `${vertente} house, ${bpm} BPM, ${phaseText[phaseOfMatch] || phaseText[1]}, ` +
      `${importanceText[importance]}, ${intensityDec}, ` +
      `Brazilian percussion rolls, 16-bit SNES warmth, ` +
      `${this.instrumentationFor(vertente)}, ` +
      `dynamic layers, 2:00`;
  }

  static postMatchPrompt(vertente, bpm, moment, personalization) {
    const { importance = 'routine' } = personalization;

    const momentText = {
      'victory': 'celebratory, triumphant, cheering crowds',
      'defeat': 'melancholic, reflective, somber',
      'draw': 'contemplative, neutral, balanced'
    };

    const importanceBoost = importance === 'critical' ? ', championship level emotion' : '';

    return `${vertente} house, ${bpm} BPM, ${momentText[moment] || 'neutral'}, ` +
      `emotional resonance, storytelling${importanceBoost}, ` +
      `${this.instrumentationFor(vertente)}, ` +
      `16-bit SNES warmth, cinematic feel, 1:30`;
  }

  static narrativePrompt(vertente, bpm, moment, personalization) {
    const momentText = {
      'injury': 'tense, anxious, uncertain future, dark ambient house',
      'promotion': 'triumphant, ascending, epic buildup',
      'peak': 'heroic, legendary, hero\'s apex moment',
      'legend': 'nostalgic, epic, hall of fame induction',
      'first_win': 'inspiring breakthrough, emotional victory',
      'relegation': 'tragic, falling, epic defeat'
    };

    return `${vertente} house, ${bpm} BPM, ` +
      `${momentText[moment] || 'dramatic narrative moment'}, ` +
      `deeply emotional, storytelling synths, ` +
      `${this.instrumentationFor(vertente)}, ` +
      `16-bit SNES synth warmth, cinematic, 3:00`;
  }

  static adminPrompt(vertente, bpm) {
    return `${vertente} house, ${bpm} BPM, neutral ambient administrative vibe, ` +
      `minimal percussion, sustained warm pads, ` +
      `16-bit SNES synth warmth, background music, ` +
      `non-intrusive, loopable, 3:00`;
  }

  static defaultPrompt(vertente, bpm) {
    return `${vertente} house, ${bpm} BPM, energetic house groove, ` +
      `${this.instrumentationFor(vertente)}, ` +
      `16-bit SNES synth warmth, loopable 8 bars, 2:00`;
  }

  static instrumentationFor(vertente) {
    const instrumentation = {
      'deep': 'warm sawtooth bass, sustained pad chords, minimal kick pattern, subtle reverb',
      'tech': 'tight 808 kick, square wave bass, industrial synth stabs, crisp hi-hats',
      'progressive': 'layered sine/triangle pads, syncopated bass, building synth stabs, swelling reverb',
      'funky': 'bouncy square bass, percussive snare, groovy synth melody, latin percussion rolls',
      'ambient': 'atmospheric pad layers, breathing sine waves, sparse kick, minimal hi-hats'
    };
    return instrumentation[vertente] || instrumentation['deep'];
  }

  static generateBatch(tracks) {
    return tracks.map(track => ({
      trackId: track.id,
      prompt: this.generatePrompt(track),
      vertente: track.vertente,
      moment: track.metadata?.moment || 'unknown'
    }));
  }
}
