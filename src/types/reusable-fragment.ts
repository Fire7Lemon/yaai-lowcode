import type { ListQuery } from './api'

export interface ReusableFragment {
  id: number
  name: string
  code: string
  fragment_type: string | null
  description: string | null
  status: boolean
  remark: string | null
  created_at: string
  updated_at: string
}

export interface ReusableFragmentQuery extends ListQuery {
  name?: string
  code?: string
  fragment_type?: string
  status?: boolean
}

export interface ReusableFragmentCreateInput {
  name: string
  code: string
  fragment_type: string | null
  description: string | null
  status: boolean
  remark: string | null
}

export type ReusableFragmentUpdateInput = ReusableFragmentCreateInput
