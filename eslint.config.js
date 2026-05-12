import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude/**', 'node_modules', 'tests/**', 'scripts/render-fase1.js', 'src/audio/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-assignment': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-refresh/only-export-components': 'warn',
      // SPEC-178: enforce Mandamento Brutal #4 (zero inline style em código novo).
      // Warning level — débito existente grande. Reviewer detecta novos warnings.
      // Exceção dynamic per-instance: /* eslint-disable-next-line no-restricted-syntax */
      'no-restricted-syntax': ['warn', {
        selector: "JSXAttribute[name.name='style']",
        message: 'Mandamento Brutal #4 (SPEC-178): inline style proibido. Use CSS class de luxury-arcade.css. Exceção dynamic per-instance: /* eslint-disable-next-line no-restricted-syntax */ + comment.',
      }],
    },
  },
])
