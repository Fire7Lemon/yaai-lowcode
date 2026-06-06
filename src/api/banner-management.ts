import type { Banner, BannerListQuery, BannerListResult, BannerWriteInput } from '@/types/banner'

import { requestFormData, requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

type BannerListData = {
  items?: unknown[]
  records?: unknown[]
  total?: number
  [key: string]: unknown
}

function throwIfFailed(raw: unknown, fallbackMessage: string): void {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
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

function mapBanner(raw: unknown): Banner {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    groupCode: toNullableString(item.groupCode ?? item.group_code),
    title: toNullableString(item.title),
    subtitle: toNullableString(item.subtitle),
    imageUrl: toNullableString(item.imageUrl ?? item.image_url),
    linkUrl: toNullableString(item.linkUrl ?? item.link_url),
    sortOrder: toNullableNumber(item.sortOrder ?? item.sort_order),
    status: toNullableBoolean(item.status),
    startTime: toNullableString(item.startTime ?? item.start_time),
    endTime: toNullableString(item.endTime ?? item.end_time),
    remark: toNullableString(item.remark),
    createdAt: toNullableString(item.createdAt ?? item.created_at),
    updatedAt: toNullableString(item.updatedAt ?? item.updated_at),
    ...item,
  }
}

function buildListQuery(query: BannerListQuery = {}): string {
  const search = new URLSearchParams()
  if (query.groupCode && query.groupCode.trim() !== '') {
    search.set('groupCode', query.groupCode.trim())
  }
  if (typeof query.status === 'boolean') {
    search.set('status', String(query.status))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

function normalizeBannerList(raw: Envelope<BannerListData>): BannerListResult {
  throwIfFailed(raw, 'listBanners request failed')
  const data = raw?.data ?? {}
  const rows = Array.isArray(data.items) ? data.items : (Array.isArray(data.records) ? data.records : [])
  return {
    items: rows.map((row) => mapBanner(row)),
    total: Number(data.total ?? rows.length ?? 0),
  }
}

function normalizeBannerDetail(raw: Envelope<unknown>, fallbackMessage: string): Banner {
  throwIfFailed(raw, fallbackMessage)
  const payload = raw?.data ?? raw
  return mapBanner(payload)
}

export async function listBanners(query: BannerListQuery = {}): Promise<BannerListResult> {
  const raw = await requestJson<Envelope<BannerListData>>(`/banners${buildListQuery(query)}`, {
    method: 'GET',
  })
  return normalizeBannerList(raw)
}

export async function listActiveBanners(groupCode: string): Promise<Banner[]> {
  const raw = await requestJson<Envelope<unknown[]>>(`/banners/active/${encodeURIComponent(groupCode)}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'listActiveBanners request failed')
  const data = Array.isArray(raw?.data) ? raw.data : []
  return data.map((row) => mapBanner(row))
}

export async function getBannerDetail(id: number): Promise<Banner> {
  const raw = await requestJson<Envelope<unknown>>(`/banners/${id}`, { method: 'GET' })
  return normalizeBannerDetail(raw, 'getBannerDetail request failed')
}

export async function createBanner(payload: BannerWriteInput): Promise<Banner> {
  const raw = await requestJson<Envelope<unknown>>('/banners', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalizeBannerDetail(raw, 'createBanner request failed')
}

export async function updateBanner(id: number, payload: BannerWriteInput): Promise<Banner> {
  const raw = await requestJson<Envelope<unknown>>(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return normalizeBannerDetail(raw, 'updateBanner request failed')
}

export async function deleteBanner(id: number): Promise<number> {
  const raw = await requestJson<Envelope<unknown>>(`/banners/${id}`, {
    method: 'DELETE',
  })
  throwIfFailed(raw, 'deleteBanner request failed')
  if (typeof raw?.data === 'number' && Number.isFinite(raw.data)) {
    return raw.data
  }
  return id
}

export async function uploadBannerImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'other-attachment')

  // Backend upload endpoint is /api/upload.
  // With Vite dev proxy '/api' + rewrite(/^\/api/, ''), browser path must be '/api/api/upload'.
  const data = await requestFormData<unknown>('/api/api/upload', formData)
  if (typeof data === 'string' && data.trim() !== '') {
    return data.trim()
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    const candidates = [obj.url, obj.path, obj.fileUrl]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim()
      }
    }
  }

  throw new Error('uploadBannerImage response missing image url')
}
