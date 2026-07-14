<template>
  <div class="flex justify-between py-1.5 pl-2 w-full">
    <span v-for="(label, idx) in timeLabels" :key="idx" class="text-[10px] text-gray/40 font-mono whitespace-nowrap">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Trace } from '~~/types'
import { formatDurationCompact } from '../../../utils/formatters.ts'

const { trace } = defineProps<{
  trace: Trace
}>()

const LABEL_COUNT = 6

const timeLabels = computed(() => {
  const duration = trace.duration
  const count = LABEL_COUNT
  const labels: string[] = []
  for (let i = 0; i <= count; i++) {
    labels.push(formatDurationCompact((duration / count) * i))
  }
  return labels
})
</script>
