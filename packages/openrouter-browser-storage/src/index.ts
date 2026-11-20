/** Stable same-origin key shared by every browser-based OpenRouter surface. */
export const OPENROUTER_API_KEY_STORAGE_KEY =
  'context-action.openrouter.api-key';

const subscribers = new Set<() => void>();
let storageListenerAttached = false;
let sessionFallbackKey = '';
let storageWriteFailed = false;

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifySubscribers(): void {
  for (const subscriber of [...subscribers]) {
    try {
      subscriber();
    } catch {
      // Isolate subscriber errors so sibling subscribers still update.
    }
  }
}

function handleStorageEvent(event: StorageEvent): void {
  const currentStorage = getLocalStorage();
  if (event.storageArea && currentStorage && event.storageArea !== currentStorage) {
    return;
  }
  if (event.key === OPENROUTER_API_KEY_STORAGE_KEY || event.key === null) {
    storageWriteFailed = false;
    notifySubscribers();
  }
}

function attachStorageListener(): void {
  if (storageListenerAttached || typeof window === 'undefined') return;
  window.addEventListener?.('storage', handleStorageEvent);
  storageListenerAttached = true;
}

function detachStorageListener(): void {
  if (!storageListenerAttached || typeof window === 'undefined') return;
  window.removeEventListener?.('storage', handleStorageEvent);
  storageListenerAttached = false;
}

/** Subscribe to same-origin changes from this tab or another browser tab. */
export function subscribeStoredOpenRouterApiKey(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  subscribers.add(listener);
  if (subscribers.size === 1) {
    attachStorageListener();
  }
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0) {
      detachStorageListener();
    }
  };
}

/** Read the user-owned key without ever consulting a server-side secret. */
export function getStoredOpenRouterApiKey(): string {
  if (typeof window === 'undefined') return '';
  if (storageWriteFailed) return sessionFallbackKey;
  const storage = getLocalStorage();
  if (!storage) return sessionFallbackKey;
  try {
    return storage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return sessionFallbackKey;
  }
}

/** Save a key for browser-local reuse by all app surfaces on this origin. */
export function saveOpenRouterApiKey(apiKey: string): string {
  const normalizedKey = apiKey.trim();
  if (typeof window === 'undefined') return normalizedKey;

  sessionFallbackKey = normalizedKey;
  const storage = getLocalStorage();
  if (!storage) {
    storageWriteFailed = true;
  } else {
    try {
      if (normalizedKey) {
        storage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, normalizedKey);
      } else {
        storage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
      }
      storageWriteFailed = false;
    } catch {
      // Keep the current tab usable when browser storage is blocked or full.
      storageWriteFailed = true;
    }
  }

  notifySubscribers();
  return normalizedKey;
}

/** Remove the saved key from this browser origin. */
export function clearStoredOpenRouterApiKey(): void {
  sessionFallbackKey = '';
  if (typeof window === 'undefined') return;
  const storage = getLocalStorage();
  if (!storage) {
    storageWriteFailed = true;
  } else {
    try {
      storage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
      storageWriteFailed = false;
    } catch {
      // The in-memory fallback is already cleared.
      storageWriteFailed = true;
    }
  }
  notifySubscribers();
}
