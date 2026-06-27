import type { PermissionItem, PermissionListResult, PermissionWriteInput } from '@/types/permission'

import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return String(value)
}

function mapPermission(raw: unknown): PermissionItem {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    name: toNullableString(item.name),
    code: toNullableString(item.code),
    module: toNullableString(item.module),
    description: toNullableString(item.description),
    createdAt: toNullableString(item.createdAt ?? item.created_at),
    ...item,
  }
}

function throwIfFailed(raw: unknown, fallbackMessage: string): void {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
}

function normalizeRows(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>
    if (Array.isArray(payload.items)) {
      return payload.items
    }
    if (Array.isArray(payload.records)) {
      return payload.records
    }
    if (Array.isArray(payload.data)) {
      return payload.data
    }
  }
  return []
}

export async function listPermissions(): Promise<PermissionListResult> {
  const raw = await requestJson<Envelope<unknown>>('/permission/queryAll', { method: 'GET' })
  throwIfFailed(raw, 'listPermissions request failed')
  const rows = normalizeRows(raw?.data)
  return {
    items: rows.map((row) => mapPermission(row)),
    total: rows.length,
  }
}

export async function getPermissionDetail(id: number): Promise<PermissionItem> {
  const raw = await requestJson<Envelope<unknown>>(`/permission/queryById?id=${encodeURIComponent(String(id))}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'getPermissionDetail request failed')
  return mapPermission(raw?.data ?? {})
}

export async function createPermission(payload: PermissionWriteInput): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>('/permission/insert', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  throwIfFailed(raw, 'createPermission request failed')
}

export async function updatePermission(id: number, payload: PermissionWriteInput): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>('/permission/updateById', {
    method: 'POST',
    body: JSON.stringify({ id, ...payload }),
  })
  throwIfFailed(raw, 'updatePermission request failed')
}

export async function deletePermission(id: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(`/permission/deleteById?id=${encodeURIComponent(String(id))}`, {
    method: 'POST',
  })
  throwIfFailed(raw, 'deletePermission request failed')
}
