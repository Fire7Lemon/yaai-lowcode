<script setup lang="ts">
import { onMounted } from 'vue'

import { useComponentDefStore } from '@/stores/component-def'

const emit = defineEmits<{
  select: [componentKey: string]
}>()

const componentStore = useComponentDefStore()

onMounted(async () => {
  await componentStore.load()
})
</script>

<template>
  <el-card shadow="never" class="app-card palette-card">
    <template #header>
      <div class="app-card__header-line">
        <div class="app-card__title-group">
          <div class="app-card__title">组件面板</div>
          <p class="app-card__description">从组件定义中快速添加节点（component_def）。</p>
        </div>
      </div>
    </template>
    <div class="palette">
      <el-button
        v-for="item in componentStore.enabledItems"
        :key="item.component_key"
        text
        bg
        @click="emit('select', item.component_key)"
      >
        {{ item.component_name }}
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.palette-card :deep(.el-card__body) {
  padding-top: 18px;
}

.palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.palette :deep(.el-button) {
  margin: 0;
  border-radius: 999px;
}
</style>
