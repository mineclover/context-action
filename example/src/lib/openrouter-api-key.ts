import {
  getStoredOpenRouterApiKey,
  subscribeStoredOpenRouterApiKey,
} from '@context-action/openrouter-browser-storage';
import { useSyncExternalStore } from 'react';

export {
  clearStoredOpenRouterApiKey,
  getStoredOpenRouterApiKey,
  saveOpenRouterApiKey,
  subscribeStoredOpenRouterApiKey,
} from '@context-action/openrouter-browser-storage';

/** React snapshot for provider controls that follow the shared key live. */
export function useStoredOpenRouterApiKey(): string {
  return useSyncExternalStore(
    subscribeStoredOpenRouterApiKey,
    getStoredOpenRouterApiKey,
    () => ''
  );
}
