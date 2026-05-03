import { menus } from '@/mock/database'
import type { IdResponse, ListResult } from '@/types/api'
import type { Menu, MenuCreateInput, MenuQuery, MenuUpdateInput, MoveMenuInput } from '@/types/menu'

import { requestJson, shouldUseRealApi } from './http-client'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { getErrorMessageFromResponse } from './response-utils'

export const menuApiDrafts = {
  list: apiDraftMeta('/menus', 'GET', true),
  detail: apiDraftMeta('/menus/{id}', 'GET', true),
  create: apiDraftMeta('/menus', 'POST', true),
  update: apiDraftMeta('/menus/{id}', 'PUT', true),
  remove: apiDraftMeta('/menus/{id}', 'DELETE', true),
  move: apiDraftMeta('/menus/{id}/move', 'POST', false, 'TODO: 是否统一与 update 合并待确认'),
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

function coerceMenuUrlType(value: unknown): 'page' | 'external' {
  const normalized = String(value ?? 'page').trim().toLowerCase()
  return normalized === 'external' ? 'external' : 'page'
}

/** 统一将后端或文档字段映射为前端 Menu（snake_case）。 */
function mapMenuRecord(raw: unknown): Menu {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    parent_id: toNumber(item.parent_id ?? item.parentId),
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    url_type: coerceMenuUrlType(item.url_type ?? item.urlType),
    page_id: toNumber(item.page_id ?? item.pageId),
    external_url: toNullableString(item.external_url ?? item.externalUrl),
    sort_order: toNumber(item.sort_order ?? item.sortOrder),
    status: toBoolean(item.status),
    icon: toNullableString(item.icon),
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

/**
 * 详情载荷：兼容信封或直接菜单对象；success===false 时抛出后端 message/msg/error。
 */
function extractMenuDetailPayload(raw: unknown): Record<string, unknown> {
  if (raw === null || raw === undefined) {
    throw new Error('menu response is empty')
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('invalid menu response shape')
  }
  const obj = raw as Record<string, unknown>
  if (obj.success === false) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'menu request failed')
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
  throw new Error('menu response missing detail payload')
}

type ListPayloadShape = {
  items: unknown[]
  total: number
  page?: number
  page_size?: number
}

function pickRowsAndTotal(container: Record<string, unknown>): { rows: unknown[]; total: number } | null {
  if (Array.isArray(container.items)) {
    const rows = container.items
    return { rows, total: Number(container.total ?? rows.length) }
  }
  if (Array.isArray(container.records)) {
    const rows = container.records
    return { rows, total: Number(container.total ?? rows.length) }
  }
  return null
}

/** 列表载荷：兼容多种信封/裸数组，输出未映射行与 total。 */
function extractMenuListPayload(raw: unknown): ListPayloadShape {
  throwIfEnvelopeFailed(raw, 'listMenus request failed')

  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
    }
  }

  if (!raw || typeof raw !== 'object') {
    return { items: [], total: 0 }
  }

  const root = raw as Record<string, unknown>
  const rootPick = pickRowsAndTotal(root)
  if (rootPick) {
    return {
      items: rootPick.rows,
      total: rootPick.total,
      page: toNumber(root.page ?? root.current) ?? undefined,
      page_size: toNumber(root.page_size ?? root.size) ?? undefined,
    }
  }

  const data = root.data
  if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
    const dataObj = data as Record<string, unknown>
    const nestedPick = pickRowsAndTotal(dataObj)
    if (nestedPick) {
      return {
        items: nestedPick.rows,
        total: nestedPick.total,
        page: toNumber(dataObj.page ?? dataObj.current) ?? undefined,
        page_size: toNumber(dataObj.page_size ?? dataObj.size) ?? undefined,
      }
    }
  }

  return { items: [], total: 0 }
}

/**
 * 前端 MenuCreateInput / MenuUpdateInput / 接口文档语义字段为 snake_case；
 * 当前后端 menu 写入经探测仅 camelCase 可正确持久化 urlType、externalUrl、sortOrder；
 * 后续以后端与文档统一为准；此处仅在 API 适配层转换。
 */
