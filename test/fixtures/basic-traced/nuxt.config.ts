import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  nuxtOtel: {
    instrument: false,
  },
  tracingChannel: true,
})
