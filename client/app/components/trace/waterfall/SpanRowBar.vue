<template>
  <div>
    <div
      class="relative h-7 flex items-center px-1.5 rounded hover:n-bg-hover cursor-pointer"
      @click="$emit('select-span', spanRow.span)"
    >
      <div
        class="absolute h-4 rounded n-transition"
        :class="getDepthColorClass(spanRow.depth, spanRow.span.status_code)"
        :style="{
          left: Math.min(spanRow.offsetPercent, 100) + '%',
          width: Math.max(1, Math.min(spanRow.widthPercent, 100 - Math.min(spanRow.offsetPercent, 100))) + '%',
          minWidth: '2px',
        }"
        :title="spanRow.span.name"
      />
    </div>
    <template v-if="isExpanded(spanRow.span.span_id) && spanRow.children.length">
      <SpanRowBar
        v-for="childSpanRow in spanRow.children"
        :key="childSpanRow.span.span_id"
        :span-row="childSpanRow"
        @select-span="$emit('select-span', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import type { SpanRowNode } from '../../../utils/span-tree.ts'

interface SpanTreeExpandedState {
  isExpanded: (spanId: string) => boolean
  toggleShowChildren: (spanId: string) => void
}

const { isExpanded } = inject<SpanTreeExpandedState>('span-tree-expanded-state')!

const { spanRow } = defineProps<{
  spanRow: SpanRowNode
}>()

defineEmits<{
  'select-span': [span: SpanRowNode['span']]
}>()

function getDepthColorClass(depth: number, statusCode: number): string {
  if (statusCode === 2) return 'bg-red-500'
  const depthColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-lime-500',
    'bg-indigo-500',
  ]
  return depthColors[depth % depthColors.length] || 'bg-blue-500'
}
</script>
