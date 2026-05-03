<script setup lang="ts">
import type { ComponentDef } from '@/types/component-def'
import type { DataBinding } from '@/types/data-binding'
import type { NodeTreeItem } from '@/utils/tree'

import NodeRenderer from '@/components/page-node/NodeRenderer.vue'

defineProps<{
  items: NodeTreeItem[]
  componentDefs: ComponentDef[]
  dataBindings: DataBinding[]
  selectedNodeId: number | null
}>()

const emit = defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <el-card shadow="never" class="app-card canvas">
    <template #header>
      <div class="app-card__header-line">
        <div class="app-card__title-group">
          <div class="app-card__title">预览区</div>
          <p class="app-card__description">主舞台用于承载页面结构预览，容器层级和组件层级应一眼可辨。</p>
        </div>
      </div>
    </template>
    <div class="canvas__body">
      <div class="canvas__stage">
        <NodeRenderer
          v-for="item in items"
          :key="item.id"
          :node="item"
          :component-defs="componentDefs"
          :data-bindings="dataBindings"
          :selected-node-id="selectedNodeId"
          @select="emit('select', $event)"
        />
        <el-empty v-if="!items.length" description="当前没有节点数据" class="canvas__empty" />
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.canvas {
  height: 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.canvas :deep(.el-card__body) {
  height: calc(100% - 78px);
  width: 100%;
  min-width: 0;
  padding: 0;
  box-sizing: border-box;
}

.canvas__body {
  height: 100%;
  width: 100%;
  min-width: 0;
  overflow: auto;
  box-sizing: border-box;
  padding: 12px;
  background:
    linear-gradient(180deg, rgba(241, 245, 249, 0.85), rgba(248, 250, 252, 0.95)),
    #f8fafc;
}

.canvas__stage {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  min-width: 0;
  max-width: none;
  margin: 0;
  padding: 16px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-sizing: border-box;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.45),
    0 14px 28px rgba(15, 23, 42, 0.05);
}

.canvas__empty {
  min-height: 320px;
}
</style>
