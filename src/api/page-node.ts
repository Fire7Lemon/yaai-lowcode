import { componentDefs, pageNodes, pageTemplates, pageVersions, reusableFragments } from '@/mock/database'
import type { IdResponse, NodeCollectionResponse } from '@/types/api'
import type {
  CopyPageNodeInput,
  CreatePageNodeInput,
  MovePageNodeInput,
  PageNode,
  PageTemplateNodeTreeResponse,
  PageVersionNodeTreeResponse,
  ReferenceFragmentInput,
  ReusableFragmentNodeTreeResponse,
  SavePageNodeTreePayload,
  UpdatePageNodeInput,
} from '@/types/page-node'

import { apiDraftMeta, mockResolve, nextNumericId } from './mock-client'

export const pageNodeApiDrafts = {
  versionNodeTree: apiDraftMeta('/page-versions/{versionId}/node-tree', 'GET', true),
  saveVersionNodeTree: apiDraftMeta(
    '/page-versions/{versionId}/node-tree',
    'PUT',
    false,
    'TODO: 整树保存时前端临时 ID 与后端真实 ID 的映射机制待确认',
  ),
  createNode: apiDraftMeta('/page-versions/{versionId}/nodes', 'POST', true),
  updateNode: apiDraftMeta(
    '/page-nodes/{id}',
    'PUT',
    false,
    'TODO: parent_id / slot_name / sort_order 的结构性变更统一走 move，update 不负责结构移动',
  ),
  removeNode: apiDraftMeta('/page-nodes/{id}', 'DELETE', false, 'TODO: 删除容器节点时是否始终级联删除整棵子树待确认'),
  moveNode: apiDraftMeta('/page-nodes/{id}/move', 'POST', true),
  copyNode: apiDraftMeta('/page-nodes/{id}/copy', 'POST', true),
  referenceFragment: apiDraftMeta(
    '/page-nodes/{id}/reference-fragment',
    'POST',
    false,
    'TODO: 辅助动作接口可选，不作为核心依赖',
  ),
}

function now() {
  return new Date().toISOString()
}

function collectDescendantIds(rootId: number): Set<number> {
  const ids = new Set<number>([rootId])
  let changed = true

  while (changed) {
    changed = false
    pageNodes.forEach((node) => {
      if (node.parent_id !== null && ids.has(node.parent_id) && !ids.has(node.id)) {
        ids.add(node.id)
        changed = true
      }
    })
  }

  return ids
}

function calculateDepth(parentId: number | null): number {
  if (parentId === null) {
    return 0
  }
  const parent = pageNodes.find((node) => node.id === parentId)
  return (parent?.depth ?? 0) + 1
}

function updateSubtreeDepths(rootId: number) {
  const root = pageNodes.find((node) => node.id === rootId)
  if (!root) {
    return
  }

  const visit = (parentId: number, parentDepth: number) => {
    pageNodes
      .filter((node) => node.parent_id === parentId)
      .forEach((child) => {
        child.depth = parentDepth + 1
        visit(child.id, child.depth)
      })
  }

  visit(root.id, root.depth ?? 0)
}

function normalizeSiblingOrder(
  nodes: PageNode[],
  item: PageNode,
  currentParentId: number | null,
  currentSlotName: string | null,
  targetParentId: number | null,
  targetSlotName: string | null,
  targetSortOrder: number | null,
) {
  const sameGroup = currentParentId === targetParentId && currentSlotName === targetSlotName

  if (sameGroup) {
    const siblings = nodes
      .filter((node) => node.id !== item.id && node.parent_id === targetParentId && node.slot_name === targetSlotName)
      .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
    const targetIndex = Math.max(0, Math.min((targetSortOrder ?? siblings.length + 1) - 1, siblings.length))
    siblings.splice(targetIndex, 0, item)
    siblings.forEach((node, index) => {
      node.sort_order = index + 1
    })
    return
  }

  const oldGroup = nodes
    .filter((node) => node.id !== item.id && node.parent_id === currentParentId && node.slot_name === currentSlotName)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
  oldGroup.forEach((node, index) => {
    node.sort_order = index + 1
  })

  const newGroup = nodes
    .filter((node) => node.id !== item.id && node.parent_id === targetParentId && node.slot_name === targetSlotName)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))

  const targetIndex = Math.max(0, Math.min((targetSortOrder ?? newGroup.length + 1) - 1, newGroup.length))
  newGroup.splice(targetIndex, 0, item)
  newGroup.forEach((node, index) => {
    node.sort_order = index + 1
  })
}

