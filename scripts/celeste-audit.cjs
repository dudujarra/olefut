#!/usr/bin/env node
/**
 * Celeste Audit Pipeline v1.0
 * ----------------------------
 * Varre o codebase OleFUT e reporta violacoes contra o design system
 * ISSSD-Premium (Celeste 32-bit aesthetic).
 *
 * Categorias de auditoria:
 *   1. FONT   — Fontes fora do padrao (permitidas: Press Start 2P, Pixelify Sans, IBM Plex Mono)
 *   2. RADIUS — border-radius != 0 (SNES = pixel-perfect, zero radius)
 *   3. COLOR  — Cores hardcoded que nao usam var(--token)
 *   4. INLINE — Excesso de inline styles (devem ir para CSS)
 *   5. LINK   — Links/src externos quebrados ou suspeitos
 *   6. VH     — Uso de 100vh em vez de 100dvh (Safari mobile bug)
 *   7. EMOJI  — Emojis em code (brand violation)
 *   8. ALIGN  — Hacks de alinhamento (calc%, magic numbers)
 *
 * Uso:
 *   node scripts/celeste-audit.cjs [--fix] [--json]
 */

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');
const COMPONENTS_DIR = path.join(SRC, 'components');
const STYLES_DIR = path.join(SRC, 'styles');

