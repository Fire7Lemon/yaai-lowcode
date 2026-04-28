import { safeParseJson } from './json'

export function schemaSummary(value: string | null): string {
  const parsed = safeParseJson(value)

  if (!parsed) {
    return '未配置'
  }

  if (Array.isArray(parsed)) {
    return `数组项 ${parsed.length} 个`
  }

  return `字段 ${Object.keys(parsed).length} 个`
}
