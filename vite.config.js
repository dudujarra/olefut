import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defaultExclude } from 'vitest/config'

// https://vite.dev/config/
// base path for GitHub Pages: /olefut/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/olefut/' : '/',
  build: {
    rollupOptions: {
      output: {
        // Vite 8 / Rolldown: manualChunks must be a function, not an object.
        manualChunks(id) {
          // SPEC-177: regional realPlayers JSON chunks (split from monolithic
          // realPlayers.json via top-level await in src/engine/data.js).
          // Each region becomes its own chunk; Rolldown infers names from the
          // dynamic import path so we just keep them out of generic groupings.
          if (id.includes('realPlayers_BRA.json')) return 'realPlayers_BRA';
          if (id.includes('realPlayers_EUR.json')) return 'realPlayers_EUR';
          if (id.includes('realPlayers_SAM.json')) return 'realPlayers_SAM';
          if (id.includes('realPlayers_pool.json')) return 'realPlayers_pool';
          // SPEC-159 legacy fallback (kept in case any code still references the
          // monolithic JSON — it shouldn't, but we play defense).
          if (id.includes('realPlayers.json')) return 'player-data';
          // ML/learning subsystem — heavy, split into its own chunk
          if (id.includes('/services/learning/')) return 'ml-brain';
        },
      },
    },
  },
  test: {
    exclude: [
      ...defaultExclude,
      '**/.claude/worktrees/**',
      'tests/e2e/**',
      // SPEC-157/BUG-080: deep-soak (100/20 seasons) roda solo via `npm run test:soak`.
      // Em suite-load excede timeout (100 seasons × 38 weeks × engine work).
      // SOAK=1 env flag desativa este exclude (test:soak script).
      ...(process.env.SOAK ? [] : ['tests/integration/deep-soak-*.test.js', 'tests/integration/sinistro-*.test.js', 'tests/integration/lab-presets-*.test.js']),
    ],
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