function insertIntoSiblingGroup(
  nodes: PageNode[],
  item: PageNode,
  targetParentId: number | null,
  targetSlotName: string | null,
  targetSortOrder: number | null,
) {
  const siblings = nodes
    .filter((node) => node.id !== item.id && node.parent_id === targetParentId && node.slot_name === targetSlotName)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
  const targetIndex = Math.max(0, Math.min((targetSortOrder ?? siblings.length + 1) - 1, siblings.length))
  siblings.splice(targetIndex, 0, item)
  siblings.forEach((node, index) => {
    node.sort_order = index + 1
  })
}

export function materializeSavedNodes(
  inputNodes: SavePageNodeTreePayload['nodes'],
  owner: Pick<PageNode, 'page_version_id' | 'template_id' | 'fragment_id'>,
): PageNode[] {
  const nowValue = now()
  const idMap = new Map<number, number>()

  inputNodes.forEach((node, index) => {
    const tempKey = node.id ?? -(index + 1)

    if (tempKey > 0) {
      idMap.set(tempKey, tempKey)
      return
    }

    idMap.set(tempKey, nextNumericId(pageNodes) + idMap.size)
  })

  const output = inputNodes.map<PageNode>((node, index) => {
    const tempKey = node.id ?? -(index + 1)
    const resolvedId = idMap.get(tempKey) ?? nextNumericId(pageNodes)
    const existingNode = tempKey > 0 ? pageNodes.find((item) => item.id === tempKey) : undefined
    const resolvedParentId =
      node.parent_id === null
        ? null
        : idMap.get(node.parent_id) ?? null

    return {
      ...node,
      id: resolvedId,
      page_version_id: owner.page_version_id,
      template_id: owner.template_id,
      fragment_id: owner.fragment_id,
      parent_id: resolvedParentId,
      depth: 0,
      created_at: existingNode?.created_at ?? nowValue,
      updated_at: nowValue,
    }
  })

  const map = new Map(output.map((node) => [node.id, node]))
  const assignDepth = (node: PageNode): number => {
    if (node.parent_id === null) {
      node.depth = 0
      return 0
    }
    const parent = map.get(node.parent_id)
    if (!parent) {
      node.depth = 0
      return 0
    }
    const depth = assignDepth(parent) + 1
    node.depth = depth
    return depth
  }

  output.forEach((node) => {
    assignDepth(node)
  })

  return output
}

export async function getVersionNodeTree(versionId: number): Promise<PageVersionNodeTreeResponse | undefined> {
  const pageVersion = pageVersions.find((item) => item.id === versionId)
  if (!pageVersion) {
    return mockResolve(undefined)
  }

  return mockResolve({
    page_version: pageVersion,
    nodes: pageNodes.filter((item) => item.page_version_id === versionId),
  })
}

export async function getTemplateNodeTreeNodes(templateId: number): Promise<PageTemplateNodeTreeResponse | undefined> {
  const template = pageTemplates.find((item) => item.id === templateId)
  if (!template) {
    return mockResolve(undefined)
  }

  return mockResolve({
    template,
    nodes: pageNodes.filter((item) => item.template_id === templateId),
  })
}

export async function getFragmentNodeTreeNodes(
  fragmentId: number,
): Promise<ReusableFragmentNodeTreeResponse | undefined> {
  const fragment = reusableFragments.find((item) => item.id === fragmentId)
  if (!fragment) {
    return mockResolve(undefined)
  }

  return mockResolve({
    fragment,
    nodes: pageNodes.filter((item) => item.fragment_id === fragmentId),
  })
}

export async function saveVersionNodeTree(
  versionId: number,
  payload: SavePageNodeTreePayload,
): Promise<NodeCollectionResponse<PageNode> | undefined> {
  const pageVersion = pageVersions.find((item) => item.id === versionId)
  if (!pageVersion) {
    return mockResolve(undefined)
  }

  // TODO: v1 已确认整树保存采用全量覆盖，但前端临时 ID 映射机制仍待和后端最终确认。
  const remain = pageNodes.filter((item) => item.page_version_id !== versionId)
  const nextNodes = materializeSavedNodes(payload.nodes, {
    page_version_id: versionId,
    template_id: null,
    fragment_id: null,
  })

  pageNodes.splice(0, pageNodes.length, ...remain, ...nextNodes)
  return mockResolve({ nodes: nextNodes })
}

export async function updatePageNode(id: number, payload: UpdatePageNodeInput): Promise<PageNode | undefined> {
  const index = pageNodes.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  pageNodes[index] = {
    ...pageNodes[index],
    ...payload,
    updated_at: now(),
  }
  return mockResolve(pageNodes[index])
}

