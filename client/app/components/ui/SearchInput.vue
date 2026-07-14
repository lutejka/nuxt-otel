<template>
  <div class="relative">
    <Icon name="carbon:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray/40 text-xs" />
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="w-full n-bg-active border n-border-base rounded pl-7 pr-2 py-1.5 text-xs text-white placeholder-gray/40 focus:outline-none focus:ring-1 focus:ring-context/50 focus:border-transparent"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
