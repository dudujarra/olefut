# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutorial-completable.spec.js >> SPEC-164 §5: Tutorial Completable >> tutorial avança pelos 5 passos e grava olefut_tutorial_done
- Location: tests/e2e/tutorial-completable.spec.js:12:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /iniciar carreira/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /iniciar carreira/i })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - main [ref=e5]:
    - generic [ref=e8]:
      - generic "Etapa 5 de 5" [ref=e11]: PASSO 05
      - img [ref=e13]
      - generic [ref=e16]:
        - heading "CONQUISTAS E CARREIRA" [level=2] [ref=e17]
        - paragraph [ref=e18]: Sua jornada ficará na história. Acumule troféus, ganhe prestígio, mude de clube e desbloqueie as 60+ conquistas disponíveis no Hall da Fama.
      - progressbar [ref=e19]
      - generic [ref=e25]:
        - button "ANTERIOR" [ref=e26] [cursor=pointer]:
          - img [ref=e27]
          - text: ANTERIOR
        - button "JOGAR" [active] [ref=e29] [cursor=pointer]:
          - text: JOGAR
          - img [ref=e30]
      - button "PULAR TUTORIAL" [ref=e33] [cursor=pointer]:
        - img [ref=e34]
        - text: PULAR TUTORIAL
      - generic [ref=e36]:
        - generic [ref=e37]: TUTORIAIS CONTEXTUAIS JÁ VISTOS
        - generic [ref=e38]: Nenhum ainda.
        - button "REVER TUTORIAIS" [ref=e39] [cursor=pointer]
  - button "🎵" [ref=e40] [cursor=pointer]
```

# Test source

```ts
  1  | /**
  2  |  * SPEC-164 §5 — Tutorial completável (5 passos)
  3  |  *
  4  |  * Limpa localStorage, abre o tutorial pelo botão da StartView e avança pelos
  5  |  * 5 steps. Espera-se sair para start view e ter `olefut_tutorial_done` setado.
  6  |  */
  7  | // SPEC-176: shared fixture auto-fails on uncaught pageerror / console.error.
  8  | import { test, expect } from './_fixtures.js';
  9  | 
  10 | test.describe('SPEC-164 §5: Tutorial Completable', () => {
  11 | 
  12 |     test('tutorial avança pelos 5 passos e grava olefut_tutorial_done', async ({ page }) => {
  13 |         await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  14 |         await page.goto('/');
  15 | 
  16 |         await page.waitForSelector('#input-name', { timeout: 15_000 });
  17 | 
  18 |         // Botão TUTORIAL na StartView só aparece quando tutorial ainda não foi feito.
  19 |         const tutBtn = page.getByRole('button', { name: /tutorial/i });
  20 |         await expect(tutBtn).toBeVisible();
  21 |         await tutBtn.click();
  22 | 
  23 |         // Step 1 (título "BEM-VINDO AO OLÉ FUT")
  24 |         await page.waitForSelector('text=BEM-VINDO', { timeout: 10_000 });
  25 | 
  26 |         // Clica PRÓXIMO 4x para chegar ao step 5
  27 |         for (let i = 0; i < 4; i++) {
  28 |             await page.getByRole('button', { name: /próximo/i }).click();
  29 |             // Wait small content shift
  30 |             await page.waitForFunction(
  31 |                 () => {
  32 |                     // SPEC-173: stepbar usa CSS class .ef-stepbar__pip (era inline style height:4px)
  33 |                     const dots = document.querySelectorAll('.ef-stepbar__pip, div[style*="height: 4px"]');
  34 |                     return dots.length >= 5;
  35 |                 },
  36 |                 undefined,
  37 |                 { timeout: 5_000 }
  38 |             );
  39 |         }
  40 | 
  41 |         // No último step o botão muda para "INICIAR CARREIRA"
  42 |         const finishBtn = page.getByRole('button', { name: /iniciar carreira/i });
> 43 |         await expect(finishBtn).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
  44 |         await finishBtn.click();
  45 | 
  46 |         // Voltamos para a start view; manager input visível de novo
  47 |         await page.waitForSelector('#input-name', { timeout: 10_000 });
  48 | 
  49 |         const tutDone = await page.evaluate(() => localStorage.getItem('olefut_tutorial_done'));
  50 |         expect(tutDone).toBeTruthy();
  51 |     });
  52 | });
  53 | 
```