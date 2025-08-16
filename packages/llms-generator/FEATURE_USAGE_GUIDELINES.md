# LLMS Generator - 기능 사용 가이드라인

## 📋 **개요**

LLMS Generator는 문서 기반 컨텐츠 생성 및 관리를 위한 TypeScript 라이브러리입니다. 클린 아키텍처 패턴을 따르며, 다국어 지원과 adaptive composition 기능을 제공합니다.

### **핵심 기능**
- **문서 ID 관리**: 더블 대시(`--`) 기반 계층적 ID 시스템
- **다국어 지원**: 영어, 한국어, 일본어 등 다중 언어 컨텐츠 생성
- **Character-limited 생성**: 다양한 글자 수 제한에 맞춘 컨텐츠 생성
- **Priority 기반 관리**: JSON Schema 기반 우선순위 시스템
- **Work Queue 관리**: 순차적 작업 처리 시스템

---

## 🏗️ **아키텍처 개요**

### **클린 아키텍처 레이어**

```
┌─────────────────────────────────────────┐
│             Presentation Layer          │
│  CLI, Commands, Controllers             │
├─────────────────────────────────────────┤
│            Application Layer            │
│  Use Cases, Services                    │
├─────────────────────────────────────────┤
│              Domain Layer               │
│  Entities, Value Objects, Interfaces   │
├─────────────────────────────────────────┤
│           Infrastructure Layer          │
│  Repositories, External Services       │
└─────────────────────────────────────────┘
```

### **주요 컴포넌트**

#### **Domain Layer (`src/domain/`)**
- **Entities**: `DocumentSummary` - 문서 요약 엔티티
- **Value Objects**: `Frontmatter` - YAML 프론트매터 값 객체
- **Repositories**: `IDocumentSummaryRepository` - 문서 저장소 인터페이스
- **Services**: `IFrontmatterService`, `ISummaryExtractor` - 도메인 서비스 인터페이스

#### **Application Layer (`src/application/`)**
- **Use Cases**: `GenerateSummaryUseCase`, `SummaryGeneratorUseCase` - 비즈니스 로직 구현

#### **Infrastructure Layer (`src/infrastructure/`)**
- **Repositories**: `FileSystemDocumentSummaryRepository` - 파일 시스템 기반 저장소
- **Services**: `FrontmatterService`, `SummaryExtractor` - 인프라 서비스 구현
- **DI Container**: `DIContainer` - 의존성 주입 컨테이너

#### **Core Layer (`src/core/`)**
- **AdaptiveComposer**: 적응형 컨텐츠 구성
- **PriorityGenerator**: 우선순위 기반 생성
- **ConfigManager**: 설정 관리
- **WorkStatusManager**: 작업 상태 관리

---

## 🚀 **기본 사용법**

### **1. 설정 초기화**

```bash
# 기본 설정 생성
npx @context-action/llms-generator config-init standard

# 설정 확인
npx @context-action/llms-generator config-show

# 설정 검증
npx @context-action/llms-generator config-validate
```

### **2. Priority.json 생성**

```bash
# 모든 문서에 대한 priority.json 생성
npx @context-action/llms-generator priority-generate en

# 드라이런으로 미리보기
npx @context-action/llms-generator priority-generate en --dry-run

# 통계 확인
npx @context-action/llms-generator priority-stats en
```

### **3. 컨텐츠 생성**

```bash
# 최소 형식 생성
npx @context-action/llms-generator minimum en

# 원본 형식 생성
npx @context-action/llms-generator origin en

# 특정 글자 수 제한으로 생성
npx @context-action/llms-generator chars 1000 en

# 모든 형식 일괄 생성
npx @context-action/llms-generator batch --lang=en,ko --chars=300,1000,3000
```

### **4. Work Queue 관리**

```bash
# 다음 작업 대상 확인
./wq next en

# 작업 상태 확인
./wq status en

# 작업 완료 처리
./wq complete <document-id> en

# 중복 검사
./wq check-duplicates en

# 중복 해결
./wq resolve-duplicates en --dry-run
```

