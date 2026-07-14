<template>
  <div class="flex-1 flex flex-col items-center justify-center text-center p-6 size-full">
    <div class="space-y-3 max-w-xs">
      <div class="w-16 h-16 mx-auto n-bg-active rounded-2xl flex items-center justify-center">
        <span class="text-2xl text-gray/30">{{ icon }}</span>
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-semibold text-white">
          {{ title }}
        </h3>
        <p class="text-xs text-gray/50 leading-relaxed">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
}>()
</script>
