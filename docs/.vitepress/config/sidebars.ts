/**
 * Sidebar Configuration - Top-Down Architecture
 * Full Guide 구조를 기반으로 한 계층적 사이드바 설계
 */

import type { DefaultTheme } from 'vitepress'

export type SidebarLocale = 'en' | 'ko'

// Top-Down 사이드바 구조 정의
const SIDEBAR_STRUCTURE = {
  en: {
    // 1. Architecture & Philosophy (Big Picture)
    architecture: {
      text: '🏗️ Architecture & Philosophy',
      collapsed: false,
      items: [
        { text: 'Overview & Core Concepts', link: '/en/guide/overview' },
        { text: 'Design Philosophy', link: '/en/guide/philosophy' },
        { text: 'Domain-Specific Hooks Pattern', link: '/en/guide/domain-hooks-pattern' },
        { text: 'MVVM-Inspired Architecture', link: '/en/guide/mvvm-architecture' }
      ]
    },
    
    // 2. Core Implementation (Essential Learning Path)
    coreImplementation: {
      text: '⚙️ Core Implementation',
      collapsed: false,
      items: [
        { text: 'Quick Start Guide', link: '/en/guide/quick-start' },
        { text: 'Full Implementation Guide', link: '/en/guide/full' },
        { text: 'Basic Setup & Usage', link: '/en/guide/setup-usage' },
        { text: 'Store Management', link: '/en/guide/store-management' },
        { text: 'Action Handlers', link: '/en/guide/action-handlers' },
        { text: 'Provider Composition', link: '/en/guide/provider-composition' }
      ]
    },
    
    // 3. Advanced Patterns & Best Practices
    advancedPatterns: {
      text: '🚀 Advanced Patterns',
      collapsed: true,
      items: [
        { text: 'Cross-Domain Integration', link: '/en/guide/cross-domain-integration' },
        { text: 'Logic Fit Hooks Pattern', link: '/en/guide/logic-fit-hooks' },
        { text: 'Handler ID Strategies', link: '/en/guide/handler-id-strategies' },
        { text: 'Performance Optimization', link: '/en/guide/performance' },
        { text: 'Error Handling Patterns', link: '/en/guide/error-handling' }
      ]
    },
    
    // 4. Quality & Best Practices
    bestPractices: {
      text: '✅ Best Practices',
      collapsed: true,
      items: [
        { text: 'Development Best Practices', link: '/en/guide/best-practices' },
        { text: 'Common Pitfalls', link: '/en/guide/common-pitfalls' },
        { text: 'Type Safety Guidelines', link: '/en/guide/type-safety' },
        { text: 'Memory Management', link: '/en/guide/memory-management' }
      ]
    },
    
    // 5. Practical Resources
    practicalResources: {
      text: '📚 Practical Resources',
      collapsed: true,
      items: [
        { text: 'Implementation Examples', link: '/en/guide/examples' },
        { text: 'Testing Guide', link: '/en/guide/testing' },
        { text: 'Migration Guide', link: '/en/guide/migration' },
        { text: 'Troubleshooting', link: '/en/guide/troubleshooting' },
        { text: 'FAQ', link: '/en/guide/faq' }
      ]
    },
    
    // 6. Framework Integrations
    integrations: {
      text: '🔌 Framework Integrations',
      collapsed: true,
      items: [
        { text: 'React Integration', link: '/en/guide/react-integration' },
        { text: 'Jotai Integration', link: '/en/guide/jotai-integration' },
        { text: 'Next.js Integration', link: '/en/guide/nextjs-integration' },
        { text: 'Vite Integration', link: '/en/guide/vite-integration' }
      ]
    }
  },
  
  ko: {
    // 1. 아키텍처 & 철학 (큰 그림)
    architecture: {
      text: '🏗️ 아키텍처 & 철학',
      collapsed: false,
      items: [
        { text: '개요 & 핵심 개념', link: '/ko/guide/overview' },
        { text: '설계 철학', link: '/ko/guide/philosophy' },
        { text: '도메인별 훅 패턴', link: '/ko/guide/domain-hooks-pattern' },
        { text: 'MVVM 기반 아키텍처', link: '/ko/guide/mvvm-architecture' }
      ]
    },
    
    // 2. 핵심 구현 (필수 학습 경로)
    coreImplementation: {
      text: '⚙️ 핵심 구현',
      collapsed: false,
      items: [
        { text: '빠른 시작 가이드', link: '/ko/guide/quick-start' },
        { text: '완전한 구현 가이드', link: '/ko/guide/full' },
        { text: '기본 설정 & 사용법', link: '/ko/guide/setup-usage' },
        { text: '스토어 관리', link: '/ko/guide/store-management' },
        { text: '액션 핸들러', link: '/ko/guide/action-handlers' },
        { text: '프로바이더 구성', link: '/ko/guide/provider-composition' }
      ]
    },
    
    // 3. 고급 패턴 & 모범 사례
    advancedPatterns: {
      text: '🚀 고급 패턴',
      collapsed: true,
      items: [
        { text: '크로스 도메인 통합', link: '/ko/guide/cross-domain-integration' },
        { text: '로직 핏 훅 패턴', link: '/ko/guide/logic-fit-hooks' },
        { text: '핸들러 ID 전략', link: '/ko/guide/handler-id-strategies' },
        { text: '성능 최적화', link: '/ko/guide/performance' },
        { text: '에러 처리 패턴', link: '/ko/guide/error-handling' }
      ]
    },
    
    // 4. 품질 & 모범 사례
    bestPractices: {
      text: '✅ 모범 사례',
      collapsed: true,
      items: [
        { text: '개발 모범 사례', link: '/ko/guide/best-practices' },
        { text: '일반적인 함정', link: '/ko/guide/common-pitfalls' },
        { text: '타입 안전성 가이드라인', link: '/ko/guide/type-safety' },
        { text: '메모리 관리', link: '/ko/guide/memory-management' }
      ]
    },
    
    // 5. 실용적 자료
    practicalResources: {
      text: '📚 실용적 자료',
      collapsed: true,
      items: [
        { text: '구현 예제', link: '/ko/guide/examples' },
        { text: '테스팅 가이드', link: '/ko/guide/testing' },
        { text: '마이그레이션 가이드', link: '/ko/guide/migration' },
        { text: '문제 해결', link: '/ko/guide/troubleshooting' },
        { text: 'FAQ', link: '/ko/guide/faq' }
      ]
    },
    
    // 6. 프레임워크 통합
    integrations: {
      text: '🔌 프레임워크 통합',
      collapsed: true,
      items: [
        { text: 'React 통합', link: '/ko/guide/react-integration' },
        { text: 'Jotai 통합', link: '/ko/guide/jotai-integration' },
        { text: 'Next.js 통합', link: '/ko/guide/nextjs-integration' },
        { text: 'Vite 통합', link: '/ko/guide/vite-integration' }
      ]
    }
  }
}

