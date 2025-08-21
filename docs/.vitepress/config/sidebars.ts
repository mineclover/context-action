/**
 * Sidebar Configuration - Unified structure based on concept documents
 * Clean, focused documentation with 6 essential guides (21→6 file reduction)
 */

import type { DefaultTheme } from 'vitepress'

export type SidebarLocale = 'en' | 'ko'

// Concept-based simplified guide structure
const GUIDE_STRUCTURE = {
  en: {
    // 1. Essential Guides - concept 문서 기반
    essentials: {
      text: '🚀 Essential Guides',
      collapsed: false,
      items: [
        { text: 'Getting Started', link: '/en/guide/getting-started' },
        { text: 'Architecture', link: '/en/guide/architecture' },
        { text: 'Action Pipeline', link: '/en/guide/action-pipeline' },
        { text: 'React Hooks', link: '/en/guide/hooks' },
        { text: 'Code Patterns', link: '/en/guide/code-patterns' },
        { text: 'Best Practices', link: '/en/guide/best-practices' },
        { text: 'Action Handlers', link: '/en/guide/action-handlers' }
      ]
    },
    // 2. Pattern Collection - organized patterns directory
    patterns: {
      text: '🎯 Pattern Collection',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/guide/patterns/' },
        {
          text: '🎯 Action Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/action/' },
            { text: 'Basic Usage', link: '/en/guide/patterns/action/basic-usage' },
            { text: 'Register Delegation', link: '/en/guide/patterns/action/register-delegation' },
            { text: 'Type System', link: '/en/guide/patterns/action/type-system' },
            { text: 'Advanced Patterns', link: '/en/guide/patterns/action/advanced-patterns' },
            { text: 'Dispatch Patterns', link: '/en/guide/patterns/action/dispatch-patterns' },
            { text: 'Dispatch with Result', link: '/en/guide/patterns/action/dispatch-with-result' },
            { text: 'Register Patterns', link: '/en/guide/patterns/action/register-patterns' },
            { text: 'Dispatch Access', link: '/en/guide/patterns/action/dispatch-access' }
          ]
        },
        {
          text: '🏪 Store Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/store/' },
            { text: 'Basic Usage', link: '/en/guide/patterns/store/basic-usage' },
            { text: 'HOC Pattern', link: '/en/guide/patterns/store/hoc-pattern' },
            { text: 'Advanced Config', link: '/en/guide/patterns/store/advanced-config' },
            { text: 'Advanced Hooks', link: '/en/guide/patterns/store/advanced-hooks' }
          ]
        },
        {
          text: '🔧 Ref Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/ref/' },
            { text: 'Basic Usage', link: '/en/guide/patterns/ref/basic-usage' },
            { text: 'Multi-Context', link: '/en/guide/patterns/ref/multi-context' },
            { text: 'Performance', link: '/en/guide/patterns/ref/performance' }
          ]
        },
        {
          text: '🏗️ Architecture Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/architecture/' },
            { text: 'MVVM', link: '/en/guide/patterns/architecture/mvvm' },
            { text: 'Domain Context', link: '/en/guide/patterns/architecture/domain-context' },
            { text: 'Composition', link: '/en/guide/patterns/architecture/composition' }
          ]
        },
        {
          text: '⚡ Async Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/async/' },
            { text: 'Real-time State Access', link: '/en/guide/patterns/async/real-time-state-access' },
            { text: 'Wait-Then-Execute', link: '/en/guide/patterns/async/wait-then-execute' },
            { text: 'Conditional Await', link: '/en/guide/patterns/async/conditional-await' },
            { text: 'Timeout Protection', link: '/en/guide/patterns/async/timeout-protection' }
          ]
        }
      ]
    }
  },
  
  ko: {
    // 1. 필수 가이드 - concept 문서 기반
    essentials: {
      text: '🚀 필수 가이드',
      collapsed: false,
      items: [
        { text: '시작하기', link: '/ko/guide/getting-started' },
        { text: '아키텍처', link: '/ko/guide/architecture' },
        { text: '액션 파이프라인', link: '/ko/guide/action-pipeline' },
        { text: 'React 훅', link: '/ko/guide/hooks' },
        { text: '코드 패턴', link: '/ko/guide/code-patterns' },
        { text: '모범 사례', link: '/ko/guide/best-practices' },
        { text: '액션 핸들러', link: '/ko/guide/action-handlers' }
      ]
    },
    // 2. 패턴 컬렉션 - 정리된 패턴 디렉토리
    patterns: {
      text: '🎯 패턴 컬렉션',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/guide/patterns/' },
        {
          text: '🎯 액션 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/action/' },
            { text: '기본 사용법', link: '/ko/guide/patterns/action/basic-usage' },
            { text: '레지스터 위임', link: '/ko/guide/patterns/action/register-delegation' }
          ]
        },
        {
          text: '🏪 스토어 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/store/' },
            { text: '기본 사용법', link: '/ko/guide/patterns/store/basic-usage' },
            { text: 'HOC 패턴', link: '/ko/guide/patterns/store/hoc-pattern' },
            { text: '고급 설정', link: '/ko/guide/patterns/store/advanced-config' },
            { text: '고급 훅', link: '/ko/guide/patterns/store/advanced-hooks' }
          ]
        },
        {
          text: '🔧 Ref 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/ref/' },
            { text: '기본 사용법', link: '/ko/guide/patterns/ref/basic-usage' },
            { text: '멀티 컨텍스트', link: '/ko/guide/patterns/ref/multi-context' },
            { text: '성능 최적화', link: '/ko/guide/patterns/ref/performance' }
          ]
        },
        {
          text: '🏗️ 아키텍처 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/architecture/' },
            { text: 'MVVM', link: '/ko/guide/patterns/architecture/mvvm' },
            { text: '도메인 컨텍스트', link: '/ko/guide/patterns/architecture/domain-context' },
            { text: '패턴 조합', link: '/ko/guide/patterns/architecture/composition' }
          ]
        },
        {
          text: '⚡ 비동기 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/async/' },
            { text: '실시간 상태 접근', link: '/ko/guide/patterns/async/real-time-state-access' },
            { text: '대기 후 실행', link: '/ko/guide/patterns/async/wait-then-execute' },
            { text: '조건부 대기', link: '/ko/guide/patterns/async/conditional-await' },
            { text: '타임아웃 보호', link: '/ko/guide/patterns/async/timeout-protection' }
          ]
        }
      ]
    }
  }
}

