import { pages, pageVersions } from '@/mock/database'
import type { ListResult } from '@/types/api'
import type { Page, PageCreateInput, PageQuery, PageUpdateInput } from '@/types/page'
import type { PageVersion } from '@/types/page-version'

import { requestJson, shouldUseRealApi } from './http-client'
import { apiDraftMeta, buildListResult, includesQueryValue, mockResolve, nextNumericId } from './mock-client'
import { getErrorMessageFromResponse } from './response-utils'

export const pageApiDrafts = {
  list: apiDraftMeta('/pages', 'GET', false, 'TODO: 分页参数与排序字段待后端确认'),
  detail: apiDraftMeta('/pages/{id}', 'GET', true),
  create: apiDraftMeta('/pages', 'POST', true),
  update: apiDraftMeta('/pages/{id}', 'PUT', true),
  remove: apiDraftMeta('/pages/{id}', 'DELETE', false, 'TODO: 删除已有版本页面时的约束策略待确认'),
  currentVersion: apiDraftMeta('/pages/{id}/current-version', 'GET', false, 'TODO: 未发布时返回 null 还是 404 待确认'),
}

type Envelope<T> = {
  code?: string
  success?: boolean
  message?: string
  data?: T
}

type PageListData = {
  records?: unknown[]
  items?: unknown[]
  total?: number
  current?: number
  size?: number
  page?: number
  page_size?: number
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

function mapPageRecord(raw: unknown): Page {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    name: String(item.name ?? ''),
    code: String(item.code ?? ''),
    path: String(item.path ?? ''),
    page_type: String(item.page_type ?? item.pageType ?? ''),
    title: toNullableString(item.title),
    status: toBoolean(item.status),
    current_version_id: toNumber(item.current_version_id ?? item.currentVersionId),
    seo_title: toNullableString(item.seo_title ?? item.seoTitle),
    seo_keywords: toNullableString(item.seo_keywords ?? item.seoKeywords),
    seo_description: toNullableString(item.seo_description ?? item.seoDescription),
    remark: toNullableString(item.remark),
    created_at: String(item.created_at ?? item.createdAt ?? ''),
    updated_at: String(item.updated_at ?? item.updatedAt ?? ''),
  }
}

function extractPageDetailPayload(raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return undefined
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined
  }
  const obj = raw as Record<string, unknown>
  if (obj.data !== undefined && typeof obj.data === 'object' && !Array.isArray(obj.data) && obj.data !== null) {
    return obj.data
  }
  if ('id' in obj) {
    return raw
  }
  return undefined
}

