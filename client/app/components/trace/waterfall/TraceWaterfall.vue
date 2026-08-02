<template>
  <div class="h-full min-h-0 flex flex-col bg-default">
    <header class="bg-elevated border-b border-default p-4 min-h-24 shrink-0">
      <div class="flex items-center justify-between mb-3 gap-3">
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-semibold text-highlighted truncate">
            {{ trace.operation_name }}
          </h2>
        </div>
        <TraceStatus :trace="trace" />
      </div>

      <div class="flex gap-4 flex-wrap items-center text-xs">
        <span class="text-muted">
          <strong class="text-highlighted mr-1">Service:</strong>
          {{ trace.service_name }}
        </span>
        <span class="text-muted">
          <strong class="text-highlighted mr-1">Duration:</strong>
          {{ formatDuration(trace.duration) }}
        </span>
        <span class="text-muted">
          <strong class="text-highlighted mr-1">Spans:</strong>
          {{ spans.length }}
        </span>
        <button
          v-if="isZoomed"
          type="button"
          class="text-muted hover:text-highlighted underline underline-offset-2"
          @click="resetZoom"
        >
          Reset zoom
        </button>
      </div>

      <div
        v-if="isError && !trace.status_message"
        class="mt-3 p-2 bg-red-500/10 border-l-2 border-red-500 rounded text-xs text-red-400"
      >
        <strong class="text-red-500 mr-1">Error:</strong>
        {{ trace.status_message }}
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden min-h-0">
      <aside
        ref="leftPanel"
        class="overflow-y-auto overflow-x-hidden shrink-0 bg-default"
        :style="{ width: `${nameColWidth}px` }"
        @scroll="syncScrollFromLeft"
      >
        <div class="sticky top-0 z-10 bg-default border-b border-default h-7 shrink-0" />
        <div class="space-y-0.5 px-1.5">
          <SpanRowName
            v-for="spanRow in spanTree"
            :key="spanRow.span.span_id"
            :span-row="spanRow"
            @select-span="$emit('select-span', $event)"
          />
        </div>
      </aside>

      <div
        class="shrink-0 w-0 cursor-col-resize -mx-px px-px border-l border-default hover:border-primary transition-colors z-20"
        :class="{ '!border-primary': nameColDragging }"
        @mousedown="onNameColMouseDown"
      />

      <section
        ref="timelineContainer"
        class="flex-1 overflow-auto bg-default cursor-grab min-w-0"
        :class="{ 'cursor-grabbing': isPanning }"
        @scroll="syncScrollFromRight"
        @mousedown="onTimelineMouseDown"
      >
        <div class="min-h-full" :style="timelineContentStyle">
          <div class="sticky top-0 z-10 bg-default border-b border-default">
            <TraceTimeline :trace-duration="traceBounds.traceDuration" />
          </div>

          <div class="space-y-0.5 px-1.5">
            <SpanRowBar
              v-for="spanRow in spanTree"
              :key="spanRow.span.span_id"
              :span-row="spanRow"
              @select-span="$emit('select-span', $event)"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api'
import type { Span, Trace } from '~~/types'
import { formatDuration } from '../../../utils/formatters.ts'
import { spanListToTree } from '../../../utils/span-tree.ts'
import { getTraceBounds } from '../../../utils/trace.ts'
import { useResizablePanel } from '../../../composables/useResizablePanel.ts'
import { useWaterfallZoom } from '../../../composables/useWaterfallZoom.ts'
import { useWaterfallPan } from '../../../composables/useWaterfallPan.ts'
import TraceStatus from '~/components/trace/TraceStatus.vue'
import TraceTimeline from '~/components/trace/waterfall/TraceTimeline.vue'
import SpanRowName from '~/components/trace/waterfall/SpanRowName.vue'
import SpanRowBar from '~/components/trace/waterfall/SpanRowBar.vue'

const props = defineProps<{
  trace: Trace
  spans: Span[]
}>()

defineEmits<{
  'select-span': [span: Span]
}>()

const {
  width: nameColWidth,
  dragging: nameColDragging,
  onMouseDownLeft: onNameColMouseDown,
} = useResizablePanel('waterfall-name-col', 220, { min: 140, max: 400 })

const isError = computed(() => props.trace.status_code === SpanStatusCode.ERROR)
const spanTree = computed(() => spanListToTree(props.spans))
const traceBounds = computed(() => getTraceBounds(props.spans))

const expandedState = reactive(new Map<string, boolean>())

function isExpanded(spanId: string): boolean {
  return expandedState.get(spanId) ?? true
}

function toggleShowChildren(spanId: string) {
  expandedState.set(spanId, !isExpanded(spanId))
}

provide('span-tree-expanded-state', { isExpanded, toggleShowChildren })

const leftPanel = ref<HTMLElement | null>(null)
const timelineContainer = ref<HTMLElement | null>(null)

const { zoomLevel, resetZoom, isZoomed } = useWaterfallZoom(timelineContainer)
const { isPanning, onMouseDown: onTimelineMouseDown } = useWaterfallPan(timelineContainer)

const timelineContentStyle = computed(() => ({
  width: `${zoomLevel.value * 100}%`,
  minWidth: '100%',
}))

let syncingScroll = false

function syncScrollFromLeft(event: Event) {
  if (syncingScroll) return
  syncingScroll = true
  const source = event.target as HTMLElement
  if (timelineContainer.value) {
    timelineContainer.value.scrollTop = source.scrollTop
  }
  syncingScroll = false
}

function syncScrollFromRight(event: Event) {
  if (syncingScroll) return
  syncingScroll = true
  const source = event.target as HTMLElement
  if (leftPanel.value) {
    leftPanel.value.scrollTop = source.scrollTop
  }
  syncingScroll = false
}

watch(
  () => props.trace.trace_id,
  () => {
    resetZoom()
    expandedState.clear()
  },
)
</script>
