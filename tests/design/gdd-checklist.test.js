/**
 * §23 Automated Design Checklist
 *
 * Verifies GDD §1-§23 compliance automatically.
 * Each test maps to a specific design checklist item.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Engine } from '../../src/engine/engine.js';
import { CHALLENGE_MODES, getAllChallengeModes } from '../../src/engine/ChallengeModes.js';
import { canAccess, evaluateNewUnlocks, UNLOCK_CONDITIONS } from '../../src/engine/ViewUnlockSystem.js';
import { FORMATIONS, TACTICS, TEAM_TALKS, TRAINING_TYPES } from '../../src/engine/ManagerSystems.js';
import fs from 'fs';
import path from 'path';

describe('§23 GDD Automated Design Checklist', () => {
    let engine;

    // Init fresh engine for each test group
    beforeAll(() => {
        engine = new Engine();
        engine.initGame('Checklist Bot', 1);
    });

    // === BEFORE BUILDING checks ===
    describe('Player Fantasy & Framework', () => {
        it('§1.3 Bartle types — Achiever systems exist', () => {
            // Achievements = achiever system
            expect(fs.existsSync(path.resolve('src/engine/systems/AchievementsSystem.js'))).toBe(true);
        });

        it('§1.2 DDA — DifficultyModes exist', () => {
            expect(fs.existsSync(path.resolve('src/engine/systems/DifficultyModes.js'))).toBe(true);
        });

        it('§12.4 Octalysis — at least 2 drives per challenge mode', () => {
            getAllChallengeModes().forEach(mode => {
                expect(mode.octalysis.length).toBeGreaterThanOrEqual(2);
            });
        });
    });

    // === DURING BUILDING checks ===
    describe('Engine Integrity', () => {
        it('§6.1 seeded PRNG — rng.js exists, no Math.random in engine', () => {
            expect(fs.existsSync(path.resolve('src/engine/rng.js'))).toBe(true);
            // Scan engine files for Math.random (should be zero)
            const engineDir = path.resolve('src/engine');
            const files = fs.readdirSync(engineDir).filter(f => f.endsWith('.js'));
            files.forEach(f => {
                const content = fs.readFileSync(path.join(engineDir, f), 'utf8');
                const matches = content.match(/Math\.random\(\)/g);
                // Allow only comments mentioning Math.random
                if (matches) {
                    const lines = content.split('\n');
                    lines.forEach(line => {
                        if (line.includes('Math.random()') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                            // Fail: non-comment Math.random found
                            expect(`${f} uses Math.random()`).toBe('should use seeded RNG');
                        }
                    });
                }
            });
        });

        it('§10 architecture — engine has zero DOM imports', () => {
            const engineDir = path.resolve('src/engine');
            const files = fs.readdirSync(engineDir).filter(f => f.endsWith('.js'));
            files.forEach(f => {
                const content = fs.readFileSync(path.join(engineDir, f), 'utf8');
                expect(content).not.toContain("import React");
                expect(content).not.toContain("document.");
                expect(content).not.toContain("window.");
            });
        });


    });

    // === AFTER BUILDING checks ===
    describe('Gameplay Completeness', () => {
        it('§16.2 ceremonies — TrophyCeremony component exists', () => {
            expect(fs.existsSync(path.resolve('src/components/TrophyCeremony.jsx'))).toBe(true);
        });

        it('§19.1 progressive disclosure — ViewUnlockSystem has conditions', () => {
            expect(Object.keys(UNLOCK_CONDITIONS).length).toBeGreaterThanOrEqual(5);
        });

        it('§14.2 challenge modes — at least 5 pre-set modes', () => {
            expect(getAllChallengeModes().length).toBeGreaterThanOrEqual(5);
        });

        it('§12.1 core loop speed — formations + tactics + training exist', () => {
            expect(Object.keys(FORMATIONS).length).toBeGreaterThan(0);
            expect(Object.keys(TACTICS).length).toBeGreaterThan(0);
            expect(TRAINING_TYPES.length).toBeGreaterThan(0);
        });

        it('§20.3 interrupt events — InterruptEvents.js exists', () => {
            expect(fs.existsSync(path.resolve('src/engine/InterruptEvents.js'))).toBe(true);
        });

        it('§22.5 season awards — engine has seasonAwards capability', () => {
            expect(typeof engine.seasonAwards).not.toBe('undefined');
        });

        it('§22.7 accessibility — prefers-reduced-motion in CSS', () => {
            const cssFiles = [
                'src/index.css',
                'src/styles/animations.css',
                'src/styles/progressive-disclosure.css',
                'src/styles/gdd-systems.css',
            ];
            let found = 0;
            cssFiles.forEach(f => {
                if (fs.existsSync(path.resolve(f))) {
                    const content = fs.readFileSync(path.resolve(f), 'utf8');
                    if (content.includes('prefers-reduced-motion')) found++;
                }
            });
            expect(found).toBeGreaterThanOrEqual(3);
        });



        it('§8 narrative — ChronicleSystem + NarrativeService exist', () => {
            expect(fs.existsSync(path.resolve('src/engine/ChronicleSystem.js'))).toBe(true);
            expect(fs.existsSync(path.resolve('src/services/NarrativeService.js'))).toBe(true);
        });
    });
});
