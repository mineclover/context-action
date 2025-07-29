import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Context Action',
  description: 'Type-safe action pipeline management with React integration',
  base: '/context-action/',
  
  // 기본 언어 설정
  lang: 'en-US',
  
  // 멀티 언어 지원
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
    },
    ko: {
      label: '한국어',
      lang: 'ko-KR',
      title: 'Context Action',
      description: 'React 통합을 통한 타입 안전 액션 파이프라인 관리',
    }
  },

  // 테마 설정
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/mineclover/context-action/releases' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Action Pipeline', link: '/guide/action-pipeline' },
            { text: 'Handler Configuration', link: '/guide/handler-configuration' },
            { text: 'Priority System', link: '/guide/priority-system' },
          ]
        },
        {
          text: 'React Integration',
          items: [
            { text: 'Action Context', link: '/guide/action-context' },
            { text: 'Hooks', link: '/guide/hooks' },
            { text: 'Best Practices', link: '/guide/best-practices' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'Core API',
          items: [
            { text: 'ActionRegister', link: '/api/core/action-register' },
            { text: 'Types', link: '/api/core/types' },
          ]
        },
        {
          text: 'React API',
          items: [
            { text: 'createActionContext', link: '/api/react/create-action-context' },
            { text: 'Hooks', link: '/api/react/hooks' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Basic Examples',
          items: [
            { text: 'Counter App', link: '/examples/counter' },
            { text: 'Todo List', link: '/examples/todo-list' },
          ]
        },
        {
          text: 'Advanced Examples',
          items: [
            { text: 'State Management', link: '/examples/state-management' },
            { text: 'Async Operations', link: '/examples/async-operations' },
            { text: 'Plugin System', link: '/examples/plugin-system' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mineclover/context-action' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@context-action/core' }
    ],

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2024 mineclover'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/mineclover/context-action/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  // Markdown 설정
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  // 빌드 설정
  outDir: '../dist-docs',
  cacheDir: '.vitepress/cache',
  
  // Dead link 체크 비활성화 (임시로 TypeDoc 통합 완료까지)
  ignoreDeadLinks: true,
  
  // Head 태그 설정
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Context Action | Type-safe action pipeline' }],
    ['meta', { property: 'og:site_name', content: 'Context Action' }],
    ['meta', { property: 'og:url', content: 'https://context-action.dev/' }],
  ]
})