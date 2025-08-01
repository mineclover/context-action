// Glossary 사이드바 구조 정의

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

// Glossary 구조
export const GLOSSARY_STRUCTURE = {
  overview: {
    text: 'Overview',
    textKo: '개요',
    items: [
      { text: 'Glossary Introduction', textKo: '용어집 소개', path: '/glossary/' }
    ]
  },
  categories: {
    text: 'Term Categories',
    textKo: '용어 카테고리',
    items: [
      { text: 'Core Concepts', textKo: '핵심 개념', path: '/glossary/core-concepts' },
      { text: 'Architecture Terms', textKo: '아키텍처 용어', path: '/glossary/architecture-terms' },
      { text: 'API Terms', textKo: 'API 용어', path: '/glossary/api-terms' },
      { text: 'Naming Conventions', textKo: '네이밍 컨벤션', path: '/glossary/naming-conventions' }
    ]
  }
}

// 사이드바 섹션 생성 함수
function createSidebarSection(locale: string, section: any, useKorean: boolean = false): SidebarSection {
  return {
    text: useKorean && section.textKo ? section.textKo : section.text,
    collapsed: false,
    items: section.items.map((item: any) => ({
      text: useKorean && item.textKo ? item.textKo : item.text,
      link: createLocalePath(locale, item.path)
    }))
  }
}

// 용어집 사이드바 생성
export function sidebarGlossaryEn() {
  return [
    createSidebarSection('en', GLOSSARY_STRUCTURE.overview, false),
    createSidebarSection('en', GLOSSARY_STRUCTURE.categories, false)
  ]
}

export function sidebarGlossaryKo() {
  return [
    createSidebarSection('ko', GLOSSARY_STRUCTURE.overview, true),
    createSidebarSection('ko', GLOSSARY_STRUCTURE.categories, true)
  ]
}