import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Context Action',
  description: 'Type-safe action pipeline management for React',
  
  // 다국어 설정
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API Reference', link: '/api/' },
          { text: 'Examples', link: '/examples/' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Advanced Usage', link: '/guide/advanced' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/api/' },
                { text: 'Core', link: '/api/core/' },
                { text: 'React', link: '/api/react/' },
                { text: 'Jotai', link: '/api/jotai/' }
              ]
            }
          ]
        }
      }
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/ko/guide/getting-started' },
          { text: 'API 레퍼런스', link: '/ko/api/' },
          { text: '예제', link: '/ko/examples/' }
        ],
        sidebar: {
          '/ko/guide/': [
            {
              text: '가이드',
              items: [
                { text: '시작하기', link: '/ko/guide/getting-started' },
                { text: '고급 사용법', link: '/ko/guide/advanced' }
              ]
            }
          ],
          '/ko/api/': [
            {
              text: 'API 레퍼런스',
              items: [
                { text: '개요', link: '/ko/api/' },
                { text: 'Core', link: '/ko/api/core/' },
                { text: 'React', link: '/ko/api/react/' },
                { text: 'Jotai', link: '/ko/api/jotai/' }
              ]
            }
          ]
        }
      }
    }
  },

  // 전역 테마 설정
  themeConfig: {
    logo: '/logo.svg',
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mineclover/context-action' }
    ],

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2024 mineclover'
    },

    editLink: {
      pattern: 'https://github.com/mineclover/context-action/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
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

  // 죽은 링크 무시 (개발 중에는 일부 링크가 아직 생성되지 않을 수 있음)
  ignoreDeadLinks: [
    // API generated 링크들
    /\/api\/generated\//,
    /\/ko\/guide\/advanced\/index/,
    /\/examples\/index/,
    /\/guide\/action-pipeline/,
    /\/guide\/handler-configuration/,
    // 생성될 예정인 링크들
    /\.\.\//,
  ],

  // Head 설정
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Context Action | Type-safe action pipeline management' }],
    ['meta', { property: 'og:site_name', content: 'Context Action' }],
    ['meta', { property: 'og:image', content: 'https://context-action.dev/og-image.png' }],
    ['meta', { property: 'og:url', content: 'https://context-action.dev/' }]
  ]
})