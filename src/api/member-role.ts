import type { MemberRoleAssignInput } from '@/types/member-role'

import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

function throwIfFailed(raw: unknown, fallbackMessage: string): void {
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? fallbackMessage)
  }
}

function normalizeRoleIds(data: unknown): number[] {
  const rows = Array.isArray(data) ? data : []
  return rows
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
}

export async function queryMemberRoleIds(memberId: number): Promise<number[]> {
  const raw = await requestJson<Envelope<unknown>>(
    `/member-role/queryRoleIds?memberId=${encodeURIComponent(String(memberId))}`,
    {
      method: 'GET',
    }
  )
  throwIfFailed(raw, 'queryMemberRoleIds request failed')
  return normalizeRoleIds(raw?.data)
}

export async function assignMemberRoles(payload: MemberRoleAssignInput): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>('/member-role/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  throwIfFailed(raw, 'assignMemberRoles request failed')
}

export async function assignMemberRoleOne(memberId: number, roleId: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>('/member-role/assignOne', {
    method: 'POST',
    body: JSON.stringify({ memberId, roleIds: [roleId] }),
  })
  throwIfFailed(raw, 'assignMemberRoleOne request failed')
}

export async function deleteMemberRole(memberId: number, roleId: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(
    `/member-role/deleteRole?memberId=${encodeURIComponent(String(memberId))}&roleId=${encodeURIComponent(String(roleId))}`,
    {
      method: 'POST',
    }
  )
  throwIfFailed(raw, 'deleteMemberRole request failed')
}

export async function deleteAllMemberRoles(memberId: number): Promise<void> {
  const raw = await requestJson<Envelope<unknown>>(
    `/member-role/deleteAll?memberId=${encodeURIComponent(String(memberId))}`,
    {
      method: 'POST',
    }
  )
  throwIfFailed(raw, 'deleteAllMemberRoles request failed')
}
