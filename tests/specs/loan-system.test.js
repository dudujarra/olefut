/**
 * Loan System Tests
 * Validates: takeLoan, processLoanPayment, payOffLoan, getLoanOptions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/engine.js';

describe('Loan System', () => {
    let engine;

    beforeEach(() => {
        engine = new Engine();
        engine.initGame('TestManager', 1);
    });

    it('getLoanOptions returns options when no active loan', () => {
        const opts = engine.getLoanOptions();
        expect(opts.available).toBe(true);
        expect(opts.options).toHaveLength(3);
        expect(opts.options[0].amount).toBeGreaterThan(0);
        expect(opts.interestRate).toBeGreaterThan(0);
    });

    it('takeLoan adds money to team balance', () => {
        const team = engine.getTeam(engine.manager.teamId);
        const before = team.balance;
        const opts = engine.getLoanOptions();
        const result = engine.takeLoan(opts.options[0].amount);
        expect(result.success).toBe(true);
        expect(team.balance).toBe(before + opts.options[0].amount);
    });

    it('cannot take second loan while one is active', () => {
        const opts = engine.getLoanOptions();
        engine.takeLoan(opts.options[0].amount);
        const result2 = engine.takeLoan(opts.options[1].amount);
        expect(result2.success).toBe(false);
    });

    it('processLoanPayment deducts weekly installment', () => {
        const team = engine.getTeam(engine.manager.teamId);
        const opts = engine.getLoanOptions();
        engine.takeLoan(opts.options[0].amount);
        const balBefore = team.balance;
        const payment = engine.activeLoan.weeklyPayment;
        const result = engine.processLoanPayment();
        // BUG-085: processLoanPayment não debita direto — retorna o valor
        // para o WeekProcessor debitar via weeklyFinance.expenses
        expect(result.paid).toBe(payment);
        expect(team.balance).toBe(balBefore); // balance inalterado (WeekProcessor cuida)
        expect(engine.activeLoan.weeksRemaining).toBe(opts.termWeeks - 1);
    });

    it('loan is cleared when all payments made', () => {
        const opts = engine.getLoanOptions();
        engine.takeLoan(opts.options[0].amount);
        // Fast-forward all payments
        for (let i = 0; i < opts.termWeeks; i++) {
            engine.processLoanPayment();
        }
        expect(engine.activeLoan).toBeNull();
    });

    it('payOffLoan clears loan immediately', () => {
        const team = engine.getTeam(engine.manager.teamId);
        const opts = engine.getLoanOptions();
        const smallLoan = opts.options[0];
        engine.takeLoan(smallLoan.amount);
        // Ensure enough balance
        team.balance += smallLoan.totalOwed + 1_000_000;
        const result = engine.payOffLoan();
        expect(result.success).toBe(true);
        expect(engine.activeLoan).toBeNull();
    });

    it('payOffLoan fails if balance insufficient', () => {
        const team = engine.getTeam(engine.manager.teamId);
        const opts = engine.getLoanOptions();
        engine.takeLoan(opts.options[2].amount); // largest
        team.balance = 0; // drain balance
        const result = engine.payOffLoan();
        expect(result.success).toBe(false);
    });
});
