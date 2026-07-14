<template>
  <div class="w-full h-full flex overflow-hidden">
    <main class="flex-1 overflow-y-auto relative n-bg-base">
      <TraceWaterfall
        v-if="trace && spans.length > 0"
        :trace="trace"
        :spans="spans"
        @select-span="selectedSpan = $event"
      />
      <div v-else-if="loading" class="flex items-center justify-center h-full text-gray/50 text-sm">
        Loading trace details...
      </div>
      <div v-else class="flex items-center justify-center h-full text-gray/50 text-sm">
        No spans found for this trace
      </div>
    </main>

    <template v-if="selectedSpan">
      <div
        class="w-0 cursor-col-resize border-l n-border-base hover:border-context transition-colors shrink-0 -mx-px px-px z-10"
        :class="{ 'border-context': spanPanelDragging }"
        @mousedown="onSpanPanelMouseDown"
      />
      <aside class="n-bg-active overflow-y-auto shrink-0" :style="{ width: spanPanelWidth + 'px' }">
        <SpanDetails :span="selectedSpan" @close="selectedSpan = undefined" />
      </aside>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Trace, Span } from '~~/types'
import { useResizablePanel } from '../composables/useResizablePanel'
import TraceWaterfall from '~/components/trace/waterfall/TraceWaterfall.vue'
import SpanDetails from '~/components/SpanDetails.vue'

const props = defineProps<{
  trace: Trace
  spans: Span[]
  loading?: boolean
}>()

const selectedSpan = ref<Span | undefined>()
const {
  width: spanPanelWidth,
  dragging: spanPanelDragging,
  onMouseDown: onSpanPanelMouseDown,
} = useResizablePanel('span-panel-width', 380)

watch(
  () => props.trace.trace_id,
  () => {
    selectedSpan.value = undefined
  },
)
</script>
