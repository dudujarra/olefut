#!/usr/bin/env node
/**
 * tokens-to-css — Converte src/styles/tokens/tokens.json em CSS variables.
 *
 * Output: src/styles/tokens/{colors,spacing,typography,shadows,motion}.css
 *
 * Run: node scripts/tokens-to-css.js
 *
 * Re-rodar após editar tokens.json. Versionar arquivos CSS gerados (commitar).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'src/styles/tokens/tokens.json');
const OUTDIR = path.join(ROOT, 'src/styles/tokens');

const tokens = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

function toKebab(obj, prefix = '') {
    const lines = [];
    for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('$') || key === 'version') continue;
        const k = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const name = prefix ? `${prefix}-${k}` : k;
        if (val && typeof val === 'object') {
            if ('value' in val) {
                const comment = val.comment ? ` /* ${val.comment} */` : '';
                lines.push(`  --ef-${name}: ${val.value};${comment}`);
            } else {
                lines.push(...toKebab(val, name));
            }
        }
    }
    return lines;
}

function writeFile(filename, header, lines) {
    const content = [
        '/**',
        ` * ${header}`,
        ' * AUTO-GERADO por scripts/tokens-to-css.js — não editar manualmente.',
        ' * Source: src/styles/tokens/tokens.json',
        ` * Versão: ${tokens.version}`,
        ' */',
        ':root {',
        ...lines,
        '}',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(OUTDIR, filename), content);
    console.log(`✓ ${filename} (${lines.length} tokens)`);
}

// Generate per-category files
writeFile('colors.css', 'ELIFOOT Color Tokens', toKebab(tokens.color, 'color'));
writeFile('spacing.css', 'ELIFOOT Spacing Tokens', toKebab(tokens.space, 'space'));
writeFile('typography.css', 'ELIFOOT Typography Tokens', toKebab(tokens.font, 'font'));
writeFile('shadows.css', 'ELIFOOT Shadow Tokens', toKebab(tokens.shadow, 'shadow'));
writeFile('motion.css', 'ELIFOOT Motion Tokens', [
    ...toKebab(tokens.duration, 'dur'),
    ...toKebab(tokens.easing, 'ease')
]);
writeFile('radius.css', 'ELIFOOT Radius Tokens', toKebab(tokens.radius, 'radius'));

// Bundle index
const indexContent = [
    '/* AUTO-GERADO por scripts/tokens-to-css.js */',
    "@import './colors.css';",
    "@import './spacing.css';",
    "@import './typography.css';",
    "@import './shadows.css';",
    "@import './motion.css';",
    "@import './radius.css';",
    ''
].join('\n');
fs.writeFileSync(path.join(OUTDIR, 'index.css'), indexContent);
console.log('✓ index.css (bundle)');

// Aliases for backward compat (bevel-light/dark sem prefixo color-neutral-)
const aliasContent = [
    '/**',
    ' * ELIFOOT Token Aliases — atalhos pra tokens commumente usados.',
    ' * AUTO-GERADO por scripts/tokens-to-css.js.',
    ' */',
    ':root {',
    '  /* Aliases sem prefixo color-neutral */',
    '  --ef-bevel-light: var(--ef-color-neutral-bevel-light);',
    '  --ef-bevel-dark: var(--ef-color-neutral-bevel-dark);',
    '  --ef-bg: var(--ef-color-neutral-bg);',
    '  --ef-bg-elev: var(--ef-color-neutral-bg-elev);',
    '  --ef-bg-card: var(--ef-color-neutral-bg-card);',
    '  --ef-text-hi: var(--ef-color-neutral-text-hi);',
    '  --ef-text-md: var(--ef-color-neutral-text-md);',
    '  --ef-text-lo: var(--ef-color-neutral-text-lo);',
    '}',
    ''
].join('\n');
fs.writeFileSync(path.join(OUTDIR, 'aliases.css'), aliasContent);
console.log('✓ aliases.css');

console.log('\nDone. Tokens sync em src/styles/tokens/');
