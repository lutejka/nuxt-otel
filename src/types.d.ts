declare module '#nuxt-otel-config' {
  export const nuxtOtel: {
    nuxt?: boolean
    h3?: boolean
    srvx?: boolean
    unstorage?: boolean
  }
  export const devtoolsEnabled: boolean

  export const devServerUrl: string | undefined
}
