# Glossary Tools Usage Examples

실제 개발 시나리오에서 glossary tools를 활용하는 방법을 단계별로 설명합니다.

## 🎯 시나리오별 사용법

### 시나리오 1: 새로운 기능 구현 시

**상황**: Action pipeline에 새로운 middleware 기능을 추가

#### 1단계: 용어집 정의 추가
```markdown
<!-- glossary/architecture-terms.md -->
## middleware-chain

액션 파이프라인에서 순차적으로 실행되는 중간 처리 단계들의 연결 구조입니다.

### 특징
- 체인 패턴으로 구현
- 각 미들웨어는 다음 단계 호출 제어
- 에러 처리 및 로깅 지원

### 관련 용어
- [action-pipeline](core-concepts.md#action-pipeline)
- [interceptor](architecture-terms.md#interceptor)
```

#### 2단계: 코드 구현과 태그 추가
```typescript
/**
 * Middleware chain implementation for action pipeline
 * @glossary middleware-chain, interceptor
 * @category architecture-terms
 * @pattern chain-of-responsibility
 * @related action-pipeline, action-handler
 */
export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  /**
   * Add middleware to the chain
   * @glossary middleware-registration
   */
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Execute middleware chain
   * @glossary middleware-execution
   */
  async execute(context: ActionContext): Promise<void> {
    // implementation
  }
}
```

#### 3단계: 일관성 검증
```bash
# 1. 스캔하여 새 매핑 추출
pnpm glossary:scan

# 2. 검증하여 일관성 확인
pnpm glossary:validate

# 3. 구현 현황 업데이트
pnpm glossary:update
```

#### 4단계: 결과 확인
```bash
# 대시보드에서 진행률 확인
cat glossary/implementations/dashboard.md

# 구체적인 매핑 확인 (terms 객체 내에서 검색)
jq '.terms."middleware-chain"' glossary/implementations/_data/mappings.json
```

---

### 시나리오 2: 코드 리팩토링 시

**상황**: ActionRegister 클래스 리팩토링으로 구조 변경

#### 1단계: 리팩토링 전 현황 백업
```bash
# 현재 상태 스냅샷
pnpm glossary:update
cp glossary/implementations/_data/mappings.json mappings-backup.json
```

#### 2단계: 리팩토링 수행
```typescript
// 기존 코드 수정
/**
 * Enhanced action register with plugin support
 * @glossary action-register, plugin-system
 * @category core-concepts  
 * @pattern registry-pattern, plugin-architecture
 * @related action-handler, middleware-chain
 */
export class EnhancedActionRegister extends ActionRegister {
  // 새로운 구현
}
```

#### 3단계: 변경사항 추적
```bash
# 새로운 매핑 생성
pnpm glossary:scan

# 변경사항 비교
diff mappings-backup.json glossary/implementations/_data/mappings.json
```

#### 4단계: 누락된 용어 해결
```bash
# 미구현 분석으로 누락 확인
pnpm glossary:missing

# 결과에서 새로 추가된 용어 확인
jq '.codeToGlossary.missing' glossary/implementations/_data/missing-analysis-report.json
```

---

### 시나리오 3: 릴리스 전 품질 검증

**상황**: v1.0 릴리스 전 용어집 일관성 최종 점검

#### 1단계: 전체 시스템 검증
```bash
# 전체 업데이트 실행
pnpm glossary:update

# 번역 상태도 함께 확인
pnpm docs:translation
```

#### 2단계: 품질 지표 확인
```bash
# 검증 오류 확인
validation_report="glossary/implementations/_data/validation-report.json"
error_count=$(jq '.summary.errors' $validation_report)

if [ "$error_count" -gt 0 ]; then
  echo "❌ $error_count validation errors found"
  jq '.details.errors' $validation_report
  exit 1
fi
```

#### 3단계: 완성도 측정
```bash
# 카테고리별 완성도 확인
missing_report="glossary/implementations/_data/missing-analysis-report.json"

echo "📊 Implementation Completion Rates:"
jq -r '.categoryAnalysis | to_entries[] | "\(.key): \(.value.implementation_rate)%"' $missing_report

# 핵심 용어 구현 여부 확인
core_completion=$(jq -r '.categoryAnalysis."core-concepts".implementation_rate // 0' $missing_report)
if (( $(echo "$core_completion < 90" | bc -l) )); then
  echo "⚠️  Core concepts completion below 90%: $core_completion%"
fi
```

