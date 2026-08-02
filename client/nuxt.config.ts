import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const _dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  appId: 'nuxt-otel-iframe',
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  ssr: false,
  devtools: { enabled: false },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },
  app: {
    baseURL: '/__nuxt-otel',
    head: {
      htmlAttrs: {
        class: 'dark',
      },
    },
  },
  css: ['~/assets/css/main.css'],
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
