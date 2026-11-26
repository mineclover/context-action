/**
 * Sidebar Configuration
 * Organized by locale and domain sections for clear navigation
 */

import type { DefaultTheme } from 'vitepress'

export type SidebarLocale = 'en' | 'ko'

const GUIDE_STRUCTURE = {
  en: {
    essentials: {
      text: '🚀 Essential Guides',
      collapsed: false,
      items: [
        { text: 'Getting Started', link: '/en/guide/getting-started' },
        { text: 'Vanilla JavaScript Guide', link: '/en/guide/vanilla-js-guide' },
        { text: 'Type Inference', link: '/en/guide/type-inference' },
        { text: 'Actions-based Dispatching', link: '/en/guide/actions-based-dispatching' },
        { text: 'Code Patterns', link: '/en/guide/code-patterns' },
        { text: 'Best Practices', link: '/en/guide/best-practices' },
        { text: 'Troubleshooting', link: '/en/guide/troubleshooting' },
        { text: 'Production Readiness', link: '/en/guide/production-readiness' },
        { text: 'React 19.2 Activity', link: '/en/guide/react-19-activity' },
        { text: 'React UI Testing with act', link: '/en/guide/react-testing-act' },
        { text: 'Testing by Boundary', link: '/en/guide/testing-boundaries' },
        { text: 'React Context Migration', link: '/en/guide/react-context-migration' },
        { text: 'React Aria Integration', link: '/en/guide/react-aria-integration' },
        { text: 'WebMCP Browser Tools', link: '/en/guide/webmcp' }
      ]
    },
    pipeline: {
      text: '⚡ Pipeline Features',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/guide/pipeline/' },
        { text: 'Priority System', link: '/en/guide/pipeline/priority' },
        { text: 'Dispatch Methods', link: '/en/guide/pipeline/dispatch' },
        { text: 'Advanced Filtering', link: '/en/guide/pipeline/advanced-filtering' }
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
            { text: 'Deferred View Subscription', link: '/en/guide/patterns/store/deferred-view-subscription' },
            { text: 'useStoreManager API', link: '/en/guide/patterns/store/useStoreManager-api' }
          ]
        },
        {
          text: '🔧 Ref Patterns',
          collapsed: true,
          items: [
            { text: 'Basic Usage', link: '/en/guide/patterns/ref/basic-usage' },
            { text: 'Imperative Handle Facade', link: '/en/guide/patterns/ref/imperative-handle-facade' },
            { text: 'Local State Imperative Handle', link: '/en/guide/patterns/ref/local-state-imperative-handle' },
            { text: 'External OOP Lifecycle', link: '/en/guide/patterns/ref/external-oop-lifecycle' }
          ]
        },
        {
          text: '⚡ Async Patterns',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/en/guide/patterns/async/' },
            { text: 'Real-time State Access', link: '/en/guide/patterns/async/real-time-state-access' },
            { text: 'Wait-Then-Execute', link: '/en/guide/patterns/async/wait-then-execute' },
            { text: 'Optimistic & Transition UI (React 19)', link: '/en/guide/patterns/async/optimistic-and-transition-ui' }
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
        { text: '바닐라 자바스크립트 가이드', link: '/ko/guide/vanilla-js-guide' },
        { text: '타입 추론', link: '/ko/guide/type-inference' },
        { text: 'Actions 기반 디스패칭', link: '/ko/guide/actions-based-dispatching' },
        { text: '코드 패턴', link: '/ko/guide/code-patterns' },
        { text: '모범 사례', link: '/ko/guide/best-practices' },
        { text: '문제 해결', link: '/ko/guide/troubleshooting' },
        { text: '프로덕션 준비도', link: '/ko/guide/production-readiness' },
        { text: 'React 19.2 Activity', link: '/ko/guide/react-19-activity' },
        { text: 'act를 활용한 React UI 테스트', link: '/ko/guide/react-testing-act' },
        { text: '경계별 테스트', link: '/ko/guide/testing-boundaries' },
        { text: 'React Context 마이그레이션', link: '/ko/guide/react-context-migration' },
        { text: 'React Aria 통합', link: '/ko/guide/react-aria-integration' },
        { text: 'WebMCP 브라우저 도구', link: '/ko/guide/webmcp' }
      ]
    },
    pipeline: {
      text: '⚡ 파이프라인 기능',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/guide/pipeline/' },
        { text: '우선순위 시스템', link: '/ko/guide/pipeline/priority' },
        { text: '디스패치 메서드', link: '/ko/guide/pipeline/dispatch' },
        { text: '고급 필터링', link: '/ko/guide/pipeline/advanced-filtering' }
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
            { text: '지연 뷰 구독 (useDeferredValue)', link: '/ko/guide/patterns/store/deferred-view-subscription' },
            { text: 'useStoreManager API', link: '/ko/guide/patterns/store/useStoreManager-api' }
          ]
        },
        {
          text: '🔧 Ref 패턴',
          collapsed: true,
          items: [
            { text: '기본 사용법', link: '/ko/guide/patterns/ref/basic-usage' },
            { text: 'Imperative Handle Facade', link: '/ko/guide/patterns/ref/imperative-handle-facade' },
            { text: '로컬 상태 캡슐화 핸들', link: '/ko/guide/patterns/ref/local-state-imperative-handle' },
            { text: '외부 OOP 라이프사이클 브릿지', link: '/ko/guide/patterns/ref/external-oop-lifecycle' }
          ]
        },
        {
          text: '⚡ 비동기 패턴',
          collapsed: true,
          items: [
            { text: '개요', link: '/ko/guide/patterns/async/' },
            { text: '실시간 상태 접근', link: '/ko/guide/patterns/async/real-time-state-access' },
            { text: '대기 후 실행', link: '/ko/guide/patterns/async/wait-then-execute' },
            { text: '낙관적 UI & 전환 (React 19)', link: '/ko/guide/patterns/async/optimistic-and-transition-ui' }
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

const CONTEXT_LAYERED_GROUPS = {
  en: [
    {
      text: '📐 Standards & Starting Points',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/en/context-layered/context-layered-guide' },
        { text: 'Convention Index', link: '/en/context-layered/convention-index' },
        { text: 'Implementation Convention', link: '/en/context-layered/implementation-convention' },
        { text: 'Spec-to-Code Authoring Guide', link: '/en/context-layered/spec-to-code-authoring-guide' },
        { text: 'Repository Surface Catalog', link: '/en/context-layered/repository-surface-catalog' },
        { text: 'Store Selection and Usage Guide', link: '/en/context-layered/store-selection-and-usage-guide' }
      ]
    },
    {
      text: '🏗️ Architecture & Contracts',
      collapsed: false,
      items: [
        { text: 'Folder Structure', link: '/en/context-layered/architecture/folder-structure' },
        { text: 'Handler Registry', link: '/en/context-layered/architecture/handler-registry' },
        { text: 'Explicit State Machine', link: '/en/context-layered/patterns/explicit-state-machine' },
        { text: 'Interaction Intent Contract (IIC)', link: '/en/context-layered/interaction-intent-contract' },
        { text: 'Interaction Intent to Implementation Flow', link: '/en/context-layered/interaction-intent-implementation-flow' },
        { text: 'Unified Triad Self-Serve Sync Guide', link: '/en/context-layered/triad-evidence-sync-guide' },
        { text: 'Architecture Decision Records', link: '/en/context-layered/decisions/' }
      ]
    },
    {
      text: '🧪 Testing & Operations',
      collapsed: false,
      items: [
        { text: 'Testing Convention & Scenarios', link: '/en/context-layered/testing-convention' },
        { text: 'Stability Test Cycle', link: '/en/context-layered/stability-test-cycle' },
        { text: 'Durable Operation Operations Runbook', link: '/en/context-layered/architecture/durable-operation-operations' },
        { text: 'PostgreSQL Durable Operation Adapter', link: '/en/context-layered/architecture/postgres-durable-operation-adapter' }
      ]
    },
    {
      text: '📦 Governance & Boundaries',
      collapsed: true,
      items: [
        { text: 'Package Boundary and Codebase Management', link: '/en/context-layered/package-boundary-convention' },
        { text: 'Specification, Issue, and Documentation Management', link: '/en/context-layered/change-management-convention' },
        { text: 'Mutative Core History and Upstream References', link: '/en/context-layered/mutative-core-history' },
        { text: 'Convention Alignment Plan', link: '/en/context-layered/convention-alignment-plan' },
        { text: 'Next Work and Documentation Ownership', link: '/en/context-layered/next-work' }
      ]
    },
    {
      text: '🧭 Profiles, Usecases & Migration',
      collapsed: true,
      items: [
        { text: 'Usecase and Recipe Profile', link: '/en/context-layered/usecase-recipe-profile' },
        { text: 'Integration Profiles', link: '/en/context-layered/integration-profiles' },
        { text: 'Tool-Calling Web Studio Convention', link: '/en/context-layered/usecase-tool-calling-web-studio' },
        { text: 'Panel Layout Preference Convention', link: '/en/context-layered/usecase-panel-layout' },
        { text: 'Migration Guide', link: '/en/context-layered/migration-guide' },
        { text: 'v5 Migration & Readiness Guide', link: '/en/context-layered/v5-migration-readiness' },
        { text: 'vNext Architecture & Handoff Guide', link: '/en/context-layered/vnext-architecture-handoff' },
        { text: 'v1.0 Release Roadmap', link: '/en/context-layered/v1-release-roadmap' },
        { text: 'v1.0 Release Documents', link: '/releases/v1.0.0/' }
      ]
    }
  ],
  ko: [
    {
      text: '📐 표준 및 시작점',
      collapsed: false,
      items: [
        { text: '개요', link: '/ko/context-layered/context-layered-guide' },
        { text: '개발 컨벤션 인덱스', link: '/ko/context-layered/convention-index' },
        { text: '표준 컨벤션', link: '/ko/context-layered/implementation-convention' },
        { text: '스펙 기반 코드 작성 가이드', link: '/ko/context-layered/spec-to-code-authoring-guide' },
        { text: '저장소 표면 카탈로그', link: '/ko/context-layered/repository-surface-catalog' },
        { text: 'Store별 선택 및 사용법 가이드', link: '/ko/context-layered/store-selection-and-usage-guide' }
      ]
    },
    {
      text: '🏗️ 아키텍처 및 계약',
      collapsed: false,
      items: [
        { text: '폴더 구조', link: '/ko/context-layered/architecture/folder-structure' },
        { text: '핸들러 레지스트리', link: '/ko/context-layered/architecture/handler-registry' },
        { text: '명시적 상태 머신', link: '/ko/context-layered/patterns/explicit-state-machine' },
        { text: '상호작용 의도 계약(IIC)', link: '/ko/context-layered/interaction-intent-contract' },
        { text: '상호작용 의도 계약에서 구현까지의 흐름', link: '/ko/context-layered/interaction-intent-implementation-flow' },
        { text: '통합 트라이어드 자율 동기화 가이드', link: '/ko/context-layered/triad-evidence-sync-guide' },
        { text: '아키텍처 결정 기록', link: '/ko/context-layered/decisions/' }
      ]
    },
    {
      text: '🧪 테스트 및 운영',
      collapsed: false,
      items: [
        { text: '테스트 컨벤션 및 시나리오 표준', link: '/ko/context-layered/testing-convention' },
        { text: '안정성 테스트 사이클', link: '/ko/context-layered/stability-test-cycle' },
        { text: 'Durable Operation 운영 Runbook', link: '/ko/context-layered/architecture/durable-operation-operations' },
        { text: 'PostgreSQL Durable Operation Adapter 결정', link: '/ko/context-layered/architecture/postgres-durable-operation-adapter' }
      ]
    },
    {
      text: '📦 거버넌스 및 패키지 경계',
      collapsed: true,
      items: [
        { text: '패키지 경계 및 코드베이스 관리', link: '/ko/context-layered/package-boundary-convention' },
        { text: '스펙·이슈·문서 관리', link: '/ko/context-layered/change-management-convention' },
        { text: 'Mutative Core 히스토리 및 원본 참조', link: '/ko/context-layered/mutative-core-history' },
        { text: '컨벤션 정합성 계획', link: '/ko/context-layered/convention-alignment-plan' },
        { text: '다음 작업과 문서 소유권', link: '/ko/context-layered/next-work' }
      ]
    },
    {
      text: '🧭 프로파일·유스케이스 및 마이그레이션',
      collapsed: true,
      items: [
        { text: 'Usecase 및 Recipe Profile', link: '/ko/context-layered/usecase-recipe-profile' },
        { text: 'Integration Profile', link: '/ko/context-layered/integration-profiles' },
        { text: 'Tool Calling Web Studio 컨벤션', link: '/ko/context-layered/usecase-tool-calling-web-studio' },
        { text: '패널 레이아웃 Preference 컨벤션', link: '/ko/context-layered/usecase-panel-layout' },
        { text: '마이그레이션 가이드', link: '/ko/context-layered/migration-guide' },
        { text: 'v5 마이그레이션 및 준비 가이드', link: '/ko/context-layered/v5-migration-readiness' },
        { text: 'vNext 아키텍처 및 핸드오프 가이드', link: '/ko/context-layered/vnext-architecture-handoff' },
        { text: 'v1.0 릴리스 로드맵', link: '/ko/context-layered/v1-release-roadmap' },
        { text: 'v1.0 릴리스 문서', link: '/ko/releases/v1.0.0/' }
      ]
    }
  ]
}

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
        { text: 'Documentation Conventions', link: '/en/concept/documentation-development-conventions' }
      ]
    },
    deepDives: {
      text: '🔬 Deep Dives & Specs',
      collapsed: false,
      items: [
        { text: 'Business Logic Separation', link: '/en/concept/business-logic-separation-guide' },
        { text: 'Store Conventions', link: '/en/concept/store-conventions' },
        { text: 'React Refs Guide', link: '/en/concept/react-refs-guide' },
        { text: 'notifyPath Performance Proof', link: '/en/concept/notifyPath-performance-proof' },
        { text: 'Tool Calling Editor Architecture', link: '/en/concept/tool-calling-editor-architecture' }
      ]
    },
    contextLayeredLinks: {
      text: '🏗️ Context-Layered',
      collapsed: true,
      items: CONTEXT_LAYERED_GROUPS.en
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
        { text: '문서 및 개발 관리 컨벤션', link: '/ko/concept/documentation-development-conventions' }
      ]
    },
    deepDives: {
      text: '🔬 심화 가이드 및 스펙',
      collapsed: false,
      items: [
        { text: '비즈니스 로직 분리 가이드', link: '/ko/concept/business-logic-separation-guide' },
        { text: 'Store 컨벤션', link: '/ko/concept/store-conventions' },
        { text: 'React Refs 가이드', link: '/ko/concept/react-refs-guide' },
        { text: 'notifyPath 성능 증명', link: '/ko/concept/notifyPath-performance-proof' },
        { text: 'Tool Calling Editor 아키텍처', link: '/ko/concept/tool-calling-editor-architecture' }
      ]
    },
    contextLayeredLinks: {
      text: '🏗️ Context-Layered',
      collapsed: true,
      items: CONTEXT_LAYERED_GROUPS.ko
    }
  }
}

