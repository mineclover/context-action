# Glossary Tools Reference

각 도구의 상세 기능과 사용법을 설명하는 참조 문서입니다.

## 🔍 glossary-scanner.js

### 목적
소스 코드에서 JSDoc 태그를 스캔하여 용어집 매핑 정보를 추출합니다.

### 기능
- **JSDoc 태그 파싱**: `@glossary`, `@category`, `@pattern`, `@related` 태그 추출
- **파일 스캔**: TypeScript, JavaScript, JSX, TSX 파일 재귀 스캔
- **매핑 데이터 생성**: 코드-용어집 간 연결 정보 JSON 생성
- **packages/glossary 통합**: 최신 glossary API 사용

### 실행
```bash
pnpm glossary:scan
# 또는
cd glossary/tools && node glossary-scanner.js
```

### 입력
- **스캔 경로**: `example/src/**/*`, `packages/*/src/**/*`
- **파일 형식**: `.ts`, `.tsx`, `.js`, `.jsx`
- **JSDoc 태그**: 코드 내 주석

### 출력
- **파일**: `glossary/implementations/_data/mappings.json`
- **형식**:
```json
{
  "terms": {
    "business-logic": [
      {
        "file": "example/src/hooks/useActionGuard.ts",
        "name": "useActionGuard",
        "type": "function",
        "line": 68,
        "description": "통합 액션 가드 훅",
        "implements": ["business-logic", "type-safety"],
        "memberOf": ["core-concepts", "architecture-terms"],
        "examples": ["코드 예제"],
        "since": "1.0.0",
        "signature": "export function useActionGuard<T extends ActionPayloadMap>(",
        "lastModified": "2025-08-01T20:42:36.286Z"
      }
    ]
  }
}
```

### 설정
```javascript
// config.js에서 커스터마이징 가능
scanPaths: [
  'example/src/**/*.{ts,tsx,js,jsx}',
  'packages/*/src/**/*.{ts,tsx,js,jsx}'
],
tagPatterns: {
  jsdoc: /@glossary\s+([^\n\r*]+)/g,
  category: /@category[:\s]+([^\n\r*]+)/g
}
```

---

## ✅ glossary-validator.js

### 목적
매핑 데이터와 용어집 정의 간의 일관성을 검증합니다.

### 기능
- **용어 검증**: 코드에서 참조하는 용어가 용어집에 존재하는지 확인
- **카테고리 검증**: 카테고리 분류의 정확성 확인
- **오탈자 탐지**: 유사한 용어명으로 오탈자 추정
- **보고서 생성**: 상세한 검증 결과 리포트

### 실행
```bash
pnpm glossary:validate
# 또는
cd glossary/tools && node glossary-validator.js
```

### 입력
- **매핑 데이터**: `glossary/implementations/_data/mappings.json`
- **용어집 파일**: `glossary/core-concepts.md`, `glossary/api-terms.md` 등

### 출력
- **파일**: `glossary/implementations/_data/validation-report.json`
- **형식**:
```json
{
  "success": true,
  "summary": {
    "errors": 0,
    "warnings": 45,
    "totalIssues": 45,
    "glossaryTerms": 68,
    "mappedTerms": 35,
    "implementationRate": 51
  },
  "details": {
    "errors": [],
    "warnings": [
      {
        "type": "DUPLICATE_MAPPING",
        "severity": "warning",
        "file": "example/src/hooks/useActionGuard.ts",
        "method": "useActionGuard",
        "message": "useActionGuard implements multiple terms: business-logic, type-safety"
      }
    ]
  }
}
```

### 검증 규칙
- **필수 용어**: 모든 참조 용어가 용어집에 정의되어야 함
- **카테고리 일치**: 용어의 카테고리가 정의와 일치해야 함
- **중복 검사**: 동일 용어의 중복 정의 탐지
- **관련 용어**: `@related` 태그의 용어들도 검증

---

## 📈 missing-analysis.js

### 목적
용어집과 코드 구현 간의 격차를 양방향으로 분석합니다.

### 기능
- **미구현 탐지**: 용어집에 있지만 코드에 없는 용어
- **미정의 탐지**: 코드에 있지만 용어집에 없는 용어
- **구현 우선순위**: 중요도 기반 구현 순서 제안
- **진행률 계산**: 카테고리별 구현 완성도 측정

### 실행
```bash
pnpm glossary:missing
# 또는
cd glossary/tools && node missing-analysis.js
```

