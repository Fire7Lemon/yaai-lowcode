import type { OperationLogItem, OperationLogListResult } from '@/types/operation-log'

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

function mapOperationLog(raw: unknown): OperationLogItem {
  const item = (raw ?? {}) as Record<string, unknown>
  return {
    id: Number(item.id ?? 0),
    operationType: toNullableString(item.operationType ?? item.operation_type),
    tableName: toNullableString(item.tableName ?? item.table_name),
    recordId: toNullableString(item.recordId ?? item.record_id),
    newData: toNullableString(item.newData ?? item.new_data),
    operator: toNullableString(item.operator),
    operateTime: toNullableString(item.operateTime ?? item.operate_time),
    method: toNullableString(item.method),
    requestParams: toNullableString(item.requestParams ?? item.request_params),
    description: toNullableString(item.description),
    ...item,
  }
}

function throwIfFailed(raw: unknown, fallbackMessage: string): void {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
}

export async function listOperationLogs(): Promise<OperationLogListResult> {
  const raw = await requestJson<Envelope<unknown[]>>('/log/queryAll', {
    method: 'GET',
  })
  throwIfFailed(raw, 'listOperationLogs request failed')
  const rows = Array.isArray(raw?.data) ? raw.data : []
  return {
    items: rows.map((row) => mapOperationLog(row)),
    total: rows.length,
  }
}

export async function getOperationLogDetail(id: number): Promise<OperationLogItem> {
  const raw = await requestJson<Envelope<unknown>>(`/log/queryById?id=${encodeURIComponent(String(id))}`, {
    method: 'GET',
  })
  throwIfFailed(raw, 'getOperationLogDetail request failed')
  return mapOperationLog(raw?.data ?? {})
}

export async function deleteOperationLog(id: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(`/log/delete?id=${encodeURIComponent(String(id))}`, {
    method: 'POST',
  })
  throwIfFailed(raw, 'deleteOperationLog request failed')
}
