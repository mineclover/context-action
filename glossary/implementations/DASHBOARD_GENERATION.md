# Dashboard Generation Principles

용어집 대시보드가 생성되는 원리와 데이터 플로우를 설명합니다.

## 🔄 전체 데이터 플로우

```
Source Code → JSDoc Tags → Mappings → Validation → Analysis → Dashboard
    ↓            ↓           ↓          ↓           ↓         ↓
  .ts/.tsx    @implements  mappings.json  validation  missing   dashboard.md
   files       tags                      -report.json -report   + dashboard.json
```

## 📊 단계별 처리 과정

### 1단계: 코드 스캔 (Code Scanning)
**파일**: `glossary/tools/glossary-scanner-v2.js`

#### 스캔 대상
```javascript
scanPaths: [
  'example/src/**/*.{ts,tsx,js,jsx}',
  'packages/*/src/**/*.{ts,tsx,js,jsx}'
]
```

#### JSDoc 파싱
```javascript
// comment-parser 라이브러리 사용
const comments = parse(sourceCode);
const implementsTags = comments
  .filter(comment => comment.tags.some(tag => tag.tag === 'implements'))
  .map(extractImplementationData);
```

#### 수집되는 데이터
- **파일 경로**: 구현체 위치
- **구현체 이름**: 클래스/인터페이스/함수명
- **구현체 타입**: class, interface, function, type
- **라인 번호**: 정확한 위치
- **JSDoc 메타데이터**: @memberof, @example, @since 등
- **구현 용어들**: @implements 태그의 값들

#### 출력
```json
{
  "terms": {
    "action-handler": [
      {
        "file": "example/src/hooks/useActionThrottle.ts",
        "name": "ThrottleOptions",
        "type": "interface",
        "line": 9,
        "implements": ["action-handler"],
        "memberOf": ["core-concepts"],
        "lastModified": "2025-08-01T06:11:40.512Z"
      }
    ]
  },
  "categories": {
    "core-concepts": ["action-handler", "pipeline-controller"]
  },
  "files": {
    "example/src/hooks/useActionThrottle.ts": {
      "terms": ["action-handler"],
      "lastScanned": "2025-08-01T06:11:40.512Z"
    }
  }
}
```

### 2단계: 용어집 검증 (Glossary Validation)
**파일**: `glossary/tools/glossary-validator-v2.js`

#### 용어집 파싱
```javascript
// 마크다운 파일에서 ## 헤더 추출
const glossaryTerms = parseMarkdownTerms(glossaryFiles);
// 예: "## Action Handler" → "action-handler"
```

#### 매핑 검증
```javascript
const validation = {
  errors: [],      // 심각한 문제들
  warnings: [],    // 경고 사항들
  summary: {
    glossaryTerms: totalTermsInGlossary,
    mappedTerms: implementedTermsCount,
    implementationRate: (implementedTermsCount / totalTermsInGlossary) * 100
  }
};
```

#### 검증 규칙
- **DUPLICATE_MAPPING**: 하나의 구현체가 여러 용어 구현
- **ORPHANED_TERM**: 용어집에 있지만 구현되지 않은 용어
- **UNDEFINED_TERM**: 코드에서 참조하지만 용어집에 없는 용어

### 3단계: 미구현 분석 (Missing Analysis)
**파일**: `glossary/tools/missing-analysis.js`

#### 양방향 분석
```javascript
const analysis = {
  glossaryToCode: {    // 용어집 → 코드 방향
    missing: [],       // 미구현 용어들
    partial: [],       // 부분 구현 용어들
    categories: {}     // 카테고리별 통계
  },
  codeToGlossary: {    // 코드 → 용어집 방향
    undefined: [],     // 미정의 용어들
    outdated: [],      // 오래된 참조들
    suggestions: []    // 개선 제안들
  }
};
```

#### 우선순위 계산
```javascript
function calculatePriority(term, category, usageFrequency) {
  let priority = 'MEDIUM';
  
  if (category === 'core-concepts') priority = 'HIGH';
  if (usageFrequency > 5) priority = 'HIGH';
  if (category === 'naming-conventions' && usageFrequency < 2) priority = 'LOW';
  
  return priority;
}
```

#### 개선 제안 생성
```javascript
const suggestions = generateSuggestions(term, category);
// "ActionRegister 클래스에 @implements actionregister 태그 추가"
// "createActionRegister 팩토리 함수 구현"
```

### 4단계: 대시보드 생성 (Dashboard Generation)
**파일**: `glossary/tools/implementation-dashboard.js`

#### 데이터 통합
```javascript
// 3개 소스 데이터 통합
const dashboardData = integrateData(
  mappingsData,      // 1단계 결과
  validationData,    // 2단계 결과
  missingAnalysis    // 3단계 결과
);
```

