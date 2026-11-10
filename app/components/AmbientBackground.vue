<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  /** 0 = idle, 1 = fully energised (e.g. while Chi is thinking or listening) */
  energy?: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

// Slowly drifting, domain-warped noise field: warm smoke with faint ember contour lines.
const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_energy;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time * (0.03 + 0.05 * u_energy);

  vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t + 5.2));
  vec2 r = vec2(fbm(uv * 1.8 + 3.0 * q + vec2(1.7, 9.2) + t * 1.3),
                fbm(uv * 1.8 + 3.0 * q + vec2(8.3, 2.8) - t * 1.1));
  float f = fbm(uv * 1.6 + 3.5 * r);

  // Thin luminous contour lines through the field
  float lines = smoothstep(0.03, 0.0, abs(fract(f * 6.0) - 0.5) - 0.46);

  vec3 bg = vec3(0.071, 0.063, 0.055);
  vec3 smoke = vec3(0.93, 0.90, 0.85);
  vec3 ember = vec3(1.0, 0.37, 0.18);
  vec3 tint = mix(smoke, ember, clamp(length(q) * 0.9 - 0.2 + 0.4 * u_energy, 0.0, 1.0));

  float glow = pow(f, 3.0) * (0.08 + 0.14 * u_energy);
  vec3 col = bg + tint * glow + ember * lines * (0.02 + 0.05 * u_energy);

  // Vignette keeps the edges calm and the text readable
  col *= 1.0 - 0.45 * dot(uv * 0.8, uv * 0.8);
  gl_FragColor = vec4(col, 1.0);
}
`

let gl: WebGLRenderingContext | null = null
let frame = 0
let energy = 0
let resizeObserver: ResizeObserver | null = null

function compile(type: number, source: string) {
  const shader = gl!.createShader(type)!
  gl!.shaderSource(shader, source)
  gl!.compileShader(shader)
  return shader
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  gl = el.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
  gl.useProgram(program)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, 'u_res')
  const uTime = gl.getUniformLocation(program, 'u_time')
  const uEnergy = gl.getUniformLocation(program, 'u_energy')

  // Render at reduced resolution: the field is soft, and this keeps it cheap.
  const scale = 0.5
  const resize = () => {
    el.width = Math.max(1, Math.floor(el.clientWidth * scale))
    el.height = Math.max(1, Math.floor(el.clientHeight * scale))
    gl!.viewport(0, 0, el.width, el.height)
  }
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(el)

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = performance.now() - Math.random() * 100000

  const render = (now: number) => {
    energy += ((props.energy ?? 0) - energy) * 0.03
    gl!.uniform2f(uRes, el.width, el.height)
    gl!.uniform1f(uTime, (now - start) / 1000)
    gl!.uniform1f(uEnergy, energy)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    if (!reducedMotion) frame = requestAnimationFrame(render)
  }
  frame = requestAnimationFrame(render)

  if (reducedMotion) {
    watch(
      () => props.energy,
      () => requestAnimationFrame(render)
    )
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
})
</script>

<template>
  <canvas ref="canvas" class="ambient-bg" aria-hidden="true" />
</template>

<style scoped lang="scss">
.ambient-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background-color: $bg-app;
}
</style>
