/**
 * Sidebar Configuration - Simplified structure
 * Clean, essential documentation only
 */

import type { DefaultTheme } from 'vitepress'

export type SidebarLocale = 'en' | 'ko'

// Simplified guide structure - essential docs only
const GUIDE_STRUCTURE = {
  en: {
    essentials: {
      text: '🚀 Essential Guides',
      collapsed: false,
      items: [
        { text: 'Getting Started', link: '/en/guide/getting-started' },
        { text: 'Actions-based Dispatching', link: '/en/guide/actions-based-dispatching' },
        { text: 'Code Patterns', link: '/en/guide/code-patterns' },
        { text: 'Best Practices', link: '/en/guide/best-practices' },
        { text: 'React Context Migration', link: '/en/guide/react-context-migration' }
      ]
    },
    pipeline: {
      text: '⚡ Pipeline Features',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/guide/pipeline/' },
        { text: 'Priority System', link: '/en/guide/pipeline/priority' },
        { text: 'Dispatch Methods', link: '/en/guide/pipeline/dispatch' }
      ]
    },
    patterns: {
      text: '🎯 Pattern Collection',
      collapsed: false,
      items: [
        {
          text: '🎯 Action Patterns',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/action/' },
            { text: 'Basic Usage', link: '/en/guide/patterns/action/basic-usage' },
            { text: 'Type System', link: '/en/guide/patterns/action/type-system' },
            { text: 'Advanced Patterns', link: '/en/guide/patterns/action/advanced-patterns' },
            { text: 'Dispatch Patterns', link: '/en/guide/patterns/action/dispatch-patterns' },
            { text: 'Register Patterns', link: '/en/guide/patterns/action/register-patterns' },
            { text: 'Dispatch Access', link: '/en/guide/patterns/action/dispatch-access' },
            { text: 'Handler State Access', link: '/en/guide/patterns/action/handler-state-access' }
          ]
        },
        {
          text: '🏪 Store Patterns',
          collapsed: true,
          items: [
            { text: 'Basic Usage', link: '/en/guide/patterns/store/basic-usage' },
            { text: 'Store Configuration', link: '/en/guide/patterns/store/store-configuration' },
            { text: 'useStoreValue Patterns', link: '/en/guide/patterns/store/useStoreValue-patterns' },
            { text: 'Path-Based Subscription', link: '/en/guide/patterns/store/path-based-subscription' },
            { text: 'useStoreManager API', link: '/en/guide/patterns/store/useStoreManager-api' }
          ]
        },
        {
          text: '🔧 Ref Patterns',
          collapsed: true,
          items: [
            { text: 'Basic Usage', link: '/en/guide/patterns/ref/basic-usage' }
          ]
        },
        {
          text: '⚡ Async Patterns',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/async/' },
            { text: 'Real-time State Access', link: '/en/guide/patterns/async/real-time-state-access' },
            { text: 'Wait-Then-Execute', link: '/en/guide/patterns/async/wait-then-execute' }
          ]
        },
        {
          text: '🔧 Setup Patterns',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/setup/' },
            { text: 'Basic Action Setup', link: '/en/guide/patterns/setup/basic-action-setup' },
            { text: 'Basic Store Setup', link: '/en/guide/patterns/setup/basic-store-setup' },
            { text: 'Multi-Context Setup', link: '/en/guide/patterns/setup/multi-context-setup' },
            { text: 'Provider Composition', link: '/en/guide/patterns/setup/provider-composition-setup' },
            { text: 'Ref Context Setup', link: '/en/guide/patterns/setup/ref-context-setup' }
          ]
        }
      ]
    }
  },

  ko: {
    essentials: {
      text: '🚀 필수 가이드',
      collapsed: false,
      items: [
        { text: '시작하기', link: '/ko/guide/getting-started' },
        { text: 'Actions 기반 디스패칭', link: '/ko/guide/actions-based-dispatching' },
        { text: '코드 패턴', link: '/ko/guide/code-patterns' },
        { text: '모범 사례', link: '/ko/guide/best-practices' },
        { text: 'React Context 마이그레이션', link: '/ko/guide/react-context-migration' }
      ]
    },
    pipeline: {
      text: '⚡ 파이프라인 기능',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/guide/pipeline/' },
        { text: '우선순위 시스템', link: '/ko/guide/pipeline/priority' },
        { text: '디스패치 메서드', link: '/ko/guide/pipeline/dispatch' }
      ]
    },
    patterns: {
      text: '🎯 패턴 컬렉션',
      collapsed: false,
      items: [
        {
          text: '🎯 액션 패턴',
          collapsed: true,
          items: [
            { text: '개요', link: '/ko/guide/patterns/action/' },
            { text: '기본 사용법', link: '/ko/guide/patterns/action/basic-usage' },
            { text: '타입 시스템', link: '/ko/guide/patterns/action/type-system' },
            { text: '고급 패턴', link: '/ko/guide/patterns/action/advanced-patterns' },
            { text: '디스패치 패턴', link: '/ko/guide/patterns/action/dispatch-patterns' },
            { text: '레지스터 패턴', link: '/ko/guide/patterns/action/register-patterns' },
            { text: '디스패치 접근', link: '/ko/guide/patterns/action/dispatch-access' },
            { text: '핸들러 상태 접근', link: '/ko/guide/patterns/action/handler-state-access' }
          ]
        },
        {
          text: '🏪 스토어 패턴',
          collapsed: true,
          items: [
            { text: '기본 사용법', link: '/ko/guide/patterns/store/basic-usage' },
            { text: '스토어 설정', link: '/ko/guide/patterns/store/store-configuration' },
            { text: 'useStoreValue 패턴', link: '/ko/guide/patterns/store/useStoreValue-patterns' },
            { text: '경로 기반 구독', link: '/ko/guide/patterns/store/path-based-subscription' },
            { text: 'useStoreManager API', link: '/ko/guide/patterns/store/useStoreManager-api' }
          ]
        },
        {
          text: '🔧 Ref 패턴',
          collapsed: true,
          items: [
            { text: '기본 사용법', link: '/ko/guide/patterns/ref/basic-usage' }
          ]
        },
        {
          text: '⚡ 비동기 패턴',
          collapsed: true,
          items: [
            { text: '개요', link: '/ko/guide/patterns/async/' },
            { text: '실시간 상태 접근', link: '/ko/guide/patterns/async/real-time-state-access' },
            { text: '대기 후 실행', link: '/ko/guide/patterns/async/wait-then-execute' }
          ]
        },
        {
          text: '🔧 설정 패턴',
          collapsed: true,
          items: [
            { text: '개요', link: '/ko/guide/patterns/setup/' },
            { text: '기본 액션 설정', link: '/ko/guide/patterns/setup/basic-action-setup' },
            { text: '기본 스토어 설정', link: '/ko/guide/patterns/setup/basic-store-setup' },
            { text: '멀티 컨텍스트 설정', link: '/ko/guide/patterns/setup/multi-context-setup' },
            { text: 'Provider 조합 설정', link: '/ko/guide/patterns/setup/provider-composition-setup' },
            { text: 'Ref 컨텍스트 설정', link: '/ko/guide/patterns/setup/ref-context-setup' }
          ]
        }
      ]
    }
  }
}


