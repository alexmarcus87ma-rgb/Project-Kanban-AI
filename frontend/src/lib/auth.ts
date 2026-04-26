/**
 * Authentication utilities using token-based session storage.
 */

export const TOKEN_STORAGE_KEY = "pm_token"

/**
 * Saves the authentication token to localStorage.
 */
export function saveSession(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

/**
 * Clears the authentication token from localStorage.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

/**
 * Retrieves the authentication token from localStorage.
 * Returns the token string if it exists, null otherwise.
 */
export function getSession(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}
