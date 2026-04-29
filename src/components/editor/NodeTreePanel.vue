<script setup lang="ts">
import { computed } from 'vue'

import NodeMoveActions from './NodeMoveActions.vue'
import NodeQuickActions from './NodeQuickActions.vue'

import type { MovePageNodeInput } from '@/types/page-node'
import type { NodeTreeItem } from '@/utils/tree'

const props = defineProps<{
  items: NodeTreeItem[]
  currentNodeId: number | null
  fragmentNameMap?: Record<number, string>
}>()

const emit = defineEmits<{
  select: [id: number]
  move: [payload: { id: number; move: MovePageNodeInput }]
  copy: [id: number]
  remove: [id: number]
  replaceFragment: [id: number]
}>()

function handleNodeClick(data: NodeTreeItem) {
  emit('select', data.id)
}

const defaultSlotOptions = ['main', 'left', 'right', 'header', 'footer', 'tab_1', 'tab_2']
const nodeTypeLabelMap: Record<string, string> = {
  container: '容器节点',
  component: '组件节点',
  fragment_ref: '片段引用节点',
}
const slotLabelMap: Record<string, string> = {
  main: '主槽位',
  left: '左侧槽位',
  right: '右侧槽位',
  header: '头部槽位',
  footer: '底部槽位',
  tab_1: '标签1槽位',
  tab_2: '标签2槽位',
}

const flatItems = computed(() => {
  const result: NodeTreeItem[] = []

  const visit = (items: NodeTreeItem[]) => {
    items.forEach((item) => {
      result.push(item)
      visit(item.children)
    })
  }

  visit(props.items)
  return result
})

const slotOptions = computed(() => {
  const values = new Set(defaultSlotOptions)
  flatItems.value.forEach((item) => {
    if (item.slot_name) {
      values.add(item.slot_name)
    }
  })
  return Array.from(values)
})

function sortedSiblingNodes(parentId: number | null, slotName: string | null) {
  return flatItems.value
    .filter((item) => item.parent_id === parentId && item.slot_name === slotName)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
}

function canMoveUp(node: NodeTreeItem) {
  const siblings = sortedSiblingNodes(node.parent_id, node.slot_name)
  return siblings.findIndex((item) => item.id === node.id) > 0
}

function canMoveDown(node: NodeTreeItem) {
  const siblings = sortedSiblingNodes(node.parent_id, node.slot_name)
  const index = siblings.findIndex((item) => item.id === node.id)
  return index >= 0 && index < siblings.length - 1
}

function descendantIds(node: NodeTreeItem): Set<number> {
  const ids = new Set<number>()

  const visit = (current: NodeTreeItem) => {
    current.children.forEach((child) => {
      ids.add(child.id)
      visit(child)
    })
  }

  visit(node)
  return ids
}

function parentOptions(node: NodeTreeItem) {
  const invalidIds = descendantIds(node)
  invalidIds.add(node.id)

  return flatItems.value
    .filter((item) => item.node_type === 'container' && !invalidIds.has(item.id))
    .map((item) => ({
      label: item.node_name || `节点#${item.id}`,
      value: item.id,
    }))
}

function nextSortOrder(parentId: number | null, slotName: string | null, ignoreId?: number) {
  const siblings = flatItems.value.filter(
    (item) => item.parent_id === parentId && item.slot_name === slotName && item.id !== ignoreId,
  )
  return Math.max(0, ...siblings.map((item) => item.sort_order ?? 0)) + 1
}

function emitMove(node: NodeTreeItem, move: MovePageNodeInput) {
  emit('move', {
    id: node.id,
    move,
  })
}

function handleMoveUp(node: NodeTreeItem) {
  const siblings = sortedSiblingNodes(node.parent_id, node.slot_name)
  const index = siblings.findIndex((item) => item.id === node.id)
  const target = index > 0 ? siblings[index - 1] : null
  if (!target) {
    return
  }

  emitMove(node, {
    parent_id: node.parent_id,
    slot_name: node.slot_name,
    sort_order: target.sort_order ?? index,
  })
}

function handleMoveDown(node: NodeTreeItem) {
  const siblings = sortedSiblingNodes(node.parent_id, node.slot_name)
  const index = siblings.findIndex((item) => item.id === node.id)
  const target = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null
  if (!target) {
    return
  }

  emitMove(node, {
    parent_id: node.parent_id,
    slot_name: node.slot_name,
    sort_order: target.sort_order ?? index + 2,
  })
}

function handleChangeParent(node: NodeTreeItem, parentId: number | null) {
  if (parentId === node.parent_id) {
    return
  }

  emitMove(node, {
    parent_id: parentId,
    slot_name: node.slot_name,
    sort_order: nextSortOrder(parentId, node.slot_name, node.id),
  })
}

function handleChangeSlot(node: NodeTreeItem, slotName: string | null) {
  if (slotName === node.slot_name) {
    return
  }

  emitMove(node, {
    parent_id: node.parent_id,
    slot_name: slotName,
    sort_order: nextSortOrder(node.parent_id, slotName, node.id),
  })
}

function resolveFragmentName(node: NodeTreeItem) {
  if (node.node_type !== 'fragment_ref' || !node.ref_fragment_id) {
    return ''
  }
  return props.fragmentNameMap?.[node.ref_fragment_id] ?? `片段#${node.ref_fragment_id}`
}

