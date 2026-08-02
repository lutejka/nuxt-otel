<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { useLogs } from '../composables/useLogs'
import LogRow from '~/components/log/LogRow.vue'
import EmptyState from '~/components/ui/EmptyState.vue'

const { logs, clearAllLogs } = useLogs()
</script>

<template>
  <div class="h-full flex flex-col bg-default">
    <div class="border-b border-default shrink-0">
      <div class="p-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-white">Logs</h2>
          <UBadge color="primary" variant="soft" size="sm">{{ logs.length }}</UBadge>
        </div>
        <div class="flex items-center gap-3">
          <UButton size="xs" color="neutral" variant="outline" @click="clearAllLogs">Clear</UButton>
        </div>
      </div>
    </div>

    <template v-if="logs.length">
      <div class="flex-1 overflow-y-auto relative">
        <!-- Sticky header aligned with the grid columns -->
        <div
          class="sticky top-0 z-10 bg-default border-b border-default grid grid-cols-[60px_180px_150px_1fr_24px] items-center gap-3 px-3 py-2"
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
