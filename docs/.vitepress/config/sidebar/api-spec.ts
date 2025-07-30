// API Specification 사이드바 구조 정의

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

// API Specification 구조
export const API_SPEC_STRUCTURE = {
  overview: {
    text: 'Specification Overview',
    items: [
      { text: 'Introduction', path: '/api-spec/' },
      { text: 'Design Principles', path: '/api-spec/design-principles' },
      { text: 'Architecture', path: '/api-spec/architecture' }
    ]
  },
  typescript: {
    text: 'TypeScript Specification',
    items: [
      { text: 'Type System', path: '/api-spec/type-system' },
      { text: 'Generic Constraints', path: '/api-spec/generic-constraints' },
      { text: 'Type Inference', path: '/api-spec/type-inference' },
      { text: 'Utility Types', path: '/api-spec/utility-types' }
    ]
  },
  core: {
    text: 'Core Specification',
    items: [
      { text: 'Action Interface', path: '/api-spec/core/action-interface' },
      { text: 'Register Interface', path: '/api-spec/core/register-interface' },
      { text: 'Handler Specification', path: '/api-spec/core/handler-specification' },
      { text: 'Lifecycle Hooks', path: '/api-spec/core/lifecycle-hooks' }
    ]
  },
  integration: {
    text: 'Integration Specification',
    items: [
      { text: 'React Integration', path: '/api-spec/react/integration-spec' },
      { text: 'Jotai Integration', path: '/api-spec/jotai/integration-spec' },
      { text: 'Plugin System', path: '/api-spec/plugin-system' }
    ]
  }
}

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

// API Specification 사이드바 생성
export function sidebarApiSpecEn() {
  return [
    createSidebarSection('en', API_SPEC_STRUCTURE.overview),
    createSidebarSection('en', API_SPEC_STRUCTURE.typescript),
    createSidebarSection('en', API_SPEC_STRUCTURE.core),
    createSidebarSection('en', API_SPEC_STRUCTURE.integration)
  ]
}

export function sidebarApiSpecKo() {
  return [
    createSidebarSection('ko', API_SPEC_STRUCTURE.overview),
    createSidebarSection('ko', API_SPEC_STRUCTURE.typescript),
    createSidebarSection('ko', API_SPEC_STRUCTURE.core),
    createSidebarSection('ko', API_SPEC_STRUCTURE.integration)
  ]
}