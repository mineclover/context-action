// Guide 사이드바 구조 정의 - full.md 기반 최신 가이드 구조

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

// Guide 구조 - 영어 (full.md 기반)
export const GUIDE_STRUCTURE_EN = {
  gettingStarted: {
    text: 'Getting Started',
    items: [
      { text: 'Overview', path: '/guide/overview' },
      { text: 'Core Concepts', path: '/guide/concepts' },
      { text: 'Philosophy', path: '/guide/philosophy' },
      { text: 'Quick Start', path: '/guide/quick-start' }
    ]
  },
  setupAndUsage: {
    text: 'Setup & Usage',
    items: [
      { text: 'Setup & Usage', path: '/guide/setup-usage' },
      { text: 'Domain Hooks Pattern', path: '/guide/domain-hooks-pattern' },
      { text: 'Provider Composition', path: '/guide/provider-composition' }
    ]
  },
  implementation: {
    text: 'Implementation',
    items: [
      { text: 'Store Management', path: '/guide/store-management' },
      { text: 'Action Handlers', path: '/guide/action-handlers' },
      { text: 'React Integration', path: '/guide/react-integration' },
      { text: 'Handler ID Strategies', path: '/guide/handler-id-strategies' }
    ]
  },
  advancedPatterns: {
    text: 'Advanced Patterns',
    items: [
      { text: 'Cross-Domain Integration', path: '/guide/cross-domain-integration' },
      { text: 'Logic Fit Hooks', path: '/guide/logic-fit-hooks' },
      { text: 'MVVM Architecture', path: '/guide/mvvm-architecture' }
    ]
  },
  bestPractices: {
    text: 'Best Practices',
    items: [
      { text: 'Best Practices', path: '/guide/best-practices' },
      { text: 'Common Pitfalls', path: '/guide/common-pitfalls' },
      { text: 'Performance', path: '/guide/performance' },
      { text: 'Error Handling', path: '/guide/error-handling' }
    ]
  }
}

// Guide 구조 - 한국어 (full.md 기반)
export const GUIDE_STRUCTURE_KO = {
  gettingStarted: {
    text: '시작하기',
    items: [
      { text: '개요', path: '/guide/overview' },
      { text: '핵심 개념', path: '/guide/concepts' },
      { text: '철학', path: '/guide/philosophy' },
      { text: '빠른 시작', path: '/guide/quick-start' }
    ]
  },
  setupAndUsage: {
    text: '설정 및 사용법',
    items: [
      { text: '설정 및 사용법', path: '/guide/setup-usage' },
      { text: '도메인 Hook 패턴', path: '/guide/domain-hooks-pattern' },
      { text: 'Provider 구성', path: '/guide/provider-composition' }
    ]
  },
  implementation: {
    text: '구현',
    items: [
      { text: '스토어 관리', path: '/guide/store-management' },
      { text: '액션 핸들러', path: '/guide/action-handlers' },
      { text: 'React 통합', path: '/guide/react-integration' },
      { text: '핸들러 ID 전략', path: '/guide/handler-id-strategies' }
    ]
  },
  advancedPatterns: {
    text: '고급 패턴',
    items: [
      { text: '크로스 도메인 통합', path: '/guide/cross-domain-integration' },
      { text: 'Logic Fit Hook', path: '/guide/logic-fit-hooks' },
      { text: 'MVVM 아키텍처', path: '/guide/mvvm-architecture' }
    ]
  },
  bestPractices: {
    text: '모범 사례',
    items: [
      { text: '모범 사례', path: '/guide/best-practices' },
      { text: '일반적인 함정', path: '/guide/common-pitfalls' },
      { text: '성능 최적화', path: '/guide/performance' },
      { text: '에러 처리', path: '/guide/error-handling' }
    ]
  }
}

// 레거시 호환성을 위한 기본 export
export const GUIDE_STRUCTURE = GUIDE_STRUCTURE_EN

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

// 가이드 사이드바 생성 - full.md 기반 최신 구조
export function sidebarGuideEn() {
  return [
    createSidebarSection('en', GUIDE_STRUCTURE_EN.gettingStarted),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.setupAndUsage),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.implementation),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.advancedPatterns),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.bestPractices)
  ]
}

export function sidebarGuideKo() {
  return [
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.gettingStarted),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.setupAndUsage),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.implementation),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.advancedPatterns),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.bestPractices)
  ]
}