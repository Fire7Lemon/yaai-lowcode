export type EntityId = number

export interface ListQuery {
  page?: number
  page_size?: number
}

export interface ListResult<T> {
  items: T[]
  total: number
  page?: number
  page_size?: number
}

export interface IdResponse {
  id: EntityId
}

export interface NodeCollectionResponse<T> {
  nodes: T[]
}

export interface ApiDraftMeta {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  confirmed: boolean
  todo?: string
}
