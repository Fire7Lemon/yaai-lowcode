import type {
  NewsCategoryItem,
  NewsCategoryListQuery,
  NewsCategoryListResult,
  NewsCategoryWriteInput,
} from '@/types/news-category'

import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

type NewsCategoryListData = {
  items?: unknown[]
  records?: unknown[]
  total?: number
  [key: string]: unknown
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toNullableBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') {
      return true
    }
    if (normalized === 'false' || normalized === '0') {
      return false
    }
  }
  return null
}

function mapNewsCategory(raw: unknown): NewsCategoryItem {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    parentId: toNullableNumber(item.parentId ?? item.parent_id),
    name: toNullableString(item.name),
    code: toNullableString(item.code),
    sortOrder: toNullableNumber(item.sortOrder ?? item.sort_order),
    status: toNullableBoolean(item.status),
    remark: toNullableString(item.remark),
    createdAt: toNullableString(item.createdAt ?? item.created_at),
    updatedAt: toNullableString(item.updatedAt ?? item.updated_at),
    ...item,
  }
}

function throwIfFailed(raw: unknown, fallbackMessage: string): void {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
}

function buildQuery(query: NewsCategoryListQuery = {}): string {
  const search = new URLSearchParams()
  if (query.name && query.name.trim() !== '') {
    search.set('name', query.name.trim())
  }
  if (query.code && query.code.trim() !== '') {
    search.set('code', query.code.trim())
  }
  if (typeof query.status === 'boolean') {
    search.set('status', String(query.status))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export async function listNewsCategories(query: NewsCategoryListQuery = {}): Promise<NewsCategoryListResult> {
  const raw = await requestJson<Envelope<NewsCategoryListData>>(`/news-categories${buildQuery(query)}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'listNewsCategories request failed')
  const data = raw?.data ?? {}
  const rows = Array.isArray(data.items) ? data.items : (Array.isArray(data.records) ? data.records : [])
  return {
    items: rows.map((row) => mapNewsCategory(row)),
    total: Number(data.total ?? rows.length ?? 0),
  }
}

export async function getNewsCategoryDetail(id: number): Promise<NewsCategoryItem> {
  const raw = await requestJson<Envelope<unknown>>(`/news-categories/${id}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'getNewsCategoryDetail request failed')
  return mapNewsCategory(raw?.data ?? {})
}

export async function createNewsCategory(payload: NewsCategoryWriteInput): Promise<NewsCategoryItem> {
  const raw = await requestJson<Envelope<unknown>>('/news-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  throwIfFailed(raw, 'createNewsCategory request failed')
  return mapNewsCategory(raw?.data ?? {})
}

export async function updateNewsCategory(id: number, payload: NewsCategoryWriteInput): Promise<NewsCategoryItem> {
  const raw = await requestJson<Envelope<unknown>>(`/news-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  throwIfFailed(raw, 'updateNewsCategory request failed')
  return mapNewsCategory(raw?.data ?? {})
}

export async function deleteNewsCategory(id: number): Promise<number> {
  const raw = await requestJson<Envelope<unknown>>(`/news-categories/${id}`, {
    method: 'DELETE',
  })
  throwIfFailed(raw, 'deleteNewsCategory request failed')
  if (typeof raw?.data === 'number' && Number.isFinite(raw.data)) {
    return raw.data
  }
  return id
}
