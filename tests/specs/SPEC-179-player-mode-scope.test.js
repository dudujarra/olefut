/**
 * SPEC-179 — Player Mode Features Scope harness
 *
 * Asserts (Regra 0 — no spec without harness):
 *   1. The 4 player-only / player-related engine files carry the "PLAYER MODE ONLY"
 *      marker + "SPEC-179" reference in their leading documentation comment.
 *   2. .gitignore contains a `dist` rule, preventing accidental commit of the
 *      ~465 MB `dist/audio` build artifact (samples WAV from `npm run render:*`).
 *   3. The SPEC markdown itself exists and discusses dist/audio.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');

const PLAYER_MODE_FILES = [
  'src/engine/BenchEventsDeck.js',
  'src/engine/OffPitchEventsDeck.js',
  'src/engine/NpcBehaviorProfile.js',
  'src/engine/PlayerCareer.js',
];

const MARKER = 'PLAYER MODE ONLY';
const SPEC_REF = 'SPEC-179';
const MARKER_WINDOW = 30; // first N lines

describe('SPEC-179: Player Mode Features Scope', () => {
  it.each(PLAYER_MODE_FILES)(
    '%s carries the PLAYER MODE ONLY / SPEC-179 marker in its header',
    (rel) => {
      const full = join(ROOT, rel);
      expect(existsSync(full), `file missing: ${rel}`).toBe(true);
      const head = readFileSync(full, 'utf8').split('\n').slice(0, MARKER_WINDOW).join('\n');
      expect(head, `${rel} missing "${MARKER}" in first ${MARKER_WINDOW} lines`).toContain(MARKER);
      expect(head, `${rel} missing "${SPEC_REF}" reference in first ${MARKER_WINDOW} lines`).toContain(SPEC_REF);
    },
  );

  it('.gitignore contains a dist rule (blocks accidental commit of dist/audio build artifact)', () => {
    const gi = readFileSync(join(ROOT, '.gitignore'), 'utf8');
    const lines = gi.split('\n').map((l) => l.trim());
    const hasDistRule = lines.some(
      (l) => l === 'dist' || l === '/dist' || l === 'dist/' || l === '/dist/',
    );
    expect(hasDistRule, '.gitignore must ignore dist/ — see SPEC-179 §2').toBe(true);
  });

  it('SPEC-179 markdown exists in specs/ and mentions dist/audio', () => {
    const specPath = join(ROOT, 'specs', 'SPEC-179-player-mode-features-scope.md');
    expect(existsSync(specPath), `expected ${specPath}`).toBe(true);
    const txt = readFileSync(specPath, 'utf8');
    expect(txt).toContain('Player Mode Features Scope');
    expect(txt).toContain('dist/audio');
    // Sanity: spec must cover both decision tracks (A = Promote / B = Hide).
    expect(txt).toMatch(/\*\*A\b.*Promote/);
    expect(txt).toMatch(/\*\*B\b.*Hide/);
  });
});