function resolveNodeTypeLabel(nodeType: string | null) {
  if (!nodeType) {
    return '未命名类型'
  }
  return nodeTypeLabelMap[nodeType] ?? `未命名类型（${nodeType}）`
}

function resolveSlotLabel(slotName: string | null) {
  if (!slotName) {
    return slotLabelMap.main
  }
  return slotLabelMap[slotName] ?? `自定义槽位：${slotName}`
}

</script>

<template>
  <el-card shadow="never" class="app-card panel">
    <template #header>
      <div class="app-card__header-line">
        <div class="app-card__title-group">
          <div class="app-card__title">页面结构树</div>
          <p class="app-card__description">用于查看页面结构树并快速选中节点，支持就地调整层级与槽位。</p>
        </div>
        <span class="app-card__meta">{{ flatItems.length }} 个节点</span>
      </div>
    </template>
    <div class="panel__body">
      <el-tree
        :data="props.items"
        node-key="id"
        default-expand-all
        highlight-current
        :current-node-key="props.currentNodeId ?? undefined"
        :props="{ children: 'children' }"
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <div class="tree-node">
            <div class="tree-node__main">
              <div class="tree-node__title-row">
                <span class="tree-node__title">{{ data.node_name || '未命名节点' }}</span>
                <el-tag size="small" :type="data.status ? 'success' : 'info'" effect="plain" class="tree-node__status">
                  {{ data.status ? '启用' : '停用' }}
                </el-tag>
              </div>
              <div class="tree-node__meta">
                <span class="tree-node__meta-item">类型：{{ resolveNodeTypeLabel(data.node_type) }}</span>
                <span class="tree-node__meta-item">插槽：{{ resolveSlotLabel(data.slot_name) }}</span>
                <span class="tree-node__meta-item">层级：{{ data.depth ?? 0 }}</span>
                <span class="tree-node__meta-item">排序：{{ data.sort_order ?? '-' }}</span>
                <span v-if="data.node_type === 'fragment_ref'" class="tree-node__fragment">
                  片段：{{ resolveFragmentName(data) }}
                </span>
                <span v-else-if="data.component_key" class="tree-node__meta-item tree-node__meta-item--truncate">
                  组件：{{ data.component_key }}
                </span>
              </div>
            </div>
            <div class="tree-node__actions">
              <NodeQuickActions
                :can-replace-fragment="data.node_type === 'fragment_ref'"
                @copy="emit('copy', data.id)"
                @remove="emit('remove', data.id)"
                @replace-fragment="emit('replaceFragment', data.id)"
              />
              <NodeMoveActions
                :can-move-up="canMoveUp(data)"
                :can-move-down="canMoveDown(data)"
                :parent-options="parentOptions(data)"
                :current-parent-id="data.parent_id"
                :slot-options="slotOptions"
                :current-slot-name="data.slot_name"
                @move-up="handleMoveUp(data)"
                @move-down="handleMoveDown(data)"
                @change-parent="handleChangeParent(data, $event)"
                @change-slot="handleChangeSlot(data, $event)"
              />
            </div>
          </div>
        </template>
      </el-tree>
    </div>
  </el-card>
</template>

<style scoped>
.panel {
  height: 100%;
}

.panel :deep(.el-card__body) {
  height: calc(100% - 78px);
  padding: 10px 10px 10px 10px;
}

.panel__body {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.panel :deep(.el-tree) {
  background: transparent;
}

.panel :deep(.el-tree-node) {
  position: relative;
}

.panel :deep(.el-tree-node__children) {
  position: relative;
}

.panel :deep(.el-tree-node__children::before) {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 6px;
  left: 7px;
  width: 1px;
  background: rgba(148, 163, 184, 0.24);
}

.panel :deep(.el-tree-node__content) {
  height: auto;
  min-height: 84px;
  padding: 8px 10px 8px 0;
  border-radius: 12px;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.panel :deep(.el-tree-node__content:hover) {
  background: rgba(59, 130, 246, 0.1);
  box-shadow:
    inset 0 0 0 1px rgba(59, 130, 246, 0.2),
    0 6px 14px rgba(37, 99, 235, 0.06);
  transform: translateX(1px);
}

.panel :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.17), rgba(96, 165, 250, 0.2));
  box-shadow:
    inset 0 0 0 1px rgba(37, 99, 235, 0.32),
    0 8px 20px rgba(37, 99, 235, 0.12);
}

.panel :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content .tree-node__title) {
  font-weight: 700;
}

.panel :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content .tree-node__status) {
  transform: scale(1.03);
}

.tree-node {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 10px;
  min-width: 0;
}

.tree-node__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.tree-node__title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.tree-node__title {
  min-width: 0;
  flex: 1;
  color: var(--app-text);
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node__status {
  flex: 0 0 auto;
}

.tree-node__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 10px;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.45;
  min-width: 0;
}

.tree-node__meta-item {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node__meta-item--truncate {
  max-width: 100%;
}

.tree-node__fragment {
  color: #b45309;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node__actions {
  display: grid;
  grid-template-columns: 1fr;
  flex: 0 0 auto;
  align-content: start;
  gap: 4px;
  min-width: 154px;
  max-width: 164px;
}

@media (max-width: 1520px) {
  .tree-node__meta {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
