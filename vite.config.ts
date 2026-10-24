import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// GitHub Pages では https://<user>.github.io/ITpassportApp/ で配信されるため、
// 開発・プレビュー時も同じベースパスに揃える
export default defineConfig({
  base: '/ITpassportApp/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
