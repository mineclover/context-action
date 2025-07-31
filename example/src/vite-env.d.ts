/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Context-Action Core
  readonly VITE_CONTEXT_ACTION_TRACE?: string
  readonly VITE_CONTEXT_ACTION_DEBUG?: string
  readonly VITE_CONTEXT_ACTION_LOG_LEVEL?: string
  readonly VITE_CONTEXT_ACTION_LOGGER_NAME?: string
  readonly VITE_NODE_ENV?: string
  
  // Action Guard
  readonly VITE_ACTION_GUARD_DEBUG?: string
  readonly VITE_ACTION_GUARD_DEFAULT_DEBOUNCE_DELAY?: string
  readonly VITE_ACTION_GUARD_DEFAULT_THROTTLE_INTERVAL?: string
  readonly VITE_ACTION_GUARD_LOG_LEVEL?: string

  // Vite built-ins
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}