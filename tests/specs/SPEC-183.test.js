/**
 * SPEC-183 — Brand alignment pós-ckm
 *
 * Harness garante que codebase está alinhado a brand-guidelines.md v1.1
 * (3 fontes: Press Start 2P, Pixelify Sans, IBM Plex Mono) e que docs/design-tokens.*
 * (duplicate OLD pre-SPEC-178) foi removido.
 *
 * Falha se:
 * 1. src/**\/*.css contém Satoshi | Outfit | Geist Mono | JetBrains Mono | Courier Prime
 * 2. src/index.css importa Google Fonts Inter | Outfit | Satoshi
 * 3. docs/design-tokens.json OU docs/design-tokens.css existe
 * 4. src/components/dashboard/dashboard.css tem raw hex fora de :root/comment
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const REPO_ROOT = resolve(__dirname, '..', '..');

function walkCss(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkCss(full, out);
    else if (entry.endsWith('.css')) out.push(full);
  }
  return out;
}

const ORPHAN_FONTS = [
  "Satoshi",
  "Outfit",
  "'Geist Mono'",
  "'JetBrains Mono'",
  "'Courier Prime'",
];

const ORPHAN_GOOGLE_FONTS = ['family=Inter', 'family=Outfit', 'family=Satoshi'];

describe('SPEC-183: Brand alignment pós-ckm', () => {
  it('Rule 1: no orphan fonts in any src/**/*.css', () => {
    const cssFiles = walkCss(resolve(REPO_ROOT, 'src'));
    const violations = [];

    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf8');
      const rel = relative(REPO_ROOT, file);
      for (const font of ORPHAN_FONTS) {
        if (content.includes(font)) {
          // permitir refs apenas dentro de comentários CSS (/* ... */)
          const lines = content.split('\n');
          const hits = lines
            .map((line, i) => ({ line, n: i + 1 }))
            .filter(({ line }) => line.includes(font))
            .filter(({ line }) => {
              // skip lines that are clearly comments
              const trimmed = line.trim();
              return !(trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*'));
            });
          if (hits.length > 0) {
            violations.push({ file: rel, font, hits: hits.map((h) => h.n) });
          }
        }
      }
    }

    expect(violations, `Orphan fonts in CSS: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });

  it('Rule 2: src/index.css must not import Inter/Outfit/Satoshi from Google Fonts', () => {
    const indexCss = readFileSync(resolve(REPO_ROOT, 'src/index.css'), 'utf8');
    const violations = ORPHAN_GOOGLE_FONTS.filter((font) => indexCss.includes(font));
    expect(violations, `Banned Google Fonts in src/index.css: ${violations.join(', ')}`).toEqual([]);
  });

  it('Rule 3: docs/design-tokens.{json,css} must NOT exist (canonical is assets/design-tokens.*)', () => {
    const offenders = ['docs/design-tokens.json', 'docs/design-tokens.css'].filter((p) =>
      existsSync(resolve(REPO_ROOT, p))
    );
    expect(offenders, `Duplicate token files present: ${offenders.join(', ')}`).toEqual([]);
  });

  it('Rule 4: dashboard.css must not contain raw hex outside :root/comments', () => {
    const file = resolve(REPO_ROOT, 'src/components/dashboard/dashboard.css');
    const lines = readFileSync(file, 'utf8').split('\n');
    const hexRe = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/;
    const violations = [];

    let inRootBlock = false;
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // track block comment state
      if (trimmed.includes('/*') && !trimmed.includes('*/')) inBlockComment = true;
      if (inBlockComment && trimmed.includes('*/')) {
        inBlockComment = false;
        continue;
      }
      if (inBlockComment) continue;
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;

      // track :root block
      if (trimmed.startsWith(':root')) inRootBlock = true;
      if (inRootBlock && trimmed === '}') {
        inRootBlock = false;
        continue;
      }
      if (inRootBlock) continue;

      if (hexRe.test(line)) {
        violations.push({ line: i + 1, content: trimmed });
      }
    }

    expect(
      violations,
      `Raw hex in dashboard.css (use var(--token)):\n${violations.map((v) => `  ${v.line}: ${v.content}`).join('\n')}`
    ).toEqual([]);
  });
});
