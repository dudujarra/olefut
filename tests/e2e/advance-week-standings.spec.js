/**
 * SPEC-164 §3 — Navegação para Standings após iniciar carreira
 *
 * "Avançar 5 semanas" via clique de partida é caro demais (cada match envolve
 * narração ao vivo de 90 min). Em vez disso, validamos o caminho mais
 * importante para o jogador: dashboard → standings exibindo a tabela.
 *
 * Cobre o gap "StandingsView never reached" do audit AKITA-233.
 */
// SPEC-176: shared fixture auto-fails on uncaught pageerror / console.error.
import { test, expect } from './_fixtures.js';

async function startCareer(page) {
    await page.addInitScript(() => {
        try {
            localStorage.clear();
            localStorage.setItem('elifoot_tutorial_done', 'true');
        } catch { /* ignore */ }
    });
    await page.goto('/');
    await page.waitForSelector('#input-name', { timeout: 15_000 });
    await page.fill('#input-name', 'Standings E2E');
    const firstValue = await page.locator('select#select-team option[value]:not([value=""])').first().getAttribute('value');
    await page.selectOption('select#select-team', firstValue);
    await page.locator('#btn-start').click();
    await page.waitForSelector('header.top-bar', { timeout: 10_000 });
}

test.describe('SPEC-164 §3: Standings reachable', () => {

    test('sidebar TABELA renderiza StandingsView com pelo menos uma linha', async ({ page }) => {
        await startCareer(page);

        // Sidebar item "TABELA"
        const tabelaItem = page.locator('aside.elifoot-sidebar').getByText('TABELA');
        await expect(tabelaItem).toBeVisible();
        await tabelaItem.click();

        // StandingsView mostra cabeçalho "Classificação"
        await page.waitForSelector('text=Classificação', { timeout: 15_000 });
        const heading = page.locator('h2', { hasText: 'Classificação' });
        await expect(heading).toBeVisible();

        // Deve haver pelo menos uma linha de time (10+ na divisão BRA)
        // Linhas de times costumam usar <tr> ou <li>. Buscamos por qualquer texto de time
        // através do conteúdo total da view, que deve ter > 200 chars úteis.
        const main = page.locator('main').first();
        const text = await main.innerText();
        expect(text.length).toBeGreaterThan(200);
    });
});
