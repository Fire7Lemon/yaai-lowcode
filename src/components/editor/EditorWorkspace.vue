<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { createPageNode } from '@/api/page-node'
import { listReusableFragments } from '@/api/reusable-fragment'
import { useComponentDefStore } from '@/stores/component-def'
import { useDataBindingStore } from '@/stores/data-binding'
import { useEditorStore, type EditorSourceType } from '@/stores/editor'
import type { ReusableFragment } from '@/types/reusable-fragment'
import type { CreatePageNodeInput, MovePageNodeInput, PageNodeType, UpdatePageNodeInput } from '@/types/page-node'

import ComponentPalette from './ComponentPalette.vue'
import EditorCanvas from './EditorCanvas.vue'
import FragmentReferenceDialog from './FragmentReferenceDialog.vue'
import NodePropertyPanel from './NodePropertyPanel.vue'
import NodeTreePanel from './NodeTreePanel.vue'
import NodeTreeToolbar from './NodeTreeToolbar.vue'

const props = defineProps<{
  sourceType: EditorSourceType
  sourceId: number
}>()

const componentStore = useComponentDefStore()
const dataBindingStore = useDataBindingStore()
const editorStore = useEditorStore()
const fragmentItems = ref<ReusableFragment[]>([])
const fragmentDialogVisible = ref(false)
const fragmentDialogMode = ref<'create' | 'replace'>('create')
const pendingFragmentNodeId = ref<number | null>(null)

const selectedComponentDef = computed(() =>
  componentStore.items.find((item) => item.component_key === editorStore.selectedNode?.component_key),
)
const selectedFragmentNode = computed(() =>
  pendingFragmentNodeId.value !== null ? editorStore.nodes.find((item) => item.id === pendingFragmentNodeId.value) ?? null : null,
)
const fragmentNameMap = computed<Record<number, string>>(() =>
  Object.fromEntries(fragmentItems.value.map((item) => [item.id, item.name])),
)
const containerComponentKey = computed(() => componentStore.enabledItems.find((item) => item.is_container)?.component_key ?? null)
const defaultComponentKey = computed(() => componentStore.enabledItems.find((item) => !item.is_container)?.component_key ?? null)
const fragmentDialogTitle = computed(() =>
  fragmentDialogMode.value === 'create' ? '新增片段引用节点' : '更换引用片段',
)
const dialogFragmentId = computed(() =>
  fragmentDialogMode.value === 'replace' ? selectedFragmentNode.value?.ref_fragment_id ?? null : null,
)

async function load() {
  const [fragmentResult] = await Promise.all([
    listReusableFragments(),
    componentStore.load(),
    dataBindingStore.load(),
  ])
  fragmentItems.value = fragmentResult.items
  await editorStore.loadEditor(props.sourceType, props.sourceId)
}

async function handleSelectNode(id: number) {
  await editorStore.selectNode(id)
}

async function handlePatch(payload: UpdatePageNodeInput) {
  if (!editorStore.selectedNodeId) {
    return
  }
  await editorStore.patchNode(editorStore.selectedNodeId, payload)
}

function resolveInsertTarget() {
  const current = editorStore.selectedNode
  if (!current) {
    return {
      parent_id: null,
      slot_name: 'main',
    }
  }

  if (current.node_type === 'container') {
    return {
      parent_id: current.id,
      slot_name: 'main',
    }
  }

  return {
    parent_id: current.parent_id,
    slot_name: current.slot_name ?? 'main',
  }
}

async function handleMove(event: { id: number; move: MovePageNodeInput }) {
  const result = await editorStore.moveNode(event.id, event.move)
  if (!result) {
    ElMessage.error('节点调整失败，请稍后重试')
  }
}

function buildBaseNode(
  componentKey: string | null,
  nodeType: PageNodeType,
  fragmentId: number | null = null,
): CreatePageNodeInput {
  const insertTarget = resolveInsertTarget()
  const component = componentStore.items.find((item) => item.component_key === componentKey)

  return {
    parent_id: insertTarget.parent_id,
    node_type: nodeType,
    component_key: componentKey,
    node_name: nodeType === 'fragment_ref' ? '片段引用节点' : component?.component_name ?? '组件节点',
    slot_name: insertTarget.slot_name,
    sort_order: null,
    col_span: 1,
    row_span: 1,
    data_binding_id: null,
    ref_fragment_id: nodeType === 'fragment_ref' ? fragmentId : null,
    props_json: component?.default_props_json ?? null,
    style_json: component?.default_style_json ?? null,
    layout_json: null,
    event_json: null,
    visible_rule_json: '{"showOn":["pc","mobile"]}',
    status: true,
    remark: '编辑器新增节点',
  }
}

