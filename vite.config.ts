import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// GitHub Pages では https://<user>.github.io/ITpassportApp/ で配信されるため、
// 開発・プレビュー時も同じベースパスに揃える
export default defineConfig({
  base: '/ITpassportApp/',
  plugins: [
    react(),
    // 新しい版は自動では切り替えず、画面の「更新する」を押したときに切り替える（prompt）
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ITパスポート学習',
        short_name: 'ITパスポート',
        description: 'ITパスポート試験の学習を支援するアプリ',
        lang: 'ja',
        display: 'standalone',
        start_url: '/ITpassportApp/',
        scope: '/ITpassportApp/',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/Root.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
