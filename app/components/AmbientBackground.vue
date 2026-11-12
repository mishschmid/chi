<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0 = idle, 1 = fully energized (speaking, thinking, listening) */
    energy?: number
    listening?: boolean
    variant?: 'auto' | 'light' | 'dark' | 'hero'
  }>(),
  {
    energy: 0,
    listening: false,
    variant: 'auto',
  }
)

const canvas = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null
let level = 0.12
let voice = 0
let t = 0

function getInk(): [number, number, number, number] {
  if (props.variant === 'hero') {
    return [17, 17, 17, 0.13]
  }
  if (props.variant === 'dark') {
    return [243, 242, 239, 0.05]
  }
  if (props.variant === 'light') {
    return [17, 17, 17, 0.06]
  }

  // Auto detect from document data-theme
  if (typeof document !== 'undefined') {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    return isDark ? [243, 242, 239, 0.05] : [17, 17, 17, 0.06]
  }
  return [17, 17, 17, 0.06]
}

function draw(c: HTMLCanvasElement, ts: number) {
  const ink = getInk()
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const w = c.clientWidth
  const h = c.clientHeight
  if (!w || !h) return

  const targetW = Math.round(w * dpr)
  const targetH = Math.round(h * dpr)
  if (c.width !== targetW || c.height !== targetH) {
    c.width = targetW
    c.height = targetH
  }

  const ctx = c.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const isActive = props.listening || (props.energy ?? 0) > 0.2
  const targetLevel = props.listening ? 1 : props.energy ? 0.12 + props.energy * 0.88 : 0.12
  level += (targetLevel - level) * 0.035

  const targetVoice = isActive
    ? 0.35 + 0.65 * Math.abs(Math.sin(ts * 0.0029) * Math.sin(ts * 0.0013 + 1.3))
    : 0
  voice += (targetVoice - voice) * 0.12
  t += 0.0035 + 0.014 * level

  const n = 22
  const gap = h / n
  ctx.lineWidth = 1

  for (let i = 0; i < n; i++) {
    const y0 = gap * (i + 0.5)
    const ny = (i + 0.5) / n
    const rowEnv = Math.exp(-Math.pow((ny - 0.55) * 2.4, 2))
    const a = Math.min(0.5, ink[3] * (1 + level * 1.4 + voice * 1.2 * rowEnv))
    ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${a})`
    ctx.beginPath()

    for (let x = 0; x <= w + 10; x += 10) {
      const nx = x / w
      const env = Math.exp(-Math.pow((nx - 0.5) * 2.2, 2))
      const amp = gap * (0.7 + (level * 1.6 + voice * 3.2) * env * rowEnv)
      const y =
        y0 +
        amp *
          (Math.sin(nx * 5.5 + t * 2.4 + i * 0.45) * 0.6 +
            Math.sin(nx * 13 - t * 3.1 + i * 0.9) * (0.15 + 0.35 * level))

      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }
}

function loop(ts: number) {
  if (canvas.value) {
    draw(canvas.value, ts)
  }
  rafId = requestAnimationFrame(loop)
}

onMounted(() => {
  rafId = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
})
</script>

<template>
  <canvas ref="canvas" class="ambient-canvas" aria-hidden="true" />
</template>

<style scoped>
.ambient-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