#### 4단계: 릴리스 노트 생성
```bash
# 새로 구현된 용어 목록 추출 (실제 구조에 맞게 수정)
jq -r '.glossaryToCode.missing[] | .term' $missing_report > new-terms.txt

echo "## 🆕 New Terms Implemented" >> RELEASE_NOTES.md
while read term; do
  echo "- $term" >> RELEASE_NOTES.md
done < new-terms.txt
```

---

### 시나리오 4: 팀 협업 워크플로우

**상황**: 여러 개발자가 동시에 다른 기능 개발

#### PR 체크리스트 템플릿
```markdown
## Glossary Checklist

- [ ] 새로운 개념에 대해 용어집 정의 추가
- [ ] 코드에 적절한 `@glossary` 태그 추가
- [ ] `pnpm glossary:update` 실행하여 일관성 확인
- [ ] 검증 오류 0개 달성
- [ ] 대시보드에서 진행률 확인

### Glossary Changes
```bash
# 이 PR의 용어집 변경사항
pnpm glossary:scan
# 새로 추가된 매핑: [목록]
# 수정된 매핑: [목록]
```
```

#### 자동화된 PR 검증
```yaml
# .github/workflows/pr-glossary-check.yml
name: PR Glossary Check

on:
  pull_request:
    paths:
      - 'packages/**/*.ts'
      - 'packages/**/*.tsx' 
      - 'example/src/**/*.ts'
      - 'example/src/**/*.tsx'
      - 'glossary/**/*.md'

jobs:
  glossary-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build glossary package
        run: pnpm build:glossary
        
      - name: Run glossary validation
        run: |
          pnpm glossary:update
          
          # 검증 결과 확인
          validation_file="glossary/implementations/_data/validation-report.json"
          error_count=$(jq '.summary.errors' $validation_file)
          
          if [ "$error_count" -gt 0 ]; then
            echo "::error::Found $error_count glossary validation errors"
            jq '.details.errors[]' $validation_file
            exit 1
          fi
          
          echo "::notice::Glossary validation passed ✅"
          
      - name: Comment PR with results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const dashboard = fs.readFileSync('glossary/implementations/dashboard.md', 'utf8');
            const summary = dashboard.split('\n').slice(0, 20).join('\n');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📊 Glossary Status\n\n${summary}\n\n[View full dashboard](../blob/${context.sha}/glossary/implementations/dashboard.md)`
            });
```

---

## 🔧 개발자 도구 통합

### VS Code 확장 설정
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  
  // JSDoc 태그 하이라이트
  "better-comments.tags": [
    {
      "tag": "@glossary",
      "color": "#3498DB",
      "strikethrough": false,
      "backgroundColor": "transparent"
    }
  ],
  
  // 태스크 설정
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Glossary Update",
        "type": "shell",
        "command": "pnpm glossary:update",
        "group": "build",
        "presentation": {
          "echo": true,
          "reveal": "always",
          "focus": false,
          "panel": "shared"
        }
      }
    ]
  }
}
```

### 스니펫 설정
```json
// .vscode/typescript.json
{
  "Glossary JSDoc": {
    "prefix": "glossary",
    "body": [
      "/**",
      " * $1",
      " * @glossary $2",
      " * @category ${3|core-concepts,architecture-terms,api-terms,naming-conventions|}",
      " * @pattern $4", 
      " * @related $5",
      " */"
    ],
    "description": "Add glossary JSDoc tags"
  }
}
```

---

## 📊 모니터링 및 분석

