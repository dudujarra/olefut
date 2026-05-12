/**
 * SPEC-164 §2 — Save manual + Reload roundtrip
 *
 * Inicia jogo, salva manualmente via botão 💾 do header e recarrega.
 * Espera-se que o manager name e o estado de "started" persistam.
 */
// SPEC-176: shared fixture auto-fails on uncaught pageerror / console.error.
import { test, expect } from './_fixtures.js';

async function startCareer(page, managerName) {
    // Limpa antes de carregar (sem addInitScript, que reexecuta no reload).
    await page.goto('/');
    await page.evaluate(() => {
        try {
            localStorage.clear();
            localStorage.setItem('elifoot_tutorial_done', 'true');
        } catch { /* ignore */ }
    });
    await page.reload();
    await page.waitForSelector('#input-name', { timeout: 15_000 });
    await page.fill('#input-name', managerName);
    const firstValue = await page.locator('select#select-team option[value]:not([value=""])').first().getAttribute('value');
    await page.selectOption('select#select-team', firstValue);
    await page.locator('#btn-start').click();
    await page.waitForSelector('header.top-bar', { timeout: 10_000 });
}

test.describe('SPEC-164 §2: Save Reload Roundtrip', () => {

    test('save manual via 💾 grava elifoot_save_v1 com gameState.started=true', async ({ page }) => {
        const managerName = 'Manager Persist';
        await startCareer(page, managerName);

        await expect(page.locator('header.top-bar .manager-name')).toHaveText(managerName);

        const saveBtn = page.locator('header.top-bar button[title^="Salvar manual"]');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Toast "Salvo!" aparece após clique
        await page.waitForSelector('text=Salvo!', { timeout: 5_000 });

        // Round-trip do save: payload em localStorage deve conter gameState com
        // started=true e manager correto + versão atual + checksum.
        const payload = await page.evaluate(() => {
            const raw = localStorage.getItem('elifoot_save_v1');
            return raw ? JSON.parse(raw) : null;
        });
        expect(payload, 'elifoot_save_v1 ausente após save manual').toBeTruthy();
        expect(payload.gameState).toBeTruthy();
        expect(payload.gameState.started).toBe(true);
        expect(payload.gameState.manager).toBe(managerName);
        expect(typeof payload.version).toBe('number');
        expect(typeof payload.checksum).toBe('number');
        expect(payload.engine).toBeTruthy();
        expect(Array.isArray(payload.engine.teams)).toBe(true);
    });

    test('reload preserva chave elifoot_save_v1 (round-trip de storage)', async ({ page }) => {
        const managerName = 'Reload Persist';
        await startCareer(page, managerName);
        await page.locator('header.top-bar button[title^="Salvar manual"]').click();
        await page.waitForSelector('text=Salvo!', { timeout: 5_000 });

        const before = await page.evaluate(() => localStorage.getItem('elifoot_save_v1'));
        expect(before).toBeTruthy();

        await page.reload();
        // Após reload, a chave continua presente (auto-save preserva).
        // Não asseguramos render do dashboard porque é responsabilidade de outra spec
        // de game-engine; aqui isolamos o contrato de persistência.
        await page.waitForLoadState('domcontentloaded');
        const after = await page.evaluate(() => localStorage.getItem('elifoot_save_v1'));
        expect(after).toBeTruthy();
        const parsed = JSON.parse(after);
        expect(parsed.gameState.manager).toBe(managerName);
        expect(parsed.gameState.started).toBe(true);
    });
});