export async function createPageNode(versionId: number, payload: CreatePageNodeInput): Promise<PageNode | undefined> {
  const pageVersion = pageVersions.find((item) => item.id === versionId)
  if (!pageVersion) {
    return mockResolve(undefined)
  }

  const component = componentDefs.find((item) => item.component_key === payload.component_key)
  const item: PageNode = {
    ...payload,
    id: nextNumericId(pageNodes),
    page_version_id: versionId,
    template_id: null,
    fragment_id: null,
    component_key: payload.node_type === 'fragment_ref' ? null : payload.component_key,
    ref_fragment_id: payload.node_type === 'fragment_ref' ? payload.ref_fragment_id : null,
    sort_order: payload.sort_order,
    depth: calculateDepth(payload.parent_id),
    created_at: now(),
    updated_at: now(),
    props_json: payload.props_json ?? component?.default_props_json ?? null,
    style_json: payload.style_json ?? component?.default_style_json ?? null,
  }
  pageNodes.push(item)
  insertIntoSiblingGroup(pageNodes, item, payload.parent_id, payload.slot_name, payload.sort_order)
  return mockResolve(item)
}

export async function deletePageNode(id: number): Promise<IdResponse | undefined> {
  const ids = collectDescendantIds(id)
  const nextNodes = pageNodes.filter((item) => !ids.has(item.id))
  if (nextNodes.length === pageNodes.length) {
    return mockResolve(undefined)
  }

  pageNodes.splice(0, pageNodes.length, ...nextNodes)
  return mockResolve({ id })
}

export async function movePageNode(id: number, payload: MovePageNodeInput): Promise<PageNode | undefined> {
  const item = pageNodes.find((node) => node.id === id)
  if (!item) {
    return mockResolve(undefined)
  }

  const currentParentId = item.parent_id
  const currentSlotName = item.slot_name
  normalizeSiblingOrder(pageNodes, item, currentParentId, currentSlotName, payload.parent_id, payload.slot_name, payload.sort_order)
  item.parent_id = payload.parent_id
  item.slot_name = payload.slot_name
  item.depth = calculateDepth(payload.parent_id)
  item.updated_at = now()
  updateSubtreeDepths(item.id)
  return mockResolve(item)
}

export async function copyPageNode(
  id: number,
  payload?: Partial<CopyPageNodeInput>,
): Promise<NodeCollectionResponse<PageNode> | undefined> {
  const source = pageNodes.find((item) => item.id === id)
  if (!source) {
    return mockResolve(undefined)
  }

  const descendantIds = collectDescendantIds(id)
  const subtree = pageNodes.filter((item) => descendantIds.has(item.id))
  const idMap = new Map<number, number>()

  subtree.forEach((node) => {
    idMap.set(node.id, nextNumericId(pageNodes) + idMap.size)
  })

  const targetParentId = payload?.parent_id ?? source.parent_id
  const targetSlotName = payload?.slot_name ?? source.slot_name
  const targetSortOrder =
    payload?.sort_order ??
    pageNodes.filter((item) => item.parent_id === targetParentId && item.slot_name === targetSlotName).length + 1

  const copiedNodes: PageNode[] = subtree.map((node) => {
    const isRoot = node.id === id
    const newId = idMap.get(node.id) ?? nextNumericId(pageNodes)
    const nextParentId = isRoot
      ? targetParentId
      : (node.parent_id === null ? null : (idMap.get(node.parent_id) ?? null))

    return {
      ...node,
      id: newId,
      parent_id: nextParentId,
      slot_name: isRoot ? targetSlotName : node.slot_name,
      sort_order: isRoot ? targetSortOrder : node.sort_order,
      node_name: isRoot ? `${node.node_name ?? '节点'}副本` : node.node_name,
      depth: node.depth,
      created_at: now(),
      updated_at: now(),
    }
  })

  pageNodes.push(...copiedNodes)
  const newRootId = idMap.get(id)
  if (newRootId) {
    const newRoot = pageNodes.find((node) => node.id === newRootId)
    if (newRoot) {
      insertIntoSiblingGroup(pageNodes, newRoot, targetParentId, targetSlotName, targetSortOrder)
      newRoot.depth = calculateDepth(newRoot.parent_id)
      updateSubtreeDepths(newRoot.id)
    }
  }
  return mockResolve({ nodes: copiedNodes })
}

export async function referenceFragmentForNode(
  id: number,
  payload: ReferenceFragmentInput,
): Promise<PageNode | undefined> {
  return updatePageNode(id, {
    node_type: 'fragment_ref',
    component_key: null,
    ref_fragment_id: payload.ref_fragment_id,
  })
}
