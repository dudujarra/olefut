// Regression tests: UX overhaul P0+P1+P2
// AKITA-036: BUG-016/017/018 fix + 9 melhorias UX
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TACTIC_NARRATION } from '../../src/engine/PlayerDevelopment.js';
import { isSoundEnabled, setSoundEnabled, sfx } from '../../src/utils/sound.js';
import { getInitials, getAvatarColor } from '../../src/utils/avatar.jsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('UX overhaul P0-P2: regressions', () => {
    test('P0-1: MatchView dedupe via key (minute, text)', () => {
        const file = path.join(projectRoot, 'src/components/MatchView.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/dedupe via key/);
        expect(c).toMatch(/`\${ev\.minute}-\${ev\.text}`/);
    });

    test('P0-2: Scoreboard fallback final score', () => {
        const file = path.join(projectRoot, 'src/components/MatchView.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/getDisplayScore/);
    });

    test('P0-4: Goal animation CSS keyframes', () => {
        const file = path.join(projectRoot, 'src/index.css');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/@keyframes goalPulse/);
        expect(c).toMatch(/@keyframes scoreFlash/);
    });

    test('P1-5: Narração tem 10+ templates por categoria', () => {
        // Normal/offensive devem ter 10+ chance/goal/filler
        expect(TACTIC_NARRATION.normal.chance.length).toBeGreaterThanOrEqual(10);
        expect(TACTIC_NARRATION.normal.goal.length).toBeGreaterThanOrEqual(10);
        expect(TACTIC_NARRATION.normal.filler.length).toBeGreaterThanOrEqual(10);
        expect(TACTIC_NARRATION.offensive.chance.length).toBeGreaterThanOrEqual(10);
    });

    test('P1-6: Sound utility functions exposed', () => {
        expect(typeof isSoundEnabled).toBe('function');
        expect(typeof setSoundEnabled).toBe('function');
        expect(typeof sfx.goal).toBe('function');
        expect(typeof sfx.card).toBe('function');
        expect(typeof sfx.click).toBe('function');
    });

    test('P1-7: Tooltips em stats (Help component v1.0)', () => {
        const file = path.join(projectRoot, 'src/components/DashboardView.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        // v1.0 Sprint 1: <Help id="sector.gol|def|mei|ata|moral_avg" /> + stat.energia
        const helpCount = (c.match(/<Help id="sector\.\w+|<Help id="stat\.\w+/g) || []).length;
        expect(helpCount).toBeGreaterThanOrEqual(4);
    });

    test('P1-8: Filter/sort em SquadView', () => {
        const file = path.join(projectRoot, 'src/components/SquadView.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/filterPos/);
        expect(c).toMatch(/sortBy/);
    });

    test('P1-9: Search box SquadView + MarketView', () => {
        const sFile = fs.readFileSync(path.join(projectRoot, 'src/components/SquadView.jsx'), 'utf-8');
        const mFile = fs.readFileSync(path.join(projectRoot, 'src/components/MarketView.jsx'), 'utf-8');
        expect(sFile).toMatch(/Buscar jogador/i);
        expect(mFile).toMatch(/marketSearch/);
    });

    test('P2-10: Avatar iniciais util funcional', () => {
        expect(getInitials('João Silva')).toBe('JS');
        expect(getInitials('Pedro')).toBe('PE');
        expect(getInitials('')).toBe('?');
        expect(getAvatarColor('Player1')).toMatch(/^#[0-9A-F]{6}$/i);
        // Determinismo
        expect(getAvatarColor('Test')).toBe(getAvatarColor('Test'));
    });

    test('P2-11: Pos-badge CSS classes', () => {
        const file = path.join(projectRoot, 'src/index.css');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/\.pos-badge\.GOL/);
        expect(c).toMatch(/\.pos-badge\.DEF/);
        expect(c).toMatch(/\.pos-badge\.MEI/);
        expect(c).toMatch(/\.pos-badge\.ATA/);
    });

    test('P2-12: Mobile responsive media queries', () => {
        const file = path.join(projectRoot, 'src/index.css');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/@media \(max-width: 768px\)/);
        expect(c).toMatch(/@media \(max-width: 480px\)/);
    });

    test('P2-13: Save manual + sound toggle + reset em App', () => {
        const file = path.join(projectRoot, 'src/App.jsx');
        const c = fs.readFileSync(file, 'utf-8');
        expect(c).toMatch(/handleSave/);
        expect(c).toMatch(/handleSoundToggle/);
        expect(c).toMatch(/handleReset/);
    });
});
