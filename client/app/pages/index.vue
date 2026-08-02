<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex flex-1 overflow-hidden bg-default">
    <ResizablePanel storage-key="traces-panel" :default-width="320" class="w-full" :min="150">
      <template #left>
        <button @click="print">print</button>
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
</template>

<script setup lang="ts">
import { watch, toValue } from 'vue'
import type { Span } from '~~/types'
import { useTraces } from '~/composables/useTraces'
import { useServiceFilter } from '~/composables/useServiceFilter'
import ResizablePanel from '~/components/layout/ResizablePanel.vue'
import EmptyState from '~/components/ui/EmptyState.vue'

const selectedTraceId = ref<string | null>(null)

const { traces, getSpansForTrace, clearAllTraces, spans } = useTraces()
const { logs } = useLogs()

const print = () => {
  console.log({ spans: toValue(spans), traces: toValue(traces), logs: toValue(logs)})
}
const { filteredTraces } = useServiceFilter(traces)

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

watch(selectedTraceId, async (id) => {
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
})

watch(
  () => traces.value[0],
  (newTrace) => {
    if (newTrace && !selectedTraceId.value) {
      selectedTraceId.value = newTrace.trace_id
    }
  },
)

watch(
  () => filteredTraces.value[0],
  (newFirst) => {
    if (selectedTraceId.value && !traces.value.find(t => t.trace_id === selectedTraceId.value)) {
      selectedTraceId.value = newFirst?.trace_id || null
    }
  },
)
</script>
