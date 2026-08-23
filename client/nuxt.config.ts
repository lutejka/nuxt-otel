import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))

const sharedDir = resolve(_dirname, '../shared')

export default defineNuxtConfig({
  appId: 'nuxt-otel-iframe',
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL: '/__nuxt-otel',
    head: {
      htmlAttrs: {
        class: 'dark',
      },
    },
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },
  alias: {
    '~shared': sharedDir,
  },
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
