# Tests

Context-Action 프레임워크의 다양한 테스트와 검증 파일들을 포함합니다.

## 📁 폴더 구조

### `type/` - TypeScript 타입 추론 테스트
Context-Action의 TypeScript 타입 추론 시스템 검증을 위한 테스트 파일들

- **`type-inference-test.ts`** - 완전한 타입 추론 검증 테스트
- **`type-inference-verification.ts`** - 실제 빌드된 패키지 검증
- **`type-inference-summary.md`** - 검증 결과 종합 문서
- **`README.md`** - 타입 테스트 가이드

## 🚀 실행 가이드

### 타입 추론 테스트 실행
```bash
# 타입 체크 검증
npx tsc --noEmit tests/type/type-inference-test.ts --strict --skipLibCheck

# 전체 프로젝트 타입 체크
pnpm type-check
```

### 다른 테스트들
```bash
# 단위 테스트 (packages 내부)
pnpm test

# Example 프로젝트 테스트
cd example && pnpm test
```

## 📋 테스트 종류

### ✅ 타입 추론 테스트
- 기본 타입 자동 추론
- 고급 타입 기능 (Generic, Union, Conditional)
- Context-Action 특화 타입 추론
- 컴파일 타임 타입 안전성

### ✅ 단위 테스트 (packages/)
- ActionRegister 테스트
- Store 시스템 테스트
- React 통합 테스트
- 성능 테스트

### ✅ 통합 테스트 (example/)
- 실제 사용 시나리오 검증
- 복잡한 애플리케이션 패턴
- 성능 및 메모리 테스트

## 🔗 관련 문서

- [타입 추론 가이드](../docs/en/guide/type-inference.md)
- [테스트 가이드](../docs/en/guide/testing.md)
- [개발 가이드](../docs/en/guide/development.md)