<script setup lang="ts">
import { watch } from 'vue'
import type { Span } from '~shared/types'
import { useTraces } from '~/composables/useTraces'
import { useLogs } from '~/composables/useLogs'
import { useServiceFilter } from '~/composables/useServiceFilter'
import ResizablePanel from '~/components/layout/ResizablePanel.vue'
import TraceList from '~/components/TraceList.vue'
import TraceDetail from '~/components/TraceDetail.vue'
import LogRow from '~/components/log/LogRow.vue'
import EmptyState from '~/components/ui/EmptyState.vue'

// Replicates the dev-ui client shell (client/app/app.vue) + both the traces
// page (client/app/pages/index.vue) and the logs page (client/app/pages/logs.vue),
// fed by the fake-data plugin.

const { initialTab = 'traces', preselectTrace } = defineProps<{
  initialTab?: 'traces' | 'logs'
  preselectTrace?: string
}>()

const activeTab = ref<'traces' | 'logs'>(initialTab)

const tabs = [
  { key: 'traces', label: 'Traces', icon: 'carbon:flow' },
  { key: 'logs', label: 'Logs', icon: 'carbon:document' },
]

useLocalStorage('traces-panel', 150)
useLocalStorage('waterfall-name-col', 160)

const { traces, getSpansForTrace, clearAllTraces } = useTraces()
const { filteredTraces } = useServiceFilter(traces)
const { logs, clearAllLogs } = useLogs()

const selectedTraceId = ref<string | null>(preselectTrace)
const traceSpans = ref<Span[]>([])
const traceLoading = ref(false)

const clearTraces = async () => {
  selectedTraceId.value = null
  await clearAllTraces()
}

const selectedTrace = computed(() => {
  if (!selectedTraceId.value) return null
  return traces.value.find(t => t.trace_id === selectedTraceId.value) || null
})

watch(
  selectedTraceId,
  async (id) => {
    if (!id) {
      traceSpans.value = []
      return
    }
    traceLoading.value = true
    try {
      traceSpans.value = await getSpansForTrace(id)
    }
    finally {
      traceLoading.value = false
    }
  },
  { immediate: true },
)

watch(
  () => traces.value[0],
  (newTrace) => {
    if (newTrace && !selectedTraceId.value) {
      selectedTraceId.value = newTrace.trace_id
    }
  },
)
</script>

<template>
  <div class="h-[480px] flex flex-col border border-default rounded-xl overflow-hidden bg-default text-left">
    <!-- shell tab bar (mirrors client/app/app.vue) -->
    <div class="flex w-full border-b border-default shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors duration-200 border-b-2"
        :class="
          activeTab === tab.key
            ? '!text-highlighted !border-primary'
            : 'text-muted hover:text-highlighted border-transparent'
        "
        @click="activeTab = tab.key"
      >
        <UIcon :name="tab.icon" class="size-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <!-- traces view (mirrors client/app/pages/index.vue) -->
    <div v-if="activeTab === 'traces'" class="flex-1 min-h-0 flex flex-col">
      <div class="flex flex-1 overflow-hidden bg-default">
        <ResizablePanel storage-key="traces-panel" :default-width="320" class="w-full" :min="150">
          <template #left>
            <TraceList
              v-model:selected-trace-id="selectedTraceId"
              :traces="filteredTraces"
              @clear-traces="clearTraces"
              @select-trace="selectedTraceId = $event"
            />
          </template>
          <template #right>
            <TraceDetail v-if="selectedTrace" :trace="selectedTrace" :spans="traceSpans" :loading="traceLoading" />
            <EmptyState
              v-else
              icon="📊"
              title="No trace selected"
              description="Select a trace from the list to view its waterfall timeline and span details"
            />
          </template>
        </ResizablePanel>
      </div>
    </div>

    <!-- logs view (mirrors client/app/pages/logs.vue) -->
    <div v-else class="flex-1 min-h-0 flex flex-col">
      <div class="h-full flex flex-col bg-default">
        <div class="border-b border-default shrink-0">
          <div class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-semibold text-highlighted">Logs</h2>
              <UBadge color="primary" variant="soft" size="sm">{{ logs.length }}</UBadge>
            </div>
            <div class="flex items-center gap-3">
              <UButton size="xs" color="neutral" variant="outline" @click="clearAllLogs">Clear</UButton>
            </div>
          </div>
        </div>

        <template v-if="logs.length">
          <div class="flex-1 overflow-y-auto relative">
            <div
              class="sticky top-0 z-10 bg-default border-b border-default grid grid-cols-[60px_180px_150px_1fr_24px] items-center gap-3 px-3 py-2"
            >
              <span class="text-[10px] font-semibold text-dimmed uppercase">Severity</span>
              <span class="text-[10px] font-semibold text-dimmed uppercase">Timestamp</span>
              <span class="text-[10px] font-semibold text-dimmed uppercase">Service</span>
              <span class="text-[10px] font-semibold text-dimmed uppercase">Message</span>
              <span class="text-[10px] font-semibold text-dimmed uppercase" />
            </div>
            <ClientOnly>
              <div>
                <div v-for="log in logs" :key="log.log_id">
                  <LogRow :log="log" />
                </div>
              </div>
              <template #fallback>
                <div class="px-3 py-6 text-xs text-gray/40">Loading logs...</div>
              </template>
            </ClientOnly>
          </div>
        </template>

        <EmptyState
          v-else
          icon="📄"
          title="No logs yet"
          description="Waiting for logs from instrumented applications"
        />
      </div>
    </div>
  </div>
</template>