async function createNode(payload: CreatePageNodeInput) {
  if (props.sourceType === 'page_version') {
    const created = await createPageNode(props.sourceId, payload)
    if (!created) {
      return undefined
    }
    await editorStore.loadEditor(props.sourceType, props.sourceId, created.id)
    return created
  }

  return editorStore.createNodeLocally(payload)
}

async function handleAddComponent(componentKey?: string) {
  const targetKey = componentKey ?? defaultComponentKey.value
  if (!targetKey) {
    ElMessage.warning('暂无可用组件，请先在组件定义中启用组件')
    return
  }

  const component = componentStore.items.find((item) => item.component_key === targetKey)
  const nodeType: PageNodeType = component?.is_container ? 'container' : 'component'
  const created = await createNode(buildBaseNode(targetKey, nodeType))
  if (!created) {
    ElMessage.error('组件新增失败，请稍后重试')
    return
  }
  ElMessage.success('组件已添加')
}

async function handleAddContainer() {
  if (!containerComponentKey.value) {
    ElMessage.warning('暂无可用容器组件，请先在组件定义中启用容器')
    return
  }

  const created = await createNode(buildBaseNode(containerComponentKey.value, 'container'))
  if (!created) {
    ElMessage.error('容器新增失败，请稍后重试')
    return
  }
  ElMessage.success('容器已添加')
}

function handleAddFragment() {
  if (!fragmentItems.value.length) {
    ElMessage.warning('暂无可引用片段，请先在片段管理中创建')
    return
  }
  fragmentDialogMode.value = 'create'
  pendingFragmentNodeId.value = null
  fragmentDialogVisible.value = true
}

async function handleCopyNode(id: number) {
  const result = await editorStore.copyNode(id)
  if (!result) {
    ElMessage.error('复制失败，请稍后重试')
    return
  }
  ElMessage.success('复制成功')
}

async function handleCopySelectedNode() {
  if (!editorStore.selectedNodeId) {
    return
  }
  await handleCopyNode(editorStore.selectedNodeId)
}

