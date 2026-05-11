import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: undefined, // to prevent warning
  }
})
