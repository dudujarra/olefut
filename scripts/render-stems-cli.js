#!/usr/bin/env node
/* eslint-disable no-unused-vars */

/**
 * render-stems-cli.js
 * Puppeteer integration: spawna browser headless, executa offline-renderer.html
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function renderStemsViaHeadless() {
  console.log('🎵 ELIFOOT Audio Rendering (Headless Puppeteer)');

  let browser;

  try {
    // Launch headless Chrome
    console.log('\n🚀 Launching headless Chrome...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Intercept console logs
    page.on('console', msg => {
      console.log(`   [browser] ${msg.text()}`);
    });

    page.on('error', err => {
      console.error(`   [browser error] ${err.message}`);
    });

    // Navigate to offline renderer
    const htmlPath = path.join(__dirname, 'offline-renderer.html');
    const fileUrl = `file://${htmlPath}`;

    console.log(`\n📄 Loading: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Wait for rendering to complete
    // Check for status div update
    console.log('\n⏳ Rendering stems...');
    let renderComplete = false;

    for (let i = 0; i < 120; i++) { // Max 2 minutes
      const status = await page.evaluate(() => {
        const statusDiv = document.getElementById('status');
        return statusDiv?.textContent || '';
      });

      if (status.includes('✅ Done') || status.includes('❌ Error')) {
        renderComplete = true;
        console.log(`\n${status}`);
        break;
      }

      if (i % 10 === 0) {
        console.log(`   ${status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!renderComplete) {
      console.warn('⚠️ Rendering timeout (check browser logs above)');
    }

    await browser.close();
    console.log('\n✅ Rendering complete!');

  } catch (err) {
    console.error('❌ Puppeteer error:', err.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Run
renderStemsViaHeadless().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
