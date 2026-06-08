import type { NewsItem, NewsListQuery, NewsListResult, NewsWriteInput } from '@/types/news'

import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

type NewsListData = {
  records?: unknown[]
  items?: unknown[]
  total?: number
  current?: number
  size?: number
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

function mapNews(raw: unknown): NewsItem {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    categoryId: toNullableNumber(item.categoryId ?? item.category_id),
    title: toNullableString(item.title),
    summary: toNullableString(item.summary),
    content: toNullableString(item.content),
    coverImage: toNullableString(item.coverImage ?? item.cover_image),
    publishTime: toNullableString(item.publishTime ?? item.publish_time),
    source: toNullableString(item.source),
    author: toNullableString(item.author),
    status: toNullableBoolean(item.status),
    isTop: toNullableBoolean(item.isTop ?? item.is_top),
    viewCount: toNullableNumber(item.viewCount ?? item.view_count),
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

function buildNewsQuery(query: NewsListQuery = {}): string {
  const search = new URLSearchParams()
  search.set('current', String(query.current ?? 1))
  search.set('size', String(query.size ?? 10))
  if (typeof query.categoryId === 'number' && Number.isFinite(query.categoryId)) {
    search.set('categoryId', String(query.categoryId))
  }
  if (query.title && query.title.trim() !== '') {
    search.set('title', query.title.trim())
  }
  if (typeof query.status === 'boolean') {
    search.set('status', String(query.status))
  }
  if (typeof query.isTop === 'boolean') {
    search.set('isTop', String(query.isTop))
  }
  return `?${search.toString()}`
}

export async function listNews(query: NewsListQuery = {}): Promise<NewsListResult> {
  const raw = await requestJson<Envelope<NewsListData>>(`/news${buildNewsQuery(query)}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'listNews request failed')
  const data = raw?.data ?? {}
  const rows = Array.isArray(data.records) ? data.records : (Array.isArray(data.items) ? data.items : [])
  return {
    items: rows.map((row) => mapNews(row)),
    total: Number(data.total ?? rows.length ?? 0),
    current: Number(data.current ?? query.current ?? 1),
    size: Number(data.size ?? query.size ?? 10),
  }
}

export async function getNewsDetail(id: number): Promise<NewsItem> {
  const raw = await requestJson<Envelope<unknown>>(`/news/${id}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'getNewsDetail request failed')
  return mapNews(raw?.data ?? {})
}

export async function createNews(payload: NewsWriteInput): Promise<NewsItem> {
  const raw = await requestJson<Envelope<unknown>>('/news', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  throwIfFailed(raw, 'createNews request failed')
  return mapNews(raw?.data ?? {})
}

export async function updateNews(id: number, payload: NewsWriteInput): Promise<NewsItem> {
  const raw = await requestJson<Envelope<unknown>>(`/news/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  throwIfFailed(raw, 'updateNews request failed')
  return mapNews(raw?.data ?? {})
}

export async function deleteNews(id: number): Promise<number> {
  const raw = await requestJson<Envelope<unknown>>(`/news/${id}`, {
    method: 'DELETE',
  })
  throwIfFailed(raw, 'deleteNews request failed')
  if (typeof raw?.data === 'number' && Number.isFinite(raw.data)) {
    return raw.data
  }
  return id
}
