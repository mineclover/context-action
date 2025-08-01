// 사이드바 통합 인덱스 파일

// 각 루트 폴더별 사이드바 모듈 임포트
export { sidebarGuideEn, sidebarGuideKo } from './guide'
export { sidebarReferenceEn, sidebarReferenceKo } from './reference'
export { sidebarGlossaryEn, sidebarGlossaryKo } from './glossary'
export { sidebarPackagesEn, sidebarPackagesKo } from './packages'
export { sidebarExamplesEn, sidebarExamplesKo } from './examples'
export { sidebarLlmsEn, sidebarLlmsKo } from './llms'

// 자동 생성된 API 사이드바 임포트
export { sidebarApiEn, sidebarApiKo } from '../api-spec'

// 구조 객체들도 재내보내기 (필요한 경우를 위해)
export { GUIDE_STRUCTURE } from './guide'
export { REFERENCE_STRUCTURE } from './reference'
export { GLOSSARY_STRUCTURE } from './glossary'
export { PACKAGES_STRUCTURE } from './packages'
export { EXAMPLES_STRUCTURE } from './examples'
export { LLMS_STRUCTURE } from './llms'

// 레거시 호환성을 위한 통합 구조 (기존 코드가 이를 참조할 수 있음)
import { GUIDE_STRUCTURE } from './guide'
import { REFERENCE_STRUCTURE } from './reference'
import { GLOSSARY_STRUCTURE } from './glossary'
import { PACKAGES_STRUCTURE } from './packages'
import { EXAMPLES_STRUCTURE } from './examples'
import { LLMS_STRUCTURE } from './llms'

export const SIDEBAR_STRUCTURE = {
  guide: GUIDE_STRUCTURE,
  reference: REFERENCE_STRUCTURE,
  glossary: GLOSSARY_STRUCTURE,
  packages: PACKAGES_STRUCTURE,
  examples: EXAMPLES_STRUCTURE,
  llms: LLMS_STRUCTURE
}