---
seo:
  title: '@lutejka/nuxt-otel — OpenTelemetry tracing for Nuxt'
  description: 'Zero-overhead OpenTelemetry tracing for Nuxt using Node.js Diagnostic Channels — auto-instrumented spans for renders, requests, and storage, plus a live DevTools UI and MCP server. No manual setup.'
---

::u-page-hero{orientation="horizontal"}

::telemetry-demo{initial-tab="traces"}
::

#title
OpenTelemetry for [Nuxt]{.text-primary}, zero code

#description
OpenTelemetry tracing that instruments your app automatically. @lutejka/nuxt-otel hooks into Node.js Diagnostic Channels to capture spans for renders, requests, and storage — no manual setup, with a live DevTools UI and an MCP server for AI agents.

#links
:::u-button{color="primary" size="xl" to="/getting-started/installation" trailing-icon="i-lucide-arrow-right"}
Getting Started
:::

:::u-button{color="neutral" size="xl" to="https://github.com/lutejka/nuxt-otel" target="\_blank" variant="outline" icon="i-simple-icons-github"}
Star on GitHub
:::
::

::u-container
:::u-page-grid

:::u-page-feature{icon="i-lucide-zap" title="Zero setup" description="Instrument your app automatically through Node.js Diagnostic Channels. No manual span creation or context management."}
:::

:::u-page-feature{icon="i-lucide-list-tree" title="Waterfall traces" description="Browse every request as a span tree with timing, attributes, and parent/child context."}
:::

:::u-page-feature{icon="i-lucide-file-text" title="Structured logs" description="OpenTelemetry-compatible log records with severity and attributes, correlated to traces."}
:::

:::u-page-feature{icon="i-lucide-monitor" title="DevTools UI" description="A live interface in the nuxt devtools to flip between waterfall traces and correlated logs."}
:::

:::u-page-feature{icon="i-lucide-bot" title="MCP server" description="Expose local telemetry to AI agents in real time through Model Context Protocol."}
:::

:::u-page-feature{icon="i-lucide-pen-tool" title="Custom spans" description="Add manual spans and logs with useOtelTracer and useOtelLogger for full control."}
:::

:::
::


::u-page-section{title="Everything you need for observability" description="A single module instruments your Nuxt internals and surfaces them in one place — from spans in production to logs and telemetry for your AI assistant."}

#features
::u-page-feature{icon="i-lucide-zap" title="Zero setup" description="Install, enable, and watch spans appear."}
::
::u-page-feature{icon="i-lucide-power" title="Nothing to run" description="No collector, backend, or manual tracing code."}
::
::u-page-feature{icon="i-lucide-arrow-up-right" title="Export anywhere" description="Wire into existing OpenTelemetry infrastructure with OTLP export."}
::
::

::u-page-section

#title
See it in action

#description
This is the real thing — the same components shipped with the module, rendered live with sample telemetry. Flip between waterfall traces and correlated logs to see exactly what you get in the nuxt dev tools.

::telemetry-demo{initial-tab="traces"}
::
::

::u-page-cta

#title
Start tracing your Nuxt app today

#description
Install the module, enable the DevTools UI, and watch your first spans appear — no manual setup required.

#links
:::u-button{color="primary" size="lg" to="/getting-started/installation" trailing-icon="i-lucide-arrow-right"}
Getting Started
:::

:::u-button{color="neutral" size="lg" to="https://github.com/lutejka/nuxt-otel" target="\_blank" variant="outline" icon="i-simple-icons-github"}
Star on GitHub
:::
::
