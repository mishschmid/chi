<template>
  <div class="thinking" role="status" aria-label="Cima is thinking">
    <span class="thinking__dot" />
    <span class="thinking__dot" />
    <span class="thinking__dot" />
    <span class="thinking__label">thinking</span>
  </div>
</template>

<style scoped lang="scss">
.thinking {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.2rem 0;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: $accent;
    animation: hop 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }

  &__label {
    margin-left: 0.5rem;
    font-family: $font-mono;
    font-size: 0.75rem;
    color: $text-muted;
    animation: fade 2.4s ease-in-out infinite;
  }
}

@keyframes hop {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@keyframes fade {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .thinking__dot,
  .thinking__label {
    animation: none;
  }
}
</style>
