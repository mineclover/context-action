/**
 * Sidebar Configuration - Simplified for existing content
 * 실제 존재하는 파일들만 포함하고 상단 탭바 확장을 고려한 단순화된 구조
 */

import type { DefaultTheme } from 'vitepress'

export type SidebarLocale = 'en' | 'ko'

// 실제 존재하는 파일들만 포함한 단일 사이드바 구조
const GUIDE_STRUCTURE = {
  en: {
    // 1. Getting Started
    gettingStarted: {
      text: '🚀 Getting Started',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/guide/overview' },
        { text: 'Core Concepts', link: '/en/guide/concepts' },
        { text: 'Quick Start', link: '/en/guide/quick-start' },
        { text: 'Setup & Usage', link: '/en/guide/setup-usage' }
      ]
    },
    
    // 2. Architecture & Philosophy
    architecture: {
      text: '🏗️ Architecture',
      collapsed: false,
      items: [
        { text: 'Design Philosophy', link: '/en/guide/philosophy' },
        { text: 'MVVM Architecture', link: '/en/guide/mvvm-architecture' },
        { text: 'Domain Hooks Pattern', link: '/en/guide/domain-hooks-pattern' }
      ]
    },
    
    // 3. Core Implementation
    coreImplementation: {
      text: '⚙️ Core Implementation',
      collapsed: false,
      items: [
        { text: 'Store Management', link: '/en/guide/store-management' },
        { text: 'Action Handlers', link: '/en/guide/action-handlers' },
        { text: 'Provider Composition', link: '/en/guide/provider-composition' },
        { text: 'React Integration', link: '/en/guide/react-integration' }
      ]
    },
    
    // 4. Advanced Topics
    advanced: {
      text: '🚀 Advanced Topics',
      collapsed: true,
      items: [
        { text: 'Cross-Domain Integration', link: '/en/guide/cross-domain-integration' },
        { text: 'Handler ID Strategies', link: '/en/guide/handler-id-strategies' },
        { text: 'Performance Optimization', link: '/en/guide/performance' },
        { text: 'Error Handling', link: '/en/guide/error-handling' },
        { text: 'Logic Fit Hooks', link: '/en/guide/logic-fit-hooks' }
      ]
    },
    
    // 5. Best Practices & Troubleshooting
    bestPractices: {
      text: '✅ Best Practices',
      collapsed: true,
      items: [
        { text: 'Best Practices', link: '/en/guide/best-practices' },
        { text: 'Common Pitfalls', link: '/en/guide/common-pitfalls' }
      ]
    }
  },
  
  ko: {
    // 1. 시작하기
    gettingStarted: {
      text: '🚀 시작하기',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/guide/overview' },
        { text: '핵심 개념', link: '/ko/guide/concepts' },
        { text: '빠른 시작', link: '/ko/guide/quick-start' },
        { text: '설정 & 사용법', link: '/ko/guide/setup-usage' }
      ]
    },
    
    // 2. 아키텍처 & 철학
    architecture: {
      text: '🏗️ 아키텍처',
      collapsed: false,
      items: [
        { text: '설계 철학', link: '/ko/guide/philosophy' },
        { text: 'MVVM 아키텍처', link: '/ko/guide/mvvm-architecture' },
        { text: '도메인 훅 패턴', link: '/ko/guide/domain-hooks-pattern' }
      ]
    },
    
    // 3. 핵심 구현
    coreImplementation: {
      text: '⚙️ 핵심 구현',
      collapsed: false,
      items: [
        { text: '스토어 관리', link: '/ko/guide/store-management' },
        { text: '액션 핸들러', link: '/ko/guide/action-handlers' },
        { text: '프로바이더 구성', link: '/ko/guide/provider-composition' },
        { text: 'React 통합', link: '/ko/guide/react-integration' }
      ]
    },
    
    // 4. 고급 주제
    advanced: {
      text: '🚀 고급 주제',
      collapsed: true,
      items: [
        { text: '크로스 도메인 통합', link: '/ko/guide/cross-domain-integration' },
        { text: '핸들러 ID 전략', link: '/ko/guide/handler-id-strategies' },
        { text: '성능 최적화', link: '/ko/guide/performance' },
        { text: '오류 처리', link: '/ko/guide/error-handling' }
      ]
    },
    
    // 5. 모범 사례 & 문제 해결
    bestPractices: {
      text: '✅ 모범 사례',
      collapsed: true,
      items: [
        { text: '모범 사례', link: '/ko/guide/best-practices' },
        { text: '공통 함정', link: '/ko/guide/common-pitfalls' }
      ]
    }
  }
}

/**
 * Create sidebar based on locale - 단일 사이드바 구조
 */
export function createSidebars(locale: SidebarLocale): DefaultTheme.Config['sidebar'] {
  const structure = GUIDE_STRUCTURE[locale]
  
  // 모든 경로에 대해 동일한 사이드바 사용 (상단 탭바 확장 대비)
  return {
    [`/${locale}/`]: [
      structure.gettingStarted,
      structure.architecture,
      structure.coreImplementation,
      structure.advanced,
      structure.bestPractices
    ]
  }
}

export default createSidebars