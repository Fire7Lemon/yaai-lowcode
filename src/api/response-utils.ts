export function getErrorMessageFromResponse(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const payload = raw as Record<string, unknown>
  const candidates = [payload.message, payload.msg, payload.error]
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) {
      return item.trim()
    }
  }
  return null
}

export function isSuccessEnvelope(raw: unknown): boolean {
  if (raw === null || raw === undefined) {
    return true
  }
  if (Array.isArray(raw)) {
    return true
  }
  if (typeof raw !== 'object') {
    return true
  }

  const envelope = raw as Record<string, unknown>

  if (typeof envelope.success === 'boolean') {
    return envelope.success
  }

  if (typeof envelope.code === 'number') {
    return envelope.code === 0 || envelope.code === 200
  }

  if (typeof envelope.code === 'string') {
    const normalizedCode = envelope.code.trim().toLowerCase()
    if (normalizedCode === 'success' || normalizedCode === 'ok') {
      return true
    }
    const numericCode = Number(normalizedCode)
    if (Number.isFinite(numericCode)) {
      return numericCode === 0 || numericCode === 200
    }
    if (normalizedCode === 'fail' || normalizedCode === 'failed' || normalizedCode === 'error') {
      return false
    }
  }

  return true
}

export function extractNodesFromSaveResponse<T>(raw: unknown, mapper: (rawNode: unknown) => T): T[] | null {
  if (Array.isArray(raw)) {
    return raw.map((item) => mapper(item))
  }
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const payload = raw as Record<string, unknown>
  if (Array.isArray(payload.nodes)) {
    return payload.nodes.map((item) => mapper(item))
  }

  const data = payload.data
  if (Array.isArray(data)) {
    return data.map((item) => mapper(item))
  }
  if (data && typeof data === 'object') {
    const dataObject = data as Record<string, unknown>
    if (Array.isArray(dataObject.nodes)) {
      return dataObject.nodes.map((item) => mapper(item))
    }
  }
  return null
}
