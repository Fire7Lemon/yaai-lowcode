import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

import type {
  CompanyMemberAuditItem,
  MemberAuditListQuery,
  MemberAuditListResult,
  SingleMemberAuditItem,
} from '@/types/member-audit'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

type ListData<T> = {
  records?: unknown[]
  items?: unknown[]
  total?: number
  [key: string]: unknown
}

function buildQueryParams(query: MemberAuditListQuery): string {
  const search = new URLSearchParams()
  const current = query.current ?? 1
  const size = query.size ?? 10
  search.set('current', String(current))
  search.set('size', String(size))
  return `?${search.toString()}`
}

function normalizeListResult<T>(raw: Envelope<ListData<T>>, fallbackError: string): MemberAuditListResult<T> {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackError)
  }

  const data = raw?.data ?? {}
  const records = Array.isArray(data.records) ? data.records : (Array.isArray(data.items) ? data.items : [])
  return {
    items: records as T[],
    total: Number(data.total ?? records.length ?? 0),
  }
}

export async function listPendingSingleMembers(
  query: MemberAuditListQuery = {},
): Promise<MemberAuditListResult<SingleMemberAuditItem>> {
  const raw = await requestJson<Envelope<ListData<SingleMemberAuditItem>>>(
    `/member/audit/single/list${buildQueryParams(query)}`,
    { method: 'GET' },
  )
  return normalizeListResult<SingleMemberAuditItem>(raw, 'listPendingSingleMembers request failed')
}

export async function listPendingCompanyMembers(
  query: MemberAuditListQuery = {},
): Promise<MemberAuditListResult<CompanyMemberAuditItem>> {
  const raw = await requestJson<Envelope<ListData<CompanyMemberAuditItem>>>(
    `/member/audit/company/list${buildQueryParams(query)}`,
    { method: 'GET' },
  )
  return normalizeListResult<CompanyMemberAuditItem>(raw, 'listPendingCompanyMembers request failed')
}

export async function auditPass(memberId: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(`/member/audit/pass?memberId=${encodeURIComponent(String(memberId))}`, {
    method: 'POST',
  })
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'auditPass request failed')
  }
}

export async function auditReject(memberId: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(`/member/audit/reject?memberId=${encodeURIComponent(String(memberId))}`, {
    method: 'POST',
  })
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'auditReject request failed')
  }
}
