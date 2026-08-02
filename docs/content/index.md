---
seo:
  title: '@lutejka/nuxt-otel — OpenTelemetry tracing for Nuxt'
  description: 'Zero-overhead OpenTelemetry tracing for Nuxt using Node.js Diagnostic Channels — auto-instrumented spans for renders, requests, and storage, plus a live DevTools UI and MCP server. No manual setup.'
---

::u-page-hero

#title
OpenTelemetry for Nuxt, zero code

#description
OpenTelemetry tracing that instruments your app automatically. @lutejka/nuxt-otel hooks into Node.js Diagnostic Channels to capture spans for renders, requests, and storage — no manual setup, with a built-in DevTools UI and an MCP server for AI agents.

#headline

#links
:::u-button{color="primary" size="xl" to="/getting-started/installation" trailing-icon="i-lucide-arrow-right"}
Getting Started
:::

:::u-button{color="neutral" size="xl" to="https://github.com/lutejka/nuxt-otel" target="\_blank" variant="outline" icon="i-simple-icons-github"}
Star on GitHub
:::
::

::u-page-section

#title
See it in action

#description
This is the real thing — the same components shipped with the module, rendered with sample telemetry. Flip between waterfall traces and correlated logs to see exactly what you get in the nuxt dev tools.

::telemetry-demo{initial-tab="traces"}
::
::
