import { pageNodes, reusableFragments } from '@/mock/database'
import type { IdResponse, ListResult, NodeCollectionResponse } from '@/types/api'
import type {
  ReusableFragment,
  ReusableFragmentCreateInput,
  ReusableFragmentQuery,
  ReusableFragmentUpdateInput,
} from '@/types/reusable-fragment'
import type {
  PageNode,
  ReusableFragmentNodeTreeResponse,
  SavePageNodeTreePayload,
} from '@/types/page-node'

import { requestJson, shouldUseRealApi } from './http-client'
import { materializeSavedNodes } from './page-node'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { extractNodesFromSaveResponse, getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

export const reusableFragmentApiDrafts = {
  list: apiDraftMeta('/reusable-fragments', 'GET', true),
  detail: apiDraftMeta('/reusable-fragments/{id}', 'GET', true),
  create: apiDraftMeta('/reusable-fragments', 'POST', true),
  update: apiDraftMeta('/reusable-fragments/{id}', 'PUT', true),
  remove: apiDraftMeta('/reusable-fragments/{id}', 'DELETE', true),
  nodeTree: apiDraftMeta('/reusable-fragments/{id}/node-tree', 'GET', true),
  saveNodeTree: apiDraftMeta(
    '/reusable-fragments/{id}/node-tree',
    'PUT',
    false,
    'TODO: 整树保存时前端临时 ID 与后端真实 ID 的映射机制待确认',
  ),
}

type Envelope<T> = {
  code?: string
  success?: boolean
  message?: string
  data?: T
}

type FragmentNodeTreeData = {
  nodes?: unknown[]
  fragment?: unknown
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

function mapPageNode(raw: unknown): PageNode {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    page_version_id: toNullableNumber(item.page_version_id ?? item.pageVersionId),
    template_id: toNullableNumber(item.template_id ?? item.templateId),
    fragment_id: toNullableNumber(item.fragment_id ?? item.fragmentId),
    parent_id: toNullableNumber(item.parent_id ?? item.parentId),
    node_type: String(item.node_type ?? item.nodeType ?? 'component') as PageNode['node_type'],
    component_key: toNullableString(item.component_key ?? item.componentKey),
    node_name: toNullableString(item.node_name ?? item.nodeName),
    slot_name: toNullableString(item.slot_name ?? item.slotName),
    sort_order: toNullableNumber(item.sort_order ?? item.sortOrder),
    depth: toNullableNumber(item.depth),
    col_span: toNullableNumber(item.col_span ?? item.colSpan),
    row_span: toNullableNumber(item.row_span ?? item.rowSpan),
    data_binding_id: toNullableNumber(item.data_binding_id ?? item.dataBindingId),
    ref_fragment_id: toNullableNumber(item.ref_fragment_id ?? item.refFragmentId),
    props_json: toNullableString(item.props_json ?? item.propsJson),
    style_json: toNullableString(item.style_json ?? item.styleJson),
    layout_json: toNullableString(item.layout_json ?? item.layoutJson),
    event_json: toNullableString(item.event_json ?? item.eventJson),
    visible_rule_json: toNullableString(item.visible_rule_json ?? item.visibleRuleJson),
    status: toBoolean(item.status),
    remark: toNullableString(item.remark),
    created_at: String(item.created_at ?? item.createdAt ?? ''),
    updated_at: String(item.updated_at ?? item.updatedAt ?? ''),
  }
}

function mapReusableFragment(raw: unknown, fallbackFragmentId: number): ReusableFragment {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? fallbackFragmentId),
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    fragment_type: toNullableString(item.fragment_type ?? item.fragmentType),
    description: toNullableString(item.description),
    status: toBoolean(item.status),
    remark: toNullableString(item.remark),
    created_at: String(item.created_at ?? item.createdAt ?? ''),
    updated_at: String(item.updated_at ?? item.updatedAt ?? ''),
  }
}

