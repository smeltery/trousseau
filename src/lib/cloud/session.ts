export const CLOUD_TOKEN_META = 'cloudToken'
export const CLOUD_UPDATED_META = 'cloudUpdatedAt'

const REMEMBER_KEY = 'trousseau.shareToken'

/** In-memory cloud session (set while on /b/:token). */
let activeToken: string | null = null

export function getActiveCloudToken(): string | null {
  return activeToken
}

export function setActiveCloudToken(token: string | null): void {
  activeToken = token
}

export function rememberShareToken(token: string): void {
  try {
    localStorage.setItem(REMEMBER_KEY, token)
  } catch {
    // private mode / quota
  }
}

export function readRememberedShareToken(): string | null {
  try {
    return localStorage.getItem(REMEMBER_KEY)
  } catch {
    return null
  }
}

export function clearRememberedShareToken(): void {
  try {
    localStorage.removeItem(REMEMBER_KEY)
  } catch {
    // ignore
  }
}
