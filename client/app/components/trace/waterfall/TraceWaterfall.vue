<template>
  <div class="h-full flex flex-col n-bg-base">
    <div class="n-bg-active border-b n-border-base p-4 min-h-24">
      <div class="flex items-center justify-between mb-3 gap-3">
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-semibold text-white truncate">
            {{ trace.operation_name }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <TraceStatus :trace="trace" />
        </div>
      </div>

      <div class="flex gap-4 flex-wrap items-center text-xs">
        <span class="text-gray/60">
          <strong class="text-gray/80 mr-1">Service:</strong>
          {{ trace.service_name }}
        </span>
        <span class="text-gray/60">
          <strong class="text-gray/80 mr-1">Duration:</strong>
          {{ formatDuration(trace.duration) }}
        </span>
        <span class="text-gray/60">
          <strong class="text-gray/80 mr-1">Spans:</strong>
          {{ spans.length }}
        </span>
      </div>

      <div
        v-if="isError && !trace.status_message"
        class="mt-3 p-2 bg-red-500/10 border-l-2 border-red-500 rounded text-xs text-red-400"
      >
        <strong class="text-red-500 mr-1">Error:</strong>
        {{ trace.status_message }}
      </div>
    </div>

    <!-- Split panel: names (left) + timeline (right) -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left panel: span names (sticky) -->
      <div
        ref="leftPanel"
        class="overflow-y-auto overflow-x-hidden shrink-0 n-bg-base"
        :style="{ width: nameColWidth + 'px' }"
        @scroll="onLeftScroll"
      >
        <div class="min-w-0">
          <!-- Timeline header spacer for left side -->
          <div class="sticky top-0 z-10 n-bg-base border-b n-border-base h-7" />
          <!-- Span name rows -->
          <div class="space-y-0.5 px-1.5">
            <SpanRowName
              v-for="spanRow in newTree"
              :key="spanRow.span.span_id"
              :span-row="spanRow"
              @select-span="$emit('select-span', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Resize handle -->
      <div
        class="shrink-0 w-0 cursor-col-resize -mx-px px-px border-l n-border-base hover:border-context transition-colors z-20"
        :class="{ '!border-context': nameColDragging }"
        @mousedown="onNameColMouseDown"
      />

      <!-- Right panel: timeline (scrollable, draggable) -->
      <div
        ref="timelineContainer"
        class="flex-1 overflow-auto n-bg-base cursor-grab"
        :class="{ 'cursor-grabbing': isPanning }"
        @scroll="onRightScroll"
        @mousedown="onTimelineMouseDown"
      >
        <div class="min-h-0">
          <!-- Timeline header -->
          <div class="sticky top-0 z-10 n-bg-base border-b n-border-base">
            <TraceTimeline :trace="trace" />
          </div>
          <!-- Timeline bar rows -->
          <div class="space-y-0.5 px-1.5">
            <SpanRowBar
              v-for="spanRow in newTree"
              :key="spanRow.span.span_id"
              :span-row="spanRow"
              @select-span="$emit('select-span', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api'
import type { Span, Trace } from '~~/types'
import { formatDuration } from '../../../utils/formatters.ts'
import { spanListToTree } from '../../../utils/span-tree.ts'
import { useResizablePanel } from '../../../composables/useResizablePanel.ts'
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
const newTree = computed(() => spanListToTree(props.spans))

// Reactive state for collapsed/expanded spans — keyed by span_id
const expandedState = reactive(new Map<string, boolean>())

function isExpanded(spanId: string): boolean {
  const val = expandedState.get(spanId)
  return val ?? true // default to expanded
}

function toggleShowChildren(spanId: string) {
  expandedState.set(spanId, !(expandedState.get(spanId) ?? true))
}

provide('span-tree-expanded-state', { isExpanded, toggleShowChildren })

const timelineContainer = ref<HTMLElement | null>(null)
const leftPanel = ref<HTMLElement | null>(null)

// Drag-to-pan for scrolling on the timeline (both X and Y axes)
let isPanning = false
let panStartX = 0
let panStartY = 0
let panStartScrollLeft = 0
let panStartScrollTop = 0

function onTimelineMouseDown(e: MouseEvent) {
  // Only start pan on left click, not on the scrollbar
  if (e.button !== 0) return
  // Don't start pan if the user clicked on a button
  const target = e.target as HTMLElement
  if (target.closest('button')) return

  isPanning = true
  panStartX = e.clientX
  panStartY = e.clientY
  const container = timelineContainer.value
  if (container) {
    panStartScrollLeft = container.scrollLeft
    panStartScrollTop = container.scrollTop
  }
  document.body.style.userSelect = 'none'

  document.addEventListener('mousemove', onPanMouseMove)
  document.addEventListener('mouseup', onPanMouseUp)
}

function onPanMouseMove(e: MouseEvent) {
  if (!isPanning || !timelineContainer.value) return
  const deltaX = panStartX - e.clientX
  const deltaY = panStartY - e.clientY
  timelineContainer.value.scrollLeft = panStartScrollLeft + deltaX
  timelineContainer.value.scrollTop = panStartScrollTop + deltaY
}

function onPanMouseUp() {
  isPanning = false
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onPanMouseMove)
  document.removeEventListener('mouseup', onPanMouseUp)
}

// Sync vertical scroll between left and right panels
let syncingScroll = false

function onLeftScroll(e: Event) {
  if (syncingScroll) return
  syncingScroll = true
  const target = e.target as HTMLElement
  const rightPanel = timelineContainer.value
  if (rightPanel) {
    rightPanel.scrollTop = target.scrollTop
  }
  syncingScroll = false
}

function onRightScroll(e: Event) {
  if (syncingScroll) return
  syncingScroll = true
  const target = e.target as HTMLElement
  if (leftPanel.value) {
    leftPanel.value.scrollTop = target.scrollTop
  }
  syncingScroll = false
}
</script>
