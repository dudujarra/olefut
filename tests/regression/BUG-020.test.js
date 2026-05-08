// Regression test for BUG-020
// App não persistia state (refresh = volta tela inicial, perde carreira)
// Fix: GameContext usa localStorage auto-save em mudança gameState
// Issue: https://github.com/dudujarra/elifoot-web/issues/18
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const ctxFile = path.join(projectRoot, 'src/context/GameContext.jsx');

describe('BUG-020 regression: localStorage auto-save', () => {
    test('GameContext exists', () => {
        expect(fs.existsSync(ctxFile)).toBe(true);
    });

    test('Uses localStorage', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/localStorage/);
    });

    test('SAVE_KEY constant defined', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/SAVE_KEY/);
        expect(content).toMatch(/elifoot_save/);
    });

    test('saveToStorage function exists', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/function saveToStorage/);
    });

    test('loadFromStorage function exists', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/function loadFromStorage/);
    });

    test('useEffect auto-save on gameState change', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/useEffect/);
        expect(content).toMatch(/saveToStorage\(engineRef/);
    });

    test('Class fields not serialized (avoid breaking instances)', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/ENGINE_CLASS_FIELDS/);
        expect(content).toMatch(/staff/);
    });

    test('resetGame clears storage', () => {
        const content = fs.readFileSync(ctxFile, 'utf-8');
        expect(content).toMatch(/resetGame/);
        expect(content).toMatch(/clearStorage/);
    });
});