// --- Config ---
const ALLOWED_FONTS_RE = /Press Start 2P|Pixelify Sans|IBM Plex Mono|var\(--font|var\(--ef-font|monospace|system-ui|sans-serif|apple-system|Consolas|SF Mono|inherit/i;
const CELESTE_TOKENS = [
  '--bg-dark', '--bg-panel', '--bg-panel-hover', '--bg-panel-sunk',
  '--primary', '--primary-dark', '--primary-glow',
  '--accent', '--accent-dark',
  '--danger', '--danger-aaa', '--danger-dark',
  '--info', '--info-dark',
  '--text-main', '--text-muted',
  '--glass-border', '--border-subtle', '--border-panel',
  '--bezel-light', '--bezel-dark', '--bezel-highlight', '--bezel-drop',
];
const HARDCODED_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g;
const INLINE_STYLE_RE = /style=\{\{/g;
const BORDER_RADIUS_RE = /border-?[Rr]adius:\s+(?!0[;\s,}]|0$|'0'|0px|var\(--radius|var\(--ef-radius)/;
const FONT_FAMILY_RE = /font-?[Ff]amily:\s*['"]?([^;'"}\n]+)/;
const VH_RE = /\b100vh\b/;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/u;
const EXTERNAL_LINK_RE = /(?:href|src)=["']?(https?:\/\/[^"'\s>]+)/g;
const MAGIC_NUMBER_RE = /(?:margin|padding|top|left|right|bottom|width|height):\s*\d{3,}px/;

// Collect files
function walk(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(walk(full, exts));
    } else if (exts.some(e => item.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// --- Auditors ---
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rel = path.relative(path.resolve(__dirname, '..'), filePath);
  const issues = [];

  lines.forEach((line, i) => {
    const ln = i + 1;
    const trimmed = line.trim();

    // 1. FONT violations
    const fontMatch = line.match(FONT_FAMILY_RE);
    if (fontMatch && !ALLOWED_FONTS_RE.test(fontMatch[1])) {
      // Skip JS dynamic assignments (e.g., fontFamily: f.family, typeof value)
      const fontVal = fontMatch[1].trim();
      const isFalsePositive = /^\w+\.\w+|typeof |===|!==|&&|\|\||\?/.test(fontVal);
      if (!isFalsePositive) {
        issues.push({
          type: 'FONT',
          severity: 'error',
          file: rel,
          line: ln,
          message: `Fonte fora do padrao: "${fontVal}"`,
          fix: 'Use Press Start 2P (display), Pixelify Sans (body), ou IBM Plex Mono (mono)',
        });
      }
    }

    // 2. RADIUS violations
    if (BORDER_RADIUS_RE.test(line) && !line.includes('9999px') && !line.includes('50%')) {
      // 50% is allowed for circular elements (avatars, dots)
      const radiusVal = line.match(/border-?[Rr]adius:\s*['"]?([^;'"}\n]+)/);
      if (radiusVal && !radiusVal[1].includes('50%') && !radiusVal[1].includes('9999px')) {
        issues.push({
          type: 'RADIUS',
          severity: 'warn',
          file: rel,
          line: ln,
          message: `border-radius nao-zero: "${radiusVal[1].trim()}" — SNES = pixel-perfect (0)`,
          fix: 'Use border-radius: 0 ou var(--radius)',
        });
      }
    }

    // 3. COLOR — hardcoded hex not in a var() declaration or :root
    if (!filePath.includes('isssd-premium') && !filePath.includes('tokens') && !filePath.includes('elifoot-classic') && !filePath.includes('StyleguideView')) {
      const colors = line.match(HARDCODED_COLOR_RE);
      if (colors && !line.includes('var(--') && !trimmed.startsWith('--') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') && !trimmed.startsWith('//')) {
        // Filter known safe hex
        const safeHex = ['#000', '#000000', '#fff', '#FFF', '#FFFFFF', '#ffffff'];
        const suspicious = colors.filter(c => !safeHex.includes(c));
        if (suspicious.length > 0) {
          issues.push({
            type: 'COLOR',
            severity: 'info',
            file: rel,
            line: ln,
            message: `Cor hardcoded: ${suspicious.join(', ')} — prefira var(--token)`,
            fix: 'Mapeie para token Celeste em isssd-premium.css :root',
          });
        }
      }
    }

    // 4. INLINE style count (tracked globally)
    const inlineMatches = line.match(INLINE_STYLE_RE);
    if (inlineMatches) {
      issues.push({
        type: 'INLINE',
        severity: 'info',
        file: rel,
        line: ln,
        message: 'Inline style={{ }} — prefira classe CSS',
        fix: 'Extraia para arquivo .css do componente',
      });
    }

    // 5. VH — Safari mobile bug
    if (VH_RE.test(line) && !line.includes('100dvh')) {
      issues.push({
        type: 'VH',
        severity: 'warn',
        file: rel,
        line: ln,
        message: '100vh detectado — causa jump no Safari mobile',
        fix: 'Troque por 100dvh ou min-h-[100dvh]',
      });
    }

    // 6. EMOJI in source (skip comments, engine pattern-matching, and config arrays)
    if (EMOJI_RE.test(line) && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
      // Skip engine data-layer emoji detection (e.g., text.includes('⚽'))
      const isEngineCheck = /\.(includes|startsWith)\(['"`].*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}].*['"`]\)/u.test(line);
      // Skip config/constant arrays with emoji prefixes
      const isConfigArray = /const\s+\w+\s*=\s*\[/.test(line) || /PREFIXES|SUFFIXES|ICONS/.test(line);
      if (!isEngineCheck && !isConfigArray) {
        issues.push({
          type: 'EMOJI',
          severity: 'warn',
          file: rel,
          line: ln,
          message: 'Emoji no codigo — brand Celeste proibe emojis na UI',
          fix: 'Substitua por icone SVG ou texto',
        });
      }
    }

    // 7. LINK — external URLs
    let linkMatch;
    const linkRe = new RegExp(EXTERNAL_LINK_RE.source, 'g');
    while ((linkMatch = linkRe.exec(line)) !== null) {
      const url = linkMatch[1];
      if (url.includes('unsplash') || url.includes('placeholder.com')) {
        issues.push({
          type: 'LINK',
          severity: 'warn',
          file: rel,
          line: ln,
          message: `Link externo suspeito: ${url}`,
          fix: 'Use assets locais em /public/sprites ou /public/assets',
        });
      }
    }

    // 8. ALIGN — magic numbers
    if (MAGIC_NUMBER_RE.test(line)) {
      issues.push({
        type: 'ALIGN',
        severity: 'info',
        file: rel,
        line: ln,
        message: `Magic number grande detectado — pode causar desalinhamento`,
        fix: 'Use spacing tokens ou CSS Grid/Flexbox',
      });
    }
  });

  return issues;
}

// --- Main ---
function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');

  const jsxFiles = walk(COMPONENTS_DIR, ['.jsx', '.tsx']);
  const cssFiles = walk(STYLES_DIR, ['.css']);
  const indexCss = path.join(SRC, 'index.css');
  if (fs.existsSync(indexCss)) cssFiles.push(indexCss);

  const allFiles = [...jsxFiles, ...cssFiles];

  let allIssues = [];
  for (const file of allFiles) {
    const issues = auditFile(file);
    allIssues = allIssues.concat(issues);
  }

  if (jsonMode) {
    console.log(JSON.stringify(allIssues, null, 2));
    return;
  }

  console.log('\n========================================');
  console.log('  CELESTE AUDIT PIPELINE v1.0');
  console.log('  OleFUT ISSSD-Premium Design System');
  console.log('========================================\n');
  console.log(`Escaneando ${allFiles.length} arquivos (${jsxFiles.length} JSX/TSX + ${cssFiles.length} CSS)...\n`);

  // Summary
  const byType = {};
  const bySeverity = { error: 0, warn: 0, info: 0 };

  for (const issue of allIssues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
    bySeverity[issue.severity]++;
  }

  // Print grouped by type
  const typeOrder = ['FONT', 'RADIUS', 'COLOR', 'INLINE', 'VH', 'EMOJI', 'LINK', 'ALIGN'];
  const typeLabels = {
    FONT: 'Fontes fora do padrao',
    RADIUS: 'Border-radius nao-zero',
    COLOR: 'Cores hardcoded',
    INLINE: 'Inline styles',
    VH: '100vh (Safari bug)',
    EMOJI: 'Emojis no codigo',
    LINK: 'Links externos suspeitos',
    ALIGN: 'Magic numbers / alinhamento',
  };
  const sevIcon = { error: '\x1b[31mERR\x1b[0m', warn: '\x1b[33mWRN\x1b[0m', info: '\x1b[36mINF\x1b[0m' };

  for (const type of typeOrder) {
    const items = allIssues.filter(i => i.type === type);
    if (items.length === 0) continue;

    console.log(`\n--- ${typeLabels[type]} (${items.length}) ---`);
    // Show max 10 per type, summarize rest
    const shown = items.slice(0, 10);
    for (const item of shown) {
      console.log(`  ${sevIcon[item.severity]} ${item.file}:${item.line}`);
      console.log(`       ${item.message}`);
    }
    if (items.length > 10) {
      console.log(`  ... e mais ${items.length - 10} ocorrencias`);
    }
  }

  // Final report
  console.log('\n========================================');
  console.log('  RESUMO');
  console.log('========================================');
  console.log(`  Arquivos escaneados: ${allFiles.length}`);
  console.log(`  Total de issues:     ${allIssues.length}`);
  console.log(`  \x1b[31m  Erros:   ${bySeverity.error}\x1b[0m`);
  console.log(`  \x1b[33m  Avisos:  ${bySeverity.warn}\x1b[0m`);
  console.log(`  \x1b[36m  Info:    ${bySeverity.info}\x1b[0m`);
  console.log('');

  for (const type of typeOrder) {
    if (byType[type]) {
      console.log(`  ${type.padEnd(8)} ${(byType[type] || 0).toString().padStart(4)} ${typeLabels[type]}`);
    }
  }

  console.log('\n  Grade: ' + (bySeverity.error === 0 ? (bySeverity.warn < 10 ? '\x1b[32mA\x1b[0m' : '\x1b[33mB\x1b[0m') : '\x1b[31mC\x1b[0m'));
  console.log('========================================\n');

  process.exit(bySeverity.error > 0 ? 1 : 0);
}

main();
