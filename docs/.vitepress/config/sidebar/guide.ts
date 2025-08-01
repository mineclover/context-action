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

// Guide 구조
export const GUIDE_STRUCTURE = {
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
  },

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

// 가이드 사이드바 생성
export function sidebarGuideEn() {
  return [
    createSidebarSection('en', GUIDE_STRUCTURE.introduction),
    createSidebarSection('en', GUIDE_STRUCTURE.configuration),
    createSidebarSection('en', GUIDE_STRUCTURE.apiSpec)
  ]
}

export function sidebarGuideKo() {
  return [
    createSidebarSection('ko', GUIDE_STRUCTURE.introduction),
    createSidebarSection('ko', GUIDE_STRUCTURE.configuration),
    createSidebarSection('ko', GUIDE_STRUCTURE.apiSpec)
  ]
}