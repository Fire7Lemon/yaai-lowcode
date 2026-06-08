export interface NewsCategoryItem {
  id?: number
  parentId?: number | null
  name?: string | null
  code?: string | null
  sortOrder?: number | null
  status?: boolean | null
  remark?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export interface NewsCategoryListQuery {
  name?: string
  code?: string
  status?: boolean
}

export interface NewsCategoryListResult {
  items: NewsCategoryItem[]
  total: number
}

export interface NewsCategoryWriteInput {
  parentId?: number | null
  name: string
  code: string
  sortOrder?: number | null
  status?: boolean | null
  remark?: string | null
}
