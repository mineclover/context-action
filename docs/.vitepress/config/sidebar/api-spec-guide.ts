// API Specification 가이드 사이드바 구조 정의
// 이 파일은 API 스펙 가이드를 위한 사이드바 설정입니다.

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

// API Specification 가이드 구조
export const API_SPEC_GUIDE_STRUCTURE = {
  overview: {
    text: 'Specification Overview',
    items: [
      { text: 'Introduction', path: '/guide/api-spec/' },
      { text: 'Design Principles', path: '/guide/api-spec/design-principles' },
      { text: 'Architecture', path: '/guide/api-spec/architecture' }
    ]
  },
  typescript: {
    text: 'TypeScript Specification',
    items: [
      { text: 'Type System', path: '/guide/api-spec/type-system' },
      { text: 'Generic Constraints', path: '/guide/api-spec/generic-constraints' },
      { text: 'Type Inference', path: '/guide/api-spec/type-inference' },
      { text: 'Utility Types', path: '/guide/api-spec/utility-types' }
    ]
  },
  core: {
    text: 'Core Specification',
    items: [
      { text: 'Action Interface', path: '/guide/api-spec/core/action-interface' },
      { text: 'Register Interface', path: '/guide/api-spec/core/register-interface' },
      { text: 'Handler Specification', path: '/guide/api-spec/core/handler-specification' },
      { text: 'Lifecycle Hooks', path: '/guide/api-spec/core/lifecycle-hooks' }
    ]
  },
  integration: {
    text: 'Integration Specification',
    items: [
      { text: 'React Integration', path: '/guide/api-spec/react/integration-spec' },
      { text: 'Jotai Integration', path: '/guide/api-spec/jotai/integration-spec' },
      { text: 'Plugin System', path: '/guide/api-spec/plugin-system' }
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

// API Specification 가이드 사이드바 생성
export function sidebarApiSpecGuideEn() {
  return [
    createSidebarSection('en', API_SPEC_GUIDE_STRUCTURE.overview),
    createSidebarSection('en', API_SPEC_GUIDE_STRUCTURE.typescript),
    createSidebarSection('en', API_SPEC_GUIDE_STRUCTURE.core),
    createSidebarSection('en', API_SPEC_GUIDE_STRUCTURE.integration)
  ]
}

export function sidebarApiSpecGuideKo() {
  return [
    createSidebarSection('ko', API_SPEC_GUIDE_STRUCTURE.overview),
    createSidebarSection('ko', API_SPEC_GUIDE_STRUCTURE.typescript),
    createSidebarSection('ko', API_SPEC_GUIDE_STRUCTURE.core),
    createSidebarSection('ko', API_SPEC_GUIDE_STRUCTURE.integration)
  ]
}