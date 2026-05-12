/**
 * SPEC-164 §5 — Tutorial completável (5 passos)
 *
 * Limpa localStorage, abre o tutorial pelo botão da StartView e avança pelos
 * 5 steps. Espera-se sair para start view e ter `elifoot_tutorial_done` setado.
 */
import { test, expect } from '@playwright/test';

test.describe('SPEC-164 §5: Tutorial Completable', () => {

    test('tutorial avança pelos 5 passos e grava elifoot_tutorial_done', async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
        await page.goto('/');

        await page.waitForSelector('#input-name', { timeout: 15_000 });

        // Botão TUTORIAL na StartView só aparece quando tutorial ainda não foi feito.
        const tutBtn = page.getByRole('button', { name: /tutorial/i });
        await expect(tutBtn).toBeVisible();
        await tutBtn.click();

        // Step 1 (título "BEM-VINDO AO OLÉ FUT")
        await page.waitForSelector('text=BEM-VINDO', { timeout: 10_000 });

        // Clica PRÓXIMO 4x para chegar ao step 5
        for (let i = 0; i < 4; i++) {
            await page.getByRole('button', { name: /próximo/i }).click();
            // Wait small content shift
            await page.waitForFunction(
                () => {
                    // SPEC-173: stepbar usa CSS class .ef-stepbar__pip (era inline style height:4px)
                    const dots = document.querySelectorAll('.ef-stepbar__pip, div[style*="height: 4px"]');
                    return dots.length >= 5;
                },
                undefined,
                { timeout: 5_000 }
            );
        }

        // No último step o botão muda para "INICIAR CARREIRA"
        const finishBtn = page.getByRole('button', { name: /iniciar carreira/i });
        await expect(finishBtn).toBeVisible();
        await finishBtn.click();

        // Voltamos para a start view; manager input visível de novo
        await page.waitForSelector('#input-name', { timeout: 10_000 });

        const tutDone = await page.evaluate(() => localStorage.getItem('elifoot_tutorial_done'));
        expect(tutDone).toBeTruthy();
    });
});