const TROUBLESHOOTING_STRUCTURE = {
  en: {
    text: '🛠️ Troubleshooting',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/en/troubleshooting/' },
      { text: 'Action System Issues', link: '/en/troubleshooting/action-issues' },
      { text: 'Store & State Issues', link: '/en/troubleshooting/store-issues' },
      { text: 'Ref System Issues', link: '/en/troubleshooting/ref-issues' },
      { text: 'Infinite Loop Issues', link: '/en/troubleshooting/infinite-loop-issues' },
      { text: 'Performance Issues', link: '/en/troubleshooting/performance-issues' }
    ]
  },
  ko: {
    text: '🛠️ 문제 해결',
    collapsed: false,
    items: [
      { text: '문제 해결 개요', link: '/ko/troubleshooting/' },
      { text: '액션 시스템 문제', link: '/ko/troubleshooting/action-issues' },
      { text: '스토어 및 상태 문제', link: '/ko/troubleshooting/store-issues' },
      { text: 'Ref 시스템 문제', link: '/ko/troubleshooting/ref-issues' },
      { text: '무한 루프 문제 해결', link: '/ko/troubleshooting/infinite-loop-issues' },
      { text: '성능 및 무한 루프 문제', link: '/ko/troubleshooting/performance-issues' }
    ]
  }
}

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

export function createSidebars(locale: SidebarLocale): DefaultTheme.Config['sidebar'] {
  const guide = GUIDE_STRUCTURE[locale]
  const concept = CONCEPT_STRUCTURE[locale]
  const examples = EXAMPLES_STRUCTURE[locale]
  const llms = LLMS_STRUCTURE[locale]

  return {
    [`/${locale}/guide/`]: [
      guide.essentials,
      guide.pipeline,
      guide.patterns
    ],

    [`/${locale}/concept/`]: [
      concept.concepts,
      concept.deepDives,
      concept.contextLayeredLinks
    ],

    [`/${locale}/context-layered/`]: CONTEXT_LAYERED_GROUPS[locale],

    [`/${locale}/examples/`]: [
      examples.patterns
    ],

    [`/${locale}/troubleshooting/`]: [
      TROUBLESHOOTING_STRUCTURE[locale]
    ],

    [`/${locale}/llms/`]: [
      llms.resources
    ],

    [`/${locale}/`]: [
      guide.essentials
    ]
  }
}

export default createSidebars
