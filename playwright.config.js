// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * §11: E2E Testing Configuration
 * Full game flows: start → simulate season → verify standings
 */
export default defineConfig({
    testDir: './tests/e2e',
    outputDir: './tests/e2e/results',
    timeout: 60_000,
    retries: 1,
    workers: 1, // Sequential — deterministic
    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        viewport: { width: 1280, height: 800 },
    },
    webServer: {
        command: 'npm run dev',
        port: 5173,
        timeout: 30_000,
        reuseExistingServer: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
});
