# Test Directory Structure

이 디렉토리는 LLMS Generator의 모든 테스트 파일과 관련 리소스를 포함합니다.

## 📁 Directory Structure

```
test/
├── unit/                    # 단위 테스트
│   └── core/               # 핵심 모듈 단위 테스트
├── integration/            # 통합 테스트
├── e2e/                    # End-to-End 테스트
├── cli/                    # CLI 명령어 테스트
├── performance/            # 성능 테스트
├── edge-cases/             # 엣지 케이스 테스트
├── helpers/                # 테스트 헬퍼 함수
├── fixtures/               # 테스트 고정 데이터
├── samples/                # 테스트용 샘플 문서
├── outputs/                # 테스트 실행 결과 출력
└── *-workspace/            # 테스트 작업 공간
```

## 🧪 Test Categories

### **Unit Tests** (`unit/`)
- 개별 클래스/함수의 단위 테스트
- `core/`: CategoryMinimumGenerator, DocumentScorer 등
- **실행**: `npm test -- unit`

### **Integration Tests** (`integration/`)
- 여러 모듈 간 통합 테스트
- configuration.test.ts: EnhancedConfigManager 통합 테스트
- config-schema.test.ts: 설정 스키마 검증 테스트
- document-processing.test.ts: 문서 처리 파이프라인 테스트
- bidirectional-sync.test.ts: 양방향 동기화 테스트
- git-workflow.test.ts: Git 워크플로우 테스트
- **실행**: `npm test -- integration`

### **E2E Tests** (`e2e/`)
- 전체 워크플로우 테스트
- main-scenarios.test.ts: 기본 사용 시나리오 E2E 테스트
- advanced-scenarios.test.ts: 고급 시나리오 및 에러 케이스 테스트
- end-to-end-workflows.test.ts: 완전한 End-to-End 워크플로우
- **실행**: `npm test -- e2e`

### **CLI Tests** (`cli/`)
- 명령어 인터페이스 테스트
- 인자 파싱, 에러 처리 등
- **실행**: `npm test -- cli`

### **Performance Tests** (`performance/`)
- 성능 벤치마크 테스트
- 대용량 데이터 처리 성능 측정
- **실행**: `npm test -- performance`

### **Edge Cases** (`edge-cases/`)
- 경계 조건 및 예외 상황 테스트
- 에러 복구, 입력 검증 등
- **실행**: `npm test -- edge-cases`

## 📄 Test Resources

### **Helpers** (`helpers/`)
- `mock-filesystem.ts`: 파일시스템 모킹 유틸리티
- `test-data-generator.ts`: 테스트 데이터 생성기

### **Fixtures** (`fixtures/`)
- 테스트에 사용되는 고정 데이터
- priority.json 샘플, 설정 파일 등

### **Samples** (`samples/`)
- 테스트용 샘플 문서
- `api-spec-example.md`: API 문서 샘플
- `guide-example.md`: 가이드 문서 샘플

### **Outputs** (`outputs/`)
- 테스트 실행 결과 저장소
- 생성된 LLMS 파일, 변환 결과 등
- **주의**: 이 디렉토리는 테스트 실행 시 자동으로 정리됩니다

### **Workspaces** (`*-workspace/`)
- 테스트 전용 작업 공간
- `test-workspace/`: 기본 테스트 환경
- `advanced-test-workspace/`: 고급 시나리오 테스트

## 🚀 Running Tests

### **전체 테스트 실행**
```bash
npm test
```

### **특정 카테고리 테스트**
```bash
npm test -- unit           # 단위 테스트만
npm test -- integration    # 통합 테스트만
npm test -- e2e           # E2E 테스트만
```

### **특정 파일 테스트**
```bash
npm test -- CategoryMinimumGenerator
npm test -- config-schema
```

### **감시 모드**
```bash
npm test -- --watch
```

## 📋 Test Configuration

- **Jest Config**: `jest.config.cjs`
- **TypeScript Config**: `tsconfig.json`
- **Test Setup**: `setup.ts`
- **Test Utils**: `test-utils.ts`

## 🎯 Writing Tests

### **단위 테스트 예시**
```typescript
// test/unit/core/DocumentScorer.test.ts
import { DocumentScorer } from '../../../src/core/DocumentScorer';

describe('DocumentScorer', () => {
  it('should calculate priority score correctly', () => {
    const scorer = new DocumentScorer();
    const score = scorer.calculateScore(mockDocument);
    expect(score).toBeGreaterThan(0);
  });
});
```

### **통합 테스트 예시**
```typescript
// test/integration/document-processing.test.ts
import { CategoryMinimumGenerator } from '../../src/core/CategoryMinimumGenerator';

describe('Document Processing Integration', () => {
  it('should process documents end-to-end', async () => {
    const generator = new CategoryMinimumGenerator();
    const result = await generator.generateSingle('api-spec', 'en');
    expect(result.success).toBe(true);
  });
});
```

## 📝 Test Data Management

### **Mock Data**
- 모든 mock 데이터는 `helpers/` 또는 `fixtures/`에 저장
- 재사용 가능한 형태로 구성

### **Output Cleanup**
- 테스트 실행 전후 `outputs/` 디렉토리 자동 정리
- CI/CD에서 아티팩트로 수집 가능

### **Workspace Isolation**
- 각 테스트는 독립된 작업 공간 사용
- 테스트 간 간섭 방지