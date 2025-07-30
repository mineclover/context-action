// LLMs 사이드바 구조 정의

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

// LLMs 구조
export const LLMS_STRUCTURE = {
  overview: {
    text: 'LLM Integration',
    items: [
      { text: 'Overview', path: '/llms/' }
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

// LLMs 사이드바 생성
export function sidebarLlmsEn() {
  return [
    createSidebarSection('en', LLMS_STRUCTURE.overview)
  ]
}

export function sidebarLlmsKo() {
  return [
    createSidebarSection('ko', LLMS_STRUCTURE.overview)
  ]
}