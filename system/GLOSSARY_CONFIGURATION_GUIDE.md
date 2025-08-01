# 용어집 시스템 설정 가이드

## 🔧 기본 설정

### 설정 파일
```javascript
// glossary.config.js
export default {
  scanPaths: [
    'example/src/**/*.{ts,tsx,js,jsx}',
    'packages/*/src/**/*.{ts,tsx,js,jsx}'
  ],
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.test.{ts,tsx,js,jsx}'
  ],
  glossaryPaths: {
    'core-concepts': 'docs/glossary/core-concepts.md',
    'architecture-terms': 'docs/glossary/architecture-terms.md',
    'api-terms': 'docs/glossary/api-terms.md',
    'naming-conventions': 'docs/glossary/naming-conventions.md'
  },
  output: {
    mappingsFile: 'docs/implementations/_data/mappings.json',
    validationFile: 'docs/implementations/_data/validation-report.json'
  }
};
```

## 🚀 기본 명령어

```bash
# 패키지 빌드
pnpm --filter @context-action/glossary build

# 코드 스캔
pnpm glossary:scan

# 매핑 검증
pnpm glossary:validate

# 전체 업데이트
pnpm glossary:update
```