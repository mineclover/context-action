/**
 * Navigation Configuration - Simplified for tab expansion
 * 상단 탭바 확장을 고려한 단순화된 네비게이션 설계
 */

export type NavigationLocale = 'root' | 'en' | 'ko'

/**
 * Create navigation based on locale - 상단 탭바 확장 대비 단순화
 */
import { sidebarApiEn, sidebarApiKo } from './api-spec'

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
        text: 'API Reference',
        items: [
          { text: 'ActionRegister', link: '/en/api/actionregister' },
          { text: 'createActionContext', link: '/en/api/createactioncontext' },
          { text: 'createStoreContext', link: '/en/api/createstorecontext' },
          { text: 'useStoreValue', link: '/en/api/usestorevalue' }
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
            text: 'Context-Driven Architecture',
            link: '/ko/architecture/context-driven-architecture'
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
        text: 'API 참조',
        items: [
          { text: 'ActionRegister', link: '/ko/api/actionregister' },
          { text: 'createActionContext', link: '/ko/api/createactioncontext' },
          { text: 'createStoreContext', link: '/ko/api/createstorecontext' },
          { text: 'useStoreValue', link: '/ko/api/usestorevalue' }
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
