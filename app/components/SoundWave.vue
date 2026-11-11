<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <span :class="['sound-wave', { 'sound-wave--sm': size === 'sm' }]" aria-hidden="true">
    <span class="bar bar--1" />
    <span class="bar bar--2" />
    <span class="bar bar--3" />
    <span class="bar bar--4" />
  </span>
</template>

<style scoped lang="scss">
.sound-wave {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 14px;
  width: 14px;
  color: currentColor;

  &--sm {
    height: 11px;
    width: 12px;
    gap: 1.5px;
  }

  .bar {
    width: 2px;
    height: 100%;
    background-color: currentColor;
    border-radius: $radius-full;
    transform-origin: center;
    animation: wave-bounce 1s ease-in-out infinite alternate;

    &--1 {
      animation-delay: 0.1s;
      animation-duration: 0.75s;
    }
    &--2 {
      animation-delay: 0.35s;
      animation-duration: 1.05s;
    }
    &--3 {
      animation-delay: 0.18s;
      animation-duration: 0.85s;
    }
    &--4 {
      animation-delay: 0.42s;
      animation-duration: 0.95s;
    }
  }
}

@keyframes wave-bounce {
  0% {
    transform: scaleY(0.25);
  }
  100% {
    transform: scaleY(1);
  }
}
</style>
