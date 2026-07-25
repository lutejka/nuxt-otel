<template>
  <div class="relative h-7 w-full select-none">
    <span
      v-for="(tick, index) in ticks"
      :key="index"
      class="absolute top-1/2 -translate-y-1/2 text-[10px] text-gray/40 font-mono whitespace-nowrap -translate-x-1/2 first:translate-x-0.5"
      :style="index === ticks.length -1 ? { right: '0px'}: { left: `${tick.percent}%` }"
    >
      {{ tick.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { formatDurationCompact } from '../../../utils/formatters.ts'

const LABEL_COUNT = 6

const { traceDuration } = defineProps<{
  traceDuration: number
}>()

const ticks = computed(() => {
  const items: Array<{ percent: number, label: string }> = []
  for (let index = 0; index <= LABEL_COUNT; index++) {
    const percent = (index / LABEL_COUNT) * 100
    items.push({
      percent,
      label: formatDurationCompact((traceDuration / LABEL_COUNT) * index),
    })
  }
  return items
})
</script>
