<template>
  <span class="w-[60px] px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 text-center" :class="colorClass">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  severityNumber: number
  severityText?: string | null
}>()

const label = computed(() => {
  if (props.severityText) return props.severityText.toUpperCase()
  if (props.severityNumber >= 21) return 'FATAL'
  if (props.severityNumber >= 17) return 'ERROR'
  if (props.severityNumber >= 13) return 'WARN'
  if (props.severityNumber >= 9) return 'INFO'
  if (props.severityNumber >= 5) return 'DEBUG'
  if (props.severityNumber >= 1) return 'TRACE'
  return 'UNSET'
})

const colorClass = computed(() => {
  if (props.severityNumber >= 21) return 'bg-red-500/20 text-red-400'
  if (props.severityNumber >= 17) return 'bg-red-500/20 text-red-400'
  if (props.severityNumber >= 13) return 'bg-amber-500/20 text-amber-400'
  if (props.severityNumber >= 9) return 'bg-blue-500/20 text-blue-400'
  if (props.severityNumber >= 5) return 'bg-purple-500/20 text-purple-400'
  if (props.severityNumber >= 1) return 'bg-gray-500/20 text-gray-400'
  return 'bg-gray-500/20 text-gray-400'
})
</script>
