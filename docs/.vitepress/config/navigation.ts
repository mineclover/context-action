/**
 * Navigation Configuration - Simplified for tab expansion
 * 상단 탭바 확장을 고려한 단순화된 네비게이션 설계
 */

export type NavigationLocale = 'root' | 'en' | 'ko'

/**
 * Create navigation based on locale - 상단 탭바 확장 대비 단순화
 */
export function createNavigation(locale: NavigationLocale) {
  // Root locale shows language selector
  if (locale === 'root') {
    return [
      {
        text: 'English',
        link: '/en/guide/overview'
      },
      {
        text: '한국어',
        link: '/ko/guide/overview'
      }
    ]
  }
  
  // 단일 가이드 링크만 제공 (사이드바에서 세부 네비게이션 처리)
  if (locale === 'en') {
    return [
      {
        text: 'Guide',
        link: '/en/guide/overview'
      }
    ]
  }
  
  if (locale === 'ko') {
    return [
      {
        text: '가이드',
        link: '/ko/guide/overview'
      }
    ]
  }
  
  return []
}

export default createNavigation