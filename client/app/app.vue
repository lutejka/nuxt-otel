<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Traces', icon: 'carbon:flow' },
  { to: '/logs', label: 'Logs', icon: 'carbon:document' },
]
</script>

<template>
  <div class="h-screen flex flex-col bg-default">
    <div class="flex w-full border-b border-default shrink-0">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-gray/50 transition-colors duration-200 hover:text-white border-b-2 border-transparent"
        active-class="!text-white !border-primary"
      >
        <UIcon :name="tab.icon" class="size-3.5" />
        {{ tab.label }}
      </NuxtLink>
    </div>
    <div class="flex-1 min-h-0 flex flex-col">
      <NuxtPage />
    </div>
  </div>
</template>