// 예제 문서 구조
const EXAMPLES_STRUCTURE = {
  en: {
    patterns: {
      text: '🎆 Pattern Examples',
      collapsed: false,
      items: [
        { text: 'Basic Setup', link: '/en/examples/basic-setup' },
        { text: 'Action Only Pattern', link: '/en/examples/action-only' },
        { text: 'Store Only Pattern', link: '/en/examples/store-only' },
        { text: 'Pattern Composition', link: '/en/examples/pattern-composition' },
        { text: 'Canonical Order Form', link: '/en/examples/canonical-order-form' },
        { text: 'Access Request Playbook', link: '/en/examples/access-request-playbook' },
        { text: 'Incident Escalation Playbook', link: '/en/examples/incident-escalation-playbook' },
        { text: 'Renewal Risk Review Playbook', link: '/en/examples/renewal-risk-review-playbook' },
        { text: 'Playbook Scenario Library', link: '/en/examples/implementation-playbook-scenarios' }
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
        { text: '패턴 조합', link: '/ko/examples/pattern-composition' },
        { text: 'Canonical Order Form 예제', link: '/ko/examples/canonical-order-form' },
        { text: 'Access Request Playbook 예제', link: '/ko/examples/access-request-playbook' },
        { text: 'Incident Escalation Playbook 예제', link: '/ko/examples/incident-escalation-playbook' },
        { text: 'Renewal Risk Review Playbook 예제', link: '/ko/examples/renewal-risk-review-playbook' },
        { text: 'Playbook 시나리오 라이브러리', link: '/ko/examples/implementation-playbook-scenarios' }
      ]
    }
  }
}

