<script setup lang="ts">
const props = defineProps<{
  active?: boolean
  title: string
  subtitle?: string
}>()

const kind = props.subtitle?.split(' / ')[0] ?? ''
</script>

<template>
  <div
    class="outline"
    :class="{
      'outline--active': active,
      'outline--container': kind === 'container',
      'outline--component': kind === 'component',
      'outline--fragment': kind === 'fragment_ref',
    }"
  >
    <div class="outline__header">
      <div class="outline__title-group">
        <div class="outline__title">{{ title }}</div>
        <div v-if="subtitle" class="outline__subtitle">{{ subtitle }}</div>
      </div>
    </div>
    <div class="outline__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.outline {
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.94));
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.outline--active {
  border-color: #2563eb;
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.12),
    0 18px 36px rgba(37, 99, 235, 0.1);
}

.outline--container {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(244, 249, 255, 0.96));
}

.outline--component {
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(249, 251, 253, 0.94));
}

.outline--fragment {
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.84), rgba(255, 255, 255, 0.96));
}

.outline__header {
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(219, 229, 240, 0.7);
  background: rgba(255, 255, 255, 0.72);
}

.outline__title-group {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.outline__title {
  font-weight: 600;
  color: var(--app-text);
}

.outline__subtitle {
  color: var(--app-text-muted);
  font-size: 12px;
}

.outline__body {
  padding: 14px 16px 16px;
}
</style>
