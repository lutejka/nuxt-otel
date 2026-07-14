<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Traces', icon: 'carbon:flow' },
  { to: '/logs', label: 'Logs', icon: 'carbon:document' },
]
</script>

<template>
  <div class="h-screen flex flex-col n-bg-base">
    <div class="flex w-full border-b n-border-base shrink-0">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-gray/50 n-transition hover:text-white border-b-2 border-transparent"
        active-class="!text-white !border-context"
      >
        <Icon :name="tab.icon" class="size-3.5" />
        {{ tab.label }}
      </NuxtLink>
    </div>
    <div class="flex-1 min-h-0 flex flex-col">
      <NuxtPage />
    </div>
  </div>
</template>
