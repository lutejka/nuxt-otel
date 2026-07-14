<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { useLogs } from '../composables/useLogs'
import LogRow from '~/components/log/LogRow.vue'
import EmptyState from '~/components/ui/EmptyState.vue'

const { logs, clearAllLogs } = useLogs()
</script>

<template>
  <div class="h-full flex flex-col n-bg-base">
    <div class="border-b n-border-base shrink-0">
      <div class="p-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-white">Logs</h2>
          <span class="n-badge">{{ logs.length }}</span>
        </div>
        <div class="flex items-center gap-3">
          <NButton n="xs" @click="clearAllLogs">Clear</NButton>
        </div>
      </div>
    </div>

    <template v-if="logs.length">
      <div class="flex-1 overflow-y-auto relative">
        <!-- Sticky header aligned with the grid columns -->
        <div
          class="sticky top-0 z-10 n-bg-base border-b n-border-base grid grid-cols-[60px_180px_150px_1fr_24px] items-center gap-3 px-3 py-2"
        >
          <span class="text-[10px] font-semibold text-gray/40 uppercase">Severity</span>
          <span class="text-[10px] font-semibold text-gray/40 uppercase">Timestamp</span>
          <span class="text-[10px] font-semibold text-gray/40 uppercase">Service</span>
          <span class="text-[10px] font-semibold text-gray/40 uppercase">Message</span>
          <span class="text-[10px] font-semibold text-gray/40 uppercase" />
        </div>
        <div>
          <div v-for="log in logs" :key="log.log_id">
            <LogRow :log="log" />
          </div>
        </div>
      </div>
    </template>

    <EmptyState v-else icon="📄" title="No logs yet" description="Waiting for logs from instrumented applications" />
  </div>
</template>
