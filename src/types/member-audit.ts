export interface MemberAuditListQuery {
  current?: number
  size?: number
}

export interface SingleMemberAuditItem {
  memberId?: number
  memberNo?: string | null
  name?: string | null
  gender?: string | null
  workUnit?: string | null
  contactPhone?: string | null
  email?: string | null
  committeeName?: string | null
  createdAt?: string | null
  auditStatus?: string | null
  id?: number
  [key: string]: unknown
}

export interface CompanyMemberAuditItem {
  memberId?: number
  memberNo?: string | null
  unitName?: string | null
  industry?: string | null
  leaderName?: string | null
  contactName?: string | null
  contactMobile?: string | null
  email?: string | null
  committeeName?: string | null
  createdAt?: string | null
  auditStatus?: string | null
  id?: number
  [key: string]: unknown
}

export interface MemberAuditListResult<T> {
  items: T[]
  total: number
}
