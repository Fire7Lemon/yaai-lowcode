import type { PermissionItem } from '@/types/permission'
import type { RoleItem, RoleListResult, RoleWriteInput } from '@/types/role'

import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

type RoleDetailRaw = {
  role?: unknown
  permissions?: unknown[]
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

function throwIfFailed(raw: unknown, fallbackMessage: string): void {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
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

function mapRole(raw: unknown): RoleItem {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    name: toNullableString(item.name),
    code: toNullableString(item.code),
    description: toNullableString(item.description),
    sortOrder: toNullableNumber(item.sortOrder ?? item.sort_order),
    status: toNullableBoolean(item.status),
    createdAt: toNullableString(item.createdAt ?? item.created_at),
    updatedAt: toNullableString(item.updatedAt ?? item.updated_at),
    ...item,
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

export async function listRoles(): Promise<RoleListResult> {
  const raw = await requestJson<Envelope<unknown>>('/role/queryAll', { method: 'GET' })
  throwIfFailed(raw, 'listRoles request failed')
  const rows = normalizeRows(raw?.data)
  return {
    items: rows.map((row) => mapRole(row)),
    total: rows.length,
  }
}

export async function getRoleDetail(id: number): Promise<RoleItem> {
  const raw = await requestJson<Envelope<RoleDetailRaw>>(`/role/queryById?id=${encodeURIComponent(String(id))}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'getRoleDetail request failed')
  const role = mapRole(raw?.data?.role ?? {})
  const permissions = Array.isArray(raw?.data?.permissions) ? raw.data.permissions.map((item) => mapPermission(item)) : []
  return {
    ...role,
    permissions,
  }
}

export async function createRole(payload: RoleWriteInput): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>('/role/insert', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      code: payload.code,
      description: payload.description,
      sortOrder: payload.sortOrder,
      status: payload.status,
      permissions: payload.permissions,
    }),
  })
  throwIfFailed(raw, 'createRole request failed')
}

export async function updateRole(id: number, payload: RoleWriteInput): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>('/role/update', {
    method: 'POST',
    body: JSON.stringify({
      id,
      name: payload.name,
      code: payload.code,
      description: payload.description,
      sortOrder: payload.sortOrder,
      status: payload.status,
      permissions: payload.permissions,
    }),
  })
  throwIfFailed(raw, 'updateRole request failed')
}

export async function deleteRole(id: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(`/role/delete?id=${encodeURIComponent(String(id))}`, {
    method: 'POST',
  })
  throwIfFailed(raw, 'deleteRole request failed')
}
