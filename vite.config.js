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
    fileParallelism: false,
    // Add localstorage-file path to eliminate Node 22 warning during automated soak tests
    execArgv: ['--localstorage-file=./.vitest-localstorage'],
    // AKITA-108: limpa localStorage no início de cada suite. Arquivo
    // .vitest-localstorage persistia state entre runs e quebrava isolamento
    // (autoplay-full-audit, marl-e2e, deep-soak, golden master flakies).
    setupFiles: ['./tests/_setup-isolate-localstorage.js'],
  },
})

