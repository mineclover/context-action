// Guide 사이드바 구조 정의

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

// Guide 구조 - 영어
export const GUIDE_STRUCTURE_EN = {
  introduction: {
    text: 'Introduction',
    items: [
      { text: 'What is Context Action?', path: '/guide/getting-started' },
      { text: 'Action Pipeline', path: '/guide/action-pipeline' }
    ]
  },
  configuration: {
    text: 'Configuration',
    items: [
      { text: 'Handler Configuration', path: '/guide/handler-configuration' },
      { text: 'Advanced Usage', path: '/guide/advanced' }
    ]
  },
  typeSafety: {
    text: 'Type Safety',
    items: [
      { text: 'Type Safety Guide', path: '/guide/type-safety' }
    ]
  },
  apiSpec: {
    text: 'API Specification',
    items: [
      { text: 'Overview', path: '/guide/api-spec/' },
      { text: 'Design Principles', path: '/guide/api-spec/design-principles' },
      { text: 'Architecture', path: '/guide/api-spec/architecture' },
      { text: 'Type System', path: '/guide/api-spec/type-system' },
      { text: 'Generic Constraints', path: '/guide/api-spec/generic-constraints' },
      { text: 'Type Inference', path: '/guide/api-spec/type-inference' },
      { text: 'Utility Types', path: '/guide/api-spec/utility-types' },
      { text: 'Action Interface', path: '/guide/api-spec/core/action-interface' },
      { text: 'Register Interface', path: '/guide/api-spec/core/register-interface' },
      { text: 'Handler Specification', path: '/guide/api-spec/core/handler-specification' },
      { text: 'Lifecycle Hooks', path: '/guide/api-spec/core/lifecycle-hooks' },
      { text: 'React Integration', path: '/guide/api-spec/react/integration-spec' },
      { text: 'Jotai Integration', path: '/guide/api-spec/jotai/integration-spec' },
      { text: 'Plugin System', path: '/guide/api-spec/plugin-system' }
    ]
  }
}

// Guide 구조 - 한국어
export const GUIDE_STRUCTURE_KO = {
  introduction: {
    text: '소개',
    items: [
      { text: 'Context Action이란?', path: '/guide/getting-started' },
      { text: 'Action Pipeline', path: '/guide/action-pipeline' }
    ]
  },
  configuration: {
    text: '설정',
    items: [
      { text: 'Handler 설정', path: '/guide/handler-configuration' },
      { text: '고급 사용법', path: '/guide/advanced' }
    ]
  },
  typeSafety: {
    text: '타입 안전성',
    items: [
      { text: '타입 안전성 가이드', path: '/guide/type-safety' }
    ]
  },
  apiSpec: {
    text: 'API 명세',
    items: [
      { text: '개요', path: '/guide/api-spec/' },
      { text: '설계 원칙', path: '/guide/api-spec/design-principles' },
      { text: '아키텍처', path: '/guide/api-spec/architecture' },
      { text: '타입 시스템', path: '/guide/api-spec/type-system' },
      { text: '제네릭 제약', path: '/guide/api-spec/generic-constraints' },
      { text: '타입 추론', path: '/guide/api-spec/type-inference' },
      { text: '유틸리티 타입', path: '/guide/api-spec/utility-types' },
      { text: 'Action 인터페이스', path: '/guide/api-spec/core/action-interface' },
      { text: 'Register 인터페이스', path: '/guide/api-spec/core/register-interface' },
      { text: 'Handler 명세', path: '/guide/api-spec/core/handler-specification' },
      { text: '라이프사이클 훅', path: '/guide/api-spec/core/lifecycle-hooks' },
      { text: 'React 통합', path: '/guide/api-spec/react/integration-spec' },
      { text: 'Jotai 통합', path: '/guide/api-spec/jotai/integration-spec' },
      { text: '플러그인 시스템', path: '/guide/api-spec/plugin-system' }
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

// 가이드 사이드바 생성
export function sidebarGuideEn() {
  return [
    createSidebarSection('en', GUIDE_STRUCTURE_EN.introduction),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.configuration),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.typeSafety),
    createSidebarSection('en', GUIDE_STRUCTURE_EN.apiSpec)
  ]
}

export function sidebarGuideKo() {
  return [
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.introduction),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.configuration),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.typeSafety),
    createSidebarSection('ko', GUIDE_STRUCTURE_KO.apiSpec)
  ]
}