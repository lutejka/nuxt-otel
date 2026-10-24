---
seo:
  title: Nuxt OTEL — OpenTelemetry tracing for Nuxt
  description: Automatic OpenTelemetry tracing for Nuxt renders, H3 requests, server routes and storage. Zero overhead, zero code changes, DevTools included.
---

::hero-background{class="absolute w-full top-[var(--ui-header-height)] transition-all text-primary flex-shrink-0"}
::

::u-page-hero
---
orientation: horizontal
ui:
  container: py-14 sm:py-16 lg:pt-16 lg:pb-24 gap-10 lg:gap-16
---
#title
Observability for Nuxt, [without the setup]{class="text-primary-600 dark:text-primary-400"}

#description
Write a server route and Nuxt OTEL traces it, links the async context, and shows the waterfall in DevTools. No manual spans, no wrapper components, no collector config to start.

#links
  :::u-button
  ---
  size: xl
  to: /getting-started/installation
  icon: i-lucide-rocket
  ---
  Get started
  :::

  :::copy-code-input{source="npm install @lutejka/nuxt-otel"}
  :::

#default
:u-color-mode-image{alt="Trace waterfall timeline with span details" class="w-full rounded-lg border border-muted shadow-xl" dark="/images/trace-dark.png" light="/images/trace-light.png"}
::

::u-page-section
#title
One module. [Every layer traced.]{class="text-primary-600 dark:text-primary-400"}

#description
Channels connect Nuxt OTEL to a layer of your app. Each one hooks a Diagnostic Channel and creates real OpenTelemetry spans. Enable all of them, pick a subset, or turn everything off.

#features
  :::u-page-feature
  ---
  to: /getting-started/configuration
  class: border-t border-default pt-6
  ---
  #title
  `nuxt` — render lifecycle

  #description
  SSR renders, island components, data fetching and plugin initialization. Requires Nuxt >= 4.5.0.
  :::

  :::u-page-feature
  ---
  to: /getting-started/configuration
  class: border-t border-default pt-6
  ---
  #title
  `h3` — HTTP requests

  #description
  Every request handled by h3, with method, route and status code as span attributes.
  :::

  :::u-page-feature
  ---
  to: /getting-started/configuration
  class: border-t border-default pt-6
  ---
  #title
  `srvx` — server routes

  #description
  Server route requests and middleware execution. Requires Nuxt >= 5.0.0.
  :::

  :::u-page-feature
  ---
  to: /getting-started/configuration
  class: border-t border-default pt-6
  ---
  #title
  `unstorage` — storage ops

  #description
  `get`, `set`, `remove` and friends, so cache misses stop being a mystery.
  :::

#links
  :::u-button
  ---
  size: lg
  color: neutral
  variant: subtle
  to: /getting-started/configuration
  trailing-icon: i-lucide-arrow-right
  ---
  Read the configuration docs
  :::
::

::u-page-section
#title
What happens [after a request starts]{class="text-primary-600 dark:text-primary-400"}

#description
Nuxt OTEL runs on Node.js Diagnostic Channels, so there is nothing to import and no component to wrap your code in.

#features
  :::u-page-feature
  ---
  class: border-t border-default pt-6
  ---
  #title
  01 — Start

  #description
  When an operation begins, a span is created with contextual attributes: URL, method, component name, storage key.
  :::

  :::u-page-feature
  ---
  class: border-t border-default pt-6
  ---
  #title
  02 — Propagate

  #description
  The span is bound to the current async context via AsyncLocalStorage, so children keep the right parent.
  :::

  :::u-page-feature
  ---
  class: border-t border-default pt-6
  ---
  #title
  03 — End

  #description
  On completion the span is finalized with response metadata such as status code and duration.
  :::

  :::u-page-feature
  ---
  class: border-t border-default pt-6
  ---
  #title
  04 — Record errors

  #description
  If the operation throws, the span records the exception and marks its status as error.
  :::

#links
  :::u-button
  ---
  size: lg
  color: neutral
  variant: subtle
  to: /reference/traced-events
  trailing-icon: i-lucide-arrow-right
  ---
  How tracing works in detail
  :::
::

::u-page-section
#title
See every trace [in DevTools]{class="text-primary-600 dark:text-primary-400"}

