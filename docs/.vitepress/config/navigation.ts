/**
 * Navigation Configuration - Simplified for tab expansion
 * 상단 탭바 확장을 고려한 단순화된 네비게이션 설계
 */

export type NavigationLocale = 'root' | 'en' | 'ko'

/**
 * Create navigation based on locale - 상단 탭바 확장 대비 단순화
 */
export function createNavigation(locale: NavigationLocale) {
  // Root locale shows language selector
  if (locale === 'root') {
    return [
      {
        text: 'English',
        link: '/en/guide/getting-started'
      },
      {
        text: '한국어',
        link: '/ko/guide/getting-started'
      }
    ]
  }
  
  // 새로운 구조: Guide, Concept, Examples, API, LLMs로 재배치
  if (locale === 'en') {
    return [
      {
        text: 'Guide',
        link: '/en/guide/getting-started'
      },
      {
        text: 'Concept',
        items: [
          {
            text: 'Pattern Guide',
            link: '/en/concept/pattern-guide'
          },
          {
            text: 'Architecture Guide',
            link: '/en/concept/architecture-guide'
          },
          {
            text: 'Context-Layered Architecture',
            link: '/en/context-layered/context-layered-guide'
          },
          {
            text: 'Hooks Reference',
            link: '/en/concept/hooks-reference'
          },
          {
            text: 'Conventions',
            link: '/en/concept/conventions'
          }
        ]
      },
      {
        text: 'Examples',
        items: [
          {
            text: 'Basic Setup',
            link: '/en/examples/basic-setup'
          },
          {
            text: 'Action Only Pattern',
            link: '/en/examples/action-only'
          },
          {
            text: 'Store Only Pattern',
            link: '/en/examples/store-only'
          },
          {
            text: 'Pattern Composition',
            link: '/en/examples/pattern-composition'
          }
        ]
      },
      {
        text: 'API',
        items: [
          {
            text: '@context-action/core',
            items: [
              {
                text: 'ActionRegister',
                link: '/en/api/core/action-register'
              },
              {
                text: 'PipelineController',
                link: '/en/api/core/pipeline-controller'
              }
            ]
          },
          {
            text: '@context-action/react',
            items: [
              {
                text: 'Action Context',
                link: '/en/api/react/action-context'
              },
              {
                text: 'Store Pattern',
                link: '/en/api/react/store-pattern'
              },
              {
                text: 'Store Manager',
                link: '/en/api/react/store-manager'
              }
            ]
          }
        ]
      },
      {
        text: 'Troubleshooting',
        link: '/en/troubleshooting/'
      },
      {
        text: 'LLMs',
        link: '/en/llms/'
      }
    ]
  }
  
  if (locale === 'ko') {
    return [
      {
        text: '가이드',
        link: '/ko/guide/getting-started'
      },
      {
        text: '핵심 개념',
        items: [
          {
            text: '패턴 가이드',
            link: '/ko/concept/pattern-guide'
          },
          {
            text: '아키텍처 가이드',
            link: '/ko/concept/architecture-guide'
          },
          {
            text: 'Context-Layered Architecture',
            link: '/en/context-layered/context-layered-guide'
          },
          {
            text: '훅 참조',
            link: '/ko/concept/hooks-reference'
          },
          {
            text: '컨벤션',
            link: '/ko/concept/conventions'
          }
        ]
      },
      {
        text: '예제',
        items: [
          {
            text: '기본 설정',
            link: '/ko/examples/basic-setup'
          },
          {
            text: 'Action Only 패턴',
            link: '/ko/examples/action-only'
          },
          {
            text: 'Store Only 패턴',
            link: '/ko/examples/store-only'
          },
          {
            text: '패턴 조합',
            link: '/ko/examples/pattern-composition'
          }
        ]
      },
      {
        text: 'API',
        items: [
          {
            text: '@context-action/core',
            items: [
              { text: 'ActionRegister', link: '/ko/api/actionregister-guide' },
              { text: 'ReactActionError', link: '/ko/api/reactactionerror-guide' },
              { text: 'ActionPayloadMap', link: '/ko/api/actionpayloadmap-guide' },
              { text: 'PipelineController', link: '/ko/api/pipelinecontroller-guide' },
              { text: 'HandlerConfig', link: '/ko/api/handlerconfig-guide' },
              { text: 'ActionRegisterConfig', link: '/ko/api/actionregisterconfig-guide' },
              { text: 'DispatchOptions', link: '/ko/api/dispatchoptions-guide' },
              { text: 'ExecutionResult', link: '/ko/api/executionresult-guide' },
              { text: 'ActionDispatcher', link: '/ko/api/actiondispatcher-guide' },
              { text: 'ActionHandler', link: '/ko/api/actionhandler-guide' },
              { text: 'ExecutionMode', link: '/ko/api/executionmode-guide' },
              { text: 'UnregisterFunction', link: '/ko/api/unregisterfunction-guide' },
              { text: 'executeSequential', link: '/ko/api/executesequential-guide' },
              { text: 'executeParallel', link: '/ko/api/executeparallel-guide' },
              { text: 'executeRace', link: '/ko/api/executerace-guide' },
              { text: 'createActionHandler', link: '/ko/api/createactionhandler-guide' },
              { text: 'createReactHandlerConfig', link: '/ko/api/createreacthandlerconfig-guide' },
              { text: 'createReactDispatcher', link: '/ko/api/createreactdispatcher-guide' },
              { text: 'isReactActionError', link: '/ko/api/isreactactionerror-guide' },
              { text: 'ReactDevUtils', link: '/ko/api/reactdevutils-guide' },
            ]
          },
          {
            text: '@context-action/react',
            items: [
              { text: 'Store', link: '/ko/api/store-guide' },
              { text: 'StoreManager', link: '/ko/api/storemanager-guide' },
              { text: 'StoreErrorBoundary', link: '/ko/api/storeerrorboundary-guide' },
              { text: 'ActionContextConfig', link: '/ko/api/actioncontextconfig-guide' },
              { text: 'ActionContextType', link: '/ko/api/actioncontexttype-guide' },
              { text: 'ActionContextReturn', link: '/ko/api/actioncontextreturn-guide' },
              { text: 'RefContextReturn', link: '/ko/api/refcontextreturn-guide' },
              { text: 'CreateRefContextOptions', link: '/ko/api/createrefcontextoptions-guide' },
              { text: 'RefTarget', link: '/ko/api/reftarget-guide' },
              { text: 'RefOperationResult', link: '/ko/api/refoperationresult-guide' },
              { text: 'RefOperationOptions', link: '/ko/api/refoperationoptions-guide' },
              { text: 'StoreErrorBoundaryProps', link: '/ko/api/storeerrorboundaryprops-guide' },
              { text: 'Snapshot', link: '/ko/api/snapshot-guide' },
              { text: 'IStore', link: '/ko/api/istore-guide' },
              { text: 'StoreConfig', link: '/ko/api/storeconfig-guide' },
              { text: 'InitialStores', link: '/ko/api/initialstores-guide' },
              { text: 'createActionContext', link: '/ko/api/createactioncontext-guide' },
              { text: 'createStoreContext', link: '/ko/api/createstorecontext-guide' },
              { text: 'createRefContext', link: '/ko/api/createrefcontext-guide' },
              { text: 'createStore', link: '/ko/api/createstore-guide' },
              { text: 'useStoreValue', link: '/ko/api/usestorevalue-guide' },
              { text: 'useStoreSelector', link: '/ko/api/usestoreselector-guide' },
            ]
          }
        ]
      },
      {
        text: '문제 해결',
        link: '/ko/troubleshooting/'
      },
      {
        text: 'LLMs',
        link: '/ko/llms/'
      }
    ]
  }
  
  return []
}

export default createNavigation