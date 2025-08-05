import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// 모듈 imports
import { navRoot, navKo, navEn } from './config/nav'
import { 
  sidebarGuideKo, 
  sidebarGuideEn,
  sidebarApiKo,
  sidebarApiEn,
  sidebarReferenceKo,
  sidebarReferenceEn,
  sidebarGlossaryKo,
  sidebarGlossaryEn,
  sidebarPackagesKo,
  sidebarPackagesEn,
  sidebarExamplesKo,
  sidebarExamplesEn,
  sidebarLlmsKo,
  sidebarLlmsEn
} from './config/sidebar'

// 패키지 정보 로드
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
)

export default defineConfig({
  title: 'Context Action',
  description: 'Type-safe action pipeline management for React',
  base: '/context-action/',
  
  // Source Directory
  srcDir: '.',
  
  // 죽은 링크 무시
  ignoreDeadLinks: true,
  
  // TypeDoc 생성 디렉토리 제외
  srcExclude: ['**/api/generated/**'],
  
  // Markdown 설정
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },
  
  // 다국어 설정 - 한국어, 영어 독립 경로
  locales: {
    root: {
      label: 'Languages',
      lang: 'en', // 기본 fallback
      themeConfig: {
        nav: navRoot()
      }
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      themeConfig: {
        nav: navKo(),
        sidebar: {
          '/ko/guide/': sidebarGuideKo(),
          '/ko/api/': sidebarApiKo(),
          '/ko/glossary/': sidebarGlossaryKo(),
          '/ko/packages/': sidebarPackagesKo(),
          '/ko/examples/': sidebarExamplesKo(),
          '/ko/llms/': sidebarLlmsKo()
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: navEn(),
        sidebar: {
          '/en/guide/': sidebarGuideEn(),
          '/en/api/': sidebarApiEn(),
          '/en/glossary/': sidebarGlossaryEn(),
          '/en/packages/': sidebarPackagesEn(),
          '/en/examples/': sidebarExamplesEn(),
          '/en/llms/': sidebarLlmsEn()
        }
      }
    }
  },

  // 전역 테마 설정
  themeConfig: {
    // logo: '/logo.svg', // 로고 비활성화
    
    // 사이드바 설정
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    outline: {
      label: 'On this page'
    },
    
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

    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    search: {
      provider: 'local'
    }
  }
})