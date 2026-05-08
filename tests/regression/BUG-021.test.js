// Regression test for BUG-021
// Generated: 2026-05-08
// Issue: https://github.com/dudujarra/elifoot-web/issues/60
//
// Bug: React error #310 ("Rendered more hooks than during the previous render")
// caused by early return BETWEEN hooks in DashboardView + PlayerDashboardView.
// When team/player transitions exists↔null, hook count diverges between renders.
//
// Fix: All hooks (useState/useRef/useEffect) declared BEFORE early return.
// Effects internally guard with `if (!team) return;` instead of throwing.
//
// Validated via static analysis (regex source check) — runtime React render
// would require jsdom + React Testing Library setup.

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readSource(relPath) {
    return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

function findEarlyReturnLine(src) {
    // Match `if (!foo) return <...` or `if (!foo || !bar) return <...`
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*if \(!.+\) return </.test(lines[i])) {
            return { line: i + 1, text: lines[i].trim() };
        }
    }
    return null;
}

function findFirstHookLine(src) {
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/(?:React\.)?(?:useState|useRef|useEffect|useMemo|useCallback)\s*\(/.test(lines[i])
            && !lines[i].includes('//')) {
            return { line: i + 1, text: lines[i].trim() };
        }
    }
    return null;
}

function findLastHookLine(src) {
    const lines = src.split('\n');
    let last = null;
    for (let i = 0; i < lines.length; i++) {
        if (/(?:React\.)?(?:useState|useRef|useEffect|useMemo|useCallback)\s*\(/.test(lines[i])
            && !lines[i].includes('//')) {
            last = { line: i + 1, text: lines[i].trim() };
        }
    }
    return last;
}

describe('BUG-021 regression — early return must not split hooks', () => {
    test('DashboardView: early return AFTER all hooks', () => {
        const src = readSource('src/components/DashboardView.jsx');
        const ret = findEarlyReturnLine(src);
        const lastHook = findLastHookLine(src);
        expect(ret).not.toBeNull();
        expect(lastHook).not.toBeNull();
        expect(ret.line).toBeGreaterThan(lastHook.line);
    });

    test('PlayerDashboardView: early return AFTER all hooks', () => {
        const src = readSource('src/components/PlayerDashboardView.jsx');
        const ret = findEarlyReturnLine(src);
        const lastHook = findLastHookLine(src);
        expect(ret).not.toBeNull();
        expect(lastHook).not.toBeNull();
        expect(ret.line).toBeGreaterThan(lastHook.line);
    });

    test('DashboardView: useEffect guards against null team', () => {
        const src = readSource('src/components/DashboardView.jsx');
        // The useEffect must internally guard (since hooks moved before early return)
        expect(src).toMatch(/React\.useEffect\(\(\) => \{\s*if \(!team\) return;/);
    });

    test('PlayerDashboardView: useEffects guard against null player', () => {
        const src = readSource('src/components/PlayerDashboardView.jsx');
        // Both useEffects must guard
        const matches = src.match(/if \(!player\) return;/g);
        expect(matches).not.toBeNull();
        expect(matches.length).toBeGreaterThanOrEqual(2);
    });
});
