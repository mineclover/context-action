// API Reference 사이드바 구조 정의

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

// API Reference 구조
export const REFERENCE_STRUCTURE = {
  gettingStarted: {
    text: 'Getting Started',
    items: [
      { text: 'Overview', path: '/api/' },
      { text: 'Installation', path: '/api/installation' },
      { text: 'Quick Start', path: '/api/quick-start' }
    ]
  },
  core: {
    text: 'Core Package',
    items: [
      { text: 'Overview', path: '/api/core/' },
      { text: 'ActionRegister', path: '/api/core/action-register' },
      { text: 'Types', path: '/api/core/types' },
      { text: 'Utilities', path: '/api/core/utilities' }
    ]
  },
  react: {
    text: 'React Integration',
    items: [
      { text: 'Overview', path: '/api/react/' },
      { text: 'ActionContext', path: '/api/react/action-context' },
      { text: 'useAction', path: '/api/react/use-action' },
      { text: 'Hooks', path: '/api/react/hooks' }
    ]
  },
  jotai: {
    text: 'Jotai Integration',
    items: [
      { text: 'Overview', path: '/api/jotai/' },
      { text: 'actionAtom', path: '/api/jotai/action-atom' },
      { text: 'Atoms', path: '/api/jotai/atoms' },
      { text: 'Utilities', path: '/api/jotai/utilities' }
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

// API 레퍼런스 사이드바 생성
export function sidebarReferenceEn() {
  return [
    createSidebarSection('en', REFERENCE_STRUCTURE.gettingStarted),
    createSidebarSection('en', REFERENCE_STRUCTURE.core),
    createSidebarSection('en', REFERENCE_STRUCTURE.react),
    createSidebarSection('en', REFERENCE_STRUCTURE.jotai)
  ]
}

export function sidebarReferenceKo() {
  return [
    createSidebarSection('ko', REFERENCE_STRUCTURE.gettingStarted),
    createSidebarSection('ko', REFERENCE_STRUCTURE.core),
    createSidebarSection('ko', REFERENCE_STRUCTURE.react),
    createSidebarSection('ko', REFERENCE_STRUCTURE.jotai)
  ]
}