<template>
  <div class="space-y-1">
    <div
      v-for="[key, value] in entries"
      :key="key"
      class="flex items-start gap-2 py-1 border-b border-default last:border-0"
    >
      <span class="text-muted font-mono text-[10px] shrink-0 min-w-[120px] break-all">{{ key }}</span>
      <span class="text-highlighted font-mono text-[10px] break-all">{{ formatValue(value) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Record<string, unknown>
}>()

const entries = computed(() => Object.entries(props.data))

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>
