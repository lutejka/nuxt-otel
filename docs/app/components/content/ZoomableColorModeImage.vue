<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  alt: string
  dark: string
  light: string
  width?: string | number
  height?: string | number
}>()
</script>

<template>
  <!--
    ProseImg already provides the zoom lightbox. Render one instance per
    color mode, and use `relative z-10` so the zoom trigger stays clickable
    above the stretched link used by UPageCard.
  -->
  <ProseImg
    :src="light"
    :alt="alt"
    :width="width"
    :height="height"
    class="relative z-10 dark:hidden"
    :ui="{ overlay: 'z-100', content: 'z-100' }"
    v-bind="$attrs"
  />
  <ProseImg
    :src="dark"
    :alt="alt"
    :width="width"
    :height="height"
    class="relative z-10 hidden dark:block"
    :ui="{ overlay: 'z-100', content: 'z-100' }"
    v-bind="$attrs"
  />
</template>
