import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const clientRoot = resolve(__dirname, '../client')
const clientApp = resolve(clientRoot, 'app')

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@vueuse/nuxt'],
  // Reuse the dev-ui client components as-is on the landing page:
  //   - register `client/app/components` so auto-imported references inside
  //     those components (e.g. <TraceCard> used by <TraceList>) resolve;
  //   - repoint `~` and `~~` at the client so their internal imports resolve.
  // The docs app and Docus never use these aliases (verified), and the docs'
  // own components dir is still registered below.
  components: [{ path: resolve(clientApp, 'components'), pathPrefix: false }, resolve(__dirname, 'app/components')],
  // The reused client components rely on Nuxt auto-imports for some
  // utils/composables (e.g. `getTraceBounds` is used in span-tree.ts without
  // an explicit import). Register the client's utils/composables dirs as
  // auto-import sources so those references resolve in the docs app too.
  imports: {
    dirs: [resolve(clientApp, 'composables'), resolve(clientApp, 'utils')],
  },
  // Load the docs theme (dev-ui dark palette). Because `~` is aliased to the
  // client app above, use an absolute path to the docs' own main.css (not the
  // client's). Tailwind v4 only scans the docs app by default, so arbitrary
  // utility classes used only inside the reused client components (e.g.
  // ResizablePanel's `grid-cols-[var(--name-col)_1fr]`) would never be
  // generated. The `@source` directives in this main.css add the client dirs
  // to the scan.
  css: [resolve(__dirname, 'app/assets/css/main.css')],
  alias: {
    '~~': clientRoot,
    '~': clientApp,
  },
  compatibilityDate: '2025-08-02',
})
