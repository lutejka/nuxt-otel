<template>
  <div class="h-full flex flex-col n-bg-active">
    <div class="flex items-center justify-between p-3 border-b n-border-base">
      <h3 class="text-sm font-semibold text-white">Span Details</h3>
      <button class="n-icon-button" @click="$emit('close')">
        <Icon name="carbon:close" class="size-3.5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
      <div>
        <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Name</h4>
        <p class="text-white font-mono break-all">
          {{ span.name }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Kind</h4>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase" :class="kindClass">
            {{ getSpanKindLabel(span.kind) }}
          </span>
        </div>
        <div>
          <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Status</h4>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" :class="statusClass">
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Duration</h4>
          <p class="text-white font-mono">
            {{ formatDuration(span.duration) }}
          </p>
        </div>
        <div>
          <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Span ID</h4>
          <p class="text-white font-mono text-[10px] break-all">
            {{ span.span_id }}
          </p>
        </div>
      </div>

      <div>
        <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Parent Span ID</h4>
        <p class="text-white font-mono text-[10px] break-all">
          {{ span.parent_span_id || '(root)' }}
        </p>
      </div>

      <div v-if="span.status_message">
        <h4 class="text-gray/50 font-medium mb-1 text-[10px] uppercase tracking-wider">Status Message</h4>
        <p class="text-red-400 bg-red-500/10 px-2 py-1.5 rounded">
          {{ span.status_message }}
        </p>
      </div>

      <div v-if="hasAttributes">
        <h4 class="text-gray/50 font-medium mb-2 text-[10px] uppercase tracking-wider">
          Attributes ({{ attributeCount }})
        </h4>
        <KeyValueTable :data="span.attributes" />
      </div>

      <div v-if="span.events.length > 0">
        <h4 class="text-gray/50 font-medium mb-2 text-[10px] uppercase tracking-wider">
          Events ({{ span.events.length }})
        </h4>
        <div class="space-y-2">
          <div v-for="(event, idx) in span.events" :key="idx" class="p-2 bg-context/5 rounded">
            <div class="flex items-center justify-between mb-1">
              <span class="text-white font-medium text-[10px]">{{ event.name }}</span>
              <span class="text-gray/40 font-mono text-[9px]">{{ formatDuration(event.time - span.start_time) }}</span>
            </div>
            <KeyValueTable :data="event.attributes" />
          </div>
        </div>
      </div>

      <div v-if="logs.length">
        <h4 class="text-gray/50 font-medium mb-2 text-[10px] uppercase tracking-wider">Logs ({{ logs.length }})</h4>
        <LogRow v-for="logEntry in logs" :key="logEntry.log_id" :log="logEntry" :show-service-column="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SpanStatusCode } from '@opentelemetry/api'
import type { Log, Span } from '~~/types'
import { formatDuration, getSpanKindLabel } from '../utils/formatters'
import { useLogs } from '../composables/useLogs'
import KeyValueTable from '~/components/ui/KeyValueTable.vue'
import LogRow from '~/components/log/LogRow.vue'

const props = defineProps<{
  span: Span
}>()

defineEmits<{
  close: []
}>()

const statusLabel = computed(() => {
  switch (props.span.status_code) {
    case SpanStatusCode.ERROR:
      return 'ERROR'
    case SpanStatusCode.OK:
      return 'OK'
    default:
      return 'UNSET'
  }
})

const statusClass = computed(() => {
  switch (props.span.status_code) {
    case SpanStatusCode.ERROR:
      return 'bg-red-500/20 text-red-400'
    case SpanStatusCode.OK:
      return 'bg-green-500/20 text-green-400'
    default:
      return 'bg-orange-400/20 text-orange-400'
  }
})

const kindClass = computed(() => {
  const kind = props.span.kind
  switch (kind) {
    case 1:
      return 'bg-blue-500/20 text-blue-400'
    case 2:
      return 'bg-purple-500/20 text-purple-400'
    case 3:
      return 'bg-emerald-500/20 text-emerald-400'
    default:
      return 'bg-context/10 text-context'
  }
})

const hasAttributes = computed(() => Object.keys(props.span.attributes).length > 0)
const attributeCount = computed(() => Object.keys(props.span.attributes).length)

const { logs: allLogs } = useLogs()
const logs = computed<Log[]>(() => {
  return allLogs.value.filter(
    logEntry => logEntry.trace_id === props.span.trace_id && logEntry.span_id === props.span.span_id,
  )
})
</script>