---

## 🔧 **고급 기능**

### **1. Adaptive Composition**

```bash
# 적응형 컨텐츠 구성
npx @context-action/llms-generator compose ko 3000

# 배치 구성
npx @context-action/llms-generator compose-batch en --chars=1000,3000,5000

# 구성 통계
npx @context-action/llms-generator compose-stats ko
```

### **2. Instruction Generation**

```bash
# 문서별 지시사항 생성
npx @context-action/llms-generator instruction-generate ko guide-action-handlers

# 일괄 지시사항 생성
npx @context-action/llms-generator instruction-batch ko --template=default

# 템플릿 관리
npx @context-action/llms-generator instruction-template list
```

### **3. 스키마 관리**

```bash
# TypeScript 타입 생성
npx @context-action/llms-generator schema-generate types/ --typescript

# 스키마 정보 확인
npx @context-action/llms-generator schema-info
```

---

## 📊 **작업 관리 워크플로우**

### **일반적인 작업 순서**

```bash
# 1. 설정 및 초기화
npx @context-action/llms-generator config-init standard
npx @context-action/llms-generator priority-generate en

# 2. 중복 검사 및 해결
./wq check-duplicates en
./wq resolve-duplicates en --dry-run
./wq resolve-duplicates en

# 3. 컨텐츠 생성
node bulk-priority-generator.cjs en
node generate-individual-files.cjs
npx @context-action/llms-generator batch

# 4. 작업 진행 관리
./wq next en
./wq complete <document-id> en
./wq status en
```

### **카테고리별 미니멀 LLMS 생성**

특정 도메인에 집중된 최소형 LLMS 파일을 생성할 수 있습니다. 이는 기존의 통합 미니멀 LLMS(`llms-minimum-ko.txt`)와 동일한 형식이지만, 특정 카테고리의 문서만 포함합니다.

#### **라이브러리 사용법**

```typescript
import { CategoryMinimumGenerator } from '@context-action/llms-generator';

// 고급 설정으로 생성기 초기화
const generator = new CategoryMinimumGenerator({
  dataDir: './data',           // priority.json 파일들이 있는 디렉토리
  outputDir: './output',       // 생성된 파일들이 저장될 디렉토리
  baseUrl: 'https://your-domain.com/docs'  // 사용자 정의 기본 URL
});

// 1. 기본 정보 확인
const categories = generator.getAvailableCategories();
console.log('Available categories:', categories); // ['api-spec', 'guide']

const patterns = generator.getCategoryPatterns('api-spec');
console.log('API patterns:', patterns); // ['api--*', 'api/*']

// 2. 언어별 문서 수 확인
const availableDocs = generator.getAvailableDocuments('en');
console.log('EN documents:', availableDocs);
// [{ category: 'api-spec', count: 87 }, { category: 'guide', count: 9 }]

// 3. 상세 통계 정보
const stats = generator.getCategoryStats('api-spec', 'en');
console.log('API-spec stats:', {
  totalDocuments: stats.totalDocuments,
  averagePriorityScore: stats.averagePriorityScore,
  tierBreakdown: stats.tierBreakdown
});

// 4. 단일 카테고리 생성
const result = await generator.generateSingle('api-spec', 'en');
if (result.success) {
  console.log(`✅ Generated: ${result.filePath}`);
  console.log(`   Documents: ${result.documentCount}`);
} else {
  console.error(`❌ Error: ${result.error}`);
}

// 5. 배치 생성 (에러 처리 포함)
try {
  const results = await generator.generateBatch({
    languages: ['en', 'ko'],
    categories: ['api-spec', 'guide']
  });
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Success: ${successful.length}, ❌ Failed: ${failed.length}`);
  
  failed.forEach(result => {
    console.error(`❌ ${result.category} (${result.language}): ${result.error}`);
  });
} catch (error) {
  console.error('Batch generation failed:', error.message);
}

