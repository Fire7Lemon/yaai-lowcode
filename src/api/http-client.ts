function joinUrl(base: string, path: string): string {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

function parseJsonSafely<T>(raw: string): T | undefined {
  if (!raw) {
    return undefined
  }
  return JSON.parse(raw) as T
}

export function shouldUseRealApi(): boolean {
  return import.meta.env.VITE_USE_REAL_API === 'true'
}

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').trim()
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is empty.')
  }

  const response = await fetch(joinUrl(baseUrl, path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const text = await response.text()
  return parseJsonSafely<T>(text) as T
}
