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
              {
                text: 'ActionRegister',
                link: '/ko/api/core/action-register'
              },
              {
                text: 'PipelineController',
                link: '/ko/api/core/pipeline-controller'
              }
            ]
          },
          {
            text: '@context-action/react',
            items: [
              {
                text: 'Action Context',
                link: '/ko/api/react/action-context'
              },
              {
                text: 'Store Pattern',
                link: '/ko/api/react/store-pattern'
              },
              {
                text: 'Store Manager',
                link: '/ko/api/react/store-manager'
              }
            ]
          }
        ]
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