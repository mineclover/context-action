# 용어집 시스템 사용법 가이드

## 🚀 빠른 시작

### 1. 시스템 확인
```bash
# 패키지 빌드
pnpm --filter @context-action/glossary build
```

### 2. 코드 스캔 실행
```bash
pnpm glossary:scan
```

### 3. 매핑 검증
```bash
pnpm glossary:validate
```

### 4. 결과 확인
```bash
# 매핑 결과
cat docs/implementations/_data/mappings.json

# 검증 리포트
cat docs/implementations/_data/validation-report.json
```

## 📝 JSDoc 태그 작성법

### 기본 태그 구조
```typescript
/**
 * 컴포넌트 또는 함수에 대한 설명
 * 
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 * @example
 * ```typescript
 * const example = useHook();
 * ```
 */
```

### 필수 태그

#### @implements (필수)
```typescript
/**
 * @implements action-handler
 * @implements pipeline-controller  // 여러 용어 가능
 */
```

#### @memberof (필수)
```typescript
/**
 * @memberof core-concepts
 */
```

## 📚 용어집 카테고리

### core-concepts
핵심 개념 및 시스템
- `action-handler`
- `pipeline-controller` 
- `action-payload-map`

### architecture-terms  
아키텍처 패턴 및 설계
- `mvvm-pattern`
- `view-layer`
- `business-logic`

### api-terms
API 및 구현 관련
- `actionregister`
- `storeprovider`
- `store-hooks`

### naming-conventions
코딩 컨벤션 및 네이밍 규칙
- `class-naming`
- `interface-naming`
- `function-naming`

## 🔍 실제 사용 예시

### React 훅 예시
```typescript
/**
 * 액션 스로틀링 훅
 * 지정된 간격으로만 액션 실행을 허용하여 고빈도 호출을 제어합니다.
 * 
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 * @example
 * ```typescript
 * const throttle = useActionThrottle({ interval: 500 });
 * ```
 */
export interface ThrottleOptions {
  interval: number;
}
```

## 🆕 새로운 분석 도구들

### 양방향 미구현 분석
```bash
# 미구현 항목 양방향 분석
pnpm glossary:missing
```

### 구현 현황 대시보드
```bash
# 전체 구현 현황 대시보드 생성
pnpm glossary:dashboard
```

### 통합 업데이트 (권장)
```bash
# 모든 도구를 순서대로 실행
pnpm glossary:update

# 실행 순서:
# 1. glossary:scan - 코드 스캔
# 2. glossary:validate - 매핑 검증  
# 3. glossary:missing - 미구현 분석
# 4. glossary:dashboard - 대시보드 생성
```

## 📊 결과 파일들

### 생성되는 파일 구조
```
docs/implementations/_data/
├── mappings.json              # 스캔된 매핑 데이터
├── validation-report.json     # 검증 결과 리포트
├── missing-analysis-report.json  # 양방향 미구현 분석 결과
└── dashboard.json            # 대시보드 JSON 데이터

docs/implementations/
└── dashboard.md              # 마크다운 대시보드
```