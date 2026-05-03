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
import { materializeSavedNodes, buildSaveNodeTreeRequestBodyForBackend } from './page-node'
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

function throwIfEnvelopeFailed(raw: unknown, fallbackMessage: string): void {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return
  }
  const envelope = raw as Record<string, unknown>
  if (envelope.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function extractPageTemplateDetailPayload(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) {
    throw new Error('pageTemplate response is empty')
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid pageTemplate response shape')
  }
  const obj = raw as Record<string, unknown>
  if (obj.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'pageTemplate request failed')
  }
  const data = obj.data
  if (data !== undefined && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const record = data as Record<string, unknown>
    if ('id' in record) {
      return record
    }
  }
  if ('id' in obj) {
    return obj
  }
  throw new Error('pageTemplate response missing detail payload')
}

function pickTemplateRowsAndTotal(container: Record<string, unknown>): { rows: unknown[]; total: number } | null {
  if (Array.isArray(container.records)) {
    const rows = container.records
    return { rows, total: Number(container.total ?? rows.length) }
  }
  if (Array.isArray(container.items)) {
    const rows = container.items
    return { rows, total: Number(container.total ?? rows.length) }
  }
  return null
}

function extractPageTemplateListPayload(raw: unknown): ListResult<PageTemplate> {
  throwIfEnvelopeFailed(raw, 'listPageTemplates request failed')

  if (Array.isArray(raw)) {
    return {
      items: raw.map((row) => mapPageTemplate(row, Number((row as Record<string, unknown>).id ?? 0))),
      total: raw.length,
    }
  }

  if (!raw || typeof raw !== 'object') {
    return { items: [], total: 0 }
  }

  const root = raw as Record<string, unknown>
  let picked = pickTemplateRowsAndTotal(root)
  let page: number | undefined
  let page_size: number | undefined

  if (picked) {
    page = toNumber(root.page ?? root.current) ?? undefined
    page_size = toNumber(root.page_size ?? root.size) ?? undefined
  } else {
    const data = root.data
    if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
      const dataObj = data as Record<string, unknown>
      picked = pickTemplateRowsAndTotal(dataObj)
      if (picked) {
        page = toNumber(dataObj.page ?? dataObj.current) ?? undefined
        page_size = toNumber(dataObj.page_size ?? dataObj.size) ?? undefined
      }
    }
  }

  if (!picked) {
    return { items: [], total: 0 }
  }

  return {
    items: picked.rows.map((row) => mapPageTemplate(row, Number((row as Record<string, unknown>).id ?? 0))),
    total: picked.total,
    page,
    page_size,
  }
}

/**
 * 前端 PageTemplateCreateInput / UpdateInput / 接口文档语义字段为 snake_case；
 * 当前后端 page-template 写入实测需要 camelCase；
 * 后续以后端与文档统一为准；此处仅在 API 适配层转换。
 */
function buildPageTemplateWriteRequestBodyForBackend(
  payload: PageTemplateCreateInput | PageTemplateUpdateInput,
): Record<string, unknown> {
  return {
    name: payload.name,
    code: payload.code,
    sceneType: payload.scene_type,
    previewImage: payload.preview_image,
    description: payload.description,
    status: payload.status,
    remark: payload.remark,
  }
}

function buildPageTemplateQueryParams(query: PageTemplateQuery): string {
  const search = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    search.set(key, String(value))
  })
  const text = search.toString()
  return text ? `?${text}` : ''
}

function resolveDeletePageTemplateResponseId(raw: unknown, requestedId: number): IdResponse {
  if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    const dataVal = obj.data
    if (typeof dataVal === 'number' && Number.isFinite(dataVal)) {
      return { id: dataVal }
    }
    if (dataVal !== undefined && dataVal !== null && typeof dataVal === 'object' && !Array.isArray(dataVal)) {
      const nestedId = (dataVal as Record<string, unknown>).id
      if (typeof nestedId === 'number' && Number.isFinite(nestedId)) {
        return { id: nestedId }
      }
    }
    const topId = obj.id
    if (typeof topId === 'number' && Number.isFinite(topId)) {
      return { id: topId }
    }
  }
  return { id: requestedId }
}

async function fetchRealTemplateNodeTree(id: number): Promise<PageTemplateNodeTreeResponse> {
  const rawResponse = await requestJson<Envelope<TemplateNodeTreeData>>(`/page-templates/${id}/node-tree`, {
    method: 'GET',
  })
  throwIfEnvelopeFailed(rawResponse, 'getTemplateNodeTree request failed')
  const data = rawResponse?.data ?? {}
  const rawNodes = Array.isArray(data.nodes) ? data.nodes : []
  return {
    template: mapPageTemplate(data.template, id),
    nodes: rawNodes.map((node) => mapPageNode(node)),
  }
}

export async function listPageTemplates(query: PageTemplateQuery = {}): Promise<ListResult<PageTemplate>> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/page-templates${buildPageTemplateQueryParams(query)}`, {
        method: 'GET',
      })
      return extractPageTemplateListPayload(raw)
    } catch (error) {
      console.error('[listPageTemplates] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(buildListResult(pageTemplates.filter((item) => includesQueryValue(item, query))))
}

export async function getPageTemplate(id: number): Promise<PageTemplate | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/page-templates/${id}`, {
        method: 'GET',
      })
      throwIfEnvelopeFailed(raw, 'getPageTemplate request failed')

      const payload = extractPageTemplateDetailPayload(raw)
      return mapPageTemplate(payload, id)
    } catch (error) {
      console.error('[getPageTemplate] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(pageTemplates.find((item) => item.id === id))
}

export async function createPageTemplate(payload: PageTemplateCreateInput): Promise<PageTemplate> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>('/page-templates', {
        method: 'POST',
        body: JSON.stringify(buildPageTemplateWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'createPageTemplate request failed')

      const detailPayload = extractPageTemplateDetailPayload(raw)
      return mapPageTemplate(detailPayload, Number(detailPayload.id ?? 0))
    } catch (error) {
      console.error('[createPageTemplate] real api failed in integration mode.', error)
      throw error
    }
  }

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
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/page-templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buildPageTemplateWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'updatePageTemplate request failed')

      const detailPayload = extractPageTemplateDetailPayload(raw)
      return mapPageTemplate(detailPayload, id)
    } catch (error) {
      console.error('[updatePageTemplate] real api failed in integration mode.', error)
      throw error
    }
  }

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
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/page-templates/${id}`, {
        method: 'DELETE',
      })
      if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        throwIfEnvelopeFailed(raw, 'deletePageTemplate request failed')
      }
      return resolveDeletePageTemplateResponseId(raw, id)
    } catch (error) {
      console.error('[deletePageTemplate] real api failed in integration mode.', error)
      throw error
    }
  }

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
        body: JSON.stringify(buildSaveNodeTreeRequestBodyForBackend(payload)),
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
