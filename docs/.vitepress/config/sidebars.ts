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
        { text: 'Code Patterns', link: '/en/guide/code-patterns' },
        { text: 'Best Practices', link: '/en/guide/best-practices' }
      ]
    },
    // 2. Hook Lifecycle - 새로운 lifecycle 폴더
    lifecycle: {
      text: '🔄 Hook Lifecycle',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/guide/lifecycle/' },
        { text: 'React Hooks', link: '/en/guide/lifecycle/hooks' },
        { text: 'Hooks Lifecycle', link: '/en/guide/lifecycle/hooks-lifecycle' }
      ]
    },
    // 3. Pipeline Features - dedicated pipeline documentation
    pipeline: {
      text: '⚡ Pipeline Features',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/guide/pipeline/' },
        { text: 'Priority System', link: '/en/guide/pipeline/priority' },
        { text: 'Blocking Operations', link: '/en/guide/pipeline/blocking' },
        { text: 'Dispatch Methods', link: '/en/guide/pipeline/dispatch' },
        { text: 'Abort Mechanisms', link: '/en/guide/pipeline/abort' },
        { text: 'Result Handling', link: '/en/guide/pipeline/result-handling' },
        {
          text: '🚀 Advanced Features',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/pipeline/advanced-features' },
            { text: 'Flow Control', link: '/en/guide/pipeline/flow-control' },
            { text: 'Conditional Execution', link: '/en/guide/pipeline/conditional-execution' },
            { text: 'Handler Introspection', link: '/en/guide/pipeline/introspection' },
            { text: 'Performance Monitoring', link: '/en/guide/pipeline/performance' }
          ]
        }
      ]
    },
    // 4. Pattern Collection - organized patterns directory
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
            { text: 'Dispatch Access', link: '/en/guide/patterns/action/dispatch-access' },
            { text: 'Handler State Access', link: '/en/guide/patterns/action/handler-state-access' }
          ]
        },
        {
          text: '🏪 Store Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/store/' },
            { text: 'Basic Usage', link: '/en/guide/patterns/store/basic-usage' },
            { text: 'Store Configuration', link: '/en/guide/patterns/store/store-configuration' },
            { text: 'Performance Patterns', link: '/en/guide/patterns/store/performance-patterns' },
            { text: 'useStoreValue Patterns', link: '/en/guide/patterns/store/useStoreValue-patterns' },
            { text: 'useStoreSelector Patterns', link: '/en/guide/patterns/store/useStoreSelector-patterns' },
            { text: 'useComputedStore Patterns', link: '/en/guide/patterns/store/useComputedStore-patterns' },
            { text: 'useStoreManager API', link: '/en/guide/patterns/store/useStoreManager-api' },
            { text: 'withProvider Pattern', link: '/en/guide/patterns/store/withProvider-pattern' }
          ]
        },
        {
          text: '🔧 Ref Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/ref/' },
            { text: 'Basic Usage', link: '/en/guide/patterns/ref/basic-usage' },
            { text: 'Multi-Context', link: '/en/guide/patterns/ref/multi-context' },
            { text: 'Performance', link: '/en/guide/patterns/ref/performance' },
            { text: 'Canvas Optimization', link: '/en/guide/patterns/ref/canvas-optimization' },
            { text: 'Hardware Acceleration', link: '/en/guide/patterns/ref/hardware-acceleration' },
            { text: 'Memory Optimization', link: '/en/guide/patterns/ref/memory-optimization' },
            { text: 'Singleton Handling', link: '/en/guide/patterns/ref/singleton-handling' }
          ]
        },
        {
          text: '🏗️ Architecture Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/architecture/' },
            { text: 'MVVM', link: '/en/guide/patterns/architecture/mvvm' },
            { text: 'Domain Context', link: '/en/guide/patterns/architecture/domain-context' },
            { text: 'Composition', link: '/en/guide/patterns/architecture/composition' },
            { text: 'Context Splitting', link: '/en/guide/patterns/architecture/context-splitting' }
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
        },
        {
          text: '🔧 Setup Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/setup/' },
            { text: 'Basic Action Setup', link: '/en/guide/patterns/setup/basic-action-setup' },
            { text: 'Basic Store Setup', link: '/en/guide/patterns/setup/basic-store-setup' },
            { text: 'Multi-Context Setup', link: '/en/guide/patterns/setup/multi-context-setup' },
            { text: 'Provider Composition Setup', link: '/en/guide/patterns/setup/provider-composition-setup' },
            { text: 'Ref Context Setup', link: '/en/guide/patterns/setup/ref-context-setup' }
          ]
        },
        {
          text: '⚡ Performance Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/performance/' },
            { text: 'Optimization Techniques', link: '/en/guide/patterns/performance/optimization-techniques' }
          ]
        },
        {
          text: '🐛 Debug Patterns',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/debug/' },
            { text: 'Production Debugging', link: '/en/guide/patterns/debug/production-debugging' }
          ]
        },
        {
          text: '💡 Proposals',
          collapsed: false,
          items: [
            { text: 'Debug Store Types', link: '/en/guide/patterns/proposals/debug-store-types' }
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
        { text: '코드 패턴', link: '/ko/guide/code-patterns' },
        { text: '모범 사례', link: '/ko/guide/best-practices' }
      ]
    },
    // 2. 훅 라이프사이클 - 새로운 lifecycle 폴더
    lifecycle: {
      text: '🔄 훅 라이프사이클',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/guide/lifecycle/' },
        { text: 'React 훅', link: '/ko/guide/lifecycle/hooks' },
        { text: '훅 라이프사이클', link: '/ko/guide/lifecycle/hooks-lifecycle' }
      ]
    },
    // 3. 파이프라인 기능 - 전용 파이프라인 문서
    pipeline: {
      text: '⚡ 파이프라인 기능',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/guide/pipeline/' },
        { text: '우선순위 시스템', link: '/ko/guide/pipeline/priority' },
        { text: '블로킹 작업', link: '/ko/guide/pipeline/blocking' },
        { text: '디스패치 메서드', link: '/ko/guide/pipeline/dispatch' },
        { text: '중단 메커니즘', link: '/ko/guide/pipeline/abort' },
        { text: '결과 처리', link: '/ko/guide/pipeline/result-handling' },
        {
          text: '🚀 고급 기능',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/pipeline/advanced-features' },
            { text: '플로우 제어', link: '/ko/guide/pipeline/flow-control' },
            { text: '조건부 실행', link: '/ko/guide/pipeline/conditional-execution' },
            { text: '핸들러 검사', link: '/ko/guide/pipeline/introspection' },
            { text: '성능 모니터링', link: '/ko/guide/pipeline/performance' }
          ]
        }
      ]
    },
    // 4. 패턴 컬렉션 - 정리된 패턴 디렉토리
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
            { text: '레지스터 위임', link: '/ko/guide/patterns/action/register-delegation' },
            { text: '타입 시스템', link: '/ko/guide/patterns/action/type-system' },
            { text: '고급 패턴', link: '/ko/guide/patterns/action/advanced-patterns' },
            { text: '디스패치 패턴', link: '/ko/guide/patterns/action/dispatch-patterns' },
            { text: '결과와 함께 디스패치', link: '/ko/guide/patterns/action/dispatch-with-result' },
            { text: '레지스터 패턴', link: '/ko/guide/patterns/action/register-patterns' },
            { text: '디스패치 접근', link: '/ko/guide/patterns/action/dispatch-access' },
            { text: '핸들러 상태 접근', link: '/ko/guide/patterns/action/handler-state-access' }
          ]
        },
        {
          text: '🏪 스토어 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/store/' },
            { text: '기본 사용법', link: '/ko/guide/patterns/store/basic-usage' },
            { text: '스토어 설정', link: '/ko/guide/patterns/store/store-configuration' },
            { text: '성능 패턴', link: '/ko/guide/patterns/store/performance-patterns' },
            { text: 'useStoreValue 패턴', link: '/ko/guide/patterns/store/useStoreValue-patterns' },
            { text: 'useStoreSelector 패턴', link: '/ko/guide/patterns/store/useStoreSelector-patterns' },
            { text: 'useComputedStore 패턴', link: '/ko/guide/patterns/store/useComputedStore-patterns' },
            { text: 'useStoreManager API', link: '/ko/guide/patterns/store/useStoreManager-api' },
            { text: 'withProvider 패턴', link: '/ko/guide/patterns/store/withProvider-pattern' }
          ]
        },
        {
          text: '🔧 Ref 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/ref/' },
            { text: '기본 사용법', link: '/ko/guide/patterns/ref/basic-usage' },
            { text: '멀티 컨텍스트', link: '/ko/guide/patterns/ref/multi-context' },
            { text: '성능 최적화', link: '/ko/guide/patterns/ref/performance' },
            { text: '캔버스 최적화', link: '/ko/guide/patterns/ref/canvas-optimization' },
            { text: '하드웨어 가속', link: '/ko/guide/patterns/ref/hardware-acceleration' },
            { text: '메모리 최적화', link: '/ko/guide/patterns/ref/memory-optimization' },
            { text: '싱글톤 처리', link: '/ko/guide/patterns/ref/singleton-handling' }
          ]
        },
        {
          text: '🏗️ 아키텍처 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/architecture/' },
            { text: 'MVVM', link: '/ko/guide/patterns/architecture/mvvm' },
            { text: '도메인 컨텍스트', link: '/ko/guide/patterns/architecture/domain-context' },
            { text: '패턴 조합', link: '/ko/guide/patterns/architecture/composition' },
            { text: '컨텍스트 분할', link: '/ko/guide/patterns/architecture/context-splitting' }
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
        },
        {
          text: '🔧 설정 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/setup/' },
            { text: '기본 액션 설정', link: '/ko/guide/patterns/setup/basic-action-setup' },
            { text: '기본 스토어 설정', link: '/ko/guide/patterns/setup/basic-store-setup' },
            { text: '멀티 컨텍스트 설정', link: '/ko/guide/patterns/setup/multi-context-setup' },
            { text: 'Provider 조합 설정', link: '/ko/guide/patterns/setup/provider-composition-setup' },
            { text: 'Ref 컨텍스트 설정', link: '/ko/guide/patterns/setup/ref-context-setup' }
          ]
        },
        {
          text: '⚡ 성능 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/performance/' },
            { text: '최적화 기법', link: '/ko/guide/patterns/performance/optimization-techniques' }
          ]
        },
        {
          text: '🐛 디버그 패턴',
          collapsed: false,
          items: [
            { text: '개요', link: '/ko/guide/patterns/debug/' },
            { text: '운영 디버깅', link: '/ko/guide/patterns/debug/production-debugging' }
          ]
        },
        {
          text: '💡 제안사항',
          collapsed: false,
          items: [
            { text: '디버그 스토어 타입', link: '/ko/guide/patterns/proposals/debug-store-types' }
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
    core: sidebarApiKo.core,
    react: sidebarApiKo.react,
    patterns: sidebarApiKo.patterns
  }
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
    },
    architecture: {
      text: '🏗️ Context-Layered Architecture',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/context-layered/context-layered-guide' },
        { text: 'Folder Structure', link: '/en/context-layered/architecture/folder-structure' },
        { text: 'Handler Registry', link: '/en/context-layered/architecture/handler-registry' },
        { text: 'Props-based Handlers', link: '/en/context-layered/patterns/props-based-handlers' },
        { text: 'Migration Guide', link: '/en/context-layered/migration-guide' }
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
    },
    architecture: {
      text: '🏗️ Context-Layered Architecture',
      collapsed: false,
      items: [
        { text: '개요', link: '/en/context-layered/context-layered-guide' },
        { text: '폴더 구조', link: '/en/context-layered/architecture/folder-structure' },
        { text: '핸들러 레지스트리', link: '/en/context-layered/architecture/handler-registry' },
        { text: 'Props 기반 핸들러', link: '/en/context-layered/patterns/props-based-handlers' },
        { text: '마이그레이션 가이드', link: '/en/context-layered/migration-guide' }
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
import { sidebarApiEn, sidebarApiKo } from '../api-spec'

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
      guide.lifecycle,
      guide.pipeline,
      guide.patterns
    ],
    
    // Concept 섹션 - CLAUDE.md에서 중요하게 언급된 핵심 문서들
    [`/${locale}/concept/`]: [
      concept.concepts
    ],
    
    // Context-Layered Architecture 섹션
    [`/${locale}/context-layered/`]: [
      concept.architecture
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
    
    // Troubleshooting 섹션
    [`/${locale}/troubleshooting/`]: [
      {
        text: locale === 'en' ? '🚨 Critical Issues' : '🚨 중요 문제들',
        collapsed: false,
        items: [
          { 
            text: locale === 'en' ? 'Performance & Infinite Loops' : '성능 및 무한 루프', 
            link: `/${locale}/troubleshooting/performance-issues` 
          },
          { 
            text: locale === 'en' ? 'Action System Issues' : '액션 시스템 문제', 
            link: `/${locale}/troubleshooting/action-issues` 
          },
          { 
            text: locale === 'en' ? 'Store & State Issues' : '스토어 및 상태 문제', 
            link: `/${locale}/troubleshooting/store-issues` 
          },
          { 
            text: locale === 'en' ? 'Ref System Issues' : 'Ref 시스템 문제', 
            link: `/${locale}/troubleshooting/ref-issues` 
          }
        ]
      }
    ],
    
    // 기본 경로는 Guide로 리다이렉트
    [`/${locale}/`]: [
      guide.essentials
    ]
  }
}

export default createSidebars