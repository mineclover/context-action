import { useSyncExternalStore } from 'react';

const OPENROUTER_API_KEY_STORAGE_KEY = 'context-action.openrouter.api-key';
const subscribers = new Set<() => void>();
let storageListenerAttached = false;
let sessionFallbackKey = '';

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifySubscribers(): void {
  for (const subscriber of subscribers) subscriber();
}

function ensureStorageListener(): void {
  if (storageListenerAttached || typeof window === 'undefined') return;
  const storage = getLocalStorage();
  window.addEventListener('storage', (event) => {
    if (event.storageArea && event.storageArea !== storage) return;
    if (event.key === OPENROUTER_API_KEY_STORAGE_KEY || event.key === null) {
      notifySubscribers();
    }
  });
  storageListenerAttached = true;
}

/** Subscribe to same-origin OpenRouter key changes from this tab or another tab. */
export function subscribeStoredOpenRouterApiKey(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  ensureStorageListener();
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

/**
 * Read the user-owned OpenRouter key saved for this browser origin.
 *
 * This is intentionally browser-only storage. The key must never be moved to
 * source code, a repository file, or an application-owned server secret.
 */
export function getStoredOpenRouterApiKey(): string {
  if (typeof window === 'undefined') return '';
  const storage = getLocalStorage();
  if (!storage) return sessionFallbackKey;
  try {
    return storage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return sessionFallbackKey;
  }
}

/** React snapshot for provider controls that should follow the shared key live. */
export function useStoredOpenRouterApiKey(): string {
  return useSyncExternalStore(
    subscribeStoredOpenRouterApiKey,
    getStoredOpenRouterApiKey,
    () => ''
  );
}

/** Save a user-owned OpenRouter key for reuse by browser-based demos. */
export function saveOpenRouterApiKey(apiKey: string): string {
  if (typeof window === 'undefined') return apiKey.trim();

  const normalizedKey = apiKey.trim();
  sessionFallbackKey = normalizedKey;
  const storage = getLocalStorage();
  try {
    if (normalizedKey) {
      storage?.setItem(OPENROUTER_API_KEY_STORAGE_KEY, normalizedKey);
    } else {
      storage?.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
    }
  } catch {
    // Keep the current tab usable when browser storage is blocked or full.
  }

  notifySubscribers();

  return normalizedKey;
}

/** Remove the saved OpenRouter key from this browser origin. */
export function clearStoredOpenRouterApiKey(): void {
  sessionFallbackKey = '';
  if (typeof window !== 'undefined') {
    try {
      getLocalStorage()?.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
    } catch {
      // The in-memory fallback is already cleared.
    }
    notifySubscribers();
  }
}
