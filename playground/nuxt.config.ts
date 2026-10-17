export default defineNuxtConfig({
  modules: ['../src/module'],
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
})
