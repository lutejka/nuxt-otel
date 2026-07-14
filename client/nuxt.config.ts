import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  appId: 'nuxt-otel-iframe',
  modules: ['@nuxt/devtools-ui-kit', '@nuxt/icon'],
  ssr: false,
  devtools: { enabled: false },
  app: { baseURL: '/__nuxt-otel' },
  compatibilityDate: '2025-03-01',
  nitro: {
    output: {
      publicDir: resolve(_dirname, '../dist/client'),
    },
  },
  vite: {
    server: {
      hmr: {
        clientPort: +(process.env.PORT || 3300),
      },
      allowedHosts: true,
    },
  },
})
