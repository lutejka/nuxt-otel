<template>
  <div
    class="group relative n-bg-base border-b n-border-base cursor-pointer n-transition hover:n-bg-hover n-bg-active"
    :class="{
      'border-l-2 border-l-red-500': isError,
      'n-bg-active!': isSelected,
    }"
    @click="$emit('select', trace.trace_id)"
  >
    <div class="p-3 flex gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex-1 min-w-0 space-y-0.5">
            <h3 class="font-semibold text-white text-sm leading-tight truncate">
              {{ trace.operation_name }}
            </h3>
            <p class="font-mono text-xs text-gray/40">
              {{ shortTraceId }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <TraceStatus :trace="trace" />
          </div>
        </div>

        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-gray/60 font-medium truncate">
              {{ trace.service_name }}
            </span>
          </div>
          <span class="text-white font-mono font-semibold text-xs ml-3">
            {{ formatDuration(trace.duration) }}
          </span>
        </div>

        <div v-if="isError && trace.status_message" class="mt-2 pt-2 border-t n-border-base">
          <div class="text-xs text-red-400 bg-red-500/10 px-2 py-1.5 rounded">
            {{ trace.status_message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api'
import type { Trace } from '~~/types'
import { formatDuration } from '../utils/formatters'
import TraceStatus from './trace/TraceStatus.vue'

const props = defineProps<{
  trace: Trace
  isSelected: boolean
}>()

defineEmits<{
  select: [traceId: string]
}>()

const isError = computed(() => props.trace.status_code === SpanStatusCode.ERROR)
const shortTraceId = computed(() => props.trace.trace_id?.slice(0, 8) ?? '')
</script>
