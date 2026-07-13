const OPENROUTER_API_KEY_STORAGE_KEY = 'context-action.openrouter.api-key';

/**
 * Read the user-owned OpenRouter key saved for this browser origin.
 *
 * This is intentionally browser-only storage. The key must never be moved to
 * source code, a repository file, or an application-owned server secret.
 */
export function getStoredOpenRouterApiKey(): string {
  if (typeof window === 'undefined') return '';

  return (
    window.localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)?.trim() ?? ''
  );
}

/** Save a user-owned OpenRouter key for reuse by browser-based demos. */
export function saveOpenRouterApiKey(apiKey: string): string {
  if (typeof window === 'undefined') return apiKey.trim();

  const normalizedKey = apiKey.trim();
  if (normalizedKey) {
    window.localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, normalizedKey);
  } else {
    window.localStorage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
  }

  return normalizedKey;
}

/** Remove the saved OpenRouter key from this browser origin. */
export function clearStoredOpenRouterApiKey(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
  }
}
