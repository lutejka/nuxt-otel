<template>
  <div class="w-full h-full flex overflow-hidden">
    <main class="flex-1 min-h-0 overflow-hidden relative bg-default flex flex-col">
      <TraceWaterfall
        v-if="trace && spans.length > 0"
        class="flex-1 min-h-0"
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
      <aside class="absolute right-0 z-20 h-full bg-default overflow-y-auto shrink-0" :style="{ width: spanPanelWidth + 'px' }" ref="spanDetails">
        <div class="relative h-full">
          <div
            class=" absolute right-0w-0 cursor-col-resize border-l-2 h-full border-default hover:border-primary transition-colors shrink-0 -mx-px px-px z-10"
            :class="{ 'border-primary': spanPanelDragging }"
            @mousedown="onSpanPanelMouseDown"
          />
          <SpanDetails :span="selectedSpan" @close="selectedSpan = undefined" />
        </div>
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

const spanDetails = useTemplateRef('spanDetails')
onClickOutside(spanDetails, () => {
  selectedSpan.value = undefined
})
</script>
