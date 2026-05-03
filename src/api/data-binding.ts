import { dataBindingPreviewMap, dataBindings } from '@/mock/database'
import type { IdResponse, ListResult } from '@/types/api'
import type {
  DataBinding,
  DataBindingCreateInput,
  DataBindingPreviewResponse,
  DataBindingQuery,
  DataBindingUpdateInput,
} from '@/types/data-binding'

import { requestJson, shouldUseRealApi } from './http-client'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { getErrorMessageFromResponse } from './response-utils'

export const dataBindingApiDrafts = {
  list: apiDraftMeta('/data-bindings', 'GET', true),
  detail: apiDraftMeta('/data-bindings/{id}', 'GET', true),
  create: apiDraftMeta('/data-bindings', 'POST', true),
  update: apiDraftMeta('/data-bindings/{id}', 'PUT', true),
  remove: apiDraftMeta('/data-bindings/{id}', 'DELETE', true),
  preview: apiDraftMeta(
    '/data-bindings/{id}/preview',
    'POST',
    false,
    'TODO: 是否同时返回原始源数据，以及是否支持临时覆盖 query_json 待确认',
  ),
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
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

function mapDataBindingRecord(raw: unknown): DataBinding {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    name: String(item.name ?? ''),
    binding_type: String(item.binding_type ?? item.bindingType ?? ''),
    source_key: String(item.source_key ?? item.sourceKey ?? ''),
    query_json: toNullableString(item.query_json ?? item.queryJson),
    field_map_json: toNullableString(item.field_map_json ?? item.fieldMapJson),
    transform_json: toNullableString(item.transform_json ?? item.transformJson),
    empty_state_json: toNullableString(item.empty_state_json ?? item.emptyStateJson),
    error_state_json: toNullableString(item.error_state_json ?? item.errorStateJson),
    cache_policy: toNullableString(item.cache_policy ?? item.cachePolicy),
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
function extractDataBindingDetailPayload(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) {
    throw new Error('dataBinding response is empty')
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid dataBinding response shape')
  }
  const obj = raw as Record<string, unknown>
  if (obj.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'dataBinding request failed')
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
  throw new Error('dataBinding response missing detail payload')
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

function extractDataBindingListPayload(raw: unknown): ListResult<DataBinding> {
  throwIfEnvelopeFailed(raw, 'listDataBindings request failed')

  if (Array.isArray(raw)) {
    return {
      items: raw.map((row) => mapDataBindingRecord(row)),
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
    items: picked.rows.map((row) => mapDataBindingRecord(row)),
    total: picked.total,
    page,
    page_size,
  }
}

/**
 * 前端 DataBindingCreateInput / DataBindingUpdateInput / 接口文档语义字段为 snake_case；
 * 当前后端 data-binding 写入实测需要 camelCase；JSON 字段仍以字符串传输；
 * 后续以后端与文档统一为准；此处仅在 API 适配层转换。
 */
function buildDataBindingWriteRequestBodyForBackend(
  payload: DataBindingCreateInput | DataBindingUpdateInput,
): Record<string, unknown> {
  return {
    name: payload.name,
    bindingType: payload.binding_type,
    sourceKey: payload.source_key,
    queryJson: payload.query_json,
    fieldMapJson: payload.field_map_json,
    transformJson: payload.transform_json,
    emptyStateJson: payload.empty_state_json,
    errorStateJson: payload.error_state_json,
    cachePolicy: payload.cache_policy,
    status: payload.status,
    remark: payload.remark,
  }
}

function buildDataBindingQueryParams(query: DataBindingQuery): string {
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

function resolveDeleteDataBindingResponseId(raw: unknown, requestedId: number): IdResponse {
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

function normalizePreviewRows(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw
  }
  return []
}

function extractDataBindingPreviewPayload(raw: unknown): DataBindingPreviewResponse {
  if (raw === null || raw === undefined) {
    throw new Error('dataBinding preview response is empty')
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid dataBinding preview response shape')
  }
  const obj = raw as Record<string, unknown>
  if (obj.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'previewDataBinding request failed')
  }

  let bindingRaw: unknown
  let previewRaw: unknown

  const data = obj.data
  if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
    const d = data as Record<string, unknown>
    bindingRaw = d.binding
    previewRaw = d.preview_data ?? d.previewData
  } else {
    bindingRaw = obj.binding
    previewRaw = obj.preview_data ?? obj.previewData
  }

  if (!bindingRaw || typeof bindingRaw !== 'object' || Array.isArray(bindingRaw)) {
    throw new Error('dataBinding preview response missing binding')
  }

  return {
    binding: mapDataBindingRecord(bindingRaw),
    preview_data: normalizePreviewRows(previewRaw),
  }
}

export async function listDataBindings(query: DataBindingQuery = {}): Promise<ListResult<DataBinding>> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/data-bindings${buildDataBindingQueryParams(query)}`, {
        method: 'GET',
      })
      return extractDataBindingListPayload(raw)
    } catch (error) {
      console.error('[listDataBindings] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(buildListResult(dataBindings.filter((item) => includesQueryValue(item, query))))
}

export async function getDataBinding(id: number): Promise<DataBinding | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/data-bindings/${id}`, {
        method: 'GET',
      })
      throwIfEnvelopeFailed(raw, 'getDataBinding request failed')

      const payload = extractDataBindingDetailPayload(raw)
      return mapDataBindingRecord(payload)
    } catch (error) {
      console.error('[getDataBinding] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(dataBindings.find((item) => item.id === id))
}

export async function createDataBinding(payload: DataBindingCreateInput): Promise<DataBinding> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>('/data-bindings', {
        method: 'POST',
        body: JSON.stringify(buildDataBindingWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'createDataBinding request failed')

      const detailPayload = extractDataBindingDetailPayload(raw)
      return mapDataBindingRecord(detailPayload)
    } catch (error) {
      console.error('[createDataBinding] real api failed in integration mode.', error)
      throw error
    }
  }

  const item: DataBinding = {
    ...payload,
    id: nextNumericId(dataBindings),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  dataBindings.push(item)
  return mockResolve(item)
}

export async function updateDataBinding(
  id: number,
  payload: DataBindingUpdateInput,
): Promise<DataBinding | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/data-bindings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buildDataBindingWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'updateDataBinding request failed')

      const detailPayload = extractDataBindingDetailPayload(raw)
      return mapDataBindingRecord(detailPayload)
    } catch (error) {
      console.error('[updateDataBinding] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = dataBindings.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  dataBindings[index] = {
    ...dataBindings[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(dataBindings[index])
}

export async function deleteDataBinding(id: number): Promise<IdResponse | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/data-bindings/${id}`, {
        method: 'DELETE',
      })
      if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        throwIfEnvelopeFailed(raw, 'deleteDataBinding request failed')
      }
      return resolveDeleteDataBindingResponseId(raw, id)
    } catch (error) {
      console.error('[deleteDataBinding] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = dataBindings.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  dataBindings.splice(index, 1)
  return mockResolve({ id })
}

export async function previewDataBinding(id: number): Promise<DataBindingPreviewResponse | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/data-bindings/${id}/preview`, {
        method: 'POST',
      })
      return extractDataBindingPreviewPayload(raw)
    } catch (error) {
      console.error('[previewDataBinding] real api failed in integration mode.', error)
      throw error
    }
  }

  const binding = dataBindings.find((item) => item.id === id)
  if (!binding) {
    return mockResolve(undefined)
  }

  return mockResolve({
    binding,
    preview_data: dataBindingPreviewMap[id] ?? [],
  })
}
