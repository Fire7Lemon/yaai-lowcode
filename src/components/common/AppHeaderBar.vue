<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="header-bar">
    <div class="header-bar__content">
      <div class="header-bar__title">{{ title }}</div>
      <div v-if="description" class="header-bar__description">{{ description }}</div>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

.header-bar__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.header-bar__title {
  font-size: 20px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--app-text);
}

.header-bar__description {
  color: var(--app-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}
</style>
