export interface Banner {
  id: number
  groupCode: string | null
  title: string | null
  subtitle: string | null
  imageUrl: string | null
  linkUrl: string | null
  sortOrder: number | null
  status: boolean | null
  startTime: string | null
  endTime: string | null
  remark: string | null
  createdAt: string | null
  updatedAt: string | null
  [key: string]: unknown
}

export interface BannerListQuery {
  groupCode?: string
  status?: boolean
}

export interface BannerListResult {
  items: Banner[]
  total: number
}

export interface BannerWriteInput {
  groupCode: string
  title: string
  subtitle?: string | null
  imageUrl: string
  linkUrl?: string | null
  sortOrder?: number | null
  status?: boolean | null
  startTime?: string | null
  endTime?: string | null
  remark?: string | null
}
