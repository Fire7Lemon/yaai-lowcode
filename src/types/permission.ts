export interface PermissionItem {
  id?: number
  name?: string | null
  code?: string | null
  module?: string | null
  description?: string | null
  createdAt?: string | null
  [key: string]: unknown
}

export interface PermissionListResult {
  items: PermissionItem[]
  total: number
}

export interface PermissionWriteInput {
  name: string
  code: string
  module: string
  description: string
}
