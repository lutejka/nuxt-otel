<template>
  <div>
    <p>Counter value: {{ data?.value ?? 'loading...' }}</p>
  </div>
</template>

<script setup>
const { data } = await useAsyncData('counter', () => $fetch('/api/unstorage-test'))
</script>
