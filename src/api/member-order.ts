import { requestJson } from './http-client'
import { getErrorMessageFromResponse, isSuccessEnvelope } from './response-utils'

import type { MemberOrderItem } from '@/types/member-order'

type Envelope<T> = {
  code?: number | string
  success?: boolean
  message?: string
  data?: T
}

export async function listMemberOrders(memberId: number): Promise<MemberOrderItem[]> {
  const raw = await requestJson<Envelope<unknown>>(`/member/order/list?memberId=${encodeURIComponent(String(memberId))}`, {
    method: 'GET',
  })
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'listMemberOrders request failed')
  }
  return Array.isArray(raw?.data) ? (raw.data as MemberOrderItem[]) : []
}

export async function getMemberOrderDetail(outTradeNo: string): Promise<MemberOrderItem> {
  const raw = await requestJson<Envelope<unknown>>(
    `/member/order/detail?outTradeNo=${encodeURIComponent(outTradeNo)}`,
    {
      method: 'GET',
    },
  )
  if (!isSuccessEnvelope(raw)) {
    throw new Error(getErrorMessageFromResponse(raw) ?? 'getMemberOrderDetail request failed')
  }
  if (!raw?.data || typeof raw.data !== 'object') {
    throw new Error('getMemberOrderDetail response missing order data')
  }
  return raw.data as MemberOrderItem
}