#### 통계 계산
```javascript
const statistics = {
  overview: {
    total_glossary_terms: glossaryTermsCount,
    mapped_terms: implementedTermsCount,
    implementation_rate: Math.round((implementedTermsCount / glossaryTermsCount) * 100),
    files_scanned: totalFilesScanned,
    files_with_tags: filesWithTagsCount
  },
  categories: calculateCategoryStats(data),
  trends: estimateTrends(historicalData)
};
```

#### 우선순위 TODO 생성
```javascript
const priorityTodos = missingTerms
  .filter(term => term.priority === 'HIGH')
  .slice(0, 4)  // 상위 4개만
  .map(term => ({
    priority: 'HIGH',
    type: 'IMPLEMENT_TERM',
    title: `"${term.name}" 구현`,
    description: term.suggestions[0],
    category: term.category,
    effort: estimateEffort(term),
    files_affected: 1
  }));
```

#### 진행 트렌드 추정
```javascript
const trends = {
  implementation_velocity: estimateVelocity(recentImplementations),
  most_active_category: findMostActiveCategory(categoryStats),
  completion_estimate: estimateCompletion(currentRate, remainingTerms)
};
```

## 🎨 마크다운 렌더링

### 템플릿 기반 생성
```javascript
function generateDashboardMarkdown(data) {
  return `# 용어집 구현 현황 대시보드

> 🕒 최종 업데이트: ${data.metadata.generated_date} ${data.metadata.generated_time}

## 📈 전체 현황
${renderOverviewStats(data.overview)}

## 📊 카테고리별 현황
${renderCategoryStats(data.categories)}

## 🎯 우선순위 TODO
${renderPriorityTodos(data.priority_todos)}

## 📊 최근 구현 현황
${renderRecentImplementations(data.recent_implementations)}
`;
}
```

### 상태 아이콘 및 색상
```javascript
function getStatusBadge(implementationRate) {
  if (implementationRate >= 80) return { emoji: '🟢', text: '완료단계', color: 'green' };
  if (implementationRate >= 60) return { emoji: '🟡', text: '진행중', color: 'yellow' };
  if (implementationRate >= 40) return { emoji: '🟠', text: '개선필요', color: 'orange' };
  return { emoji: '🔴', text: '시작단계', color: 'red' };
}
```

## 📁 출력 파일들

### JSON 데이터 파일들
```
glossary/implementations/_data/
├── mappings.json              # 1단계: 코드 스캔 결과
├── validation-report.json     # 2단계: 검증 결과
├── missing-analysis-report.json # 3단계: 미구현 분석
└── dashboard.json             # 4단계: 통합 대시보드 데이터
```

### 마크다운 리포트
```
glossary/implementations/
└── dashboard.md               # 사람이 읽기 쉬운 시각적 대시보드
```

## ⚙️ 설정 및 커스터마이징

### 스캔 설정
```javascript
// glossary.config.js
export default {
  scanPaths: ['커스터마이징 가능한 스캔 경로'],
  glossaryPaths: {'용어집 파일 경로 매핑'},
  output: {'출력 파일 경로 설정'}
};
```

### 카테고리 아이콘
```javascript
const categoryIcons = {
  'core-concepts': '🎯',
  'architecture-terms': '🏗️',
  'api-terms': '🔌',
  'naming-conventions': '📝'
};
```

### 우선순위 로직
```javascript
function calculateTermPriority(term, category, frequency) {
  // 카테고리별 가중치
  const categoryWeights = {
    'core-concepts': 1.0,
    'architecture-terms': 0.8,
    'api-terms': 0.9,
    'naming-conventions': 0.6
  };
  
  // 사용빈도 가중치
  const frequencyWeight = Math.min(frequency / 10, 1.0);
  
  return categoryWeights[category] * 0.7 + frequencyWeight * 0.3;
}
```

## 🔄 실시간 업데이트

### 자동 실행
```bash
# package.json scripts
"glossary:update": "pnpm glossary:scan && pnpm glossary:validate && pnpm glossary:missing && pnpm glossary:dashboard"
```

### CI/CD 통합
```yaml
# GitHub Actions 예시
- name: Update Glossary Dashboard
  run: pnpm glossary:update
- name: Commit Dashboard Updates
  run: |
    git add glossary/implementations/
    git commit -m "Update glossary dashboard [skip ci]"
```

## 🎯 대시보드의 핵심 가치

### 실시간 투명성
- 현재 구현 상태를 정확히 반영
- 진행률과 우선순위를 명확히 표시
- 팀 전체가 공유하는 단일 정보원

### 실행 가능한 인사이트
- 구체적인 다음 단계 제안
- 우선순위 기반 작업 가이드
- 측정 가능한 진행 지표

### 자동화된 품질 관리
- 수동 추적의 오류 최소화
- 일관된 기준의 품질 측정
- 지속적인 개선 사이클 지원

---

*이 문서는 용어집 대시보드 생성의 기술적 원리와 비즈니스 가치를 설명합니다.*