// API 참조 사이드바 구조
const API_SIDEBAR_STRUCTURE = {
  en: {
    coreApi: {
      text: '🔧 Core API',
      collapsed: false,
      items: [
        { text: 'ActionRegister', link: '/en/api/core/action-register' },
        { text: 'Handler Configuration', link: '/en/api/core/handler-config' },
        { text: 'Pipeline Controller', link: '/en/api/core/pipeline-controller' },
        { text: 'Result Collection', link: '/en/api/core/result-collection' }
      ]
    },
    reactApi: {
      text: '⚛️ React Integration',
      collapsed: false,
      items: [
        { text: 'ActionProvider', link: '/en/api/react/action-provider' },
        { text: 'useActionDispatch', link: '/en/api/react/use-action-dispatch' },
        { text: 'useActionRegister', link: '/en/api/react/use-action-register' },
        { text: 'Store System', link: '/en/api/react/store-system' },
        { text: 'Context Store Pattern', link: '/en/api/react/context-store-pattern' }
      ]
    },
    jotaiApi: {
      text: '🗃️ Jotai Integration',
      collapsed: true,
      items: [
        { text: 'Atom Integration', link: '/en/api/jotai/atom-integration' },
        { text: 'Store Adapters', link: '/en/api/jotai/store-adapters' }
      ]
    },
    types: {
      text: '📝 Type Definitions',
      collapsed: true,
      items: [
        { text: 'Core Types', link: '/en/api/types/core' },
        { text: 'Handler Types', link: '/en/api/types/handlers' },
        { text: 'React Types', link: '/en/api/types/react' },
        { text: 'Utility Types', link: '/en/api/types/utilities' }
      ]
    }
  },
  
  ko: {
    coreApi: {
      text: '🔧 코어 API',
      collapsed: false,
      items: [
        { text: 'ActionRegister', link: '/ko/api/core/action-register' },
        { text: '핸들러 설정', link: '/ko/api/core/handler-config' },
        { text: '파이프라인 컨트롤러', link: '/ko/api/core/pipeline-controller' },
        { text: '결과 수집', link: '/ko/api/core/result-collection' }
      ]
    },
    reactApi: {
      text: '⚛️ React 통합',
      collapsed: false,
      items: [
        { text: 'ActionProvider', link: '/ko/api/react/action-provider' },
        { text: 'useActionDispatch', link: '/ko/api/react/use-action-dispatch' },
        { text: 'useActionRegister', link: '/ko/api/react/use-action-register' },
        { text: '스토어 시스템', link: '/ko/api/react/store-system' },
        { text: '컨텍스트 스토어 패턴', link: '/ko/api/react/context-store-pattern' }
      ]
    },
    jotaiApi: {
      text: '🗃️ Jotai 통합',
      collapsed: true,
      items: [
        { text: 'Atom 통합', link: '/ko/api/jotai/atom-integration' },
        { text: '스토어 어댑터', link: '/ko/api/jotai/store-adapters' }
      ]
    },
    types: {
      text: '📝 타입 정의',
      collapsed: true,
      items: [
        { text: '코어 타입', link: '/ko/api/types/core' },
        { text: '핸들러 타입', link: '/ko/api/types/handlers' },
        { text: 'React 타입', link: '/ko/api/types/react' },
        { text: '유틸리티 타입', link: '/ko/api/types/utilities' }
      ]
    }
  }
}

