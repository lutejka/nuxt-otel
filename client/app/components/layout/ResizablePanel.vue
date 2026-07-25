<template>
  <div class="relative h-full" :style="{ '--name-col': width + 'px' }">
    <div
      class="absolute top-0 bottom-0 z-10 cursor-col-resize -mx-px px-px border-l n-border-base hover:border-context transition-colors"
      :class="{ '!border-context': dragging }"
      :style="{ left: width + 'px' }"
      @mousedown="startDrag($event, 'left')"
    />
    <div class="grid grid-cols-[var(--name-col)_1fr] grid-rows-[1fr] h-full">
      <div class="min-h-0 overflow-hidden flex flex-col">
        <slot name="left" />
      </div>
      <div class="min-h-0 h-full overflow-hidden flex flex-col">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  min = 280,
  max = 800,
  defaultWidth = 300,
  storageKey,
} = defineProps<{
  min?: number
  max?: number
  defaultWidth?: number
  storageKey: string
}>()

const width = useLocalStorage(storageKey, defaultWidth)

const dragging = ref(false)

function preventSelect(e: Event) {
  e.preventDefault()
}

function startDrag(e: MouseEvent, direction: 'left' | 'right') {
  e.preventDefault()
  dragging.value = true
  const startX = e.clientX
  const startWidth = width.value
  const clearSelectStart = useEventListener('selectstart', preventSelect)
  const clearMouseMove = useEventListener('mousemove', onMouseMove)
  const clearMouseUp = useEventListener('mouseup', onMouseUp)

  function onMouseMove(e: MouseEvent) {
    const delta = direction === 'right' ? startX - e.clientX : e.clientX - startX
    width.value = Math.min(max, Math.max(min, startWidth + delta))
  }

  function onMouseUp() {
    dragging.value = false
    clearSelectStart()
    clearMouseMove()
    clearMouseUp()
  }
}
</script>
