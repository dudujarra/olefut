import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[CONSOLE] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.stack}`));

  await page.goto('http://localhost:5173');
  
  try {
    await page.evaluate(() => localStorage.setItem('olefut_tutorial_done', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    console.log('Filling StartView...');
    await page.fill('#input-name', 'Dudu');
    await page.selectOption('#select-team', { index: 1 });
    await page.click('#btn-start');
    
    await page.waitForSelector('.ef-dashboard-container', { timeout: 10000 });
    console.log('Dashboard loaded.');
    await page.click('text="JOGAR PARTIDA"');
    await page.waitForTimeout(500);
    
    const next1 = await page.$('text="PRÓXIMO: TÁTICA"');
    if (next1) { await next1.click(); await page.waitForTimeout(500); console.log("Clicked Tática"); }
    
    const next2 = await page.$('text="PRÓXIMO: CONFIRMAR"');
    if (next2) { await next2.click(); await page.waitForTimeout(500); console.log("Clicked Confirmar"); }
    
    console.log('Clicking INICIAR PARTIDA...');
    await page.click('text="INICIAR PARTIDA"');
    await page.waitForTimeout(2000);
    
    const html = await page.content();
    if (html.includes('Cannot read') || html.includes('ERRO')) {
        console.log("CRASH DETECTED IN HTML!");
    } else {
        console.log("SUCCESS! MATCH STARTED!");
    }
  } catch(e) {
    console.log('Script error:', e.message);
  }

  await browser.close();
})();
