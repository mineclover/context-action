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
        { text: 'Best Practices', link: '/en/guide/best-practices' },
        { text: 'Action Handlers', link: '/en/guide/action-handlers' }
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
        { text: '모범 사례', link: '/ko/guide/best-practices' },
        { text: '액션 핸들러', link: '/ko/guide/action-handlers' }
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
      guide.essentials
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
      examples.patterns
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