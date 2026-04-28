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

</script>

<template>
  <el-card shadow="never" class="app-card panel">
    <template #header>
      <div class="app-card__header-line">
        <div class="app-card__title-group">
          <div class="app-card__title">节点树</div>
            <p class="app-card__description">优先服务纵向扫描与点选，次信息下沉到第二行，减少横向拥挤。</p>
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
                <span class="tree-node__meta-item">类型：{{ data.node_type }}</span>
                <span class="tree-node__meta-item">slot：{{ data.slot_name || 'main' }}</span>
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
  padding: 10px 8px 8px 10px;
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

.panel :deep(.el-tree-node__content) {
  height: auto;
  min-height: 72px;
  padding: 6px 8px 6px 0;
  border-radius: 14px;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.panel :deep(.el-tree-node__content:hover) {
  background: rgba(59, 130, 246, 0.06);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.12);
}

.panel :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.1), rgba(96, 165, 250, 0.12));
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.tree-node {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.tree-node__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.5;
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
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 170px;
  max-width: 170px;
}
</style>
