<template>
  <UBadge :color="color" variant="soft" size="sm" class="font-bold uppercase">
    {{ statusText }}
  </UBadge>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api'
import type { Trace } from '~shared/types'

const { trace } = defineProps<{
  trace: Trace
}>()

const color = computed(() => {
  if (trace.status_code === SpanStatusCode.ERROR) return 'error'
  if (trace.status_code === SpanStatusCode.OK) return 'success'
  return 'warning'
})

const statusText = computed(() => {
  if (trace.status_code === SpanStatusCode.UNSET) return 'Unset'
  if (trace.status_code === SpanStatusCode.ERROR) return 'Error'
  return 'Ok'
})
</script>
