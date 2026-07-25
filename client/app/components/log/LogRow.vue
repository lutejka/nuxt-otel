<template>
  <div>
    <div
      class="grid grid-cols-[60px_140px_100px_1fr_24px] items-center gap-3 px-3 py-2 cursor-pointer n-transition hover:n-bg-hover border-b n-border-base"
      :class="{
        'n-bg-active': isExpanded,
        'grid-cols-[60px_140px_100px_1fr_24px]': showServiceColumn,
        'grid-cols-[60px_140px_1fr_24px]': !showServiceColumn,
      }"
      @click="toggle"
    >
      <SeverityBadge :severity-number="log.severity_number" :severity-text="log.severity_text" />

      <span class="text-xs text-gray/40 font-mono whitespace-nowrap">
        {{ formatTimestamp(log.timestamp) }}
      </span>

      <span v-if="showServiceColumn" class="text-xs text-gray/60 font-medium whitespace-nowrap truncate">
        {{ log.service_name }}
      </span>

      <span class="text-xs text-gray/50 truncate">
        {{ log.body }}
      </span>

      <Icon
        name="carbon:chevron-down"
        :class="isExpanded ? 'rotate-180' : ''"
        class="w-4 h-4 text-gray/30 shrink-0 n-transition"
      />
    </div>

    <div v-if="isExpanded" class="border-b n-border-base n-bg-active">
      <div class="px-3 py-3 space-y-3">
        <div v-if="log.trace_id || log.span_id" class="flex gap-6">
          <div v-if="log.trace_id">
            <h4 class="text-[10px] font-semibold text-gray/40 uppercase mb-1">Trace ID</h4>
            <div class="text-xs text-gray/80 font-mono break-all">
              {{ log.trace_id }}
            </div>
          </div>
          <div v-if="log.span_id">
            <h4 class="text-[10px] font-semibold text-gray/40 uppercase mb-1">Span ID</h4>
            <div class="text-xs text-gray/80 font-mono break-all">
              {{ log.span_id }}
            </div>
          </div>
          <div v-if="!showServiceColumn">
            <h4 class="text-[10px] font-semibold text-gray/40 uppercase mb-1">Service</h4>
            <div class="text-xs text-gray/80 font-mono break-all">
              {{ log.service_name }}
            </div>
          </div>
        </div>

        <div v-if="hasAttributes">
          <h4 class="text-[10px] font-semibold text-gray/40 uppercase mb-1">Attributes</h4>
          <div class="n-bg-base rounded px-3 py-2">
            <KeyValueTable :data="log.attributes" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Log } from '~~/types'
import { formatTimestamp } from '~/utils/formatters'
import SeverityBadge from '~/components/ui/SeverityBadge.vue'
import KeyValueTable from '~/components/ui/KeyValueTable.vue'

const { log, showServiceColumn = true } = defineProps<{
  log: Log
  showServiceColumn?: boolean
}>()

const isExpanded = ref(false)

function toggle() {
  isExpanded.value = !isExpanded.value
}

const hasAttributes = computed(() => {
  const keys = Object.keys(log.attributes)
  return keys.length > 0
})

// Expose the root element for height measurement by parent
const rootEl = ref<HTMLElement | null>(null)
defineExpose({ rootEl })
</script>
