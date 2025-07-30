// 사이드바 설정 모듈 - 메인 진입점
// 모든 사이드바 함수와 구조를 통합 관리

// 새로운 분리된 구조에서 모든 함수들을 재내보내기
export {
  // 사이드바 생성 함수들
  sidebarGuideEn,
  sidebarGuideKo,
  sidebarApiSpecEn,
  sidebarApiSpecKo,
  sidebarReferenceEn,
  sidebarReferenceKo,
  sidebarPackagesEn,
  sidebarPackagesKo,
  sidebarExamplesEn,
  sidebarExamplesKo,
  sidebarLlmsEn,
  sidebarLlmsKo,
  
  // 구조 객체들
  GUIDE_STRUCTURE,
  API_SPEC_STRUCTURE,
  REFERENCE_STRUCTURE,
  PACKAGES_STRUCTURE,
  EXAMPLES_STRUCTURE,
  LLMS_STRUCTURE,
  SIDEBAR_STRUCTURE
} from './sidebar/index'