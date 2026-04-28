import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  copyPageNode,
  deletePageNode,
  getFragmentNodeTreeNodes,
  getTemplateNodeTreeNodes,
  getVersionNodeTree,
  movePageNode,
  saveVersionNodeTree,
  updatePageNode,
} from '@/api/page-node'
import { saveTemplateNodeTree } from '@/api/page-template'
import { saveFragmentNodeTree } from '@/api/reusable-fragment'
import type { ComponentDef } from '@/types/component-def'
import type { CopyPageNodeInput, CreatePageNodeInput, MovePageNodeInput, PageNode, UpdatePageNodeInput } from '@/types/page-node'
import { buildSavePageNodeTreePayload, validatePageNodeTree } from '@/utils/page-node-save'
import { buildNodeTree } from '@/utils/tree'

export type EditorSourceType = 'page_version' | 'page_template' | 'reusable_fragment'

export const useEditorStore = defineStore('editor', () => {
  const sourceType = ref<EditorSourceType>('page_version')
  const sourceId = ref<number | null>(null)
  const nodes = ref<PageNode[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const selectedNodeId = ref<number | null>(null)

  const tree = computed(() => buildNodeTree(nodes.value))
  const selectedNode = computed(() => nodes.value.find((item) => item.id === selectedNodeId.value) ?? null)

  function now() {
    return new Date().toISOString()
  }

  function applySelection(preferredNodeId?: number | null) {
    if (preferredNodeId && nodes.value.some((item) => item.id === preferredNodeId)) {
      selectedNodeId.value = preferredNodeId
      return
    }

    if (selectedNodeId.value && nodes.value.some((item) => item.id === selectedNodeId.value)) {
      return
    }

    selectedNodeId.value = nodes.value[0]?.id ?? null
  }

  function collectDescendantIds(rootId: number) {
    const ids = new Set<number>([rootId])
    let changed = true

    while (changed) {
      changed = false
      nodes.value.forEach((node) => {
        if (node.parent_id !== null && ids.has(node.parent_id) && !ids.has(node.id)) {
          ids.add(node.id)
          changed = true
        }
      })
    }

    return ids
  }

  function nextTemporaryNodeId() {
    const minId = Math.min(0, ...nodes.value.map((item) => item.id))
    return minId - 1
  }

  function nextSortOrder(parentId: number | null, slotName: string | null, ignoreId?: number) {
    const siblings = nodes.value.filter(
      (item) => item.parent_id === parentId && item.slot_name === slotName && item.id !== ignoreId,
    )
    return Math.max(0, ...siblings.map((item) => item.sort_order ?? 0)) + 1
  }

  function normalizeLocalNodes(preferredNodeId?: number | null) {
    const groupMap = new Map<string, PageNode[]>()
    const nodeMap = new Map<number, PageNode>()

    nodes.value.forEach((node) => {
      nodeMap.set(node.id, node)
      const key = `${node.parent_id ?? 'root'}::${node.slot_name ?? 'main'}`
      const group = groupMap.get(key) ?? []
      group.push(node)
      groupMap.set(key, group)
    })

    groupMap.forEach((group) => {
      group.sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      group.forEach((node, index) => {
        node.sort_order = index + 1
      })
    })

    const visiting = new Set<number>()
    const resolveDepth = (node: PageNode): number => {
      if (node.parent_id === null) {
        return 0
      }

      if (visiting.has(node.id)) {
        return 0
      }

      const parent = nodeMap.get(node.parent_id)
      if (!parent) {
        return 0
      }

      visiting.add(node.id)
      const depth = resolveDepth(parent) + 1
      visiting.delete(node.id)
      return depth
    }

    nodes.value.forEach((node) => {
      node.depth = resolveDepth(node)
    })

    nodes.value = [...nodes.value]
    applySelection(preferredNodeId)
  }

  function currentOwnerFields() {
    if (sourceId.value === null) {
      return undefined
    }

    if (sourceType.value === 'page_version') {
      return {
        page_version_id: sourceId.value,
        template_id: null,
        fragment_id: null,
      }
    }

    if (sourceType.value === 'page_template') {
      return {
        page_version_id: null,
        template_id: sourceId.value,
        fragment_id: null,
      }
    }

    return {
      page_version_id: null,
      template_id: null,
      fragment_id: sourceId.value,
    }
  }

  function createNodeLocally(payload: CreatePageNodeInput) {
    const owner = currentOwnerFields()
    if (!owner) {
      return undefined
    }

    const item: PageNode = {
      ...payload,
      id: nextTemporaryNodeId(),
      ...owner,
      node_type: payload.node_type,
      component_key: payload.node_type === 'fragment_ref' ? null : payload.component_key,
      ref_fragment_id: payload.node_type === 'fragment_ref' ? payload.ref_fragment_id : null,
      sort_order: payload.sort_order ?? nextSortOrder(payload.parent_id, payload.slot_name),
      depth: 0,
      created_at: now(),
      updated_at: now(),
    }

    nodes.value.push(item)
    normalizeLocalNodes(item.id)
    return item
  }

  function patchNodeLocally(id: number, payload: UpdatePageNodeInput) {
    const index = nodes.value.findIndex((item) => item.id === id)
    if (index === -1) {
      return undefined
    }

    const current = nodes.value[index]
    const nextNode: PageNode = {
      ...current,
      ...payload,
      updated_at: now(),
    }

    if (nextNode.node_type === 'fragment_ref') {
      nextNode.component_key = null
    } else if (payload.node_type && payload.node_type !== 'fragment_ref') {
      nextNode.ref_fragment_id = null
    }

    nodes.value.splice(index, 1, nextNode)
    normalizeLocalNodes(id)
    return nextNode
  }

  function moveNodeLocally(id: number, payload: MovePageNodeInput) {
    const node = nodes.value.find((item) => item.id === id)
    if (!node) {
      return undefined
    }

    node.parent_id = payload.parent_id
    node.slot_name = payload.slot_name
    node.sort_order = payload.sort_order ?? nextSortOrder(payload.parent_id, payload.slot_name, id)
    node.updated_at = now()
    normalizeLocalNodes(id)
    return node
  }

  function copyNodeLocally(id: number, payload?: Partial<CopyPageNodeInput>) {
    const source = nodes.value.find((item) => item.id === id)
    if (!source) {
      return undefined
    }

    const descendantIds = collectDescendantIds(id)
    const subtree = nodes.value
      .filter((item) => descendantIds.has(item.id))
      .sort((left, right) => {
        const depthDiff = (left.depth ?? 0) - (right.depth ?? 0)
        if (depthDiff !== 0) {
          return depthDiff
        }
        return (left.sort_order ?? 0) - (right.sort_order ?? 0)
      })

    const idMap = new Map<number, number>()
    subtree.forEach((node) => {
      idMap.set(node.id, nextTemporaryNodeId() - idMap.size)
    })

    const targetParentId = payload?.parent_id ?? source.parent_id
    const targetSlotName = payload?.slot_name ?? source.slot_name
    const targetSortOrder = payload?.sort_order ?? nextSortOrder(targetParentId, targetSlotName)
    const timestamp = now()

    const copiedNodes = subtree.map<PageNode>((node) => {
      const isRoot = node.id === id
      return {
        ...node,
        id: idMap.get(node.id) ?? nextTemporaryNodeId(),
        parent_id: isRoot ? targetParentId : (node.parent_id === null ? null : (idMap.get(node.parent_id) ?? null)),
        slot_name: isRoot ? targetSlotName : node.slot_name,
        sort_order: isRoot ? targetSortOrder : node.sort_order,
        node_name: isRoot ? `${node.node_name ?? '节点'}副本` : node.node_name,
        created_at: timestamp,
        updated_at: timestamp,
      }
    })

    nodes.value.push(...copiedNodes)
    normalizeLocalNodes(copiedNodes[0]?.id ?? null)
    return copiedNodes[0]
  }

  function deleteNodeLocally(id: number) {
    const ids = collectDescendantIds(id)
    const current = nodes.value.find((item) => item.id === id)
    if (!current) {
      return undefined
    }

    nodes.value = nodes.value.filter((item) => !ids.has(item.id))
    normalizeLocalNodes(current.parent_id)
    return current
  }

  async function loadEditor(type: EditorSourceType, id: number, preferredNodeId?: number | null) {
    sourceType.value = type
    sourceId.value = id
    loading.value = true

    try {
      if (type === 'page_version') {
        nodes.value = (await getVersionNodeTree(id))?.nodes ?? []
      } else if (type === 'page_template') {
        nodes.value = (await getTemplateNodeTreeNodes(id))?.nodes ?? []
      } else {
        nodes.value = (await getFragmentNodeTreeNodes(id))?.nodes ?? []
      }
      applySelection(preferredNodeId)
    } finally {
      loading.value = false
    }
  }

  async function selectNode(id: number | null) {
    selectedNodeId.value = id
  }

  async function patchNode(id: number, payload: UpdatePageNodeInput) {
    if (sourceType.value !== 'page_version' || id <= 0) {
      return patchNodeLocally(id, payload)
    }

    const updated = await updatePageNode(id, payload)
    if (!updated) {
      return undefined
    }
    const index = nodes.value.findIndex((item) => item.id === id)
    if (index >= 0) {
      nodes.value.splice(index, 1, updated)
    }
    return updated
  }

  async function moveNode(id: number, payload: MovePageNodeInput) {
    if (sourceType.value !== 'page_version' || id <= 0) {
      return moveNodeLocally(id, payload)
    }

    const updated = await movePageNode(id, payload)
    if (!updated || sourceId.value === null) {
      return undefined
    }
    await loadEditor(sourceType.value, sourceId.value, id)
    return updated
  }

  function replaceNodesFromResponse(nextNodes: PageNode[]) {
    nodes.value = nextNodes
    applySelection(selectedNodeId.value)
  }

  async function copyNode(id: number, payload?: Partial<CopyPageNodeInput>) {
    if (sourceType.value !== 'page_version' || id <= 0 || sourceId.value === null) {
      return copyNodeLocally(id, payload)
    }

    const response = await copyPageNode(id, payload)
    if (!response) {
      return undefined
    }

    const copiedIds = new Set(response.nodes.map((item) => item.id))
    const rootId =
      response.nodes.find((item) => item.parent_id === null || !copiedIds.has(item.parent_id))?.id ?? response.nodes[0]?.id

    await loadEditor(sourceType.value, sourceId.value, rootId)
    return response.nodes.find((item) => item.id === rootId)
  }

  async function deleteNode(id: number) {
    if (sourceType.value !== 'page_version' || id <= 0 || sourceId.value === null) {
      return deleteNodeLocally(id)
    }

    const result = await deletePageNode(id)
    if (!result) {
      return undefined
    }

    await loadEditor(sourceType.value, sourceId.value)
    return result
  }

  function validateNodes(componentDefs: ComponentDef[]) {
    return validatePageNodeTree(nodes.value, componentDefs)
  }

  async function saveTree() {
    if (sourceId.value === null) {
      return undefined
    }

    const payload = buildSavePageNodeTreePayload(nodes.value)
    saving.value = true

    try {
      if (sourceType.value === 'page_version') {
        const response = await saveVersionNodeTree(sourceId.value, payload)
        if (response) {
          replaceNodesFromResponse(response.nodes)
        }
        return response
      }

      if (sourceType.value === 'page_template') {
        const response = await saveTemplateNodeTree(sourceId.value, payload)
        if (response) {
          replaceNodesFromResponse(response.nodes)
        }
        return response
      }

      const response = await saveFragmentNodeTree(sourceId.value, payload)
      if (response) {
        replaceNodesFromResponse(response.nodes)
      }
      return response
    } finally {
      saving.value = false
    }
  }

  return {
    sourceType,
    sourceId,
    nodes,
    tree,
    loading,
    saving,
    selectedNodeId,
    selectedNode,
    loadEditor,
    selectNode,
    patchNode,
    moveNode,
    createNodeLocally,
    copyNode,
    deleteNode,
    replaceNodesFromResponse,
    validateNodes,
    saveTree,
  }
})
