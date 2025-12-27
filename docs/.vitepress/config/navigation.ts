/**
 * Navigation Configuration - Simplified
 */

export type NavigationLocale = 'root' | 'en' | 'ko'

export function createNavigation(locale: NavigationLocale) {
  if (locale === 'root') {
    return [
      { text: 'English', link: '/en/guide/getting-started' },
      { text: '한국어', link: '/ko/guide/getting-started' }
    ]
  }

  if (locale === 'en') {
    return [
      { text: 'Guide', link: '/en/guide/getting-started' },
      {
        text: 'Concept',
        items: [
          { text: 'Pattern Guide', link: '/en/concept/pattern-guide' },
          { text: 'Architecture Guide', link: '/en/concept/architecture-guide' },
          { text: 'Context-Layered', link: '/en/context-layered/context-layered-guide' },
          { text: 'Hooks Reference', link: '/en/concept/hooks-reference' },
          { text: 'Conventions', link: '/en/concept/conventions' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Setup', link: '/en/examples/basic-setup' },
          { text: 'Action Only', link: '/en/examples/action-only' },
          { text: 'Store Only', link: '/en/examples/store-only' },
          { text: 'Composition', link: '/en/examples/pattern-composition' }
        ]
      },
      { text: 'Troubleshooting', link: '/en/troubleshooting/' },
      { text: 'LLMs', link: '/en/llms/' }
    ]
  }

  if (locale === 'ko') {
    return [
      { text: '가이드', link: '/ko/guide/getting-started' },
      {
        text: '핵심 개념',
        items: [
          { text: '패턴 가이드', link: '/ko/concept/pattern-guide' },
          { text: '아키텍처 가이드', link: '/ko/concept/architecture-guide' },
          { text: 'Context-Layered', link: '/en/context-layered/context-layered-guide' },
          { text: '훅 참조', link: '/ko/concept/hooks-reference' },
          { text: '컨벤션', link: '/ko/concept/conventions' }
        ]
      },
      {
        text: '예제',
        items: [
          { text: '기본 설정', link: '/ko/examples/basic-setup' },
          { text: 'Action Only', link: '/ko/examples/action-only' },
          { text: 'Store Only', link: '/ko/examples/store-only' },
          { text: '패턴 조합', link: '/ko/examples/pattern-composition' }
        ]
      },
      { text: '문제 해결', link: '/ko/troubleshooting/' },
      { text: 'LLMs', link: '/ko/llms/' }
    ]
  }

  return []
}

export default createNavigation
