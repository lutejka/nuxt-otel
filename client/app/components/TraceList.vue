<template>
  <div class="h-full flex flex-col n-bg-base">
    <div class="border-b n-border-base h-24">
      <div class="p-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-white">Traces</h2>
          <span class="n-badge">{{ traces?.length }}</span>
        </div>
        <NButton n="xs" @click="$emit('clear-traces')"> Clear </NButton>
      </div>
      <div class="px-3 pb-3">
        <SearchInput v-model="searchQuery" placeholder="Search traces..." />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <EmptyState
        v-if="traces.length === 0"
        icon="📊"
        title="No traces yet"
        description="Waiting for traces from instrumented applications"
      />

      <div v-else-if="searchQuery && filteredTraces.length === 0" class="p-6 text-center">
        <p class="text-xs text-gray/50">No traces found for "{{ searchQuery }}"</p>
      </div>

      <template v-else>
        <TraceCard
          v-for="trace in filteredTraces"
          :key="trace.trace_id"
          :trace="trace"
          :is-selected="selectedTraceId === trace.trace_id"
          @select="(id: string) => $emit('select-trace', id)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import SearchInput from '~/components/ui/SearchInput.vue'
import EmptyState from '~/components/ui/EmptyState.vue'
import type { Trace } from '~~/types'

const { traces = [], selectedTraceId = null } = defineProps<{
  traces?: Trace[]
  selectedTraceId?: string | null
}>()

defineEmits<{
  'select-trace': [traceId: string]
  'clear-traces': []
}>()

const searchQuery = ref('')

const filteredTraces = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return traces
  return traces.filter(
    t =>
      t.trace_id?.toLowerCase().includes(query)
      || t.service_name?.toLowerCase().includes(query)
      || t.operation_name?.toLowerCase().includes(query),
  )
})
</script>
