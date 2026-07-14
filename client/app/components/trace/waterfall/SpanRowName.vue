<template>
  <div>
    <div
      class="flex items-center gap-1.5 min-w-0 h-7 px-1.5 rounded hover:n-bg-hover cursor-pointer"
      :style="{ paddingLeft: `${spanRow.depth * 40}px` }"
      @click="$emit('select-span', spanRow.span)"
    >
      <button
        v-if="spanRow.children.length"
        class="size-5 flex items-center justify-center shrink-0"
        @click.stop="toggleShowChildren(spanRow.span.span_id)"
      >
        <Icon
          name="carbon:chevron-down"
          class="transition duration-100"
          :class="{ '-rotate-90': !isExpanded(spanRow.span.span_id) }"
        />
      </button>
      <span
        class="size-4 flex items-center justify-center text-[9px] font-semibold px-1 py-0.5 rounded uppercase shrink-0"
        :class="[getDepthColorClassForLabel(spanRow.depth, spanRow.span.status_code)]"
        :title="getSpanKindLabel(spanRow.span.kind)"
      >
        {{ getSpanKindLabel(spanRow.span.kind)[0] }}
      </span>
      <span class="text-xs text-gray/80 truncate">
        {{ spanRow.span.name }}
      </span>
      <span class="text-[10px] text-gray/40 font-mono shrink-0 ml-auto">
        {{ formatDuration(spanRow.span.duration) }}
      </span>
    </div>
    <template v-if="isExpanded(spanRow.span.span_id) && spanRow.children.length">
      <SpanRowName
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
import { formatDuration, getSpanKindLabel } from '../../../utils/formatters.ts'

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

const { isExpanded, toggleShowChildren } = inject<SpanTreeExpandedState>('span-tree-expanded-state')!

function getDepthColorClassForLabel(depth: number, statusCode: number): string {
  if (statusCode === 2) return 'bg-red-500/20 text-red-400'
  const depthColors = [
    'bg-blue-500/20 text-blue-400',
    'bg-purple-500/20 text-purple-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-amber-500/20 text-amber-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-pink-500/20 text-pink-400',
    'bg-lime-500/20 text-lime-400',
    'bg-indigo-500/20 text-indigo-400',
  ]
  return depthColors[depth % depthColors.length] || 'bg-blue-500/20 text-blue-400'
}
</script>
