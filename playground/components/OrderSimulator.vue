<template>
  <div class="p-4 max-w-md">
    <h2 class="text-lg font-bold mb-4">Order Simulator</h2>
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      :disabled="loading"
      @click="placeOrder"
    >
      {{ loading ? 'Processing...' : 'Place Test Order' }}
    </button>
    <div v-if="result" class="mt-4 p-3 bg-gray-100 rounded text-sm">
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false)
const result = ref<Record<string, any> | null>(null)

async function placeOrder() {
  loading.value = true
  const products = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5']
  try {
    result.value = await $fetch('/api/order', {
      method: 'POST',
      body: {
        productId: products[Math.floor(Math.random() * products.length)],
        quantity: Math.floor(Math.random() * 3) + 1,
        userId: `user-${Math.floor(Math.random() * 100)}`,
      },
    })
  } catch (e: any) {
    result.value = { error: e.message }
  } finally {
    loading.value = false
  }
}
</script>
