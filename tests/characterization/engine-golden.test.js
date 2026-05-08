/**
 * Engine Golden Master — Characterization Tests
 *
 * Status: PLACEHOLDER (preenchido em AKITA-RFCT-001)
 *
 * Quando preenchido, este teste:
 * 1. Cria Engine com seed determinístico (rng = createSeededRng(42))
 * 2. Simula 5 temporadas completas (~190 weeks)
 * 3. Snapshots: tabelas finais, top scorers, transferências, hall of fame
 * 4. Re-rodadas devem produzir snapshot idêntico (determinismo)
 * 5. Refactor não pode mudar snapshot
 */

import { describe, test, expect } from 'vitest';

describe.skip('Engine Golden Master (5 seasons)', () => {
    test.todo('AKITA-RFCT-001: deterministic 5-season simulation snapshot');
});
