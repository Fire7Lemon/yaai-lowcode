import { pageNodes, pageTemplates } from '@/mock/database'
import type { IdResponse, ListResult, NodeCollectionResponse } from '@/types/api'
import type {
  PageTemplate,
  PageTemplateCreateInput,
  PageTemplateQuery,
  PageTemplateUpdateInput,
} from '@/types/page-template'
import type {
  PageNode,
  PageTemplateNodeTreeResponse,
  SavePageNodeTreePayload,
} from '@/types/page-node'

import { requestJson, shouldUseRealApi } from './http-client'
import { materializeSavedNodes } from './page-node'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { extractNodesFromSaveResponse, getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

export const pageTemplateApiDrafts = {
  list: apiDraftMeta('/page-templates', 'GET', true),
  detail: apiDraftMeta('/page-templates/{id}', 'GET', true),
  create: apiDraftMeta('/page-templates', 'POST', true),
  update: apiDraftMeta('/page-templates/{id}', 'PUT', true),
  remove: apiDraftMeta('/page-templates/{id}', 'DELETE', true),
  nodeTree: apiDraftMeta('/page-templates/{id}/node-tree', 'GET', true),
  saveNodeTree: apiDraftMeta(
    '/page-templates/{id}/node-tree',
    'PUT',
    false,
    'TODO: 整树保存时前端临时 ID 与后端真实 ID 的映射机制待确认',
  ),
}

type Envelope<T> = {
  code?: string | number
  success?: boolean
  message?: string
  msg?: string
  error?: string
  data?: T
}

type TemplateNodeTreeData = {
  nodes?: unknown[]
  template?: unknown
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

function mapPageTemplate(raw: unknown, fallbackTemplateId: number): PageTemplate {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? fallbackTemplateId),
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    scene_type: toNullableString(item.scene_type ?? item.sceneType),
    preview_image: toNullableString(item.preview_image ?? item.previewImage),
    description: toNullableString(item.description),
    status: toBoolean(item.status),
    remark: toNullableString(item.remark),
    created_at: String(item.created_at ?? item.createdAt ?? ''),
    updated_at: String(item.updated_at ?? item.updatedAt ?? ''),
  }
}

async function fetchRealTemplateNodeTree(id: number): Promise<PageTemplateNodeTreeResponse> {
  const rawResponse = await requestJson<Envelope<TemplateNodeTreeData>>(`/page-templates/${id}/node-tree`, {
    method: 'GET',
  })
  const data = rawResponse?.data ?? {}
  const rawNodes = Array.isArray(data.nodes) ? data.nodes : []
  return {
    template: mapPageTemplate(data.template, id),
    nodes: rawNodes.map((node) => mapPageNode(node)),
  }
}

export async function listPageTemplates(query: PageTemplateQuery = {}): Promise<ListResult<PageTemplate>> {
  return mockResolve(buildListResult(pageTemplates.filter((item) => includesQueryValue(item, query))))
}

export async function getPageTemplate(id: number): Promise<PageTemplate | undefined> {
  return mockResolve(pageTemplates.find((item) => item.id === id))
}

export async function createPageTemplate(payload: PageTemplateCreateInput): Promise<PageTemplate> {
  const item: PageTemplate = {
    ...payload,
    id: nextNumericId(pageTemplates),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  pageTemplates.push(item)
  return mockResolve(item)
}

export async function updatePageTemplate(id: number, payload: PageTemplateUpdateInput): Promise<PageTemplate | undefined> {
  const index = pageTemplates.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  pageTemplates[index] = {
    ...pageTemplates[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(pageTemplates[index])
}

export async function deletePageTemplate(id: number): Promise<IdResponse | undefined> {
  const index = pageTemplates.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  pageTemplates.splice(index, 1)
  return mockResolve({ id })
}

export async function getTemplateNodeTree(id: number): Promise<PageTemplateNodeTreeResponse | undefined> {
  if (shouldUseRealApi()) {
    try {
      return await fetchRealTemplateNodeTree(id)
    } catch (error) {
      // TEMP: backend compatibility for current delivery
      console.error('[getTemplateNodeTree] real api failed in integration mode.', error)
      throw error
    }
  }

  const template = pageTemplates.find((item) => item.id === id)
  if (!template) {
    return mockResolve(undefined)
  }
  return mockResolve({
    template,
    nodes: pageNodes.filter((item) => item.template_id === id),
  })
}

export async function saveTemplateNodeTree(
  id: number,
  payload: SavePageNodeTreePayload,
): Promise<NodeCollectionResponse<PageNode> | undefined> {
  if (shouldUseRealApi()) {
    try {
      const rawResponse = await requestJson<unknown>(`/page-templates/${id}/node-tree`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      if (!isSuccessEnvelope(rawResponse)) {
        const backendMessage =
          getErrorMessageFromResponse(rawResponse) ?? 'Save template node-tree response indicates failure.'
        throw new Error(backendMessage)
      }

      const savedNodes = extractNodesFromSaveResponse(rawResponse, mapPageNode)
      if (savedNodes) {
        return { nodes: savedNodes }
      }

      // TEMP: backend compatibility for current delivery
      // Integration-phase compensation: backend may only return success marker.
      const latestTree = await fetchRealTemplateNodeTree(id)
      return { nodes: latestTree.nodes }
    } catch (error) {
      // TEMP: backend compatibility for current delivery
      console.error('[saveTemplateNodeTree] real api failed in integration mode.', error)
      throw error
    }
  }

  const template = pageTemplates.find((item) => item.id === id)
  if (!template) {
    return mockResolve(undefined)
  }

  const remain = pageNodes.filter((item) => item.template_id !== id)
  const nextNodes = materializeSavedNodes(payload.nodes, {
    page_version_id: null,
    template_id: id,
    fragment_id: null,
  })

  pageNodes.splice(0, pageNodes.length, ...remain, ...nextNodes)
  return mockResolve({ nodes: nextNodes })
}
