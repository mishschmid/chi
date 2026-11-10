<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  analyser: AnalyserNode | null
}>()

const BAR_COUNT = 29
const bars = ref<number[]>(Array(BAR_COUNT).fill(0))

let frame = 0
let buffer: Uint8Array<ArrayBuffer> | null = null

function tick() {
  const node = props.analyser
  let level = 0
  if (node) {
    if (!buffer || buffer.length !== node.fftSize) buffer = new Uint8Array(node.fftSize)
    node.getByteTimeDomainData(buffer)
    let sum = 0
    for (const v of buffer) sum += ((v - 128) / 128) ** 2
    level = Math.min(1, Math.sqrt(sum / buffer.length) * 4)
  }

  const t = performance.now() / 1000
  const mid = (BAR_COUNT - 1) / 2
  bars.value = bars.value.map((prev, i) => {
    // Bell-shaped envelope: centre bars react most, edges stay as dots.
    const d = Math.abs(i - mid) / mid
    const envelope = Math.exp(-d * d * 4)
    const jitter = 0.65 + 0.35 * Math.sin(t * 9 + i * 1.7)
    const target = level * envelope * jitter
    return prev + (target - prev) * (target > prev ? 0.5 : 0.15)
  })
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <div class="waveform" role="img" aria-label="Listening">
    <span
      v-for="(v, i) in bars"
      :key="i"
      class="waveform__bar"
      :style="{ height: `${4 + v * 28}px`, opacity: 0.35 + Math.min(v * 2, 0.65) }"
    />
  </div>
</template>

<style scoped lang="scss">
.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;

  &__bar {
    width: 3px;
    min-height: 4px;
    border-radius: $radius-full;
    background-color: $text-primary;
  }
}
</style>