async function handleDeleteNode(id: number) {
  const node = editorStore.nodes.find((item) => item.id === id)
  if (!node) {
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除“${node.node_name || '未命名节点'}”及其子树吗？`, '删除节点', {
      type: 'warning',
    })
  } catch {
    return
  }

  const result = await editorStore.deleteNode(id)
  if (!result) {
    ElMessage.error('删除失败，请稍后重试')
    return
  }
  ElMessage.success('删除成功')
}

function handleReplaceFragmentRequest(id: number) {
  pendingFragmentNodeId.value = id
  fragmentDialogMode.value = 'replace'
  fragmentDialogVisible.value = true
}

async function handleFragmentDialogConfirm(fragmentId: number) {
  const fragment = fragmentItems.value.find((item) => item.id === fragmentId)
  if (!fragment) {
    ElMessage.error('未找到所选片段，请重新选择')
    return
  }

  if (fragmentDialogMode.value === 'create') {
    const created = await createNode(buildBaseNode(null, 'fragment_ref', fragment.id))
    if (!created) {
      ElMessage.error('片段引用新增失败，请稍后重试')
      return
    }

    await editorStore.patchNode(created.id, {
      node_name: fragment.name,
      ref_fragment_id: fragment.id,
      node_type: 'fragment_ref',
      component_key: null,
    })
    ElMessage.success('片段引用已添加')
    return
  }

  if (!pendingFragmentNodeId.value) {
    return
  }

  const updated = await editorStore.patchNode(pendingFragmentNodeId.value, {
    node_name: fragment.name,
    ref_fragment_id: fragment.id,
    node_type: 'fragment_ref',
    component_key: null,
  })
  if (!updated) {
    ElMessage.error('片段替换失败，请稍后重试')
    return
  }
  ElMessage.success('片段引用已更新')
}

const saveLabel = computed(() => {
  if (props.sourceType === 'page_version') {
    return '页面版本'
  }
  if (props.sourceType === 'page_template') {
    return '页面模板'
  }
  return '可复用片段'
})

async function handleSave() {
  const errors = editorStore.validateNodes(componentStore.items)
  if (errors.length) {
    ElMessage.error(errors[0])
    return
  }

  try {
    const response = await editorStore.saveTree()
    if (!response) {
      ElMessage.error(`${saveLabel.value}保存失败，请稍后重试`)
      return
    }

    ElMessage.success(`${saveLabel.value}已保存，请以重载结果为准`)
  } catch {
    ElMessage.error(`${saveLabel.value}保存失败，请检查网络或稍后重试`)
  }
}

onMounted(load)
</script>

<template>
  <div class="editor-workspace">
    <section class="app-page__header editor-workspace__header">
      <div class="app-page__title-group">
        <h1 class="app-page__title">{{ saveLabel }}编辑器</h1>
        <p class="app-page__description">围绕页面结构树进行编辑；支持新增、调整、绑定、预览与保存。</p>
      </div>
      <el-alert
        title="保存后系统会自动重载页面结构树，请以重载结果为准。"
        type="info"
        :closable="false"
        class="editor-workspace__alert"
      />
    </section>

    <div class="editor-workspace__toolbar">
      <NodeTreeToolbar
        :saving="editorStore.saving"
        :has-selection="Boolean(editorStore.selectedNodeId)"
        @refresh="load"
        @add-container="handleAddContainer"
        @add-component="handleAddComponent()"
        @add-fragment="handleAddFragment"
        @copy-selected="handleCopySelectedNode"
        @save="handleSave"
      />
    </div>

    <div class="editor-workspace__row">
      <div class="editor-workspace__col editor-workspace__col--left">
        <div class="editor-workspace__stack">
          <NodeTreePanel
            :items="editorStore.tree"
            :current-node-id="editorStore.selectedNodeId"
            :fragment-name-map="fragmentNameMap"
            @select="handleSelectNode"
            @move="handleMove"
            @copy="handleCopyNode"
            @remove="handleDeleteNode"
            @replace-fragment="handleReplaceFragmentRequest"
          />
          <ComponentPalette @select="handleAddComponent" />
        </div>
      </div>
      <div class="editor-workspace__col editor-workspace__col--center">
        <EditorCanvas
          :items="editorStore.tree"
          :component-defs="componentStore.items"
          :data-bindings="dataBindingStore.items"
          :selected-node-id="editorStore.selectedNodeId"
          @select="handleSelectNode"
        />
      </div>
      <div class="editor-workspace__col editor-workspace__col--right">
        <NodePropertyPanel :node="editorStore.selectedNode" :component-def="selectedComponentDef" @patch="handlePatch" />
      </div>
    </div>

    <FragmentReferenceDialog
      v-model="fragmentDialogVisible"
      :title="fragmentDialogTitle"
      :current-fragment-id="dialogFragmentId"
      :items="fragmentItems"
      @confirm="handleFragmentDialogConfirm"
    />
  </div>
</template>

<style scoped>
.editor-workspace {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.editor-workspace__header {
  align-items: stretch;
}

.editor-workspace__alert {
  flex: 0 0 260px;
  align-self: stretch;
  min-height: 100%;
}

.editor-workspace__toolbar {
  display: flex;
}

.editor-workspace__row {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(620px, 1fr) minmax(280px, 330px);
  gap: 14px;
  min-height: calc(100vh - 220px);
  height: calc(100vh - 220px);
}

.editor-workspace__col {
  display: flex;
  min-width: 0;
  min-height: 0;
}

.editor-workspace__stack {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-workspace__col--left .editor-workspace__stack {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

@media (max-width: 1440px) {
  .editor-workspace__row {
    grid-template-columns: minmax(240px, 280px) minmax(520px, 1fr) minmax(260px, 300px);
  }
}

@media (max-width: 1180px) {
  .editor-workspace__header {
    flex-direction: column;
  }

  .editor-workspace__alert {
    flex-basis: auto;
  }

  .editor-workspace__row {
    height: auto;
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .editor-workspace__col {
    min-height: 420px;
  }
}
</style>
