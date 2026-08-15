import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Configuration Vitest pour le dashboard Next.js.
// - `vite-tsconfig-paths` résout l'alias `@/*` -> `./*` via tsconfig.json
// - `jsdom` active le DOM côté test pour les composants React
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'out'],
  },
})
