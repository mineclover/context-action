import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// 새로운 구조적 nav와 sidebar 설정
import { createNavigation } from './config/navigation'
import { createSidebars } from './config/sidebars'

// 패키지 정보 로드
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
)

export default defineConfig({
  title: 'Context Action',
  description: 'Type-safe action pipeline management with React integration',
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
    lineNumbers: true,
    container: {
      tipLabel: '💡 Tip',
      warningLabel: '⚠️ Warning',
      dangerLabel: '🚨 Danger',
      infoLabel: 'ℹ️ Info',
      detailsLabel: 'Details'
    }
  },
  
  // 다국어 설정 - 영어 우선, 한국어 보조
  locales: {
    root: {
      label: 'Languages',
      lang: 'en',
      themeConfig: {
        nav: createNavigation('root')
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: createNavigation('en'),
        sidebar: createSidebars('en')
      }
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      themeConfig: {
        nav: createNavigation('ko'),
        sidebar: createSidebars('ko')
      }
    }
  },

  // 전역 테마 설정
  themeConfig: {
    // 사이드바 설정
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mineclover/context-action' }
    ],

    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2024 Context Action Contributors'
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
      provider: 'local',
      options: {
        locales: {
          ko: {
            translations: {
              button: {
                buttonText: '검색',
                buttonAriaLabel: '검색'
              },
              modal: {
                displayDetails: '자세한 목록 표시',
                resetButtonTitle: '검색 초기화',
                backButtonTitle: '검색 닫기',
                noResultsText: '결과를 찾을 수 없습니다',
                footer: {
                  selectText: '선택',
                  navigateText: '탐색',
                  closeText: '닫기'
                }
              }
            }
          }
        }
      }
    }
  },

  // 빌드 최적화
  cleanUrls: true,
  lastUpdated: true,
  metaChunk: true
})