<template>
  <div>
    <div
      class="relative h-7 flex items-center px-1.5 rounded hover:bg-elevated cursor-pointer"
      @click="$emit('select-span', spanRow.span)"
    >
      <div
        class="absolute h-4 rounded transition"
        :class="getDepthBarColorClass(spanRow.depth, spanRow.span.status_code)"
        :style="barStyle"
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
import SpanRowBar from '~/components/trace/waterfall/SpanRowBar.vue'

const DEPTH_BAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-indigo-500',
] as const

const { spanRow } = defineProps<{
  spanRow: SpanRowNode
}>()

defineEmits<{
  'select-span': [span: SpanRowNode['span']]
}>()

interface SpanTreeExpandedState {
  isExpanded: (spanId: string) => boolean
  toggleShowChildren: (spanId: string) => void
}

const { isExpanded } = inject<SpanTreeExpandedState>('span-tree-expanded-state')!

const getDepthBarColorClass = (depth: number, statusCode: number): string => {
  if (statusCode === 2) return 'bg-red-500'
  return DEPTH_BAR_COLORS[depth % DEPTH_BAR_COLORS.length] ?? 'bg-blue-500'
}
const barStyle = computed(() => {
  const left = Math.min(spanRow.offsetPercent, 100)
  const width = Math.max(1, Math.min(spanRow.widthPercent, 100 - left))

  return {
    left: `${left}%`,
    width: `${width}%`,
    minWidth: '2px',
  }
})
</script>
