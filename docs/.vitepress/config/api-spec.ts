// 자동 생성된 API 사이드바 설정
// 이 파일은 scripts/sync-api-docs.js에 의해 자동 생성됩니다.

// 로케일별 경로 생성 유틸리티
function createLocalePath(locale: string, path: string): string {
  return `/${locale}${path}`
}

// 타입 정의
type SidebarItem = {
  text: string
  link: string
}

type SidebarSection = {
  text: string
  collapsed: boolean
  items: SidebarItem[]
}

// API 구조 (자동 생성됨)
export const API_STRUCTURE = {
  "core": {
    "text": "Core API",
    "items": [
      {
        "text": "Overview",
        "path": "/core/src/README"
      },
      {
        "text": "Action Register",
        "path": "/core/src/classes/ActionRegister"
      },
      {
        "text": "Action Dispatcher",
        "path": "/core/src/interfaces/ActionDispatcher"
      },
      {
        "text": "Action Metrics",
        "path": "/core/src/interfaces/ActionMetrics"
      },
      {
        "text": "Action Payload Map",
        "path": "/core/src/interfaces/ActionPayloadMap"
      },
      {
        "text": "Action Register Config",
        "path": "/core/src/interfaces/ActionRegisterConfig"
      },
      {
        "text": "Action Register Events",
        "path": "/core/src/interfaces/ActionRegisterEvents"
      },
      {
        "text": "Event Emitter",
        "path": "/core/src/interfaces/EventEmitter"
      },
      {
        "text": "Handler Config",
        "path": "/core/src/interfaces/HandlerConfig"
      },
      {
        "text": "Pipeline Controller",
        "path": "/core/src/interfaces/PipelineController"
      },
      {
        "text": "Action Handler",
        "path": "/core/src/type-aliases/ActionHandler"
      },
      {
        "text": "Event Handler",
        "path": "/core/src/type-aliases/EventHandler"
      },
      {
        "text": "Unregister Function",
        "path": "/core/src/type-aliases/UnregisterFunction"
      }
    ]
  },
  "react": {
    "text": "React API",
    "items": [
      {
        "text": "Overview",
        "path": "/react/src/README"
      },
      {
        "text": "Action Register",
        "path": "/react/src/classes/ActionRegister"
      },
      {
        "text": "Console Logger",
        "path": "/react/src/classes/ConsoleLogger"
      },
      {
        "text": "Event Bus",
        "path": "/react/src/classes/EventBus"
      },
      {
        "text": "Managed Store",
        "path": "/react/src/classes/ManagedStore"
      },
      {
        "text": "Numeric Store",
        "path": "/react/src/classes/NumericStore"
      },
      {
        "text": "Registry Utils",
        "path": "/react/src/classes/RegistryUtils"
      },
      {
        "text": "Scoped Event Bus",
        "path": "/react/src/classes/ScopedEventBus"
      },
      {
        "text": "Store",
        "path": "/react/src/classes/Store"
      },
      {
        "text": "Store Registry",
        "path": "/react/src/classes/StoreRegistry"
      },
      {
        "text": "Store Utils",
        "path": "/react/src/classes/StoreUtils"
      },
      {
        "text": "Log Level",
        "path": "/react/src/enumerations/LogLevel"
      },
      {
        "text": "Action Provider",
        "path": "/react/src/functions/ActionProvider"
      },
      {
        "text": "Store Provider",
        "path": "/react/src/functions/StoreProvider"
      },
      {
        "text": "createActionContext",
        "path": "/react/src/functions/createActionContext"
      },
      {
        "text": "Create Basic Store",
        "path": "/react/src/functions/createBasicStore"
      },
      {
        "text": "createComputedStore",
        "path": "/react/src/functions/createComputedStore"
      },
      {
        "text": "createLogger",
        "path": "/react/src/functions/createLogger"
      },
      {
        "text": "Create Managed Store",
        "path": "/react/src/functions/createManagedStore"
      },
      {
        "text": "createRegistrySync",
        "path": "/react/src/functions/createRegistrySync"
      },
      {
        "text": "createStore",
        "path": "/react/src/functions/createStore"
      },
      {
        "text": "createStoreContext",
        "path": "/react/src/functions/createStoreContext"
      },
      {
        "text": "createStoreSync",
        "path": "/react/src/functions/createStoreSync"
      },
      {
        "text": "createTypedActionProvider",
        "path": "/react/src/functions/createTypedActionProvider"
      },
      {
        "text": "createTypedStoreHooks",
        "path": "/react/src/functions/createTypedStoreHooks"
      },
      {
        "text": "createTypedStoreProvider",
        "path": "/react/src/functions/createTypedStoreProvider"
      },
      {
        "text": "getLogLevelFromEnv",
        "path": "/react/src/functions/getLogLevelFromEnv"
      },
      {
        "text": "useActionDispatch",
        "path": "/react/src/functions/useActionDispatch"
      },
      {
        "text": "useActionRegister",
        "path": "/react/src/functions/useActionRegister"
      },
      {
        "text": "useActionWithStores",
        "path": "/react/src/functions/useActionWithStores"
      },
      {
        "text": "useBatchStoreSync",
        "path": "/react/src/functions/useBatchStoreSync"
      },
      {
        "text": "useComputedStore",
        "path": "/react/src/functions/useComputedStore"
      },
      {
        "text": "useComputedValue",
        "path": "/react/src/functions/useComputedValue"
      },
      {
        "text": "useDynamicStore",
        "path": "/react/src/functions/useDynamicStore"
      },
      {
        "text": "useLocalState",
        "path": "/react/src/functions/useLocalState"
      },
      {
        "text": "useLocalStore",
        "path": "/react/src/functions/useLocalStore"
      },
      {
        "text": "useMVVMStore",
        "path": "/react/src/functions/useMVVMStore"
      },
      {
        "text": "useMultiMVVMStore",
        "path": "/react/src/functions/useMultiMVVMStore"
      },
      {
        "text": "useMultiStoreAction",
        "path": "/react/src/functions/useMultiStoreAction"
      },
      {
        "text": "usePersistedStore",
        "path": "/react/src/functions/usePersistedStore"
      },
      {
        "text": "useRegistry",
        "path": "/react/src/functions/useRegistry"
      },
      {
        "text": "useRegistryStore",
        "path": "/react/src/functions/useRegistryStore"
      },
      {
        "text": "useStore",
        "path": "/react/src/functions/useStore"
      },
      {
        "text": "useStoreActions",
        "path": "/react/src/functions/useStoreActions"
      },
      {
        "text": "useStoreQuery",
        "path": "/react/src/functions/useStoreQuery"
      },
      {
        "text": "useStoreRegistry",
        "path": "/react/src/functions/useStoreRegistry"
      },
      {
        "text": "useStoreSync",
        "path": "/react/src/functions/useStoreSync"
      },
      {
        "text": "useStoreValue",
        "path": "/react/src/functions/useStoreValue"
      },
      {
        "text": "useStoreValues",
        "path": "/react/src/functions/useStoreValues"
      },
      {
        "text": "useTransactionAction",
        "path": "/react/src/functions/useTransactionAction"
      },
      {
        "text": "With Action Provider",
        "path": "/react/src/functions/withActionProvider"
      },
      {
        "text": "With Managed Store",
        "path": "/react/src/functions/withManagedStore"
      },
      {
        "text": "With Registry Stores",
        "path": "/react/src/functions/withRegistryStores"
      },
      {
        "text": "With Store",
        "path": "/react/src/functions/withStore"
      },
      {
        "text": "With Store And Action Provider",
        "path": "/react/src/functions/withStoreAndActionProvider"
      },
      {
        "text": "With Store Data",
        "path": "/react/src/functions/withStoreData"
      },
      {
        "text": "With Store Provider",
        "path": "/react/src/functions/withStoreProvider"
      },
      {
        "text": "Action Context Config",
        "path": "/react/src/interfaces/ActionContextConfig"
      },
      {
        "text": "Action Context Return",
        "path": "/react/src/interfaces/ActionContextReturn"
      },
      {
        "text": "Action Context Type",
        "path": "/react/src/interfaces/ActionContextType"
      },
      {
        "text": "Action Payload Map",
        "path": "/react/src/interfaces/ActionPayloadMap"
      },
      {
        "text": "Action Provider Props",
        "path": "/react/src/interfaces/ActionProviderProps"
      },
      {
        "text": "Dynamic Store Options",
        "path": "/react/src/interfaces/DynamicStoreOptions"
      },
      {
        "text": "Event Handler",
        "path": "/react/src/interfaces/EventHandler"
      },
      {
        "text": "Handler Config",
        "path": "/react/src/interfaces/HandlerConfig"
      },
      {
        "text": "Hook Options",
        "path": "/react/src/interfaces/HookOptions"
      },
      {
        "text": "IEventBus",
        "path": "/react/src/interfaces/IEventBus"
      },
      {
        "text": "IStore",
        "path": "/react/src/interfaces/IStore"
      },
      {
        "text": "IStoreRegistry",
        "path": "/react/src/interfaces/IStoreRegistry"
      },
      {
        "text": "Logger",
        "path": "/react/src/interfaces/Logger"
      },
      {
        "text": "Pipeline Controller",
        "path": "/react/src/interfaces/PipelineController"
      },
      {
        "text": "Registry Store Map",
        "path": "/react/src/interfaces/RegistryStoreMap"
      },
      {
        "text": "Snapshot",
        "path": "/react/src/interfaces/Snapshot"
      },
      {
        "text": "Store Config",
        "path": "/react/src/interfaces/StoreConfig"
      },
      {
        "text": "Store Context Return",
        "path": "/react/src/interfaces/StoreContextReturn"
      },
      {
        "text": "Store Context Type",
        "path": "/react/src/interfaces/StoreContextType"
      },
      {
        "text": "Store Provider Context Type",
        "path": "/react/src/interfaces/StoreProviderContextType"
      },
      {
        "text": "Store Provider Props",
        "path": "/react/src/interfaces/StoreProviderProps"
      },
      {
        "text": "Store Sync Config",
        "path": "/react/src/interfaces/StoreSyncConfig"
      },
      {
        "text": "Action Handler",
        "path": "/react/src/type-aliases/ActionHandler"
      },
      {
        "text": "Listener",
        "path": "/react/src/type-aliases/Listener"
      },
      {
        "text": "Subscribe",
        "path": "/react/src/type-aliases/Subscribe"
      },
      {
        "text": "Unsubscribe",
        "path": "/react/src/type-aliases/Unsubscribe"
      },
      {
        "text": "useDynamicStoreSnapshot",
        "path": "/react/src/variables/useDynamicStoreSnapshot"
      },
      {
        "text": "useDynamicStoreWithDefault",
        "path": "/react/src/variables/useDynamicStoreWithDefault"
      },
      {
        "text": "useDynamicStores",
        "path": "/react/src/variables/useDynamicStores"
      },
      {
        "text": "useStoreContext",
        "path": "/react/src/variables/useStoreContext"
      }
    ]
  },
  "jotai": {
    "text": "Jotai API",
    "items": [
      {
        "text": "Overview",
        "path": "/jotai/src/README"
      },
      {
        "text": "createAtomContext",
        "path": "/jotai/src/functions/createAtomContext"
      },
      {
        "text": "Atom Context Config",
        "path": "/jotai/src/interfaces/AtomContextConfig"
      }
    ]
  },
  "logger": {
    "text": "Logger API",
    "items": [
      {
        "text": "Overview",
        "path": "/logger/src/README"
      },
      {
        "text": "Console Logger",
        "path": "/logger/src/classes/ConsoleLogger"
      },
      {
        "text": "Noop Logger",
        "path": "/logger/src/classes/NoopLogger"
      },
      {
        "text": "Log Level",
        "path": "/logger/src/enumerations/LogLevel"
      },
      {
        "text": "createLogger",
        "path": "/logger/src/functions/createLogger"
      },
      {
        "text": "getDebugFromEnv",
        "path": "/logger/src/functions/getDebugFromEnv"
      },
      {
        "text": "getLogLevelFromEnv",
        "path": "/logger/src/functions/getLogLevelFromEnv"
      },
      {
        "text": "getLoggerNameFromEnv",
        "path": "/logger/src/functions/getLoggerNameFromEnv"
      },
      {
        "text": "Logger",
        "path": "/logger/src/interfaces/Logger"
      }
    ]
  }
}

// 사이드바 섹션 생성 함수
function createSidebarSection(locale: string, section: any): SidebarSection {
  return {
    text: section.text,
    collapsed: false,
    items: section.items.map((item: any) => ({
      text: item.text,
      link: createLocalePath(locale, item.path)
    }))
  }
}

// API 사이드바 생성
export function sidebarApiEn() {
  return Object.values(API_STRUCTURE).map(section => 
    createSidebarSection('en', section)
  )
}

export function sidebarApiKo() {
  return Object.values(API_STRUCTURE).map(section => 
    createSidebarSection('ko', section)
  )
}
