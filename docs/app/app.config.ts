export default defineAppConfig({
  header: {
    title: 'Nuxt OTel',
  },
  seo: {
    title: 'Nuxt OTel',
    description: 'OpenTelemetry tracing for Nuxt applications using Diagnostic Channels.',
    titleTemplate: '%s - Nuxt OTel',
  },
  socials: {
    github: 'https://github.com/lutejka/nuxt-otel',
  },
  github: {
    owner: 'lutejka',
    name: 'nuxt-otel',
    url: 'https://github.com/lutejka/nuxt-otel',
    branch: 'main',
    // Content lives in docs/content, so edit links need the docs prefix.
    rootDir: 'docs',
  },
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'zinc',
    },
    pageHero: {
      slots: {
        title: 'text-4xl sm:text-5xl lg:text-6xl/[1.05] tracking-tighter',
        description: 'text-base sm:text-lg/8 max-w-xl',
      },
    },
    pageSection: {
      slots: {
        container: 'py-14 sm:py-16 lg:py-20',
        title: 'text-2xl sm:text-3xl lg:text-4xl tracking-tighter',
        description: 'max-w-2xl',
      },
      variants: {
        orientation: {
          vertical: {
            wrapper: 'text-left',
            title: 'text-left',
            description: 'text-left text-pretty',
            headline: 'justify-start',
            leading: 'justify-start',
            links: 'justify-start',
          },
        },
      },
    },
  },
})
