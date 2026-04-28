import type { ApiDraftMeta, ListResult } from '@/types/api'

export async function mockResolve<T>(data: T, timeout = 80): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(data)), timeout)
  })
}

export function buildListResult<T>(items: T[]): ListResult<T> {
  return {
    items,
    total: items.length,
  }
}

export function nextNumericId(items: Array<{ id: number }>): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

export function includesQueryValue<T extends object>(item: T, query: Partial<T>): boolean {
  return Object.entries(query).every(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return true
    }

    const current = item[key as keyof T]
    if (typeof value === 'string' && typeof current === 'string') {
      return current.includes(value)
    }

    return current === value
  })
}

export function apiDraftMeta(
  endpoint: string,
  method: ApiDraftMeta['method'],
  confirmed = false,
  todo?: string,
): ApiDraftMeta {
  return {
    endpoint,
    method,
    confirmed,
    todo,
  }
}
