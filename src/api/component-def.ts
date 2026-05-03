import { componentDefs } from '@/mock/database'
import type { IdResponse, ListResult } from '@/types/api'
import type {
  ComponentDef,
  ComponentDefCreateInput,
  ComponentDefQuery,
  ComponentDefUpdateInput,
} from '@/types/component-def'

import { requestJson, shouldUseRealApi } from './http-client'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { getErrorMessageFromResponse } from './response-utils'

export const componentDefApiDrafts = {
  list: apiDraftMeta('/component-defs', 'GET', true),
  detail: apiDraftMeta('/component-defs/{id}', 'GET', true),
  create: apiDraftMeta('/component-defs', 'POST', true),
  update: apiDraftMeta('/component-defs/{id}', 'PUT', true),
  status: apiDraftMeta('/component-defs/{id}/status', 'PATCH', false, 'TODO: 是否统一走 PUT 待确认'),
  byKey: apiDraftMeta('/component-defs/by-key/{componentKey}', 'GET', true),
  remove: apiDraftMeta('/component-defs/{id}', 'DELETE', false, 'TODO: 后端 DELETE 当前 SYSTEM_ERROR，待修复'),
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
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

function mapComponentDefRecord(raw: unknown): ComponentDef {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    component_key: String(item.component_key ?? item.componentKey ?? ''),
    component_name: String(item.component_name ?? item.componentName ?? ''),
    component_group: toNullableString(item.component_group ?? item.componentGroup),
    component_type: toNullableString(item.component_type ?? item.componentType),
    icon: toNullableString(item.icon),
    is_container: toBoolean(item.is_container ?? item.isContainer),
    can_bind_data: toBoolean(item.can_bind_data ?? item.canBindData),
    can_reuse_as_fragment: toBoolean(item.can_reuse_as_fragment ?? item.canReuseAsFragment),
    prop_schema_json: toNullableString(item.prop_schema_json ?? item.propSchemaJson),
    style_schema_json: toNullableString(item.style_schema_json ?? item.styleSchemaJson),
    event_schema_json: toNullableString(item.event_schema_json ?? item.eventSchemaJson),
    layout_schema_json: toNullableString(item.layout_schema_json ?? item.layoutSchemaJson),
    allowed_child_types_json: toNullableString(item.allowed_child_types_json ?? item.allowedChildTypesJson),
    default_props_json: toNullableString(item.default_props_json ?? item.defaultPropsJson),
    default_style_json: toNullableString(item.default_style_json ?? item.defaultStyleJson),
    sort_order: toNumber(item.sort_order ?? item.sortOrder),
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

/** 详情载荷：信封或直接对象；success===false 时抛出后端 message/msg/error。 */
function extractComponentDefDetailPayload(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) {
    throw new Error('componentDef response is empty')
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid componentDef response shape')
  }
  const obj = raw as Record<string, unknown>
  if (obj.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'componentDef request failed')
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
  throw new Error('componentDef response missing detail payload')
}

function pickRowsAndTotal(container: Record<string, unknown>): { rows: unknown[]; total: number } | null {
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

function extractComponentDefListPayload(raw: unknown): ListResult<ComponentDef> {
  throwIfEnvelopeFailed(raw, 'listComponentDefs request failed')

  if (Array.isArray(raw)) {
    return {
      items: raw.map((row) => mapComponentDefRecord(row)),
      total: raw.length,
    }
  }

  if (!raw || typeof raw !== 'object') {
    return { items: [], total: 0 }
  }

  const root = raw as Record<string, unknown>
  let picked = pickRowsAndTotal(root)
  let page: number | undefined
  let page_size: number | undefined

  if (picked) {
    page = toNumber(root.page ?? root.current) ?? undefined
    page_size = toNumber(root.page_size ?? root.size) ?? undefined
  } else {
    const data = root.data
    if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
      const dataObj = data as Record<string, unknown>
      picked = pickRowsAndTotal(dataObj)
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
    items: picked.rows.map((row) => mapComponentDefRecord(row)),
    total: picked.total,
    page,
    page_size,
  }
}

/**
 * 前端 ComponentDefCreateInput / ComponentDefUpdateInput / 接口文档语义字段为 snake_case；
 * 当前后端 component-def 写入实测需要 camelCase；JSON 字段仍以字符串传输；
 * 后续以后端与文档统一为准；此处仅在 API 适配层转换。
 */
function buildComponentDefWriteRequestBodyForBackend(
  payload: ComponentDefCreateInput | ComponentDefUpdateInput,
): Record<string, unknown> {
  return {
    componentKey: payload.component_key,
    componentName: payload.component_name,
    componentGroup: payload.component_group,
    componentType: payload.component_type,
    icon: payload.icon,
    isContainer: payload.is_container,
    canBindData: payload.can_bind_data,
    canReuseAsFragment: payload.can_reuse_as_fragment,
    propSchemaJson: payload.prop_schema_json,
    styleSchemaJson: payload.style_schema_json,
    eventSchemaJson: payload.event_schema_json,
    layoutSchemaJson: payload.layout_schema_json,
    allowedChildTypesJson: payload.allowed_child_types_json,
    defaultPropsJson: payload.default_props_json,
    defaultStyleJson: payload.default_style_json,
    sortOrder: payload.sort_order,
    status: payload.status,
    remark: payload.remark,
  }
}

function buildComponentDefQueryParams(query: ComponentDefQuery): string {
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

function resolveDeleteComponentDefResponseId(raw: unknown, requestedId: number): IdResponse {
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

export async function listComponentDefs(query: ComponentDefQuery = {}): Promise<ListResult<ComponentDef>> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/component-defs${buildComponentDefQueryParams(query)}`, {
        method: 'GET',
      })
      return extractComponentDefListPayload(raw)
    } catch (error) {
      console.error('[listComponentDefs] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(buildListResult(componentDefs.filter((item) => includesQueryValue(item, query))))
}

export async function getComponentDef(id: number): Promise<ComponentDef | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/component-defs/${id}`, {
        method: 'GET',
      })
      throwIfEnvelopeFailed(raw, 'getComponentDef request failed')

      const payload = extractComponentDefDetailPayload(raw)
      return mapComponentDefRecord(payload)
    } catch (error) {
      console.error('[getComponentDef] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(componentDefs.find((item) => item.id === id))
}

export async function getComponentDefByKey(componentKey: string): Promise<ComponentDef | undefined> {
  if (shouldUseRealApi()) {
    try {
      const encodedKey = encodeURIComponent(componentKey)
      const raw = await requestJson<unknown>(`/component-defs/by-key/${encodedKey}`, {
        method: 'GET',
      })
      throwIfEnvelopeFailed(raw, 'getComponentDefByKey request failed')

      const payload = extractComponentDefDetailPayload(raw)
      return mapComponentDefRecord(payload)
    } catch (error) {
      console.error('[getComponentDefByKey] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(componentDefs.find((item) => item.component_key === componentKey))
}

export async function createComponentDef(payload: ComponentDefCreateInput): Promise<ComponentDef> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>('/component-defs', {
        method: 'POST',
        body: JSON.stringify(buildComponentDefWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'createComponentDef request failed')

      const detailPayload = extractComponentDefDetailPayload(raw)
      return mapComponentDefRecord(detailPayload)
    } catch (error) {
      console.error('[createComponentDef] real api failed in integration mode.', error)
      throw error
    }
  }

  const item: ComponentDef = {
    ...payload,
    id: nextNumericId(componentDefs),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  componentDefs.push(item)
  return mockResolve(item)
}

export async function updateComponentDef(
  id: number,
  payload: ComponentDefUpdateInput,
): Promise<ComponentDef | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/component-defs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buildComponentDefWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'updateComponentDef request failed')

      const detailPayload = extractComponentDefDetailPayload(raw)
      return mapComponentDefRecord(detailPayload)
    } catch (error) {
      console.error('[updateComponentDef] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = componentDefs.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  componentDefs[index] = {
    ...componentDefs[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(componentDefs[index])
}

export async function setComponentDefStatus(id: number, status: boolean): Promise<ComponentDef | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/component-defs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      throwIfEnvelopeFailed(raw, 'setComponentDefStatus request failed')

      const detailPayload = extractComponentDefDetailPayload(raw)
      return mapComponentDefRecord(detailPayload)
    } catch (error) {
      console.error('[setComponentDefStatus] real api failed in integration mode.', error)
      throw error
    }
  }

  const item = componentDefs.find((component) => component.id === id)
  if (!item) {
    return mockResolve(undefined)
  }
  item.status = status
  item.updated_at = new Date().toISOString()
  return mockResolve(item)
}

/** 删除组件定义：真实后端当前 DELETE 返回 SYSTEM_ERROR，调用仍会直连后端并在失败时 throw；mock 模式删除本地数据。 */
export async function deleteComponentDef(id: number): Promise<IdResponse | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/component-defs/${id}`, {
        method: 'DELETE',
      })
      if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        throwIfEnvelopeFailed(raw, 'deleteComponentDef request failed')
      }
      return resolveDeleteComponentDefResponseId(raw, id)
    } catch (error) {
      console.error('[deleteComponentDef] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = componentDefs.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  componentDefs.splice(index, 1)
  return mockResolve({ id })
}