// Concept 문서 구조
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
        { text: 'Conventions', link: '/en/concept/conventions' },
        {
          text: '🏗️ Context-Layered',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/en/context-layered/context-layered-guide' },
            { text: 'Convention Index', link: '/en/context-layered/convention-index' },
            { text: 'Package Boundary and Codebase Management', link: '/en/context-layered/package-boundary-convention' },
            { text: 'Mutative Core History and Upstream References', link: '/en/context-layered/mutative-core-history' },
            { text: 'Specification, Issue, and Documentation Management', link: '/en/context-layered/change-management-convention' },
            { text: 'Usecase and Recipe Profile', link: '/en/context-layered/usecase-recipe-profile' },
            { text: 'Tool-Calling Web Studio Convention', link: '/en/context-layered/usecase-tool-calling-web-studio' },
            { text: 'Panel Layout Preference Convention', link: '/en/context-layered/usecase-panel-layout' },
            { text: 'Convention Alignment Plan', link: '/en/context-layered/convention-alignment-plan' },
            { text: 'Folder Structure', link: '/en/context-layered/architecture/folder-structure' },
            { text: 'Handler Registry', link: '/en/context-layered/architecture/handler-registry' },
            { text: 'Architecture Governance', link: '/en/context-layered/architecture/architecture-governance' },
            { text: 'sem-doc and Architecture Governance Boundary', link: '/en/context-layered/architecture/sem-doc-architecture-governance-boundary' },
            { text: 'sem-doc Usage', link: '/en/context-layered/architecture/sem-doc-usage' },
            { text: 'Architecture Governance Usage', link: '/en/context-layered/architecture/architecture-governance-usage' },
            { text: 'ContextScope Symbol Graph', link: '/en/context-layered/architecture/context-scope-graph' },
            { text: 'Migration Guide', link: '/en/context-layered/migration-guide' },
            { text: 'Implementation Convention', link: '/en/context-layered/implementation-convention' },
            { text: 'Explicit State Machine', link: '/en/context-layered/patterns/explicit-state-machine' },
            { text: 'Stability Test Cycle', link: '/en/context-layered/stability-test-cycle' }
          ]
        }
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
        { text: '컨벤션', link: '/ko/concept/conventions' },
        {
          text: '🏗️ Context-Layered',
          collapsed: true,
          items: [
            { text: '개요', link: '/ko/context-layered/context-layered-guide' },
            { text: '개발 컨벤션 인덱스', link: '/ko/context-layered/convention-index' },
            { text: '패키지 경계 및 코드베이스 관리', link: '/ko/context-layered/package-boundary-convention' },
            { text: 'Mutative Core 히스토리 및 원본 참조', link: '/ko/context-layered/mutative-core-history' },
            { text: '스펙·이슈·문서 관리', link: '/ko/context-layered/change-management-convention' },
            { text: 'Usecase 및 Recipe Profile', link: '/ko/context-layered/usecase-recipe-profile' },
            { text: 'Tool Calling Web Studio 컨벤션', link: '/ko/context-layered/usecase-tool-calling-web-studio' },
            { text: '패널 레이아웃 Preference 컨벤션', link: '/ko/context-layered/usecase-panel-layout' },
            { text: '컨벤션 정합성 계획', link: '/ko/context-layered/convention-alignment-plan' },
            { text: '폴더 구조', link: '/ko/context-layered/architecture/folder-structure' },
            { text: '핸들러 레지스트리', link: '/ko/context-layered/architecture/handler-registry' },
            { text: '아키텍처 거버넌스', link: '/ko/context-layered/architecture/architecture-governance' },
            { text: 'sem-doc과 Architecture Governance 경계', link: '/ko/context-layered/architecture/sem-doc-architecture-governance-boundary' },
            { text: 'sem-doc 사용 방법', link: '/ko/context-layered/architecture/sem-doc-usage' },
            { text: '아키텍처 거버넌스 사용 방법', link: '/ko/context-layered/architecture/architecture-governance-usage' },
            { text: 'ContextScope 심볼 그래프', link: '/ko/context-layered/architecture/context-scope-graph' },
            { text: '마이그레이션 가이드', link: '/ko/context-layered/migration-guide' },
            { text: '표준 컨벤션', link: '/ko/context-layered/implementation-convention' },
            { text: '명시적 상태 머신', link: '/ko/context-layered/patterns/explicit-state-machine' },
            { text: '안정성 테스트 사이클', link: '/ko/context-layered/stability-test-cycle' }
          ]
        }
      ]
    }
  }
}