// 6. 모든 언어의 통계 비교
const allStatsEn = generator.getAllStats('en');
const allStatsKo = generator.getAllStats('ko');

console.log('Language comparison:');
allStatsEn.forEach(enStat => {
  const koStat = allStatsKo.find(s => s.category === enStat.category);
  console.log(`${enStat.category}: EN(${enStat.totalDocuments}) vs KO(${koStat?.totalDocuments || 0})`);
});
```

#### **CLI 사용법**

```bash
# 특정 카테고리만 선택하여 미니멀 LLMS 생성
node test-category-minimum-cli.cjs api-spec en    # API 참조 문서만
node test-category-minimum-cli.cjs guide en       # 가이드 문서만

# 모든 카테고리 및 언어로 생성
node test-category-minimum-cli.cjs all all

# 사용 가능한 카테고리 및 언어 확인
node test-category-minimum-cli.cjs --help
```

#### **카테고리 선택 가이드**

**API 참조 중심 작업 시 (`api-spec`)**:
- **대상**: API 문서, 함수 레퍼런스, 인터페이스 정의, 타입 시스템 (87개 문서)
- **사용 상황**: 
  - 개발 중 API 참조가 필요한 경우
  - 코드 작성 시 정확한 함수 시그니처 확인
  - TypeScript 타입 정의 참조
  - 훅(Hook)과 유틸리티 함수 사용법 확인
- **패턴 매칭**: `api--*`, `api/*` 폴더 구조의 모든 문서

**가이드 및 학습 중심 작업 시 (`guide`)**:
- **대상**: 튜토리얼, 사용 가이드, 개념 설명, 모범 사례 (9개 문서)
- **사용 상황**:
  - 프레임워크 학습 및 이해
  - 아키텍처 패턴 학습
  - 모범 사례 및 권장 패턴 참조
  - 개념적 이해가 필요한 경우
- **패턴 매칭**: `guide--*`, `guide/*`, `concept--*guide*`, `concept/*guide*` 구조의 문서

#### **카테고리 선택 의사결정 프레임워크**

| 작업 유형 | 추천 카테고리 | 이유 |
|-----------|---------------|------|
| 코드 구현 | `api-spec` | 정확한 API 사용법과 타입 정보 필요 |
| 아키텍처 설계 | `guide` | 패턴과 개념적 이해가 중요 |
| 디버깅 | `api-spec` | 함수 동작과 인터페이스 확인 필요 |
| 프레임워크 학습 | `guide` | 개념적 설명과 튜토리얼이 효과적 |
| 코드 리뷰 | `all` | API 정확성과 패턴 적합성 모두 검토 |
| 문서 작성 | `guide` | 사용자 친화적 설명과 예시 참조 |

#### **고급 카테고리 활용법**

**개발 단계별 카테고리 전략**:
```bash
# 1. 초기 설계 단계: 가이드 중심
node test-category-minimum-cli.cjs guide ko

# 2. 구현 단계: API 참조 중심  
node test-category-minimum-cli.cjs api-spec en

# 3. 통합 테스트: 전체 참조
node test-category-minimum-cli.cjs all all
```

**언어별 최적화 전략**:
- **한국어 (`ko`)**: 개념 학습과 가이드 문서에 적합
- **영어 (`en`)**: API 참조와 기술 문서에 적합 (더 풍부한 기술 콘텐츠)

#### **출력 파일 정보**

**파일 형식**: `./test-minimum-output/llms-minimum-{category}-{language}.txt`

**파일 구조**:
```
# Context-Action Framework - [카테고리 제목]
생성일: YYYY-MM-DD
유형: 최소 ([카테고리] 탐색 링크)
언어: [KO/EN]
카테고리: [category]

## Reference Documents (문서수)
- [문서 제목](URL) - Priority: [우선순위]

## [카테고리] 요약
- **총 문서 수**: N개
- **카테고리**: category
- **언어**: LANG

## 사용 안내 및 학습 경로
[카테고리별 맞춤 가이드]
```

#### **문제 해결 및 최적화**

**카테고리 매칭 확인**:
```javascript
// category-minimum-generator.cjs에서 패턴 확인
const CATEGORY_PATTERNS = {
  'api-spec': ['api--*', 'api/*'],
  'guide': ['guide--*', 'guide/*', 'concept--*guide*', 'concept/*guide*']
};
```

**카테고리별 문서 수 확인**:
- `api-spec`: 87개 문서 (세밀한 API 참조)
- `guide`: 9개 문서 (핵심 개념 중심)

**성능 고려사항**:
- API 카테고리는 문서 수가 많아 로딩 시간이 길 수 있음
- Guide 카테고리는 빠른 참조에 적합
- 필요에 따라 특정 카테고리만 선택하여 토큰 효율성 확보

### **품질 관리**

```bash
# 작업 상태 체크
npx @context-action/llms-generator work-check ko --show-all

# 컨텐츠 추출 및 검증
npx @context-action/llms-generator extract ko --dry-run
npx @context-action/llms-generator extract-all --lang=en,ko

# YAML 프론트매터 요약 생성
npx @context-action/llms-generator generate-summaries minimum ko --chars=100,300
```

---

## 🎯 **베스트 프랙티스**

### **1. ID 생성 규칙**

```javascript
// 더블 대시 방식 사용
"api/core/src/ActionRegister.md" → "api--core--src--actionregister"
"guide/getting-started.md" → "guide-getting-started"
```

**규칙:**
- 경로 구분자: `--` (더블 대시)
- 단어 내부 구분자: `-` (싱글 대시)
- 모든 문자 소문자 변환
- 특수문자는 대시로 변환

### **2. 설정 관리**

```json
// llms-generator.config.json
{
  "id": {
    "generation": {
      "strategy": "double-dash-separator",
      "pathSeparator": "--",
      "wordSeparator": "-"
    }
  }
}
```

### **3. 에러 처리**

```bash
# 항상 드라이런으로 먼저 확인
./wq resolve-duplicates en --dry-run

# 설정 검증 후 실행
npx @context-action/llms-generator config-validate
```

### **4. 성능 최적화**

```bash
# 병렬 처리 활용
npx @context-action/llms-generator batch --lang=en,ko

# 점진적 생성
npx @context-action/llms-generator chars 300 en
npx @context-action/llms-generator chars 1000 en
```

---

## 🔍 **문제 해결**

### **일반적인 문제**

#### **1. ID 중복 문제**
```bash
# 문제 확인
./wq check-duplicates en

# 해결 방법
./wq resolve-duplicates en --strategy=hierarchical-separator
```

#### **2. 설정 오류**
```bash
# 설정 검증
npx @context-action/llms-generator config-validate

# 설정 재초기화
npx @context-action/llms-generator config-init standard --overwrite
```

#### **3. 생성 실패**
```bash
# 상태 확인
./wq status en

# 로그 확인
npx @context-action/llms-generator work-check en --show-all
```

### **디버깅 팁**

1. **설정 우선 확인**: `config-show`로 현재 설정 상태 확인
2. **드라이런 활용**: 모든 변경 작업 전 `--dry-run` 옵션 사용
3. **상태 모니터링**: `./wq quick`으로 전체 상태 빠른 확인
4. **단계별 실행**: 복잡한 작업은 단계별로 나누어 실행

---

## 📚 **참고 자료**

### **관련 파일**
- `FEATURE_SPECIFICATIONS.md` - 중복 처리 시스템 명세
- `PATH_SEPARATOR_SOLUTION.md` - 경로 구분자 해결 방안
- `DUPLICATE_HANDLING_STRATEGY.md` - 중복 처리 전략

### **CLI 명령어 전체 목록**
```bash
npx @context-action/llms-generator help
```

### **Work Queue 명령어**
```bash
./wq  # 도움말 표시
```

이 가이드를 통해 LLMS Generator의 모든 기능을 효과적으로 활용할 수 있습니다.