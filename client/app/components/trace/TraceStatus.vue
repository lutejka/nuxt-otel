<template>
  <div
    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
    :class="{
      'bg-red-500/20 text-red-400': trace.status_code === SpanStatusCode.ERROR,
      'bg-green-500/20 text-green-400': trace.status_code === SpanStatusCode.OK,
      'bg-orange-400/20 text-orange-400': trace.status_code === SpanStatusCode.UNSET,
    }"
  >
    {{ statusText }}
  </div>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api'
import type { Trace } from '~~/types'

const { trace } = defineProps<{
  trace: Trace
}>()

const statusText = computed(() => {
  if (trace.status_code === SpanStatusCode.UNSET) return 'Unset'
  if (trace.status_code === SpanStatusCode.ERROR) return 'Error'
  return 'Ok'
})
</script>
