export interface NewsItem {
  id?: number
  categoryId?: number | null
  title?: string | null
  summary?: string | null
  content?: string | null
  coverImage?: string | null
  publishTime?: string | null
  source?: string | null
  author?: string | null
  status?: boolean | null
  isTop?: boolean | null
  viewCount?: number | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export interface NewsListQuery {
  current?: number
  size?: number
  categoryId?: number
  title?: string
  status?: boolean
  isTop?: boolean
}

export interface NewsListResult {
  items: NewsItem[]
  total: number
  current: number
  size: number
}

export interface NewsWriteInput {
  categoryId: number
  title: string
  summary?: string | null
  content?: string | null
  coverImage?: string | null
  publishTime: string
  source?: string | null
  author?: string | null
  status?: boolean | null
  isTop?: boolean | null
  remark?: string | null
}
