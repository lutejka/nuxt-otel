export default defineAppConfig({
  docus: {
    name: 'Nuxt Otel',
    description: 'OpenTelemetry tracing for Nuxt applications using Diagnostic Channels.',
    url: 'https://nuxt-otel.vercel.app',
    socials: {
      github: 'lutejka/nuxt-otel',
    },
    header: {
      title: 'Nuxt Otel',
    },
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
