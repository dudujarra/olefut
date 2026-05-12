/**
 * Regression test for BUG-084 — StandingsView hydration warning.
 *
 * Repro:
 *   1. Open the game in production (or any environment where React DEV checks
 *      run, e.g. `npm run dev`).
 *   2. Navigate to the standings/classificação view.
 *   3. Browser console emits:
 *        Warning: validateDOMNesting(...): <span> cannot appear as a child of <tr>.
 *      and (in newer React) a hydration mismatch error in production builds.
 *
 * Root cause:
 *   `<Tooltip>` (src/components/Tooltip.jsx) renders a `<span>` wrapper around
 *   its children. StandingsView used `<Tooltip content="..."><th>P</th></Tooltip>`
 *   directly inside `<tr>`, which expands to `<span><th>P</th></span>` inside
 *   `<tr>` — invalid HTML and a guaranteed React hydration warning.
 *
 * Fix:
 *   Replaced each `<Tooltip><th>...</th></Tooltip>` with `<th title="...">...</th>`.
 *   Native `title=` attribute keeps the UX (hover hint), produces zero wrapper
 *   elements, costs zero JS, and is accessible to assistive tech without
 *   custom ARIA work.
 *
 * Akita Mandamento #6 — ticket + fix + regression test.
 * This static check fails if anyone re-introduces `<Tooltip><th>` (or any
 * `<Tooltip>` wrapping a table-row child) in StandingsView.
 */
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const standingsFile = path.resolve(__dirname, '../../src/components/StandingsView.jsx');

const src = fs.readFileSync(standingsFile, 'utf-8');

describe('BUG-084: StandingsView hydration — no <span> inside <tr>', () => {
    test('does NOT wrap <th> with <Tooltip> (would emit <span> inside <tr>)', () => {
        // The exact bad pattern: <Tooltip ...><th ...>...</th></Tooltip>
        // Tolerate whitespace between the tags.
        const badPattern = /<Tooltip[^>]*>\s*<th\b/;
        expect(src).not.toMatch(badPattern);
    });

    test('does NOT wrap <td> with <Tooltip> either (same invariant)', () => {
        const badPattern = /<Tooltip[^>]*>\s*<td\b/;
        expect(src).not.toMatch(badPattern);
    });

    test('does NOT wrap <tr> with <Tooltip> either', () => {
        const badPattern = /<Tooltip[^>]*>\s*<tr\b/;
        expect(src).not.toMatch(badPattern);
    });

    test('preserves header semantics: title= attribute carries hint copy', () => {
        // The header cells we converted should still expose the user-facing
        // hint via title=. If someone strips the title= without restoring an
        // accessible alternative, this catches it.
        expect(src).toMatch(/<th\s+title="Pontos"/);
        expect(src).toMatch(/<th\s+title="Vitórias"/);
        expect(src).toMatch(/<th\s+title="Saldo"/);
    });

    test('does NOT import Tooltip anymore (dead import would mean someone re-added the wrapper)', () => {
        expect(src).not.toMatch(/^\s*import\s*\{\s*Tooltip\s*\}\s*from\s*['"]\.\/Tooltip['"]/m);
    });
});
