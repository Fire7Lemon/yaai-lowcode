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
          <p class="app-card__description">
            从组件定义快速添加节点；上与 YAAI 前台对齐的<strong>推荐使用</strong>物料单独分组，其余为扩展/历史存量。
          </p>
        </div>
      </div>
    </template>
    <div class="palette palette-stack">
      <div v-if="componentStore.paletteOfficialItems.length" class="palette-section">
        <div class="palette-section__title">YAAI 推荐（白名单）</div>
        <div class="palette-section__buttons">
          <el-button
            v-for="item in componentStore.paletteOfficialItems"
            :key="item.component_key"
            text
            bg
            @click="emit('select', item.component_key)"
          >
            {{ item.component_name }}
            <span class="palette-chip">{{ item.component_key }}</span>
          </el-button>
        </div>
      </div>
      <div v-if="componentStore.paletteOtherItems.length" class="palette-section">
        <div class="palette-section__title">其他 / 历史</div>
        <div class="palette-section__buttons">
          <el-button
            v-for="item in componentStore.paletteOtherItems"
            :key="item.component_key"
            text
            bg
            @click="emit('select', item.component_key)"
          >
            {{ item.component_name }}
            <span class="palette-chip palette-chip--muted">{{ item.component_key }}</span>
          </el-button>
        </div>
      </div>
      <el-empty
        v-if="!componentStore.paletteOfficialItems.length && !componentStore.paletteOtherItems.length"
        description="暂无已启用的组件定义"
        :image-size="72"
      />
    </div>
  </el-card>
</template>

<style scoped>
.palette-card :deep(.el-card__body) {
  padding-top: 18px;
}

.palette-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.palette-section__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-muted, #64748b);
  margin-bottom: 8px;
}

.palette-section__buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.palette-section__buttons :deep(.el-button) {
  margin: 0;
  border-radius: 999px;
}

.palette-chip {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(37, 99, 235, 0.9);
}

.palette-chip--muted {
  color: var(--app-text-muted, #94a3b8);
}
</style>