function buildQueryParams(query: PageQuery): string {
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

export async function listPages(query: PageQuery = {}): Promise<ListResult<Page>> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<Envelope<PageListData>>(`/pages${buildQueryParams(query)}`, {
        method: 'GET',
      })
      const data = raw?.data ?? {}
      const records = Array.isArray(data.records) ? data.records : (Array.isArray(data.items) ? data.items : [])
      return {
        items: records.map((item) => mapPageRecord(item)),
        total: Number(data.total ?? records.length ?? 0),
        page: Number(data.current ?? data.page ?? 1),
        page_size: Number(data.size ?? data.page_size ?? records.length ?? 0),
      }
    } catch (error) {
      // TEMP: backend compatibility for current delivery
      // In integration mode we must expose real failures explicitly.
      console.error('[listPages] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(buildListResult(pages.filter((item) => includesQueryValue(item, query))))
}

export async function getPage(id: number): Promise<Page | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/pages/${id}`, {
        method: 'GET',
      })

      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const envelope = raw as Record<string, unknown>
        if (envelope.success === false) {
          throw new Error(getErrorMessageFromResponse(raw) ?? 'getPage request failed')
        }
      }

      const payload = extractPageDetailPayload(raw)
      if (payload === undefined || payload === null) {
        return undefined
      }

      return mapPageRecord(payload)
    } catch (error) {
      console.error('[getPage] real api failed in integration mode.', error)
      throw error
    }
  }

  return mockResolve(pages.find((item) => item.id === id))
}

/**
 * 页面写入（POST/PUT）请求体：v2.0 文档为 snake_case，当前后端实现要求 camelCase。
 * 后续以后端与文档统一为准；此处仅在 API 适配层转换，前端 PageCreateInput / PageUpdateInput 仍为 snake_case 语义字段。
 */
function buildPageWriteRequestBodyForBackend(payload: PageCreateInput | PageUpdateInput): Record<string, unknown> {
  return {
    name: payload.name,
    code: payload.code,
    path: payload.path,
    pageType: payload.page_type,
    title: payload.title,
    status: payload.status,
    seoTitle: payload.seo_title,
    seoKeywords: payload.seo_keywords,
    seoDescription: payload.seo_description,
    remark: payload.remark,
  }
}

export async function createPage(payload: PageCreateInput): Promise<Page> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>('/pages', {
        method: 'POST',
        body: JSON.stringify(buildPageWriteRequestBodyForBackend(payload)),
      })

      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const envelope = raw as Record<string, unknown>
        if (envelope.success === false) {
          throw new Error(getErrorMessageFromResponse(raw) ?? 'createPage request failed')
        }
      }

      const detailPayload = extractPageDetailPayload(raw)
      if (detailPayload === undefined || detailPayload === null) {
        throw new Error('createPage response missing page data')
      }

      return mapPageRecord(detailPayload)
    } catch (error) {
      console.error('[createPage] real api failed in integration mode.', error)
      throw error
    }
  }

  const item: Page = {
    ...payload,
    id: nextNumericId(pages),
    current_version_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  pages.push(item)
  return mockResolve(item)
}

export async function updatePage(id: number, payload: PageUpdateInput): Promise<Page | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buildPageWriteRequestBodyForBackend(payload)),
      })

      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const envelope = raw as Record<string, unknown>
        if (envelope.success === false) {
          throw new Error(getErrorMessageFromResponse(raw) ?? 'updatePage request failed')
        }
      }

      const detailPayload = extractPageDetailPayload(raw)
      if (detailPayload === undefined || detailPayload === null) {
        throw new Error('updatePage response missing page data')
      }

      return mapPageRecord(detailPayload)
    } catch (error) {
      console.error('[updatePage] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = pages.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }

  pages[index] = {
    ...pages[index],
    ...payload,
    updated_at: new Date().toISOString(),
  }
  return mockResolve(pages[index])
}

function resolveDeletePageResponseId(raw: unknown, requestedId: number): { id: number } {
  if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>
    const topId = obj.id
    if (typeof topId === 'number' && Number.isFinite(topId)) {
      return { id: topId }
    }
    const data = obj.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const nestedId = (data as Record<string, unknown>).id
      if (typeof nestedId === 'number' && Number.isFinite(nestedId)) {
        return { id: nestedId }
      }
    }
  }
  return { id: requestedId }
}

export async function deletePage(id: number): Promise<{ id: number } | undefined> {
  if (shouldUseRealApi()) {
    try {
      const raw = await requestJson<unknown>(`/pages/${id}`, {
        method: 'DELETE',
      })

      if (raw !== undefined && raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        const envelope = raw as Record<string, unknown>
        if (envelope.success === false) {
          throw new Error(getErrorMessageFromResponse(raw) ?? 'deletePage request failed')
        }
      }

      return resolveDeletePageResponseId(raw, id)
    } catch (error) {
      console.error('[deletePage] real api failed in integration mode.', error)
      throw error
    }
  }

  const index = pages.findIndex((item) => item.id === id)
  if (index === -1) {
    return mockResolve(undefined)
  }
  pages.splice(index, 1)
  return mockResolve({ id })
}

export async function getPageCurrentVersion(id: number): Promise<PageVersion | null> {
  const page = pages.find((item) => item.id === id)
  return mockResolve(pageVersions.find((item) => item.id === page?.current_version_id) ?? null)
}