### 일일 상태 체크 스크립트
```bash
#!/bin/bash
# scripts/daily-glossary-check.sh

echo "🔍 Daily Glossary Health Check - $(date)"
echo "========================================"

# 빌드 및 업데이트
pnpm build:glossary && pnpm glossary:update

# 주요 지표 추출
validation_file="glossary/implementations/_data/validation-report.json"
missing_file="glossary/implementations/_data/missing-analysis-report.json"

# 검증 현황
total_terms=$(jq '.summary.glossaryTerms' $validation_file)
mapped_terms=$(jq '.summary.mappedTerms' $validation_file)
error_count=$(jq '.summary.errors' $validation_file)

echo "📈 Validation Status:"
echo "  Total Terms: $total_terms"
echo "  Mapped: $mapped_terms ✅"
echo "  Errors: $error_count $([ $error_count -gt 0 ] && echo '❌' || echo '✅')"

# 구현 현황
core_completion=$(jq -r '.categoryAnalysis."core-concepts".implementation_rate // 0' $missing_file)
api_completion=$(jq -r '.categoryAnalysis."api-terms".implementation_rate // 0' $missing_file)

echo ""
echo "📊 Implementation Progress:"
echo "  Core Concepts: ${core_completion}%"
echo "  API Terms: ${api_completion}%"

# 우선순위 작업 (실제 구조에 맞게 수정)
high_priority=$(jq -r '.categoryAnalysis."naming-conventions".priority_suggestions | length' $missing_file)
echo "  High Priority Tasks: $high_priority"

# 경고 및 알림
if [ "$error_count" -gt 0 ]; then
  echo ""
  echo "⚠️  ATTENTION NEEDED:"
  jq -r '.details.errors[] | "  - \(.method // .term) in \(.file) - \(.type)"' $validation_file
fi

if (( $(echo "$core_completion < 80" | bc -l) )); then
  echo ""
  echo "📢 Core concepts completion is below 80%. Consider prioritizing implementation."
fi

echo ""
echo "📊 Full report: glossary/implementations/dashboard.md"
```

### 주간 리포트 생성
```bash
#!/bin/bash
# scripts/weekly-glossary-report.sh

report_file="reports/glossary-weekly-$(date +%Y-%m-%d).md"
mkdir -p reports

cat > $report_file << EOF
# Glossary Weekly Report - $(date +%Y-%m-%d)

## Summary
$(pnpm glossary:update > /dev/null 2>&1 && echo "✅ Analysis completed successfully" || echo "❌ Analysis failed")

## Progress Overview
\`\`\`
$(jq -r '.categoryAnalysis | to_entries[] | "\(.key): \(.value.implementation_rate)%"' glossary/implementations/_data/missing-analysis-report.json)
\`\`\`

## New Terms This Week
\`\`\`
$(git log --since="1 week ago" --grep="@glossary" --oneline | head -10)
\`\`\`

## Action Items
$(jq -r '.categoryAnalysis."naming-conventions".priority_suggestions[] | "- [ ] \(.)"' glossary/implementations/_data/missing-analysis-report.json)

## Full Dashboard
[View detailed dashboard](../glossary/implementations/dashboard.md)
EOF

echo "📊 Weekly report generated: $report_file"
```

---

## 🚨 트러블슈팅 가이드

### 일반적인 문제들

#### 1. "Cannot find module" 오류
```bash
# 해결: 패키지 빌드 먼저 실행
pnpm build:glossary

# 패키지 설치 확인
cd glossary/tools && pnpm install
```

#### 2. 빈 매핑 데이터
```bash
# 원인 확인: 스캔 경로 검증
ls -la example/src/**/*.ts packages/*/src/**/*.ts

# 태그 확인: 실제 JSDoc 태그 존재 여부
grep -r "@glossary" example/src/ packages/*/src/
```

#### 3. 검증 오류가 계속 발생
```bash
# 상세 오류 정보 확인
jq '.details.errors[] | {method, file, type, message}' glossary/implementations/_data/validation-report.json

# 용어집 파일 존재 확인
ls -la glossary/*.md

# 용어 정의 확인
grep -n "특정용어" glossary/*.md
```

#### 4. 대시보드 생성 실패
```bash
# 의존 데이터 확인
ls -la glossary/implementations/_data/

# 필요한 파일들이 모두 있는지 확인
required_files=("mappings.json" "validation-report.json" "missing-analysis-report.json")
for file in "${required_files[@]}"; do
  if [ ! -f "glossary/implementations/_data/$file" ]; then
    echo "❌ Missing: $file"
  else
    echo "✅ Found: $file"
  fi
done
```

### 성능 최적화

#### 대용량 코드베이스 처리
```javascript
// config.js 최적화
export const config = {
  // 파일 크기 제한 (1MB)
  maxFileSize: 1024 * 1024,
  
  // 동시 처리 파일 수 제한
  concurrency: 10,
  
  // 캐싱 활성화
  enableCache: true,
  cacheDir: '.glossary-cache',
  
  // 제외 패턴 추가
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.min.js',
    '**/*.bundle.js'
  ]
};
```

### 디버깅 모드
```bash
# 상세 로그와 함께 실행
DEBUG=true pnpm glossary:update

# 특정 도구만 디버깅
cd glossary/tools
DEBUG=true node glossary-scanner.js
```

이러한 예제들을 통해 다양한 개발 상황에서 glossary tools를 효과적으로 활용할 수 있습니다.