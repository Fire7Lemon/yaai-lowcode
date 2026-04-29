<script setup lang="ts">
import type { ComponentDef } from '@/types/component-def'
import type { PageNode, UpdatePageNodeInput } from '@/types/page-node'

import NodeBasicForm from './NodeBasicForm.vue'
import NodeBindingForm from './NodeBindingForm.vue'
import NodeEventForm from './NodeEventForm.vue'
import NodeLayoutForm from './NodeLayoutForm.vue'
import NodePropsForm from './NodePropsForm.vue'
import NodeStyleForm from './NodeStyleForm.vue'
import NodeVisibleRuleForm from './NodeVisibleRuleForm.vue'

const props = defineProps<{
  node: PageNode | null
  componentDef?: ComponentDef
}>()

const emit = defineEmits<{
  patch: [payload: UpdatePageNodeInput]
}>()

const nodeTypeLabelMap: Record<string, string> = {
  container: '容器节点',
  component: '组件节点',
  fragment_ref: '片段引用节点',
}

function resolveNodeTypeLabel(nodeType: string | null) {
  if (!nodeType) {
    return '未命名类型'
  }
  return nodeTypeLabelMap[nodeType] ?? `未命名类型（${nodeType}）`
}
</script>

<template>
  <el-card shadow="never" class="app-card property-panel">
    <template #header>
      <div class="app-card__header-line">
        <div class="app-card__title-group">
          <div class="app-card__title">属性面板</div>
          <p class="app-card__description">
            {{
              props.node
                ? `${props.node.node_name || '未命名节点'} · ${resolveNodeTypeLabel(props.node.node_type)}`
                : '选中节点后在此调整属性与绑定配置。'
            }}
          </p>
        </div>
      </div>
    </template>
    <div class="property-panel__body">
      <div v-if="!props.node" class="property-panel__empty">
        <el-empty description="请选择一个节点" />
        <p class="property-panel__empty-note">选中节点后，可在这里查看基础信息、布局配置、绑定配置和显示规则。</p>
      </div>
      <el-collapse v-else :model-value="['basic', 'layout', 'props', 'style', 'binding', 'event', 'visible']">
        <el-collapse-item title="基础信息" name="basic">
          <NodeBasicForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
        <el-collapse-item title="布局配置" name="layout">
          <NodeLayoutForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
        <el-collapse-item title="业务属性" name="props">
          <NodePropsForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
        <el-collapse-item title="样式配置" name="style">
          <NodeStyleForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
        <el-collapse-item title="数据绑定" name="binding">
          <NodeBindingForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
        <el-collapse-item title="事件配置" name="event">
          <NodeEventForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
        <el-collapse-item title="显示规则" name="visible">
          <NodeVisibleRuleForm :node="props.node" @patch="emit('patch', $event)" />
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-card>
</template>

<style scoped>
.property-panel {
  height: 100%;
}

.property-panel :deep(.el-card__body) {
  height: calc(100% - 78px);
  padding: 0;
}

.property-panel__body {
  height: 100%;
  overflow: auto;
  padding: 10px 12px 14px;
}

.property-panel__empty {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 12px;
}

.property-panel__empty-note {
  max-width: 280px;
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

.property-panel :deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
}

.property-panel :deep(.el-collapse-item) {
  margin-bottom: 10px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.92));
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.03);
}

.property-panel :deep(.el-collapse-item__header) {
  height: 44px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(219, 229, 240, 0.2);
  color: var(--app-text);
  font-weight: 600;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(247, 250, 253, 0.88));
}

.property-panel :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background: transparent;
}

.property-panel :deep(.el-collapse-item__content) {
  padding: 8px 14px 8px;
}

.property-panel :deep(.el-form-item) {
  margin-bottom: 16px;
}

.property-panel :deep(.el-form-item__label) {
  color: var(--app-text-secondary);
  font-weight: 600;
}

.property-panel :deep(.el-alert) {
  border-radius: 12px;
}
</style>
