export function formatJsonText(value: string | null): string {
  if (!value) {
    return ''
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

export function safeParseJson(value: string | null): Record<string, unknown> | unknown[] | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
