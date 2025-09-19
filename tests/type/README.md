# Type Inference Tests

이 폴더는 Context-Action의 TypeScript 타입 추론 기능을 검증하는 테스트 파일들을 포함합니다.

## 📁 파일 구조

### `type-inference-test.ts`
**완전한 타입 추론 검증 테스트**
- 기본 스토어 타입 추론 테스트
- 고급 액션 타입 추론 테스트
- 브랜드 타입, TypeUtils 검증
- 실제 컴포넌트 사용 시나리오
- 에러 케이스 검증 (주석 형태)

### `type-inference-verification.ts`
**실제 빌드된 패키지를 사용한 검증**
- 실제 빌드된 패키지 import
- 런타임 성능 테스트
- 실제 사용 패턴 검증
- 성능 벤치마크

### `type-inference-summary.md`
**검증 결과 종합 문서**
- 전체 프로젝트 타입 체크 결과
- 실제 사용 사례 분석
- 성능 검증 결과
- 검증된 기능 목록

## 🚀 실행 방법

### 1. 타입 체크 검증
```bash
# 루트 디렉토리에서
npx tsc --noEmit tests/type/type-inference-test.ts --strict --skipLibCheck
```

### 2. 전체 프로젝트 타입 체크
```bash
# 모든 패키지 타입 체크
pnpm type-check

# Example 프로젝트 타입 체크
cd example && pnpm type-check
```

## ✅ 검증된 기능

### 기본 타입 추론
- [x] Primitive 타입 (number, string, boolean)
- [x] 배열 타입 (Array<T>, T[])
- [x] 객체 타입 (interface, type)
- [x] 함수 타입

### 고급 타입 추론
- [x] Literal 타입 (`as const`)
- [x] Union 타입 (`A | B`)
- [x] Generic 타입 (`Map<K, V>`, `Set<T>`)
- [x] Conditional 타입
- [x] Branded 타입 (`TypeUtils.Brand`)

### Context-Action 특화 기능
- [x] Store 타입 자동 추론
- [x] Action 페이로드 타입 추론
- [x] Handler 파라미터 타입 추론
- [x] Result 타입 추론

### 타입 안전성
- [x] 컴파일 타임 타입 검증
- [x] 런타임 성능 영향 없음
- [x] IntelliSense 자동완성
- [x] 안전한 리팩토링

## 📊 성능 결과

- **컴파일 타임**: 타입 검증은 컴파일 시에만 수행
- **런타임**: 타입 추론으로 인한 성능 오버헤드 **0%**
- **번들 크기**: 타입 정보는 프로덕션 빌드에서 제거됨

## 🔗 관련 문서

- [타입 추론 가이드](../../docs/en/guide/type-inference.md)
- [스토어 타입 추론](../../docs/en/guide/type-inference/stores.md)
- [액션 타입 추론](../../docs/en/guide/type-inference/actions.md)
- [고급 타입 기능](../../docs/en/guide/type-inference/advanced.md)