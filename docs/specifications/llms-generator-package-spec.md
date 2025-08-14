# @context-action/llms-generator Package Specification

## 개요

llmstxt 형식의 요약 문서를 자동 생성하는 전용 라이브러리 패키지입니다. `priority-schema.json` 기반 메타데이터를 읽고 지시문에 따라 다양한 형식의 요약 문서를 생성합니다.

## 패키지 정보

- **Package Name**: `@context-action/llms-generator`
- **Version**: `1.0.0`
- **License**: MIT
- **Location**: `/packages/llms-generator`

## 핵심 기능

### 1. 메타데이터 기반 문서 파싱

```typescript
interface DocumentProcessor {
  // priority.json 기반 문서 메타데이터 로드
  loadPriorityMetadata(language: string): Promise<PriorityMap>;
  
  // 원본 문서 파일 읽기 및 파싱
  parseSourceDocument(sourcePath: string): Promise<DocumentContent>;
  
  // 문서 우선순위 기반 정렬
  sortByPriority(documents: DocumentCollection): SortedDocuments;
}
```

### 2. 지시문 기반 요약 엔진

```typescript
interface SummaryEngine {
  // 캐릭터 제한 기반 요약
  generateSummary(
    content: DocumentContent, 
    limit: number, 
    instructions: ExtractionGuideline
  ): Promise<string>;
  
  // 전략별 요약 (concept-first, api-first, example-first)
  applyExtractionStrategy(
    content: DocumentContent, 
    strategy: ExtractionStrategy
  ): Promise<ProcessedContent>;
  
  // 품질 검증
  validateSummary(summary: string, criteria: QualityCriteria): ValidationResult;
}
```

### 3. 다중 형식 출력

```typescript
interface OutputGenerator {
  // minimum: 네비게이션 링크 형식
  generateMinimumFormat(documents: SortedDocuments): Promise<string>;
  
  // origin: 완전한 원본 문서
  generateOriginFormat(documents: SortedDocuments): Promise<string>;
  
  // character-limited: 지정된 글자 수 제한
  generateCharacterLimited(
    documents: SortedDocuments, 
    limit: number
  ): Promise<string>;
}
```

## 아키텍처

### Core Classes

#### 1. `LLMSGenerator`
메인 생성기 클래스
```typescript
export class LLMSGenerator {
  constructor(config: LLMSConfig);
  
  // 전체 생성 프로세스
  async generate(options: GenerationOptions): Promise<GenerationResult>;
  
  // 특정 형식 생성
  async generateMinimum(language: string): Promise<string>;
  async generateOrigin(language: string): Promise<string>;
  async generateCharacterLimited(chars: number, language: string): Promise<string>;
}
```

#### 2. `PriorityManager`
우선순위 데이터 관리
```typescript
export class PriorityManager {
  constructor(llmContentPath: string);
  
  // 모든 우선순위 파일 로드
  async loadAllPriorities(): Promise<PriorityCollection>;
  
  // 언어별 필터링
  filterByLanguage(collection: PriorityCollection, language: string): PriorityCollection;
  
  // 우선순위 점수별 정렬
  sortByPriority(collection: PriorityCollection): SortedPriorityCollection;
}
```

#### 3. `DocumentProcessor`
문서 처리 및 파싱
```typescript
export class DocumentProcessor {
  constructor(docsPath: string);
  
  // 원본 문서 읽기
  async readSourceDocument(sourcePath: string): Promise<DocumentContent>;
  
  // YAML frontmatter 제거
  removeYAMLFrontmatter(content: string): string;
  
  // 문서 크기 분석
  analyzeDocumentSize(content: string): DocumentStats;
}
```

#### 4. `SummaryEngine`
요약 생성 엔진
```typescript
export class SummaryEngine {
  constructor(config: SummaryConfig);
  
  // 전략 기반 요약
  async summarizeWithStrategy(
    content: DocumentContent,
    strategy: ExtractionStrategy,
    limit: number
  ): Promise<string>;
  
  // 품질 검증
  validateSummary(summary: string, criteria: QualityCriteria): ValidationResult;
}
```

## 데이터 스키마

### PrioritySchema 기반 타입 정의

```typescript
interface PriorityMetadata {
  document: {
    id: string;
    title: string;
    source_path: string;
    category: DocumentCategory;
    subcategory?: string;
  };
  priority: {
    score: number; // 1-100
    tier: PriorityTier;
    rationale?: string;
  };
  purpose: {
    primary_goal: string;
    target_audience: TargetAudience[];
    use_cases: string[];
    dependencies: string[];
  };
  keywords: {
    primary: string[];
    technical: string[];
    patterns?: string[];
    avoid?: string[];
  };
  extraction: {
    strategy: ExtractionStrategy;
    character_limits: CharacterLimitsConfig;
    emphasis: {
      must_include: string[];
      nice_to_have: string[];
    };
  };
  quality: {
    completeness_threshold: number;
    code_examples_required: boolean;
    consistency_checks: ConsistencyCheck[];
  };
  metadata: {
    created: string;
    updated?: string;
    version: string;
    original_size: number;
    estimated_extraction_time: Record<string, string>;
  };
}
```

### Enums

```typescript
enum DocumentCategory {
  GUIDE = 'guide',
  API = 'api',
  CONCEPT = 'concept',
  EXAMPLE = 'example',
  REFERENCE = 'reference',
  LLMS = 'llms'
}

enum PriorityTier {
  CRITICAL = 'critical',
  ESSENTIAL = 'essential',
  IMPORTANT = 'important',
  REFERENCE = 'reference',
  SUPPLEMENTARY = 'supplementary'
}

enum ExtractionStrategy {
  CONCEPT_FIRST = 'concept-first',
  EXAMPLE_FIRST = 'example-first',
  API_FIRST = 'api-first',
  TUTORIAL_FIRST = 'tutorial-first',
  REFERENCE_FIRST = 'reference-first'
}
```

