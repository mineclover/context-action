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
        link: '/en/guide/overview'
      },
      {
        text: '한국어',
        link: '/ko/guide/overview'
      }
    ]
  }
  
  // 새로운 구조: Guide, Examples, API, LLMs로 재배치
  if (locale === 'en') {
    return [
      {
        text: 'Guide',
        link: '/en/guide/getting-started'
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
            text: 'Store Only Methods',
            link: '/en/api/store-only'
          },
          {
            text: 'Action Only Methods',
            link: '/en/api/action-only'
          },
          {
            text: 'Store Manager',
            link: '/en/api/store-manager'
          },
          {
            text: 'Action Registry',
            link: '/en/api/action-registry'
          }
        ]
      },
      {
        text: 'LLMs',
        link: '/en/llms/llms.txt'
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
            text: 'Store Only 메서드',
            link: '/ko/api/store-only'
          },
          {
            text: 'Action Only 메서드',
            link: '/ko/api/action-only'
          },
          {
            text: 'Store Manager',
            link: '/ko/api/store-manager'
          },
          {
            text: 'Action Registry',
            link: '/ko/api/action-registry'
          }
        ]
      },
      {
        text: 'LLMs',
        link: '/ko/llms/llms.txt'
      }
    ]
  }
  
  return []
}

export default createNavigation