async function fetchRealFragmentNodeTree(id: number): Promise<ReusableFragmentNodeTreeResponse> {
  const rawResponse = await requestJson<Envelope<FragmentNodeTreeData>>(`/reusable-fragments/${id}/node-tree`, {
    method: 'GET',
  })
  const data = rawResponse?.data ?? {}
  const rawNodes = Array.isArray(data.nodes) ? data.nodes : []
  return {
    fragment: mapReusableFragment(data.fragment, id),
    nodes: rawNodes.map((node) => mapPageNode(node)),
  }
}

export async function listReusableFragments(
  query: ReusableFragmentQuery = {},
): Promise<ListResult<ReusableFragment>> {
  return mockResolve(buildListResult(reusableFragments.filter((item) => includesQueryValue(item, query))))
}

export async function getReusableFragment(id: number): Promise<ReusableFragment | undefined> {
  return mockResolve(reusableFragments.find((item) => item.id === id))
}

export async function createReusableFragment(payload: ReusableFragmentCreateInput): Promise<ReusableFragment> {
  const item: ReusableFragment = {
    ...payload,
    id: nextNumericId(reusableFragments),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  reusableFragments.push(item)
  return mockResolve(item)
}

export async function updateReusableFragment(
  id: number,
  payload: ReusableFragmentUpdateInput,
): Promise<ReusableFragment | undefined> {
  const index = reusableFragments.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  reusableFragments[index] = {
    ...reusableFragments[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(reusableFragments[index])
}

export async function deleteReusableFragment(id: number): Promise<IdResponse | undefined> {
  const index = reusableFragments.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  reusableFragments.splice(index, 1)
  return mockResolve({ id })
}

export async function getFragmentNodeTree(id: number): Promise<ReusableFragmentNodeTreeResponse | undefined> {
  if (shouldUseRealApi()) {
    try {
      return await fetchRealFragmentNodeTree(id)
    } catch (error) {
      // TEMP: backend compatibility for current delivery
      console.error('[getFragmentNodeTree] real api failed in integration mode.', error)
      throw error
    }
  }

  const fragment = reusableFragments.find((item) => item.id === id)
  if (!fragment) {
    return mockResolve(undefined)
  }
  return mockResolve({
    fragment,
    nodes: pageNodes.filter((item) => item.fragment_id === id),
  })
}

export async function saveFragmentNodeTree(
  id: number,
  payload: SavePageNodeTreePayload,
): Promise<NodeCollectionResponse<PageNode> | undefined> {
  if (shouldUseRealApi()) {
    try {
      const rawResponse = await requestJson<unknown>(`/reusable-fragments/${id}/node-tree`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (!isSuccessEnvelope(rawResponse)) {
        const backendMessage =
          getErrorMessageFromResponse(rawResponse) ?? 'Save fragment node-tree response indicates failure.'
        throw new Error(backendMessage)
      }

      const savedNodes = extractNodesFromSaveResponse(rawResponse, mapPageNode)
      if (savedNodes) {
        return { nodes: savedNodes }
      }

      // TEMP: backend compatibility for current delivery
      // Integration-phase compensation: backend may only return success marker.
      const latestTree = await fetchRealFragmentNodeTree(id)
      return { nodes: latestTree.nodes }
    } catch (error) {
      // TEMP: backend compatibility for current delivery
      console.error('[saveFragmentNodeTree] real api failed in integration mode.', error)
      throw error
    }
  }

  const fragment = reusableFragments.find((item) => item.id === id)
  if (!fragment) {
    return mockResolve(undefined)
  }

  const remain = pageNodes.filter((item) => item.fragment_id !== id)
  const nextNodes = materializeSavedNodes(payload.nodes, {
    page_version_id: null,
    template_id: null,
    fragment_id: id,
  })

  pageNodes.splice(0, pageNodes.length, ...remain, ...nextNodes)
  return mockResolve({ nodes: nextNodes })
}
