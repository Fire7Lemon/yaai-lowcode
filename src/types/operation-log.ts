export interface OperationLogItem {
  id?: number
  operationType?: string | null
  tableName?: string | null
  recordId?: string | null
  newData?: string | null
  operator?: string | null
  operateTime?: string | null
  method?: string | null
  requestParams?: string | null
  description?: string | null
  [key: string]: unknown
}

export interface OperationLogListResult {
  items: OperationLogItem[]
  total: number
}