### 입력
- **매핑 데이터**: `glossary/implementations/_data/mappings.json`
- **검증 리포트**: `glossary/implementations/_data/validation-report.json`
- **용어집 파일**: 모든 glossary/*.md 파일

### 출력
- **파일**: `glossary/implementations/_data/missing-analysis-report.json`
- **형식**:
```json
{
  "glossaryToCode": {
    "missing": [
      {
        "term": "simple-event-emitter",
        "name": "Simple Event Emitter",
        "category": "unknown",
        "reason": "no_implementation",
        "suggestions": [
          "simple-event-emitter을 구현하는 함수/클래스/인터페이스에 @implements simple-event-emitter 태그 추가",
          "용어집 정의에 맞는 구체적인 구현 작성"
        ]
      }
    ]
  },
  "codeToGlossary": {
    "missing": []
  },
  "partialImplementations": [
    {
      "term": "action-handler",
      "implementations": 1,
      "totalExpected": 5
    }
  ],
  "statistics": {
    "totalGlossaryTerms": 68,
    "implementedTerms": 35,
    "implementationRate": 51.47,
    "missingFromCode": 33,
    "missingFromGlossary": 0
  }
}
```

### 분석 알고리즘
- **우선순위 계산**: 핵심도 × 사용빈도 × 의존성
- **구현 제안**: 패턴 분석으로 구현 방향 제시
- **영향도 평가**: 용어 구현이 다른 용어에 미치는 영향

---

## 📊 implementation-dashboard.js

### 목적
전체 구현 현황과 진행 상황을 시각적 대시보드로 제공합니다.

### 기능
- **종합 현황**: 전체 구현 진행률 요약
- **카테고리별 분석**: 영역별 상세 진행 현황
- **트렌드 분석**: 시간에 따른 구현 진척도
- **TODO 리스트**: 우선순위 기반 작업 목록

### 실행
```bash
pnpm glossary:dashboard
# 또는
cd glossary/tools && node implementation-dashboard.js
```

### 입력
- **매핑 데이터**: `mappings.json`
- **검증 리포트**: `validation-report.json`
- **분석 결과**: `missing-analysis-report.json`

### 출력
- **마크다운**: `glossary/implementations/dashboard.md`
- **JSON 데이터**: `glossary/implementations/_data/dashboard.json`

### 대시보드 구성
```markdown
# 📊 Glossary Implementation Dashboard

## 🎯 Overall Progress
- **Total Terms**: 67
- **Implemented**: 52 (77.6%)
- **Missing**: 15 (22.4%)
- **With Issues**: 3 (4.5%)

## 📈 Category Progress
| Category | Progress | Status |
|----------|----------|--------|
| Core Concepts | ████████░░ 85% | 🟢 Good |
| API Terms | ██████░░░░ 60% | 🟡 Needs Attention |
| Architecture | ███████░░░ 70% | 🟡 In Progress |

## 🔥 Priority Tasks
1. **High Priority** (5 items)
   - [ ] Implement `event-bus` pattern
   - [ ] Add `middleware-chain` documentation
   
2. **Medium Priority** (8 items)
   - [ ] Define `action-pipeline` terminology
```

### 메트릭스 계산
- **완성도**: (구현된 용어 / 전체 용어) × 100
- **품질 점수**: 검증 통과율 기반
- **트렌드**: 이전 실행 결과와 비교
- **예상 완료일**: 현재 진척률 기반 추정

---

## 🔗 link-validator.js

### 목적
마크다운 파일 내 링크의 유효성을 검증합니다.

### 기능
- **내부 링크 검증**: 상대 경로 링크의 존재 여부 확인
- **외부 링크 검증**: HTTP 링크의 접근 가능성 확인 (선택적)
- **앵커 링크 검증**: 헤더 링크의 정확성 확인
- **깨진 링크 리포트**: 문제가 있는 링크 목록 제공

### 실행
```bash
cd glossary/tools && node link-validator.js
```

### 주요 기능
```javascript
// 내부 링크 검증
validateInternalLinks(markdownContent, filePath)

// 앵커 링크 검증  
validateAnchorLinks(markdownContent, filePath)

// 외부 링크 검증 (옵션)
validateExternalLinks(markdownContent, options)
```

---

## 📝 mapping-generator.js

### 목적
용어집 정의로부터 매핑 템플릿을 자동 생성합니다.

### 기능
- **템플릿 생성**: 용어별 구현 가이드 템플릿
- **Handlebars 템플릿**: 커스터마이징 가능한 템플릿 시스템
- **카테고리별 그룹화**: 체계적인 문서 구조
- **예제 코드 생성**: 용어별 구현 예제 스니펫

### 실행
```bash
cd glossary/tools && node mapping-generator.js
```

### 템플릿 예시
```handlebars
# {{term}}

## 정의
{{definition}}

## 구현 가이드
```typescript
// TODO: {{term}} 구현
{{#if examples}}
{{#each examples}}
{{{this}}}
{{/each}}
{{/if}}
```

## 관련 용어
{{#each relatedTerms}}
- [{{this}}]({{this}}.md)
{{/each}}
```

---

## 🔧 공통 설정 (config.js)

모든 도구가 공유하는 설정 파일입니다.

### 주요 설정 항목

```javascript
export const config = {
  // 스캔 대상 경로
  scanPaths: [
    'example/src/**/*.{ts,tsx,js,jsx}',
    'packages/*/src/**/*.{ts,tsx,js,jsx}'
  ],
  
  // 제외 경로
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.d.ts'
  ],
  
  // 용어집 파일 매핑
  glossaryPaths: {
    'core-concepts': 'glossary/core-concepts.md',
    'architecture-terms': 'glossary/architecture-terms.md',
    'api-terms': 'glossary/api-terms.md',
    'naming-conventions': 'glossary/naming-conventions.md'
  },
  
  // 출력 설정
  output: {
    mappingsFile: 'implementations/_data/mappings.json',
    implementationsDir: 'implementations/',
    templatesDir: 'tools/templates/'
  },
  
  // 검증 규칙
  validation: {
    strictMode: true,
    allowUnknownTerms: false,
    allowMissingCategories: true,
    warnOnDuplicates: true
  },
  
  // JSDoc 태그 패턴
  tagPatterns: {
    jsdoc: /@glossary\s+([^\n\r*]+)/g,
    simple: /@glossary:\s*([^\n\r]+)/g,
    category: /@category[:\s]+([^\n\r*]+)/g,
    pattern: /@pattern[:\s]+([^\n\r*]+)/g,
    related: /@related[:\s]+([^\n\r*]+)/g
  }
};
```

### 경로 설정 커스터마이징

**프로젝트별 조정**:
```javascript
// 다른 프로젝트에서 사용 시
const config = {
  scanPaths: [
    'src/**/*.{ts,js}',      // 단일 패키지
    'lib/**/*.{ts,js}',      // 라이브러리 코드
  ],
  glossaryPaths: {
    'terms': 'docs/glossary.md'  // 단일 용어집 파일
  }
};
```

**태그 패턴 확장**:
```javascript
tagPatterns: {
  // 커스텀 태그 추가
  implements: /@implements[:\s]+([^\n\r*]+)/g,
  version: /@since[:\s]+([^\n\r*]+)/g,
  author: /@author[:\s]+([^\n\r*]+)/g
}
```

---

## 🚀 고급 사용법

### 1. CI/CD 통합

```yaml
# .github/workflows/glossary-check.yml
name: Glossary Consistency Check