// 예제 사이드바 구조
const EXAMPLES_SIDEBAR_STRUCTURE = {
  en: {
    quickStart: {
      text: '🚀 Quick Start Examples',
      collapsed: false,
      items: [
        { text: 'Basic Counter', link: '/en/examples/basic-counter' },
        { text: 'Todo List', link: '/en/examples/todo-list' },
        { text: 'Form Validation', link: '/en/examples/form-validation' }
      ]
    },
    patterns: {
      text: '🏗️ Pattern Examples',
      collapsed: false,
      items: [
        { text: 'Domain Separation', link: '/en/examples/domain-separation' },
        { text: 'Cross-Domain Communication', link: '/en/examples/cross-domain' },
        { text: 'Logic Fit Hooks', link: '/en/examples/logic-fit-hooks' },
        { text: 'Provider Composition', link: '/en/examples/provider-composition' }
      ]
    },
    advanced: {
      text: '🔥 Advanced Examples',
      collapsed: true,
      items: [
        { text: 'E-commerce Cart', link: '/en/examples/ecommerce-cart' },
        { text: 'User Management', link: '/en/examples/user-management' },
        { text: 'Real-time Chat', link: '/en/examples/realtime-chat' },
        { text: 'Dashboard Analytics', link: '/en/examples/dashboard-analytics' }
      ]
    }
  },
  
  ko: {
    quickStart: {
      text: '🚀 빠른 시작 예제',
      collapsed: false,
      items: [
        { text: '기본 카운터', link: '/ko/examples/basic-counter' },
        { text: '할 일 목록', link: '/ko/examples/todo-list' },
        { text: '폼 검증', link: '/ko/examples/form-validation' }
      ]
    },
    patterns: {
      text: '🏗️ 패턴 예제',
      collapsed: false,
      items: [
        { text: '도메인 분리', link: '/ko/examples/domain-separation' },
        { text: '크로스 도메인 통신', link: '/ko/examples/cross-domain' },
        { text: '로직 핏 훅', link: '/ko/examples/logic-fit-hooks' },
        { text: '프로바이더 구성', link: '/ko/examples/provider-composition' }
      ]
    },
    advanced: {
      text: '🔥 고급 예제',
      collapsed: true,
      items: [
        { text: '이커머스 장바구니', link: '/ko/examples/ecommerce-cart' },
        { text: '사용자 관리', link: '/ko/examples/user-management' },
        { text: '실시간 채팅', link: '/ko/examples/realtime-chat' },
        { text: '대시보드 분석', link: '/ko/examples/dashboard-analytics' }
      ]
    }
  }
}

/**
 * Create sidebars based on locale
 */
export function createSidebars(locale: SidebarLocale): DefaultTheme.Config['sidebar'] {
  const structure = SIDEBAR_STRUCTURE[locale]
  const apiStructure = API_SIDEBAR_STRUCTURE[locale]
  const examplesStructure = EXAMPLES_SIDEBAR_STRUCTURE[locale]
  
  return {
    // Guide 사이드바 - Full Guide 기반 구조
    [`/${locale}/guide/`]: [
      structure.architecture,
      structure.coreImplementation,
      structure.advancedPatterns,
      structure.bestPractices,
      structure.practicalResources,
      structure.integrations
    ],
    
    // API Reference 사이드바
    [`/${locale}/api/`]: [
      apiStructure.coreApi,
      apiStructure.reactApi,
      apiStructure.jotaiApi,
      apiStructure.types
    ],
    
    // Examples 사이드바
    [`/${locale}/examples/`]: [
      examplesStructure.quickStart,
      examplesStructure.patterns,
      examplesStructure.advanced
    ]
  }
}

export default createSidebars