/**
 * SPEC-176 — Shared Playwright fixture: auto page-error & console-error capture.
 *
 * Before this fixture, every E2E spec was free to ignore `page.on('pageerror')`,
 * which meant bugs like BUG-084 (StandingsView hydration warning) could ship
 * without any red flag because the existing tests asserted DOM content but
 * never inspected runtime console/page errors.
 *
 * The fixture replaces `@playwright/test`'s `page` with a wrapper that:
 *   1. Subscribes to `pageerror` (uncaught JS exceptions in the page).
 *   2. Subscribes to `console` events of type `error`.
 *   3. After the test body finishes, fails the test if any captured
 *      message survives the whitelist filter.
 *
 * Whitelist (known noisy, non-actionable):
 *   - "ResizeObserver loop limit exceeded" / "ResizeObserver loop completed..."
 *     (browser noise unrelated to app correctness)
 *   - "favicon" (404 noise, not a real bug)
 *   - "[vite]"  hot-reload chatter
 *   - "Download the React DevTools" (dev-only banner)
 *
 * Tests that intentionally trigger errors can opt out by importing the raw
 * `test` from `@playwright/test` directly, or by adding `expectPageErrors`
 * to the test body (future extension).
 *
 * Usage in a spec:
 *   import { test, expect } from './_fixtures.js';
 *   test('something', async ({ page }) => { ... });
 *
 * Re-exports `expect` so specs only need one import line.
 */
import { test as base, expect } from '@playwright/test';

const WHITELIST_PATTERNS = [
    /ResizeObserver/i,
    /favicon/i,
    /^\[vite\]/i,
    /Download the React DevTools/i,
];

function isWhitelisted(msg) {
    return WHITELIST_PATTERNS.some(re => re.test(msg));
}

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        /** @type {string[]} */
        const pageErrors = [];
        /** @type {string[]} */
        const consoleErrors = [];

        page.on('pageerror', (err) => {
            const text = err?.message ?? String(err);
            if (!isWhitelisted(text)) pageErrors.push(text);
        });

        page.on('console', (msg) => {
            if (msg.type() !== 'error') return;
            const text = msg.text();
            if (!isWhitelisted(text)) consoleErrors.push(text);
        });

        await use(page);

        // After the test body runs, surface anything we caught.
        // Skip this assertion if the test already failed for another reason —
        // a stack trace from the original failure is more useful than a
        // secondary error from this fixture.
        if (testInfo.status === 'failed' || testInfo.status === 'timedOut') return;

        const lines = [];
        if (pageErrors.length) {
            lines.push(`Uncaught page errors (${pageErrors.length}):`);
            pageErrors.forEach(e => lines.push(`  - ${e}`));
        }
        if (consoleErrors.length) {
            lines.push(`Console errors (${consoleErrors.length}):`);
            consoleErrors.forEach(e => lines.push(`  - ${e}`));
        }
        if (lines.length) {
            throw new Error(`SPEC-176 page-error gate:\n${lines.join('\n')}`);
        }
    },
});

export { expect };
