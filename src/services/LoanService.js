// AKITA-RFCT-019.4: extract loan system + player loan from engine.
//
// Stateless service. Recebe engine como contexto, muta state in-place.
//
// Métodos:
// - loanPlayer: empréstimo de jogador (loanPlayerOut helper)
// - getLoanOptions: tiers financeiros por divisão
// - takeLoan: contratar empréstimo financeiro
// - processLoanPayment: parcela semanal (chamado por WeekProcessor)
// - payOffLoan: quitar antecipado

import { loanPlayerOut } from '../engine/YouthAcademy';

export class LoanService {
    constructor() {
        // Stateless
    }

    /**
     * Empréstimo de jogador para outro time (delegate to YouthAcademy.loanPlayerOut).
     */
    loanPlayer(engine, playerId, weeks = 20) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado.' };
        const result = loanPlayerOut(team, playerId, weeks);
        if (result.success) engine.loanedOut.push(result.loan);
        return result;
    }

    /**
     * Loan tiers based on division. Higher divisions = larger loans, lower interest.
     */
    getLoanOptions(engine) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { available: false, reason: 'Time não encontrado' };
        if (engine.activeLoan) return { available: false, reason: 'Já possui empréstimo ativo', loan: engine.activeLoan };

        const divisionLoans = {
            1: { maxLoan: 30_000_000, interestRate: 0.08, termWeeks: 38, label: 'Série A' },
            2: { maxLoan: 15_000_000, interestRate: 0.10, termWeeks: 38, label: 'Série B' },
            3: { maxLoan: 5_000_000,  interestRate: 0.12, termWeeks: 38, label: 'Série C' },
            4: { maxLoan: 2_000_000,  interestRate: 0.15, termWeeks: 38, label: 'Série D' },
        };

        const tier = divisionLoans[team.division] || divisionLoans[4];
        const options = [
            { amount: Math.round(tier.maxLoan * 0.25), label: 'Pequeno' },
            { amount: Math.round(tier.maxLoan * 0.50), label: 'Médio' },
            { amount: tier.maxLoan, label: 'Grande' },
        ];

        return {
            available: true,
            interestRate: tier.interestRate,
            termWeeks: tier.termWeeks,
            options: options.map(o => ({
                ...o,
                totalOwed: Math.round(o.amount * (1 + tier.interestRate)),
                weeklyPayment: Math.round((o.amount * (1 + tier.interestRate)) / tier.termWeeks),
            })),
        };
    }

    /**
     * Take a loan.
     */
    takeLoan(engine, amount) {
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado' };
        if (engine.activeLoan) return { success: false, msg: 'Já possui empréstimo ativo. Pague primeiro.' };

        const options = this.getLoanOptions(engine);
        if (!options.available) return { success: false, msg: options.reason };

        const chosen = options.options.find(o => o.amount === amount);
        if (!chosen) return { success: false, msg: 'Valor inválido' };

        engine.activeLoan = {
            principal: chosen.amount,
            interestRate: options.interestRate,
            totalOwed: chosen.totalOwed,
            weeklyPayment: chosen.weeklyPayment,
            weeksRemaining: options.termWeeks,
            weekTaken: engine.currentWeek,
            seasonTaken: engine.seasonNumber,
        };

        team.balance += chosen.amount;
        engine.weekEvents.push(`🏦 Empréstimo de R$ ${(chosen.amount / 1_000_000).toFixed(1)}M aprovado! Juros: ${(options.interestRate * 100).toFixed(0)}%. Parcela semanal: R$ ${(chosen.weeklyPayment / 1000).toFixed(0)}K`);

        return { success: true, msg: `Empréstimo de R$ ${(chosen.amount / 1_000_000).toFixed(1)}M aprovado!`, loan: engine.activeLoan };
    }

    /**
     * Process weekly loan payment. Called by WeekProcessor.
     * BUG-085: payment NÃO é debitado aqui — WeekProcessor já inclui em weeklyFinance.expenses.
     */
    processLoanPayment(engine) {
        if (!engine.activeLoan) return null;
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return null;

        const payment = engine.activeLoan.weeklyPayment;
        engine.activeLoan.weeksRemaining--;
        engine.activeLoan.totalOwed -= payment;

        if (engine.activeLoan.weeksRemaining <= 0) {
            const msg = `🏦 Empréstimo quitado! Total pago: R$ ${((engine.activeLoan.principal * (1 + engine.activeLoan.interestRate)) / 1_000_000).toFixed(1)}M`;
            engine.activeLoan = null;
            return { paid: payment, finished: true, msg };
        }

        return { paid: payment, finished: false, remaining: engine.activeLoan.weeksRemaining };
    }

    /**
     * Pay off remaining loan early.
     */
    payOffLoan(engine) {
        if (!engine.activeLoan) return { success: false, msg: 'Sem empréstimo ativo' };
        const team = engine.getTeam(engine.manager.teamId);
        if (!team) return { success: false, msg: 'Time não encontrado' };
        if (team.balance < engine.activeLoan.totalOwed) return { success: false, msg: `Saldo insuficiente. Precisa de R$ ${(engine.activeLoan.totalOwed / 1_000_000).toFixed(1)}M` };

        team.balance -= engine.activeLoan.totalOwed;
        const msg = `🏦 Empréstimo quitado antecipadamente! Economia de juros.`;
        engine.activeLoan = null;
        return { success: true, msg };
    }
}
