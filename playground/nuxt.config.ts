export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  nuxtOtel: { instrument: true, devtools: true },
  tracingChannel: true,
})
