// Examples 사이드바 구조 정의

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

// Examples 구조
export const EXAMPLES_STRUCTURE = {
  gettingStarted: {
    text: 'Getting Started',
    items: [
      { text: 'Overview', path: '/examples/' },
      { text: 'Basic Setup', path: '/examples/basic-setup' },
      { text: 'First Action', path: '/examples/first-action' }
    ]
  },
  core: {
    text: 'Core Examples',
    items: [
      { text: 'Action Registration', path: '/examples/core/action-registration' },
      { text: 'Handler Configuration', path: '/examples/core/handler-configuration' },
      { text: 'Pipeline Usage', path: '/examples/core/pipeline-usage' }
    ]
  },
  react: {
    text: 'React Examples',
    items: [
      { text: 'Context Setup', path: '/examples/react/context-setup' },
      { text: 'Component Integration', path: '/examples/react/component-integration' },
      { text: 'Form Handling', path: '/examples/react/form-handling' },
      { text: 'Async Actions', path: '/examples/react/async-actions' }
    ]
  },
  jotai: {
    text: 'Jotai Examples',
    items: [
      { text: 'Atom Integration', path: '/examples/jotai/atom-integration' },
      { text: 'State Management', path: '/examples/jotai/state-management' },
      { text: 'Complex Workflows', path: '/examples/jotai/complex-workflows' }
    ]
  },
  services: {
    text: 'Complete Services',
    items: [
      { text: 'Todo Application', path: '/examples/services/todo-app' },
      { text: 'E-commerce Cart', path: '/examples/services/ecommerce-cart' },
      { text: 'Real-time Chat', path: '/examples/services/realtime-chat' },
      { text: 'Dashboard Analytics', path: '/examples/services/dashboard-analytics' }
    ]
  },
  advanced: {
    text: 'Advanced Patterns',
    items: [
      { text: 'Custom Handlers', path: '/examples/advanced/custom-handlers' },
      { text: 'Error Handling', path: '/examples/advanced/error-handling' },
      { text: 'Testing Strategies', path: '/examples/advanced/testing-strategies' },
      { text: 'Performance Optimization', path: '/examples/advanced/performance-optimization' }
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

// 예제 사이드바 생성
export function sidebarExamplesEn() {
  return [
    createSidebarSection('en', EXAMPLES_STRUCTURE.gettingStarted),
    createSidebarSection('en', EXAMPLES_STRUCTURE.core),
    createSidebarSection('en', EXAMPLES_STRUCTURE.react),
    createSidebarSection('en', EXAMPLES_STRUCTURE.jotai),
    createSidebarSection('en', EXAMPLES_STRUCTURE.services),
    createSidebarSection('en', EXAMPLES_STRUCTURE.advanced)
  ]
}

export function sidebarExamplesKo() {
  return [
    createSidebarSection('ko', EXAMPLES_STRUCTURE.gettingStarted),
    createSidebarSection('ko', EXAMPLES_STRUCTURE.core),
    createSidebarSection('ko', EXAMPLES_STRUCTURE.react),
    createSidebarSection('ko', EXAMPLES_STRUCTURE.jotai),
    createSidebarSection('ko', EXAMPLES_STRUCTURE.services),
    createSidebarSection('ko', EXAMPLES_STRUCTURE.advanced)
  ]
}