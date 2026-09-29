export const CLOUD_TOKEN_META = 'cloudToken'
export const CLOUD_UPDATED_META = 'cloudUpdatedAt'

/** In-memory cloud session (set while on /b/:token). */
let activeToken: string | null = null

export function getActiveCloudToken(): string | null {
  return activeToken
}

export function setActiveCloudToken(token: string | null): void {
  activeToken = token
}
