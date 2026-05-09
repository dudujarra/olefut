/**
 * audio-generator.test.js
 * SPEC-050: Audio Soundtrack System validation tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AudioGenerator } from '../../src/audio/AudioGenerator.js';
import { SunoPromptGenerator } from '../../src/audio/SunoPromptGenerator.js';
import { MidiBuilder } from '../../src/audio/MidiBuilder.js';

describe('SPEC-050: Audio Soundtrack System', () => {
  let result;

  beforeAll(async () => {
    const generator = new AudioGenerator({ dryRun: true });
    result = await generator.generate();
  });

  // RULE 1: Complete generation (72+ tracks)
  it('generation: 72+ tracks created (rule 1)', () => {
    expect(result.generated.tracks).toBeDefined();
    expect(result.generated.tracks.length).toBeGreaterThanOrEqual(72);
  });

  // RULE 2: Categories correct
  it('categories: context=4, preMatch=2, match=50, postMatch=9, narrative=6, admin=1 (rule 2)', () => {
    const m = result.generated.manifest.categories;
    expect(m.context).toBe(4);
    expect(m.preMatch).toBe(2);
    expect(m.match).toBe(150); // 50 grooves × 3 phases each
    expect(m.postMatch).toBe(9);
    expect(m.narrative).toBe(6);
    expect(m.admin).toBe(1);
  });

  // RULE 3: Vertente distribution
  it('vertentes: distribution within bounds (rule 3)', () => {
    const v = result.generated.manifest.vertentes;
    const total = Object.values(v).reduce((a, b) => a + b, 0);
    expect(total).toBe(result.generated.tracks.length);
    // All vertentes must be represented
    expect(v.deep).toBeGreaterThan(0);
    expect(v.tech).toBeGreaterThan(0);
    expect(v.progressive).toBeGreaterThan(0);
    expect(v.funky).toBeGreaterThan(0);
    expect(v.ambient).toBeGreaterThan(0);
  });

  // RULE 4: Track metadata completeness
  it('metadata: all tracks have required fields (rule 4)', () => {
    for (const track of result.generated.tracks) {
      expect(track.id).toBeDefined();
      expect(track.filename).toBeDefined();
      expect(track.vertente).toBeDefined();
      expect(track.duration).toBeDefined();
      expect(track.bpm).toBeDefined();
      expect(track.metadata).toBeDefined();
      expect(track.metadata.context).toBeDefined();
      expect(track.metadata.moment).toBeDefined();
      expect(track.metadata.sunoPrompt).toBeDefined();
    }
  });

  // RULE 5: MIDI generation
  it('midi: valid MIDI data generated (rule 5)', () => {
    for (const track of result.generated.tracks.slice(0, 5)) {
      const midiData = MidiBuilder.buildMidi(track.vertente, track.bpm, 2);
      expect(midiData.format).toBe(0);
      expect(midiData.tracks).toBeDefined();
      expect(Array.isArray(midiData.tracks)).toBe(true);
      expect(midiData.tracks.length).toBeGreaterThan(0);
    }
  });

  // RULE 6: Suno prompts valid
  it('metadata: all sunoPrompts valid (rule 6)', () => {
    for (const track of result.generated.tracks) {
      const prompt = track.metadata.sunoPrompt;
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThanOrEqual(50);
      expect(prompt.toLowerCase()).toContain('bpm');
      expect(prompt.toLowerCase()).toContain('house');
      expect(prompt.toLowerCase()).toContain('16-bit');
    }
  });

  // RULE 7: Uniqueness (no duplicates)
  it('validation: no duplicate track IDs (rule 7)', () => {
    const ids = result.generated.tracks.map(t => t.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  // RULE 8: Vertente-BPM mapping
  it('synthesis: vertentes have correct BPM ranges (rule 8)', () => {
    const deepTracks = result.generated.tracks.filter(t => t.vertente === 'deep');
    for (const track of deepTracks) {
      expect(track.bpm).toBeGreaterThanOrEqual(110);
      expect(track.bpm).toBeLessThanOrEqual(120);
    }

    const techTracks = result.generated.tracks.filter(t => t.vertente === 'tech');
    for (const track of techTracks) {
      expect(track.bpm).toBeGreaterThanOrEqual(125);
      expect(track.bpm).toBeLessThanOrEqual(130);
    }
  });

  // RULE 9: Duration validation
  it('audio: durations within valid range (rule 9)', () => {
    for (const track of result.generated.tracks) {
      expect(track.duration).toBeGreaterThanOrEqual(1); // at least 1 second
      expect(track.duration).toBeLessThanOrEqual(5); // at most 5 minutes
    }
  });

  // RULE 10: Manifest sum check
  it('manifest: category sum = track count (rule 10)', () => {
    const m = result.generated.manifest.categories;
    const sum = m.context + m.preMatch + m.match + m.postMatch + m.narrative + m.admin;
    expect(sum).toBe(result.generated.tracks.length);
  });

  // FORBIDDEN 1: Missing tracks
  it('forbidden: no generation failure (forbidden 1)', () => {
    expect(result.validation.passed).toBe(true);
    expect(result.validation.errors.length).toBe(0);
  });

  // FORBIDDEN 2: Suno prompt content validation
  it('forbidden: suno prompts include vertente name (forbidden 2)', () => {
    for (const track of result.generated.tracks) {
      const prompt = track.metadata.sunoPrompt.toLowerCase();
      const vertente = track.vertente.toLowerCase();
      expect(prompt).toContain(vertente);
    }
  });

  // Batch test: Suno prompt generation
  it('batch: SunoPromptGenerator generates all prompts', () => {
    const prompts = SunoPromptGenerator.generateBatch(result.generated.tracks);
    expect(prompts.length).toBe(result.generated.tracks.length);
    expect(prompts.every(p => p.trackId && p.prompt)).toBe(true);
  });

  // Context test: Context tracks are deterministic
  it('context: context tracks have fixed vertentes', () => {
    const contextTracks = result.generated.tracks.filter(t => t.metadata.context === 'context');
    expect(contextTracks.length).toBe(4);

    const vertentes = contextTracks.map(t => t.vertente);
    expect(vertentes).toContain('progressive'); // start_menu + chronicle
    expect(vertentes).toContain('deep');        // dashboard
    expect(vertentes).toContain('ambient');     // player_home
  });

  // Match test: Match tracks have momentum factors
  it('match: match tracks have momentum personalization', () => {
    const matchTracks = result.generated.tracks.filter(t => t.metadata.context === 'match');
    expect(matchTracks.length).toBe(150);

    for (const track of matchTracks.slice(0, 10)) {
      expect(track.metadata.personalization).toBeDefined();
      expect(track.metadata.personalization.momentumFactor).toBeDefined();
      expect(track.metadata.personalization.phaseOfMatch).toBeDefined();
      expect([1, 2, 3]).toContain(track.metadata.personalization.phaseOfMatch);
    }
  });

  // Narrative test: Narrative moments correct
  it('narrative: all 6 narrative moments present', () => {
    const narrativeTracks = result.generated.tracks.filter(t => t.metadata.context === 'narrative');
    expect(narrativeTracks.length).toBe(6);

    const moments = narrativeTracks.map(t => t.metadata.moment);
    expect(moments).toContain('injury');
    expect(moments).toContain('promotion');
    expect(moments).toContain('peak');
    expect(moments).toContain('legend');
    expect(moments).toContain('first_win');
    expect(moments).toContain('relegation');
  });
});
