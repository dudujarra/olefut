// Regression test for BUG-015
// MatchView crashava ao acelerar partida ("TypeError: Cannot read properties of undefined (reading 'minute')")
// Issue: https://github.com/dudujarra/elifoot-web/issues/12
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const matchView = path.join(projectRoot, 'src/components/MatchView.jsx');

describe('BUG-015 regression: MatchView filters null-safe', () => {
    test('No unsafe e.minute filters', () => {
        const content = fs.readFileSync(matchView, 'utf-8');
        const lines = content.split('\n');
        const unsafe = [];
        lines.forEach((line, idx) => {
            // .filter(e => e.minute) ou .filter(n => n.minute) sem `e &&` / `e?.`
            if (/\.filter\(\s*([enx])\s*=>\s*\1\.minute/.test(line) && !/(\s\1\s*&&\s*\1\.minute|\1\?\.minute)/.test(line)) {
                unsafe.push(`Line ${idx + 1}: ${line.trim()}`);
            }
        });
        expect(unsafe).toEqual([]);
    });

    test('No unsafe e.text filters', () => {
        const content = fs.readFileSync(matchView, 'utf-8');
        const lines = content.split('\n');
        const unsafe = [];
        lines.forEach((line, idx) => {
            if (/\.filter\(\s*([en])\s*=>\s*\1\.text/.test(line) && !/(\s\1\s*&&\s*\1\.text|\1\?\.text)/.test(line)) {
                unsafe.push(`Line ${idx + 1}: ${line.trim()}`);
            }
        });
        expect(unsafe).toEqual([]);
    });

    test('Filter pattern handles undefined entries', () => {
        const events = [{ minute: 5, text: 'OK' }, undefined, { minute: 10, text: 'OK2' }, null];
        const safe = events.filter((e) => e && e.minute <= 45);
        expect(safe.length).toBe(2);
        expect(() => events.filter((e) => e && e.minute <= 45)).not.toThrow();
    });

    test('events?.home?.filter null-safe pattern', () => {
        const score = { events: { home: [{ minute: 30 }, undefined, { minute: 50 }] } };
        const htHomeGoals = score.events?.home?.filter((e) => e && e.minute <= 45).length || 0;
        expect(htHomeGoals).toBe(1);
    });

    test('events.textLog || [] handles undefined', () => {
        const score = { events: undefined };
        const allEvents = score.events?.textLog || [];
        expect(allEvents).toEqual([]);
    });
});