// API 문서 구조 - 실제 파일 구조에 맞춤
const API_STRUCTURE = {
  en: {
    core: {
      text: '🔧 @context-action/core',
      collapsed: false,
      items: [
        { text: 'ActionRegister', link: '/en/api/core/action-register' },
        { text: 'PipelineController', link: '/en/api/core/pipeline-controller' }
      ]
    },
    react: {
      text: '⚛️ @context-action/react',
      collapsed: false,
      items: [
        { text: 'Action Context', link: '/en/api/react/action-context' },
        { text: 'Store Pattern', link: '/en/api/react/store-pattern' },
        { text: 'Store Manager', link: '/en/api/react/store-manager' }
      ]
    },
    patterns: {
      text: '🎯 Pattern APIs',
      collapsed: false,
      items: [
        { text: 'Action Only Methods', link: '/en/api/action-only' },
        { text: 'Store Only Methods', link: '/en/api/store-only' },
        { text: 'Action Registry', link: '/en/api/action-registry' },
        { text: 'Pipeline Controller API', link: '/en/api/pipeline-controller' },
        { text: 'Store Manager API', link: '/en/api/store-manager' },
        { text: 'Declarative Store Pattern', link: '/en/api/declarative-store-pattern' }
      ]
    }
  },
  ko: {
    core: {
      text: '🔧 @context-action/core',
      collapsed: false,
      items: [
        { text: 'ActionRegister', link: '/ko/api/core/action-register' },
        { text: 'PipelineController', link: '/ko/api/core/pipeline-controller' }
      ]
    },
    react: {
      text: '⚛️ @context-action/react',
      collapsed: false,
      items: [
        { text: 'Action Context', link: '/ko/api/react/action-context' },
        { text: 'Store Pattern', link: '/ko/api/react/store-pattern' },
        { text: 'Store Manager', link: '/ko/api/react/store-manager' }
      ]
    },
    patterns: {
      text: '🎯 패턴 APIs',
      collapsed: false,
      items: [
        { text: 'Action Only 메서드', link: '/ko/api/action-only' },
        { text: 'Store Only 메서드', link: '/ko/api/store-only' },
        { text: 'Action Registry', link: '/ko/api/action-registry' },
        { text: 'Pipeline Controller API', link: '/ko/api/pipeline-controller' },
        { text: 'Store Manager API', link: '/ko/api/store-manager' },
        { text: 'Declarative Store 패턴', link: '/ko/api/declarative-store-pattern' }
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
    },
    advanced: {
      text: '🚀 Advanced Examples',
      collapsed: false,
      items: [
        { text: 'DOM Element Management', link: '/en/examples/element-management' }
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
    },
    advanced: {
      text: '🚀 고급 예제',
      collapsed: false,
      items: [
        { text: 'DOM Element 관리', link: '/ko/examples/element-management' }
      ]
    }
  }
}

// Concept 문서 구조 - CLAUDE.md에서 중요하게 언급된 섹션
const CONCEPT_STRUCTURE = {
  en: {
    concepts: {
      text: '📖 Core Concepts',
      collapsed: false,
      items: [
        { text: 'Pattern Guide', link: '/en/concept/pattern-guide' },
        { text: 'Architecture Guide', link: '/en/concept/architecture-guide' },
        { text: 'Action Pipeline Guide', link: '/en/concept/action-pipeline-guide' },
        { text: 'Hooks Reference', link: '/en/concept/hooks-reference' },
        { text: 'Conventions', link: '/en/concept/conventions' }
      ]
    }
  },
  ko: {
    concepts: {
      text: '📖 핵심 개념',
      collapsed: false,
      items: [
        { text: '패턴 가이드', link: '/ko/concept/pattern-guide' },
        { text: '아키텍처 가이드', link: '/ko/concept/architecture-guide' },
        { text: '액션 파이프라인 가이드', link: '/ko/concept/action-pipeline-guide' },
        { text: '훅 참조', link: '/ko/concept/hooks-reference' },
        { text: '컨벤션', link: '/ko/concept/conventions' }
      ]
    }
  }
}

// LLMs 문서 구조 - 실제 파일에 맞춤
const LLMS_STRUCTURE = {
  en: {
    resources: {
      text: '🤖 LLM Resources',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/llms/' },
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
        { text: '개요', link: '/ko/llms/' },
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
  const concept = CONCEPT_STRUCTURE[locale]
  const api = API_STRUCTURE[locale]
  const examples = EXAMPLES_STRUCTURE[locale]
  const llms = LLMS_STRUCTURE[locale]
  
  return {
    // Guide 섹션 - concept 기반으로 간소화
    [`/${locale}/guide/`]: [
      guide.essentials,
      guide.patterns
    ],
    
    // Concept 섹션 - CLAUDE.md에서 중요하게 언급된 핵심 문서들
    [`/${locale}/concept/`]: [
      concept.concepts
    ],
    
    // API 섹션 - 실제 파일 구조에 맞춤
    [`/${locale}/api/`]: [
      api.core,
      api.react,
      api.patterns
    ],
    
    // Examples 섹션
    [`/${locale}/examples/`]: [
      examples.patterns,
      examples.advanced
    ],
    
    // LLMs 섹션
    [`/${locale}/llms/`]: [
      llms.resources
    ],
    
    // 기본 경로는 Guide로 리다이렉트
    [`/${locale}/`]: [
      guide.essentials
    ]
  }
}

export default createSidebars