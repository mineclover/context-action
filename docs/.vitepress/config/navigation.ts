/**
 * Navigation Configuration - Top-Down Architecture
 * Full Guide 구조를 기반으로 한 계층적 네비게이션 설계
 */

export type NavigationLocale = 'root' | 'en' | 'ko'

// 네비게이션 구조 정의 - Architecture First
const NAVIGATION_STRUCTURE = {
  en: {
    // 1. Architecture & Philosophy (큰 프레임)
    architecture: {
      text: 'Architecture',
      items: [
        { text: 'Overview', link: '/en/guide/overview' },
        { text: 'Core Concepts', link: '/en/guide/concepts' },
        { text: 'Design Philosophy', link: '/en/guide/philosophy' }
      ]
    },
    
    // 2. Implementation Guide (구현)
    guide: {
      text: 'Guide',
      items: [
        { text: 'Quick Start', link: '/en/guide/quick-start' },
        { text: 'Full Guide', link: '/en/guide/full' },
        { text: 'Setup & Usage', link: '/en/guide/setup' },
        { text: 'Store Management', link: '/en/guide/store-management' },
        { text: 'Action Handlers', link: '/en/guide/action-handlers' }
      ]
    },
    
    // 3. Advanced Patterns (고급 패턴)
    advanced: {
      text: 'Advanced',
      items: [
        { text: 'Domain Patterns', link: '/en/guide/domain-patterns' },
        { text: 'Cross-Domain Integration', link: '/en/guide/cross-domain' },
        { text: 'Performance Optimization', link: '/en/guide/performance' },
        { text: 'Testing Strategies', link: '/en/guide/testing' }
      ]
    },
    
    // 4. API Reference (참조)
    api: {
      text: 'API Reference',
      items: [
        { text: 'Core API', link: '/en/api/core' },
        { text: 'React Integration', link: '/en/api/react' },
        { text: 'Jotai Integration', link: '/en/api/jotai' },
        { text: 'Type Definitions', link: '/en/api/types' }
      ]
    },
    
    // 5. Resources (자료)
    resources: {
      text: 'Resources',
      items: [
        { text: 'Examples', link: '/en/examples/' },
        { text: 'Best Practices', link: '/en/guide/best-practices' },
        { text: 'Migration Guide', link: '/en/guide/migration' },
        { text: 'Troubleshooting', link: '/en/guide/troubleshooting' }
      ]
    }
  },
  
  ko: {
    // 1. 아키텍처 & 철학 (큰 프레임)
    architecture: {
      text: '아키텍처',
      items: [
        { text: '개요', link: '/ko/guide/overview' },
        { text: '핵심 개념', link: '/ko/guide/concepts' },
        { text: '설계 철학', link: '/ko/guide/philosophy' }
      ]
    },
    
    // 2. 구현 가이드
    guide: {
      text: '가이드',
      items: [
        { text: '빠른 시작', link: '/ko/guide/quick-start' },
        { text: '완전한 가이드', link: '/ko/guide/full' },
        { text: '설정 & 사용법', link: '/ko/guide/setup' },
        { text: '스토어 관리', link: '/ko/guide/store-management' },
        { text: '액션 핸들러', link: '/ko/guide/action-handlers' }
      ]
    },
    
    // 3. 고급 패턴
    advanced: {
      text: '고급',
      items: [
        { text: '도메인 패턴', link: '/ko/guide/domain-patterns' },
        { text: '크로스 도메인 통합', link: '/ko/guide/cross-domain' },
        { text: '성능 최적화', link: '/ko/guide/performance' },
        { text: '테스팅 전략', link: '/ko/guide/testing' }
      ]
    },
    
    // 4. API 참조
    api: {
      text: 'API 참조',
      items: [
        { text: '코어 API', link: '/ko/api/core' },
        { text: 'React 통합', link: '/ko/api/react' },
        { text: 'Jotai 통합', link: '/ko/api/jotai' },
        { text: '타입 정의', link: '/ko/api/types' }
      ]
    },
    
    // 5. 자료
    resources: {
      text: '자료',
      items: [
        { text: '예제', link: '/ko/examples/' },
        { text: '모범 사례', link: '/ko/guide/best-practices' },
        { text: '마이그레이션 가이드', link: '/ko/guide/migration' },
        { text: '문제 해결', link: '/ko/guide/troubleshooting' }
      ]
    }
  }
}

/**
 * Create navigation based on locale
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
  
  const structure = NAVIGATION_STRUCTURE[locale]
  
  return [
    // Architecture (Big Picture)
    {
      text: structure.architecture.text,
      activeMatch: `^/${locale}/guide/(overview|concepts|philosophy)`,
      items: structure.architecture.items
    },
    
    // Implementation Guide (Core Learning Path)
    {
      text: structure.guide.text,
      activeMatch: `^/${locale}/guide/`,
      items: structure.guide.items
    },
    
    // Advanced Patterns
    {
      text: structure.advanced.text,
      activeMatch: `^/${locale}/guide/(domain-patterns|cross-domain|performance|testing)`,
      items: structure.advanced.items
    },
    
    // API Reference
    {
      text: structure.api.text,
      activeMatch: `^/${locale}/api/`,
      items: structure.api.items
    },
    
    // Resources & Tools
    {
      text: structure.resources.text,
      activeMatch: `^/${locale}/(examples|guide/(best-practices|migration|troubleshooting))`,
      items: structure.resources.items
    }
  ]
}

export default createNavigation