#description
Enable `nuxtOtel.devtools` and an **OpenTelemetry** panel appears in Vite DevTools. Browse traces and logs in real time — no collector needed.

#body
  :::u-page-grid
    ::::u-page-card
    ---
    variant: subtle
    to: /guide/devtools
    ---
    :::::u-color-mode-image{alt="Traces view waterfall timeline and span details" class="w-full rounded-lg border border-muted" dark="/images/trace-dark.png" light="/images/trace-light.png"}
    :::::
    #title
    Traces — waterfall timeline

    #description
    Resizable split panel with the trace list on the left and a waterfall timeline with span details on the right.
    ::::

    ::::u-page-card
    ---
    variant: subtle
    to: /guide/devtools
    ---
    :::::u-color-mode-image{alt="Logs view expandable log entries with severity badges" class="w-full rounded-lg border border-muted" dark="/images/logs-dark.png" light="/images/logs-light.png"}
    :::::
    #title
    Logs — structured events

    #description
    Scrollable list of OpenTelemetry log records with severity badges and expandable attributes, linked to the same async context as your traces.
    ::::
  :::
::

::u-page-section
---
ui:
  features: sm:grid-cols-2 lg:grid-cols-2 gap-x-10 gap-y-8
---
#title
Defaults worth [keeping]{class="text-primary-600 dark:text-primary-400"}

#features
  :::u-page-feature
  ---
  to: /getting-started/installation
  class: border-t border-default pt-6
  ---
  #title
  Zero code changes to start

  #description
  Add the module and keep writing routes. Tracing is automatic from the first request.
  :::

  :::u-page-feature
  ---
  to: /guide/instrumentation
  class: border-t border-default pt-6
  ---
  #title
  Zero-overhead channels

  #description
  Built on Node.js Diagnostic Channels — hooks only fire when something listens.
  :::

  :::u-page-feature
  ---
  to: /guide/instrumentation
  class: border-t border-default pt-6
  ---
  #title
  OTLP out of the box

  #description
  Node presets get a built-in NodeSDK that exports traces via OTLP. Configure it with standard `OTEL_*` env vars.
  :::

  :::u-page-feature
  ---
  to: /guide/mcp-server
  class: border-t border-default pt-6
  ---
  #title
  Agent-ready with MCP

  #description
  Query `get-traces`, `get-trace`, `get-spans` and `get-logs` straight from your coding agent during development.
  :::
::

::u-page-section
---
ui:
  features: sm:grid-cols-3 gap-6
---
#title
Built on [OpenTelemetry]{class="text-primary-600 dark:text-primary-400"}

#description
Nuxt OTEL is the Nuxt-shaped layer over standard OTel packages. Each of them is useful on its own.

#features
  :::u-page-card
  ---
  variant: subtle
  to: https://opentelemetry.io/docs/
  target: _blank
  ---
  #title
  opentelemetry-js

  #description
  Standard APIs, SDKs and semantic conventions. Export to Jaeger, Zipkin, or any OTLP collector.
  :::

  :::u-page-card
  ---
  variant: subtle
  to: https://nodejs.org/api/diagnostics_channel.html
  target: _blank
  ---
  #title
  diagnostics_channel

  #description
  The Node.js mechanism that makes zero-overhead hooking into Nuxt, h3, srvx and unstorage possible.
  :::

  :::u-page-card
  ---
  variant: subtle
  to: https://devtools.vite.dev/
  target: _blank
  ---
  #title
  vite-opentelemetry-inspector

  #description
  The DevTools panel powering the trace waterfall, log viewer and MCP tools.
  :::
::

::u-page-section
---
class: bg-muted border-t border-default
---
#title
Add it to your app [in one command]{class="text-primary-600 dark:text-primary-400"}

#description
Nuxt OTEL is MIT licensed and maintained by the community.

#links
  :::u-button
  ---
  size: xl
  to: /getting-started/installation
  icon: i-lucide-rocket
  ---
  Get started
  :::

  :::u-button
  ---
  size: xl
  color: neutral
  variant: subtle
  to: https://github.com/lutejka/nuxt-otel
  target: _blank
  icon: i-simple-icons-github
  ---
  Star on GitHub
  :::
::
