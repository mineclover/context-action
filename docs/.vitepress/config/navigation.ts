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
          { text: 'Convention Index', link: '/en/context-layered/convention-index' },
          { text: 'Testing Convention', link: '/en/context-layered/testing-convention' },
          { text: 'Hooks Reference', link: '/en/concept/hooks-reference' },
          { text: 'Conventions', link: '/en/concept/conventions' },
          { text: 'Docs & Development', link: '/en/concept/documentation-development-conventions' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Setup', link: '/en/examples/basic-setup' },
          { text: 'Action Only', link: '/en/examples/action-only' },
          { text: 'Store Only', link: '/en/examples/store-only' },
          { text: 'Composition', link: '/en/examples/pattern-composition' },
          { text: 'Canonical Order Form', link: '/en/examples/canonical-order-form' },
          { text: 'Playbook Scenarios', link: '/en/examples/implementation-playbook-scenarios' }
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
          { text: 'Context-Layered', link: '/ko/context-layered/context-layered-guide' },
          { text: '개발 컨벤션 인덱스', link: '/ko/context-layered/convention-index' },
          { text: '테스트 컨벤션', link: '/ko/context-layered/testing-convention' },
          { text: '훅 참조', link: '/ko/concept/hooks-reference' },
          { text: '컨벤션', link: '/ko/concept/conventions' },
          { text: '문서·개발 관리', link: '/ko/concept/documentation-development-conventions' }
        ]
      },
      {
        text: '예제',
        items: [
          { text: '기본 설정', link: '/ko/examples/basic-setup' },
          { text: 'Action Only', link: '/ko/examples/action-only' },
          { text: 'Store Only', link: '/ko/examples/store-only' },
          { text: '패턴 조합', link: '/ko/examples/pattern-composition' },
          { text: 'Canonical Order Form', link: '/ko/examples/canonical-order-form' },
          { text: 'Playbook 시나리오', link: '/ko/examples/implementation-playbook-scenarios' }
        ]
      },
      { text: '문제 해결', link: '/ko/troubleshooting/' },
      { text: 'LLMs', link: '/ko/llms/' }
    ]
  }

  return []
}

export default createNavigation
