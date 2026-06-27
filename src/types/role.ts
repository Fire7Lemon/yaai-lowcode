import type { PermissionItem } from './permission'

export interface RoleItem {
  id?: number
  name?: string | null
  code?: string | null
  description?: string | null
  sortOrder?: number | null
  status?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
  permissions?: PermissionItem[]
  [key: string]: unknown
}

export interface RoleListResult {
  items: RoleItem[]
  total: number
}

export interface RoleWriteInput {
  name: string
  code: string
  description: string
  sortOrder: number
  status: boolean
  permissions: number[]
}
