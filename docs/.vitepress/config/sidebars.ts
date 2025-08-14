/**
 * Sidebar Configuration - Updated for new documentation structure
 * DOCUMENTATION_GUIDELINES.md에 맞춘 새로운 문서 구조
 */

import type { DefaultTheme } from 'vitepress'

export type SidebarLocale = 'en' | 'ko'

// DOCUMENTATION_GUIDELINES.md에 맞춰 재구성된 가이드 구조
const GUIDE_STRUCTURE = {
  en: {
    // 1. Getting Started - MVVM 아키텍처와 패턴 중심
    gettingStarted: {
      text: '🚀 Getting Started',
      collapsed: false,
      items: [
        { text: 'Getting Started', link: '/en/guide/getting-started' },
        { text: 'MVVM Architecture', link: '/en/guide/mvvm-architecture' },
        { text: 'Action Pipeline', link: '/en/guide/action-pipeline' },
        { text: 'Main Patterns', link: '/en/guide/patterns' }
      ]
    },
    
    // 2. Legacy Support (기존 문서 호환성)
    legacy: {
      text: '📚 Legacy Guides',
      collapsed: true,
      items: [
        { text: 'Overview (Legacy)', link: '/en/guide/overview' },
        { text: 'Concepts (Legacy)', link: '/en/guide/concepts' },
        { text: 'Quick Start (Legacy)', link: '/en/guide/quick-start' },
        { text: 'Setup & Usage (Legacy)', link: '/en/guide/setup-usage' },
        { text: 'Philosophy (Legacy)', link: '/en/guide/philosophy' },
        { text: 'Domain Hooks Pattern', link: '/en/guide/domain-hooks-pattern' }
      ]
    },
    
    // 3. Implementation Details
    implementation: {
      text: '⚙️ Implementation',
      collapsed: true,
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
    // 1. 시작하기 - MVVM 아키텍처와 패턴 중심
    gettingStarted: {
      text: '🚀 시작하기',
      collapsed: false,
      items: [
        { text: '시작하기', link: '/ko/guide/getting-started' },
        { text: 'MVVM 아키텍처', link: '/ko/guide/mvvm-architecture' },
        { text: '액션 파이프라인', link: '/ko/guide/action-pipeline' },
        { text: '주요 패턴', link: '/ko/guide/patterns' }
      ]
    },
    
    // 2. 기존 문서 (호환성)
    legacy: {
      text: '📚 기존 가이드',
      collapsed: true,
      items: [
        { text: '개요 (기존)', link: '/ko/guide/overview' },
        { text: '핵심 개념 (기존)', link: '/ko/guide/concepts' },
        { text: '빠른 시작 (기존)', link: '/ko/guide/quick-start' },
        { text: '설정 & 사용법 (기존)', link: '/ko/guide/setup-usage' },
        { text: '설계 철학 (기존)', link: '/ko/guide/philosophy' },
        { text: '도메인 훅 패턴', link: '/ko/guide/domain-hooks-pattern' }
      ]
    },
    
    // 3. 구현 세부사항
    implementation: {
      text: '⚙️ 구현 세부사항',
      collapsed: true,
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
        { text: '오류 처리', link: '/ko/guide/error-handling' },
        { text: 'Logic Fit Hooks', link: '/ko/guide/logic-fit-hooks' }
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

// API 문서 구조 - Store Only, Action Only 중심으로 재구성
const API_STRUCTURE = {
  en: {
    storeOnly: {
      text: '🏪 Store Only Pattern',
      collapsed: false,
      items: [
        { text: 'Store Only Methods', link: '/en/api/store-only' },
        { text: 'Store Manager Object', link: '/en/api/store-manager' },
        { text: 'Declarative Store Pattern', link: '/en/api/declarative-store-pattern' }
      ]
    },
    actionOnly: {
      text: '🎯 Action Only Pattern',
      collapsed: false,
      items: [
        { text: 'Action Only Methods', link: '/en/api/action-only' },
        { text: 'Action Registry', link: '/en/api/action-registry' },
        { text: 'Pipeline Controller', link: '/en/api/pipeline-controller' }
      ]
    }
  },
  ko: {
    storeOnly: {
      text: '🏪 Store Only 패턴',
      collapsed: false,
      items: [
        { text: 'Store Only 메서드', link: '/ko/api/store-only' },
        { text: 'Store Manager 객체', link: '/ko/api/store-manager' },
        { text: 'Declarative Store 패턴', link: '/ko/api/declarative-store-pattern' }
      ]
    },
    actionOnly: {
      text: '🎯 Action Only 패턴',
      collapsed: false,
      items: [
        { text: 'Action Only 메서드', link: '/ko/api/action-only' },
        { text: 'Action Registry', link: '/ko/api/action-registry' },
        { text: 'Pipeline Controller', link: '/ko/api/pipeline-controller' }
      ]
    }
  }
}

// 예제 문서 구조 추가
const EXAMPLES_STRUCTURE = {
  en: {
    patterns: {
      text: '🎆 Pattern Examples',
      collapsed: false,
      items: [
        { text: 'Basic Setup', link: '/en/examples/basic-setup' },
        { text: 'Action Only Pattern', link: '/en/examples/action-only' },
        { text: 'Store Only Pattern', link: '/en/examples/store-only' },
        { text: 'Pattern Composition', link: '/en/examples/pattern-composition' }
      ]
    }
  },
  ko: {
    patterns: {
      text: '🎆 패턴 예제',
      collapsed: false,
      items: [
        { text: '기본 설정', link: '/ko/examples/basic-setup' },
        { text: 'Action Only 패턴', link: '/ko/examples/action-only' },
        { text: 'Store Only 패턴', link: '/ko/examples/store-only' },
        { text: '패턴 조합', link: '/ko/examples/pattern-composition' }
      ]
    }
  }
}

// LLMs 문서 구조 - 컨벤션과 라이브러리 설명용
const LLMS_STRUCTURE = {
  en: {
    resources: {
      text: '🤖 LLM Resources',
      collapsed: false,
      items: [
        { text: 'LLMs Integration Guide', link: '/en/llms/llms.txt' },
        { text: 'Conventions', link: '/en/llms/conventions' },
        { text: 'Library Specifications', link: '/en/llms/library-specs' }
      ]
    }
  },
  ko: {
    resources: {
      text: '🤖 LLM 리소스',
      collapsed: false,
      items: [
        { text: 'LLMs 통합 가이드', link: '/ko/llms/llms.txt' },
        { text: '컨벤션', link: '/ko/llms/conventions' },
        { text: '라이브러리 사양', link: '/ko/llms/library-specs' }
      ]
    }
  }
}

/**
 * Create sidebar based on locale and section - 섹션별 사이드바 구조
 */
export function createSidebars(locale: SidebarLocale): DefaultTheme.Config['sidebar'] {
  const guide = GUIDE_STRUCTURE[locale]
  const api = API_STRUCTURE[locale]
  const examples = EXAMPLES_STRUCTURE[locale]
  const llms = LLMS_STRUCTURE[locale]
  
  return {
    // Guide 섹션
    [`/${locale}/guide/`]: [
      guide.gettingStarted,
      guide.legacy,
      guide.implementation,
      guide.advanced,
      guide.bestPractices
    ],
    
    // API 섹션 - Store Only, Action Only 중심
    [`/${locale}/api/`]: [
      api.storeOnly,
      api.actionOnly
    ],
    
    // Examples 섹션
    [`/${locale}/examples/`]: [
      examples.patterns
    ],
    
    // LLMs 섹션
    [`/${locale}/llms/`]: [
      llms.resources
    ],
    
    // 기본 경로는 Guide로 리다이렉트
    [`/${locale}/`]: [
      guide.gettingStarted,
      guide.legacy,
      guide.implementation,
      guide.advanced,
      guide.bestPractices
    ]
  }
}

export default createSidebars