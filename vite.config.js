import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { defaultExclude } from 'vitest/config'

// https://vite.dev/config/
// base path for GitHub Pages: /elifoot-web/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/elifoot-web/' : '/',
  test: {
    exclude: [...defaultExclude, '**/.claude/worktrees/**', 'tests/e2e/**'],
    // BUG-GOLDEN: 190-week simulations need >5s under parallel load.
    // Default 5000ms causes intermittent timeouts in characterization tests.
    testTimeout: 30000,
  },
})

