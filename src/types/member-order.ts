export interface MemberOrderItem {
  id?: number
  memberId?: number
  memberCategoryId?: number | null
  amount?: number | string | null
  outTradeNo?: string | null
  date?: string | null
  paymentMethod?: string | null
  status?: string | null
  payUrl?: string | null
  transactionId?: string | null
  paidAt?: string | null
  closeReason?: string | null
  closedAt?: string | null
  expireTime?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  expired?: boolean | null
  [key: string]: unknown
}
