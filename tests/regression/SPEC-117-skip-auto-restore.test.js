// Regression test for AKITA-204 — AdaptiveBrain skipAutoRestore opt-in.
//
// Bug latente: todos NPCs criados pelo engine compartilhavam STORAGE_KEY
// ('elifoot_autoplay_brain'). Constructor chamava _restore() que lia desse
// key, hidratando TODO NPC com a mesma persona persistida (a do último save
// do autoplay). Quebrava SPEC-117 unique-OCEAN contract.
//
// Fix: constructor aceita { skipAutoRestore }. Engine passa true para NPCs.
//
// Este teste é o 3º artefato (Mandamento #6 — ticket + fix + regression test).
import { describe, test, expect, beforeEach } from 'vitest';
import { AdaptiveBrain } from '../../src/services/learning/AdaptiveBrain.js';

// Some envs (Node sem --localstorage-file ou --experimental-webstorage) não expõem
// localStorage global. Tests que dependem de persistência são skipped nesses envs;
// os que apenas verificam comportamento de opt-out rodam normalmente.
const HAS_PERSISTENT_STORAGE = typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function';

describe('AKITA-204 — AdaptiveBrain skipAutoRestore opt-in', () => {
    beforeEach(() => {
        if (HAS_PERSISTENT_STORAGE && typeof localStorage.clear === 'function') {
            localStorage.clear();
        }
    });

    test.skipIf(!HAS_PERSISTENT_STORAGE)('persona persists across constructor when skipAutoRestore omitted', () => {
        const b1 = new AdaptiveBrain('GUARDIOLA');
        b1.qTable['test|state'] = { TACTIC_offensive: 42 };
        b1.totalUpdates = 7;
        b1.save();

        const b2 = new AdaptiveBrain();
        // Default behavior: auto-restore from STORAGE_KEY happens in ctor.
        expect(b2.qTable['test|state']).toBeDefined();
        expect(b2.qTable['test|state'].TACTIC_offensive).toBe(42);
        expect(b2.totalUpdates).toBe(7);
    });

    test('skipAutoRestore=true bypasses restore — fresh state', () => {
        const seed = new AdaptiveBrain('GUARDIOLA');
        seed.qTable['saved|state'] = { ACTION: 99 };
        seed.totalUpdates = 50;
        seed.save();

        // NPC brain with opt-out
        const npc = new AdaptiveBrain('MERCENARY', { skipAutoRestore: true });
        expect(npc.qTable['saved|state']).toBeUndefined();
        expect(npc.totalUpdates).toBe(0);
        expect(npc.personality).toBeDefined();
        expect(npc.personality.id).toBe('MERCENARY');
    });

    test('many NPCs with skipAutoRestore yield unique OCEAN personalities', () => {
        // SPEC-117: cada NPC deve ter persona única via gaussian noise sobre archetype.
        const seen = new Set();
        for (let i = 0; i < 60; i++) {
            const b = new AdaptiveBrain('BALANCED', { skipAutoRestore: true });
            seen.add(JSON.stringify(b.personality.ocean));
        }
        // Without opt-out, all would converge to same persisted persona → set size = 1.
        // With opt-out, gaussian noise gives unique per call.
        expect(seen.size).toBeGreaterThan(50);
    });

    test('engine NPCs do not share persisted persona', async () => {
        // E2E shape: simulate engine pattern (many brains with skipAutoRestore).
        // Pre-populate STORAGE_KEY with a fake persisted brain.
        const seed = new AdaptiveBrain('GUARDIOLA');
        seed.qTable['polluted'] = { X: 1 };
        seed.save();

        // 10 NPCs as engine constructs them
        const brains = [];
        for (let i = 0; i < 10; i++) {
            brains.push(new AdaptiveBrain('BALANCED', { skipAutoRestore: true }));
        }

        // None of them should carry the polluted qTable entry
        for (const b of brains) {
            expect(b.qTable['polluted']).toBeUndefined();
            expect(b.totalUpdates).toBe(0);
        }
    });

    test('opts argument is optional and backwards-compatible', () => {
        // Old call signature: new AdaptiveBrain(archetype) — must still work.
        const b = new AdaptiveBrain('FORMADOR');
        expect(b).toBeDefined();
        expect(b.personality).toBeDefined();
    });
});