function buildMenuWriteRequestBodyForBackend(payload: MenuCreateInput | MenuUpdateInput): Record<string, unknown> {
  return {
    parentId: payload.parent_id,
    name: payload.name,
    code: payload.code,
    urlType: payload.url_type,
    pageId: payload.page_id,
    externalUrl: payload.external_url,
    sortOrder: payload.sort_order,
    status: payload.status,
    icon: payload.icon,
    remark: payload.remark,
  }
}

function buildMoveRequestBodyForBackend(payload: MoveMenuInput): Record<string, unknown> {
  return {
    parentId: payload.parent_id,
    sortOrder: payload.sort_order,
  }
}

function buildMenuQueryParams(query: MenuQuery): string {
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

function resolveDeleteMenuResponseId(raw: unknown, requestedId: number): IdResponse {
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

export async function listMenus(query: MenuQuery = {}): Promise<ListResult<Menu>> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/menus${buildMenuQueryParams(query)}`, {
        method: 'GET',
      })
      const extracted = extractMenuListPayload(raw)
      return {
        items: extracted.items.map((item) => mapMenuRecord(item)),
        total: extracted.total,
        page: extracted.page,
        page_size: extracted.page_size,
      }
    } catch (error) {
      console.error('[listMenus] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(buildListResult(menus.filter((item) => includesQueryValue(item, query))))
}

export async function getMenu(id: number): Promise<Menu | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/menus/${id}`, {
        method: 'GET',
      })
      throwIfEnvelopeFailed(raw, 'getMenu request failed')

      const payload = extractMenuDetailPayload(raw)
      return mapMenuRecord(payload)
    } catch (error) {
      console.error('[getMenu] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(menus.find((item) => item.id === id))
}

export async function createMenu(payload: MenuCreateInput): Promise<Menu> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>('/menus', {
        method: 'POST',
        body: JSON.stringify(buildMenuWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'createMenu request failed')

      const detailPayload = extractMenuDetailPayload(raw)
      return mapMenuRecord(detailPayload)
    } catch (error) {
      console.error('[createMenu] real api failed in integration mode.', error)
      throw error
    }
  }

  const item: Menu = {
    ...payload,
    id: nextNumericId(menus),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  menus.push(item)
  return mockResolve(item)
}

export async function updateMenu(id: number, payload: MenuUpdateInput): Promise<Menu | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/menus/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buildMenuWriteRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'updateMenu request failed')

      const detailPayload = extractMenuDetailPayload(raw)
      return mapMenuRecord(detailPayload)
    } catch (error) {
      console.error('[updateMenu] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = menus.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  menus[index] = {
    ...menus[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(menus[index])
}

export async function deleteMenu(id: number): Promise<IdResponse | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/menus/${id}`, {
        method: 'DELETE',
      })
      if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        throwIfEnvelopeFailed(raw, 'deleteMenu request failed')
      }
      return resolveDeleteMenuResponseId(raw, id)
    } catch (error) {
      console.error('[deleteMenu] real api failed in integration mode.', error)
      throw error
    }
  }

  const nextMenus = menus.filter((item) => item.id !== id && item.parent_id !== id)
  if (nextMenus.length === menus.length) {
    return mockResolve(undefined)
  }
  menus.splice(0, menus.length, ...nextMenus)
  return mockResolve({ id })
}

export async function moveMenu(id: number, payload: MoveMenuInput): Promise<Menu | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/menus/${id}/move`, {
        method: 'POST',
        body: JSON.stringify(buildMoveRequestBodyForBackend(payload)),
      })
      throwIfEnvelopeFailed(raw, 'moveMenu request failed')

      const detailPayload = extractMenuDetailPayload(raw)
      return mapMenuRecord(detailPayload)
    } catch (error) {
      console.error('[moveMenu] real api failed in integration mode.', error)
      throw error
    }
  }

  const item = menus.find((menu) => menu.id === id)
  if (!item) {
    return mockResolve(undefined)
  }
  item.parent_id = payload.parent_id
  item.sort_order = payload.sort_order
  item.updated_at = new Date().toISOString()
  return mockResolve(item)
}
