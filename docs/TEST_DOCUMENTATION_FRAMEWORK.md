# Test-Documentation Management Framework

## 🎯 목표: 삼각관계의 완전한 일관성

테스트 코드 → 기능 설명 문서 → 추가 테스트 코드가 서로 보완하면서도 중복 없이 명확하게 관리되는 체계 구축

## 📋 현재 문제점 분석

### 1. 삼각관계 불일치
- **테스트 코드**: 구현 중심의 검증
- **기능 설명 문서**: 사용자 중심의 설명
- **추가 테스트 코드**: 문서 검증을 위한 또 다른 테스트

### 2. 중복 관리 부담
- 같은 API가 3곳에서 다르게 표현됨
- 변경 시 3곳 모두 수동 업데이트 필요
- 일관성 보장의 어려움

### 3. 진실 공급원(Source of Truth) 부재
- 어떤 문서가 최신인지 불분명
- 충돌 발생 시 우선순위 불명확

## 🏗️ 해결책: 단일 진실 공급원 기반 자동화 체계

### 핵심 원칙

#### 1. **테스트 코드 = 진실 공급원 (Single Source of Truth)**
```typescript
// 테스트 코드가 API의 정확한 동작을 정의
describe('createActionContext API', () => {
  it('should create action context with type safety', () => {
    // 이 테스트가 API의 정확한 사용법을 정의
  });
});
```

#### 2. **문서 = 테스트에서 자동 생성**
```markdown
<!-- 테스트 코드에서 자동 추출된 사용법 -->
## 기본 사용법
createActionContext를 사용하여 타입 안전한 액션 컨텍스트를 생성할 수 있습니다.
```

#### 3. **추가 테스트 = 문서 검증용**
```typescript
// 문서의 예제가 실제로 동작하는지 검증
describe('Documentation Examples Validation', () => {
  it('should validate all examples in createActionContext.md', () => {
    // 문서 예제 코드 실행 및 검증
  });
});
```

## 🔄 자동화 워크플로우

### 1단계: 테스트 작성 (개발자)
```typescript
// packages/react/__tests__/createActionContext.usage.test.tsx
describe('createActionContext usage examples', () => {
  it('basic usage with type safety', () => {
    // @doc-extract: basic-usage
    const { Provider, useActionDispatch } = createActionContext<UserActions>('User');
    // 실제 동작하는 코드
  });
});
```

### 2단계: 문서 자동 생성 (시스템)
```bash
pnpm docs:enhanced --packages react  # 테스트에서 문서 생성
pnpm docs:sync                       # API 문서와 동기화
```

### 3단계: 문서 검증 테스트 자동 생성 (시스템)
```typescript
// 자동 생성된 검증 테스트
describe('Generated Documentation Validation', () => {
  it('validates createActionContext basic-usage example', () => {
    // 문서에서 추출한 예제 코드를 실제로 실행
  });
});
```

## 📁 파일 구조 체계

### 테스트 파일 분류
```
packages/react/__tests__/
├── api/                     # API 정확성 테스트 (진실 공급원)
│   ├── createActionContext.api.test.tsx
│   ├── useStoreValue.api.test.tsx
│   └── createStoreContext.api.test.tsx
├── usage/                   # 사용법 예제 테스트 (문서 생성용)
│   ├── createActionContext.usage.test.tsx
│   ├── useStoreValue.usage.test.tsx
│   └── createStoreContext.usage.test.tsx
├── integration/             # 통합 시나리오 테스트
│   └── patterns.integration.test.tsx
└── validation/              # 문서 검증 테스트 (자동 생성)
    ├── createActionContext.docs.test.tsx  # 자동 생성
    ├── useStoreValue.docs.test.tsx        # 자동 생성
    └── createStoreContext.docs.test.tsx   # 자동 생성
```

### 문서 구조
```
docs/
├── api/                     # 자동 생성 API 문서
│   ├── generated/           # TypeDoc 생성
│   └── enhanced/            # 테스트에서 추출한 사용법 추가
├── guides/                  # 수동 작성 가이드
└── examples/                # 테스트에서 추출한 예제
```

## 🏷️ 어노테이션 시스템

### 테스트 코드 어노테이션
```typescript
describe('createActionContext', () => {
  // @doc-extract: basic-usage
  // @doc-category: getting-started
  // @doc-priority: high
  it('should create basic action context', () => {
    // 이 테스트는 기본 사용법 문서로 추출됨
  });

  // @doc-extract: advanced-patterns
  // @doc-category: advanced
  // @doc-priority: medium
  it('should handle complex scenarios', () => {
    // 고급 패턴 문서로 추출됨
  });
});
```

### 자동 추출 규칙
- `@doc-extract: {id}`: 해당 테스트를 문서로 추출
- `@doc-category: {category}`: 문서 카테고리 분류
- `@doc-priority: {level}`: 문서 우선순위 설정

## 🔧 도구 체계

### 1. 문서 추출 도구
```bash
# 테스트에서 문서 추출
pnpm docs:extract --from-tests
pnpm docs:extract --api=createActionContext
pnpm docs:extract --category=getting-started
```

### 2. 검증 테스트 생성 도구
```bash
# 문서 예제에서 검증 테스트 생성
pnpm test:generate-validation
pnpm docs:validate-docs
```

### 3. 일관성 검사 도구
```bash
# 테스트-문서 일관성 검사
pnpm docs:consistency-check
pnpm docs:diff-analysis
```

## 📊 품질 메트릭

### 자동 측정 지표
- **문서 커버리지**: 테스트 대비 문서화된 API 비율
- **예제 검증률**: 문서 예제의 실행 성공률
- **동기화 점수**: 테스트-문서 간 일치도
- **중복 제거율**: 동일 내용의 중복 감소 정도

### 대시보드
```bash
pnpm docs:dashboard  # 품질 메트릭 대시보드 생성
```

## 🎯 구현 로드맵

### Phase 1: 어노테이션 시스템 구축
- [ ] 테스트 어노테이션 파서 구현
- [ ] 문서 추출 파이프라인 구축
- [ ] 기본 검증 테스트 생성기 구현

### Phase 2: 자동화 워크플로우 구축
- [ ] CI/CD 통합
- [ ] 실시간 동기화 시스템
- [ ] 품질 메트릭 대시보드

### Phase 3: 고도화
- [ ] AI 기반 문서 품질 개선
- [ ] 다국어 지원
- [ ] 인터랙티브 예제 생성

## 🎉 기대 효과

### 개발자 경험 개선
- **단일 작업**: 테스트만 작성하면 문서 자동 생성
- **항상 최신**: 테스트 변경 시 문서 자동 업데이트
- **일관성 보장**: 시스템이 일관성 자동 관리

### 사용자 경험 개선
- **정확한 문서**: 실제 동작하는 코드 기반
- **풍부한 예제**: 모든 API에 검증된 예제
- **신뢰할 수 있는 가이드**: 테스트로 검증된 내용

### 유지보수성 향상
- **중복 제거**: 하나의 소스에서 모든 문서 생성
- **자동 검증**: 변경사항 자동 검증
- **품질 관리**: 메트릭 기반 품질 관리