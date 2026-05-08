// Regression test for BUG-019
// Tab "Clube" crashava: TypeError "engine.staff?.getStaff is not a function"
// StaffManager não tinha método getStaff() chamado por DashboardView.jsx
// Issue: https://github.com/dudujarra/elifoot-web/issues/17
import { describe, test, expect } from 'vitest';
import { StaffManager, STAFF_ROLES } from '../../src/engine/StadiumSystem.js';

describe('BUG-019 regression: StaffManager.getStaff exists', () => {
    test('getStaff method exists', () => {
        const sm = new StaffManager();
        expect(typeof sm.getStaff).toBe('function');
    });

    test('getStaff(notHired) returns null', () => {
        const sm = new StaffManager();
        expect(sm.getStaff('physio')).toBeNull();
    });

    test('getStaff(hired) returns role object', () => {
        const sm = new StaffManager();
        sm.hire('physio');
        const result = sm.getStaff('physio');
        expect(result).toBeDefined();
        expect(result.id).toBe('physio');
        expect(result.npc).toBeDefined();
    });

    test('getStaff invalid id returns null', () => {
        const sm = new StaffManager();
        expect(sm.getStaff('invalid_id')).toBeNull();
    });

    test('getAllStaff returns all hired roles', () => {
        const sm = new StaffManager();
        sm.hire('physio');
        sm.hire('scout');
        const all = sm.getAllStaff();
        expect(all.length).toBe(2);
    });

    test('STAFF_ROLES.filter pattern works (DashboardView)', () => {
        const sm = new StaffManager();
        sm.hire('physio');
        const hiredCount = STAFF_ROLES.filter(r => sm.getStaff(r.id)).length;
        expect(hiredCount).toBe(1);
    });
});
