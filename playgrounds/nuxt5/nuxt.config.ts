export default defineNuxtConfig({
  modules: ['../../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  nitro: {
    storage: {
      redis: {
        driver: 'redis',
        port: 6379, // Redis port
        host: '127.0.0.1', // Redis host (local)
        db: 0, // DB index (default: 0)
      },
    },
  },
  nuxtOtel: { instrument: true, devtools: true },
  tracingChannel: true,
  hooks: {
    // Nuxt 5 turns its default `/vendor` ignore into a path relative to the
    // filesystem root (`../../…/vendor`). In a deeply nested checkout that
    // pattern matches every file, so Nitro finds no `server/` routes or
    // middleware and `/api/*` falls through to the Vue renderer (HTML).
    'nitro:config'(nitroConfig) {
      nitroConfig.ignore = (nitroConfig.ignore ?? []).filter(
        pattern => typeof pattern !== 'string' || !/^(\.\.\/)+vendor$/.test(pattern),
      )
    },
  },
})
