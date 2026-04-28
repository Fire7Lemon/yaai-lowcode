<script setup lang="ts">
import { computed } from 'vue'

import type { ComponentDef } from '@/types/component-def'
import type { DataBinding } from '@/types/data-binding'
import type { PageNode } from '@/types/page-node'
import { safeParseJson } from '@/utils/json'

import NodeOutlineBox from './NodeOutlineBox.vue'

interface RenderNode extends PageNode {
  children?: RenderNode[]
}

const props = defineProps<{
  node: RenderNode
  componentDefs: ComponentDef[]
  dataBindings: DataBinding[]
  selectedNodeId: number | null
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const componentDef = computed(() =>
  props.componentDefs.find((item) => item.component_key === props.node.component_key),
)
const binding = computed(() =>
  props.dataBindings.find((item) => item.id === props.node.data_binding_id),
)
const parsedProps = computed(() => safeParseJson(props.node.props_json))
const propSummary = computed(() => {
  if (!parsedProps.value || typeof parsedProps.value !== 'object' || Array.isArray(parsedProps.value)) {
    return []
  }

  return Object.entries(parsedProps.value)
    .slice(0, 4)
    .map(([key, value]) => ({
      key,
      value:
        typeof value === 'object'
          ? '对象'
          : typeof value === 'string'
            ? value
            : String(value),
    }))
})
</script>

<template>
  <NodeOutlineBox
    :active="props.selectedNodeId === props.node.id"
    :title="props.node.node_name || '未命名节点'"
    :subtitle="`${props.node.node_type} / ${componentDef?.component_name ?? props.node.component_key ?? '片段引用'}`"
    @click="emit('select', props.node.id)"
  >
    <div class="node-renderer__meta">
      <el-tag size="small" effect="plain">{{ props.node.slot_name || 'main' }}</el-tag>
      <el-tag v-if="binding" size="small" effect="plain" type="success">数据绑定：{{ binding.name }}</el-tag>
    </div>
    <div v-if="propSummary.length" class="node-renderer__props">
      <div class="node-renderer__props-title">配置概览</div>
      <div class="node-renderer__props-list">
        <div v-for="item in propSummary" :key="item.key" class="node-renderer__prop-chip">
          <span class="node-renderer__prop-key">{{ item.key }}</span>
          <span class="node-renderer__prop-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
    <div v-if="props.node.children?.length" class="node-renderer__children">
      <NodeRenderer
        v-for="child in props.node.children"
        :key="child.id"
        :node="child"
        :component-defs="props.componentDefs"
        :data-bindings="props.dataBindings"
        :selected-node-id="props.selectedNodeId"
        @select="emit('select', $event)"
      />
    </div>
  </NodeOutlineBox>
</template>

<style scoped>
.node-renderer__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.node-renderer__props {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-renderer__props-title {
  color: var(--app-text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.node-renderer__props-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.node-renderer__prop-chip {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 12px;
  background: rgba(248, 251, 255, 0.92);
}

.node-renderer__prop-key {
  color: var(--app-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.node-renderer__prop-value {
  color: var(--app-text);
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-renderer__children {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding-left: 16px;
}
</style>