// LLMs 문서 구조
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

const CONTEXT_LAYERED_SIDEBAR = {
  en: {
    text: '🏗️ Context-Layered Architecture',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/context-layered/context-layered-guide' },
      { text: 'Mutative Core History and Upstream References', link: '/en/context-layered/mutative-core-history' },
      { text: 'Specification, Issue, and Documentation Management', link: '/en/context-layered/change-management-convention' },
      { text: 'Panel Layout Preference Convention', link: '/en/context-layered/usecase-panel-layout' },
      { text: 'Folder Structure', link: '/en/context-layered/architecture/folder-structure' },
      { text: 'Handler Registry', link: '/en/context-layered/architecture/handler-registry' },
      { text: 'Architecture Governance', link: '/en/context-layered/architecture/architecture-governance' },
      { text: 'sem-doc and Architecture Governance Boundary', link: '/en/context-layered/architecture/sem-doc-architecture-governance-boundary' },
      { text: 'sem-doc Usage', link: '/en/context-layered/architecture/sem-doc-usage' },
      { text: 'Architecture Governance Usage', link: '/en/context-layered/architecture/architecture-governance-usage' },
      { text: 'ContextScope Symbol Graph', link: '/en/context-layered/architecture/context-scope-graph' },
      { text: 'Migration Guide', link: '/en/context-layered/migration-guide' },
      { text: 'Stability Test Cycle', link: '/en/context-layered/stability-test-cycle' }
    ]
  },
  ko: {
    text: '🏗️ Context-Layered Architecture',
    collapsed: false,
    items: [
      { text: '개요', link: '/ko/context-layered/context-layered-guide' },
      { text: 'Mutative Core 히스토리 및 원본 참조', link: '/ko/context-layered/mutative-core-history' },
      { text: '스펙·이슈·문서 관리', link: '/ko/context-layered/change-management-convention' },
      { text: '패널 레이아웃 Preference 컨벤션', link: '/ko/context-layered/usecase-panel-layout' },
      { text: '폴더 구조', link: '/ko/context-layered/architecture/folder-structure' },
      { text: '핸들러 레지스트리', link: '/ko/context-layered/architecture/handler-registry' },
      { text: '아키텍처 거버넌스', link: '/ko/context-layered/architecture/architecture-governance' },
      { text: 'sem-doc과 Architecture Governance 경계', link: '/ko/context-layered/architecture/sem-doc-architecture-governance-boundary' },
      { text: 'sem-doc 사용 방법', link: '/ko/context-layered/architecture/sem-doc-usage' },
      { text: '아키텍처 거버넌스 사용 방법', link: '/ko/context-layered/architecture/architecture-governance-usage' },
      { text: 'ContextScope 심볼 그래프', link: '/ko/context-layered/architecture/context-scope-graph' },
      { text: '마이그레이션 가이드', link: '/ko/context-layered/migration-guide' },
      { text: '안정성 테스트 사이클', link: '/ko/context-layered/stability-test-cycle' }
    ]
  }
}

export function createSidebars(locale: SidebarLocale): DefaultTheme.Config['sidebar'] {
  const guide = GUIDE_STRUCTURE[locale]
  const concept = CONCEPT_STRUCTURE[locale]
  const examples = EXAMPLES_STRUCTURE[locale]
  const llms = LLMS_STRUCTURE[locale]

  const baseSidebar = {
    [`/${locale}/guide/`]: [
      guide.essentials,
      guide.pipeline,
      guide.patterns
    ],

    [`/${locale}/concept/`]: [
      concept.concepts
    ],

    [`/${locale}/examples/`]: [
      examples.patterns
    ],

    [`/${locale}/llms/`]: [
      llms.resources
    ],

    [`/${locale}/`]: [
      guide.essentials
    ]
  }

  return {
    ...baseSidebar,
    [`/${locale}/context-layered/`]: [CONTEXT_LAYERED_SIDEBAR[locale]]
  }
}

export default createSidebars
