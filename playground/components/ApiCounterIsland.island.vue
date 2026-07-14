<template>
  <div>
    <p>Island counter: {{ data?.value ?? 'loading...' }}</p>
  </div>
</template>

<script setup>
const { data } = await useAsyncData('island-counter', () => $fetch('/api/unstorage-test'))
</script>
