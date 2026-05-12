/**
 * SPEC-164 §1 — Start → Team Select → Dashboard
 *
 * Verifica que a StartView renderiza, o seletor de time é populado a partir
 * de RealDB e que clicar "COMEÇAR CARREIRA" leva ao dashboard (top-bar visível).
 */
import { test, expect } from '@playwright/test';

test.describe('SPEC-164 §1: Start → Team Select', () => {

    test('StartView renderiza com select de time populado', async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
        await page.goto('/');

        // StartView mostra o logo OléFUT (h1) e o select#select-team
        await page.waitForSelector('select#select-team', { timeout: 15_000 });

        // Pelo menos 50 opções vindas da RealDB (na verdade são 170+)
        const optionCount = await page.locator('select#select-team option').count();
        expect(optionCount).toBeGreaterThan(50);

        // Botão começar inicialmente desabilitado (sem nome / sem time)
        const startBtn = page.locator('#btn-start');
        await expect(startBtn).toBeDisabled();
    });

    test('preencher nome + escolher time habilita botão e leva ao dashboard', async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
        await page.goto('/');

        await page.waitForSelector('#input-name', { timeout: 15_000 });
        await page.fill('#input-name', 'Dudu E2E');

        // Pega o primeiro <option> com value (skip placeholder)
        const firstValue = await page.locator('select#select-team option[value]:not([value=""])').first().getAttribute('value');
        expect(firstValue).toBeTruthy();
        await page.selectOption('select#select-team', firstValue);

        const startBtn = page.locator('#btn-start');
        await expect(startBtn).toBeEnabled();
        await startBtn.click();

        // Top-bar do App.jsx só aparece quando gameState.started === true
        await page.waitForSelector('header.top-bar', { timeout: 10_000 });
        await expect(page.locator('header.top-bar .manager-name')).toHaveText(/Dudu E2E/);
    });
});