## 설정

### LLMSConfig

```typescript
interface LLMSConfig {
  // 경로 설정
  paths: {
    docsDir: string;           // 원본 문서 경로
    llmContentDir: string;     // llm-content 경로
    outputDir: string;         // 출력 디렉토리
  };
  
  // 생성 옵션
  generation: {
    supportedLanguages: string[];
    characterLimits: number[];
    defaultLanguage: string;
    outputFormat: 'txt' | 'md';
  };
  
  // 품질 설정
  quality: {
    minCompletenessThreshold: number;
    enableValidation: boolean;
    strictMode: boolean;
  };
  
  // 서버 동기화 설정 (미래)
  sync?: {
    enabled: boolean;
    serverUrl: string;
    apiKey: string;
  };
}
```

## API 사용법

### 기본 사용법

```typescript
import { LLMSGenerator } from '@context-action/llms-generator';

const generator = new LLMSGenerator({
  paths: {
    docsDir: './docs',
    llmContentDir: './docs/llm-content',
    outputDir: './docs/llms'
  },
  generation: {
    supportedLanguages: ['en', 'ko'],
    characterLimits: [100, 300, 500, 1000, 2000, 3000, 4000],
    defaultLanguage: 'en',
    outputFormat: 'txt'
  }
});

// minimum 형식 생성
const minimum = await generator.generateMinimum('en');

// character-limited 형식 생성
const summary = await generator.generateCharacterLimited(1000, 'ko');

// 전체 배치 생성
const results = await generator.generate({
  languages: ['en', 'ko'],
  formats: ['minimum', 'origin', 'chars'],
  characterLimits: [300, 1000, 2000]
});
```

### CLI 인터페이스

```bash
# 패키지 레벨 CLI
npx @context-action/llms-generator generate --format minimum --lang en
npx @context-action/llms-generator batch --languages en,ko --limits 300,1000

# 또는 프로그래밍 방식으로
import { CLI } from '@context-action/llms-generator/cli';
```

## 서버 동기화 계획

### Phase 1: JSON 기반 로컬 처리
- priority.json 파일 읽기
- 로컬 문서 파싱 및 요약
- 정적 파일 생성

### Phase 2: 서버 연동
```typescript
interface SyncManager {
  // 서버에서 priority 데이터 가져오기
  async fetchPriorityData(language: string): Promise<PriorityCollection>;
  
  // 로컬 변경사항 서버에 업로드
  async pushPriorityUpdates(updates: PriorityUpdate[]): Promise<void>;
  
  // 문서 내용 서버 동기화
  async syncDocuments(documents: DocumentCollection): Promise<void>;
}
```

### 동기화 전략
1. **우선순위 메타데이터**: JSON → API 엔드포인트
2. **문서 콘텐츠**: 로컬 파일 → 서버 저장소
3. **생성된 요약**: 로컬 캐시 → 서버 CDN
4. **실시간 업데이트**: WebSocket 또는 폴링

## 패키지 구조

```
packages/llms-generator/
├── src/
│   ├── core/
│   │   ├── LLMSGenerator.ts
│   │   ├── PriorityManager.ts
│   │   ├── DocumentProcessor.ts
│   │   └── SummaryEngine.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── priority.ts
│   │   ├── document.ts
│   │   └── config.ts
│   ├── utils/
│   │   ├── file-utils.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   ├── cli/
│   │   ├── index.ts
│   │   └── commands.ts
│   └── index.ts
├── __tests__/
│   ├── core/
│   ├── integration/
│   └── fixtures/
├── examples/
├── README.md
├── package.json
├── tsconfig.json
└── tsdown.config.ts
```

## 현재 스크립트와의 관계

### 마이그레이션 계획
1. **기존 스크립트 기능 추출**
   - `generate-llms-adaptive.js` → `LLMSGenerator`
   - `analyze-llm-generation-status.js` → `StatusAnalyzer`
   - CLI 스크립트들 → 패키지 CLI

2. **향상된 기능**
   - TypeScript 타입 안전성
   - 모듈화된 아키텍처
   - 확장 가능한 플러그인 시스템
   - 서버 동기화 준비

3. **하위 호환성**
   - 기존 CLI 명령어 지원
   - 동일한 출력 형식
   - 기존 설정 파일 호환

## 품질 보증

### 테스트 전략
- **Unit Tests**: 각 클래스별 기능 테스트
- **Integration Tests**: 전체 생성 프로세스 테스트
- **E2E Tests**: CLI 및 파일 시스템 테스트
- **Performance Tests**: 대량 문서 처리 성능

### 검증 기준
- priority.json 스키마 준수
- 생성된 문서 품질 검증
- 캐릭터 제한 정확성
- 우선순위 정렬 정확성

## 배포 및 버전 관리

### NPM 배포
```bash
# 개발 빌드
npm run build

# 테스트
npm run test

# 배포
npm publish
```

### 버전 관리
- **Semantic Versioning** 적용
- **Lerna**와 통합된 monorepo 관리
- **자동 CHANGELOG** 생성

---

이 스펙은 현재 스크립트 기반 시스템을 보다 견고하고 확장 가능한 패키지로 발전시키기 위한 설계 문서입니다. priority-schema.json을 활용하여 지능적인 문서 요약 시스템을 구축하고, 향후 서버 동기화를 통한 실시간 업데이트까지 지원할 계획입니다.