on: [push, pull_request]

jobs:
  glossary-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build glossary package
        run: pnpm build:glossary
      
      - name: Run glossary analysis
        run: pnpm glossary:update
      
      - name: Check for validation errors
        run: |
          if grep -q '"errors":\s*\[.\+\]' glossary/implementations/_data/validation-report.json; then
            echo "❌ Glossary validation failed"
            exit 1
          fi
          echo "✅ Glossary validation passed"
```

### 2. 주기적 리포팅

```bash
#!/bin/bash
# scripts/weekly-glossary-report.sh

echo "📊 Weekly Glossary Report - $(date)"
echo "=================================="

# 업데이트 실행
pnpm glossary:update

# 진행률 추출
completion_rate=$(jq -r '.categoryAnalysis."core-concepts".completionRate' glossary/implementations/_data/missing-analysis-report.json)
echo "Core Concepts Completion: ${completion_rate}%"

# 우선순위 작업 추출
high_priority_count=$(jq -r '.recommendations | map(select(.priority == "high")) | length' glossary/implementations/_data/missing-analysis-report.json)
echo "High Priority Tasks: ${high_priority_count}"

# 대시보드 링크
echo "📊 Full Dashboard: glossary/implementations/dashboard.md"
```

### 3. 커스텀 후크

```javascript
// scripts/glossary-hooks.js
import { createGlossaryAPI } from '@context-action/glossary';

// 스캔 후 후크
export async function afterScan(mappings) {
  console.log(`✅ Scanned ${Object.keys(mappings.mappings).length} terms`);
  
  // 슬랙 알림 (예시)
  await sendSlackNotification(`Glossary scan completed: ${Object.keys(mappings.mappings).length} terms mapped`);
}

// 검증 후 후크
export async function afterValidation(validation) {
  if (validation.summary.invalidTerms > 0) {
    console.warn(`⚠️  Found ${validation.summary.invalidTerms} invalid terms`);
    // 이슈 자동 생성 등
  }
}
```

이러한 도구들을 통해 Context-Action 프로젝트의 용어집 시스템이 항상 최신 상태를 유지하고, 코드와 문서 간의 일관성을 보장할 수 있습니다.