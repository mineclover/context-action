/**
 * Glossary System Configuration
 * 용어집-코드 매핑 시스템 설정 파일
 */

export default {
  // 기본 설정
  rootDir: '.',
  debug: false,
  parseSignatures: true,

  // 📂 코드 스캔 영역 설정
  scanPaths: [
    // Example 전체 영역
    'example/src/**/*.{ts,tsx,js,jsx}',
    
    // 핵심 패키지들만: core, react
    'packages/core/src/**/*.{ts,tsx,js,jsx}',
    'packages/react/src/**/*.{ts,tsx,js,jsx}',
    
    // 제외된 패키지들 (참고용 주석)
    // 'packages/logger/src/**/*.{ts,tsx,js,jsx}',
    // 'packages/jotai/src/**/*.{ts,tsx,js,jsx}',
    // 'packages/glossary/src/**/*.{ts,tsx,js,jsx}',
    // 'packages/core-dev/src/**/*.{ts,tsx,js,jsx}',
    // 'packages/react-dev/src/**/*.{ts,tsx,js,jsx}',
  ],

  // ❌ 제외할 영역 설정
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/*.d.ts',
    
    // 예시: 특정 폴더 제외
    // '**/deprecated/**',
    // '**/legacy/**',
  ],

  // 📚 용어집 문서 영역 설정
  glossaryPaths: {
    // 핵심 개념들
    'core-concepts': 'glossary/terms/core-concepts.md',
    
    // 아키텍처 용어들
    'architecture-terms': 'glossary/terms/architecture-terms.md',
    
    // API 관련 용어들
    'api-terms': 'glossary/terms/api-terms.md',
    
    // 네이밍 컨벤션
    'naming-conventions': 'glossary/terms/naming-conventions.md',
  },

  // 🎯 출력 설정
  output: {
    // 매핑 데이터 저장 경로
    mappingsFile: 'glossary/implementations/_data/mappings.json',
    
    // 검증 리포트 저장 경로
    validationFile: 'glossary/implementations/_data/validation-report.json',
    
    // 구현 문서 생성 경로
    implementationDocsDir: 'glossary/implementations/',
  },

  // 🔍 파싱 규칙 설정
  parsing: {
    // JSDoc 태그 매핑
    tags: {
      implements: ['implements', 'glossary'],  // @implements 또는 @glossary 태그
      memberOf: ['memberof', 'memberOf', 'category'],  // 카테고리 태그들
      examples: ['example', 'examples'],  // 예시 태그들
      since: ['since', 'version'],  // 버전 태그들
    },

    // 용어 정규화 규칙
    termNormalization: {
      // PascalCase를 kebab-case로 변환
      convertCase: true,
      // 특수문자 제거
      removeSpecialChars: true,
      // 공백을 하이픈으로 변환
      spacesToHyphens: true,
    },

    // 선언 감지 패턴
    declarationPatterns: [
      { regex: /export\s+function\s+(\w+)/, type: 'function' },
      { regex: /export\s+const\s+(\w+)/, type: 'const' },
      { regex: /export\s+class\s+(\w+)/, type: 'class' },
      { regex: /export\s+interface\s+(\w+)/, type: 'interface' },
      { regex: /export\s+type\s+(\w+)/, type: 'type' },
      { regex: /export\s+enum\s+(\w+)/, type: 'enum' },
      // 내부 선언들
      { regex: /function\s+(\w+)/, type: 'function' },
      { regex: /const\s+(\w+)/, type: 'const' },
      { regex: /class\s+(\w+)/, type: 'class' },
      { regex: /interface\s+(\w+)/, type: 'interface' },
      { regex: /type\s+(\w+)/, type: 'type' },
      { regex: /enum\s+(\w+)/, type: 'enum' },
    ],
  },

  // ✅ 검증 규칙 설정
  validation: {
    // 엄격한 검증 모드
    strict: false,
    
    // 오류 레벨 설정
    errorLevels: {
      termNotFound: 'error',      // 용어를 찾을 수 없음
      invalidCategory: 'error',   // 잘못된 카테고리
      duplicateMapping: 'warning', // 중복 매핑
      orphanedTerm: 'info',       // 고아 용어
    },

    // 허용되는 중복 매핑 패턴
    allowedDuplicates: [
      // 같은 파일에서 여러 용어 구현 허용
      'same-file-multiple-terms',
    ],

    // 무시할 용어들 (정규표현식 지원)
    ignoredTerms: [
      // 예시: 임시 용어들 무시
      // /^temp-/,
      // /^draft-/,
    ],
  },

  // 🚀 성능 최적화 설정
  performance: {
    // 병렬 처리할 최대 파일 수
    maxConcurrentFiles: 10,
    
    // 캐시 사용 여부
    enableCache: true,
    
    // 캐시 만료 시간 (분)
    cacheExpiry: 60,
  },

  // 📊 리포팅 설정
  reporting: {
    // 상세 로그 출력
    verbose: false,
    
    // 진행상황 표시
    showProgress: true,
    
    // 통계 정보 출력
    showStatistics: true,
    
    // JSON 리포트 생성
    generateJsonReport: true,
    
    // HTML 리포트 생성 (향후 기능)
    generateHtmlReport: false,
  },

  // 🔌 확장 설정
  extensions: {
    // 커스텀 파서 플러그인
    customParsers: [],
    
    // 커스텀 검증 규칙
    customValidators: [],
    
    // 후처리 훅
    postProcessHooks: [],
  },

  // 🌍 다국어 지원 설정
  i18n: {
    // 기본 언어
    defaultLanguage: 'ko',
    
    // 지원 언어들
    supportedLanguages: ['ko', 'en'],
    
    // 언어별 용어집 경로
    languagePaths: {
      ko: 'docs/ko/glossary/',
      en: 'docs/en/glossary/',
    },
  },

  // 🎨 템플릿 설정
  templates: {
    // 구현 문서 템플릿
    implementationTemplate: 'docs/tools/templates/implementation.md',
    
    // 대시보드 템플릿
    dashboardTemplate: 'docs/tools/templates/dashboard.md',
  },
};