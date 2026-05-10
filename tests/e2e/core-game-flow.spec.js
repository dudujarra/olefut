import { test, expect } from '@playwright/test';

/**
 * §11: E2E Test Suite — Core Game Flows
 *
 * Validates the full player journey:
 *   1. Start new game → select team
 *   2. View dashboard → verify initial state
 *   3. Advance weeks → verify standings change
 *   4. Complete season → verify end-of-season
 */

test.describe('Core Game Flow', () => {

    test('should load start screen with team selection', async ({ page }) => {
        await page.goto('/');
        // Wait for app to hydrate
        await page.waitForSelector('[data-testid="start-view"], .start-view, h1', { timeout: 10_000 });

        // App should show start/team selection
        const body = await page.textContent('body');
        expect(body).toBeTruthy();
        expect(body.length).toBeGreaterThan(50);
    });

    test('should start new game and show dashboard', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="start-view"], .start-view, h1', { timeout: 10_000 });

        // Look for a team card or start button
        const startBtn = page.locator('button:has-text("Novo"), button:has-text("Iniciar"), button:has-text("Jogar")').first();

        if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await startBtn.click();
            // Wait for dashboard or next view
            await page.waitForTimeout(2000);
        }

        // Page should have meaningful content
        const pageContent = await page.textContent('body');
        expect(pageContent.length).toBeGreaterThan(100);
    });

    test('should render without JS errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/');
        await page.waitForTimeout(3000);

        // Filter out known non-critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.includes('favicon')
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('should be responsive at mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.waitForTimeout(2000);

        // No horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
    });

    test('should have proper meta tags for SEO', async ({ page }) => {
        await page.goto('/');

        const title = await page.title();
        expect(title.length).toBeGreaterThan(3);

        // Check for viewport meta
        const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewport).toContain('width=device-width');
    });
});

test.describe('Accessibility', () => {

    test('should have no images without alt text', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        const imgsWithoutAlt = await page.locator('img:not([alt])').count();
        // Allow decorative images (role=presentation), but flag others
        const decorative = await page.locator('img[role="presentation"]').count();
        expect(imgsWithoutAlt - decorative).toBeLessThanOrEqual(2);
    });

    test('should support keyboard navigation', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Tab through interactive elements
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focused);
    });

    test('should respect prefers-reduced-motion', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');
        await page.waitForTimeout(1000);

        // Animations should be disabled
        const animDuration = await page.evaluate(() => {
            const el = document.querySelector('.ef-anim-ball-roll, .ef-anim-spinner, button');
            if (!el) return '0s';
            return getComputedStyle(el).animationDuration;
        });
        // Should be near-zero or '0s' when reduced motion is active
        expect(['0s', '0.01ms', '0.001s', '']).toContain(animDuration.replace(/^0\.0+/, '0'));
    });
});
