# 용어집-코드 매핑 시스템

## 📋 개요

**표준 JSDoc 기반 매핑 시스템**으로 용어집과 실제 구현 코드를 연결합니다.

### 핵심 원칙
- **표준 준수**: JSDoc 표준 태그 사용 (`@implements`, `@memberof`)
- **느슨한 결합**: 용어집과 코드의 독립적 발전
- **역방향 참조**: 코드가 용어집을 참조

## 🏷️ JSDoc 태그 시스템

```typescript
/**
 * 액션 실행을 제어하는 통합 훅
 * 
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 * @example
 * ```typescript
 * const guard = useActionGuard({ mode: 'debounce' });
 * ```
 */
export interface ThrottleOptions { ... }
```

### 태그 종류

| JSDoc 태그 | 설명 | 필수 여부 |
|-----------|------|----------|
| `@implements` | 구현하는 용어집 용어 | **필수** |
| `@memberof` | 소속 용어집 카테고리 | **필수** |
| `@example` | 사용법 예시 코드 | 권장 |
| `@since` | 버전 정보 | 선택 |

## 🔧 도구 시스템

### @context-action/glossary 패키지
```bash
# 패키지 빌드
pnpm --filter @context-action/glossary build

# 코드 스캔
pnpm glossary:scan

# 매핑 검증
pnpm glossary:validate
```

## 📊 현재 상태 (2025-08-01)

- **전체 용어집 용어**: 40개
- **매핑된 용어**: 3개 (8%)
- **스캔된 파일**: 82개
- **태그가 있는 파일**: 5개

### 매핑된 용어
- `action-handler` (4개 구현)
- `pipeline-controller` (2개 구현) 
- `action-payload-map` (1개 구현)