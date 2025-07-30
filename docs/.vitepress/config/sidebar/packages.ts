// Packages 사이드바 구조 정의

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

// Packages 구조
export const PACKAGES_STRUCTURE = {
  overview: {
    text: 'Overview',
    items: [
      { text: 'Package Overview', path: '/packages/' },
      { text: 'Architecture', path: '/packages/architecture' },
      { text: 'Compatibility', path: '/packages/compatibility' }
    ]
  },
  core: {
    text: '@context-action/core',
    items: [
      { text: 'Overview', path: '/packages/core/' },
      { text: 'Installation', path: '/packages/core/installation' },
      { text: 'Configuration', path: '/packages/core/configuration' },
      { text: 'Advanced Usage', path: '/packages/core/advanced' }
    ]
  },
  react: {
    text: '@context-action/react',
    items: [
      { text: 'Overview', path: '/packages/react/' },
      { text: 'Installation', path: '/packages/react/installation' },
      { text: 'Setup', path: '/packages/react/setup' },
      { text: 'Best Practices', path: '/packages/react/best-practices' }
    ]
  },
  jotai: {
    text: '@context-action/jotai',
    items: [
      { text: 'Overview', path: '/packages/jotai/' },
      { text: 'Installation', path: '/packages/jotai/installation' },
      { text: 'Integration', path: '/packages/jotai/integration' },
      { text: 'Patterns', path: '/packages/jotai/patterns' }
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

// 패키지 사이드바 생성
export function sidebarPackagesEn() {
  return [
    createSidebarSection('en', PACKAGES_STRUCTURE.overview),
    createSidebarSection('en', PACKAGES_STRUCTURE.core),
    createSidebarSection('en', PACKAGES_STRUCTURE.react),
    createSidebarSection('en', PACKAGES_STRUCTURE.jotai)
  ]
}

export function sidebarPackagesKo() {
  return [
    createSidebarSection('ko', PACKAGES_STRUCTURE.overview),
    createSidebarSection('ko', PACKAGES_STRUCTURE.core),
    createSidebarSection('ko', PACKAGES_STRUCTURE.react),
    createSidebarSection('ko', PACKAGES_STRUCTURE.jotai)
  ]
}