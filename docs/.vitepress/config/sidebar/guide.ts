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

// 가이드 사이드바 생성
export function sidebarGuideEn() {
  return [
    createSidebarSection('en', GUIDE_STRUCTURE.introduction),
    createSidebarSection('en', GUIDE_STRUCTURE.configuration)
  ]
}

export function sidebarGuideKo() {
  return [
    createSidebarSection('ko', GUIDE_STRUCTURE.introduction),
    createSidebarSection('ko', GUIDE_STRUCTURE.configuration)
  ]
}