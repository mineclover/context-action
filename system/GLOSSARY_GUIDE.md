# 용어집 시스템 가이드

이 문서는 용어집 시스템의 사용법, JSDoc 태그 작성법, 그리고 관련 도구 사용법을 안내합니다.

## 🚀 빠른 시작: 시스템 사용법

### 1. 시스템 확인
용어집 관련 패키지가 빌드되었는지 확인합니다.
```bash
# 패키지 빌드
pnpm --filter @context-action/glossary build
```

### 2. 전체 분석 및 업데이트 (권장)
가장 간단한 방법은 모든 도구를 순차적으로 실행하는 통합 명령어를 사용하는 것입니다.
```bash
# 모든 도구를 순서대로 실행
pnpm glossary:update

# 실행 순서:
# 1. glossary:scan - 코드 스캔
# 2. glossary:validate - 매핑 검증  
# 3. glossary:missing - 미구현 분석
# 4. glossary:dashboard - 대시보드 생성
```

### 3. 개별 명령어 실행 (필요시)
특정 작업만 수행하고 싶을 때 사용합니다.
```bash
# 코드 스캔
pnpm glossary:scan

# 매핑 검증
pnpm glossary:validate

# 미구현 항목 양방향 분석
pnpm glossary:missing

# 전체 구현 현황 대시보드 생성
pnpm glossary:dashboard
```

### 4. 결과 확인
분석이 끝나면 생성된 결과 파일들을 확인할 수 있습니다.
```bash
# 매핑 결과
cat docs/implementations/_data/mappings.json

# 검증 리포트
cat docs/implementations/_data/validation-report.json

# 마크다운 대시보드
cat docs/implementations/dashboard.md
```

---

## 🏷️ JSDoc 태그 작성법

용어집과 코드를 연결하기 위해 표준 JSDoc 태그를 사용합니다.

### 기본 태그 구조
```typescript
/**
 * 함수 또는 컴포넌트에 대한 설명
 * 
 * @implements action-handler
 * @memberof core-concepts
 * @since 1.0.0
 * @example
 * ```typescript
 * const result = useMyHook();
 * ```
 */
export function useMyHook() { ... }
```

### 필수 태그

#### `@implements` (필수)
구현하는 용어집의 용어를 명시합니다. 용어 이름은 kebab-case로 작성합니다.
```typescript
// 단일 용어 구현
/** @implements action-handler */

// 여러 용어 동시 구현
/** @implements action-handler, pipeline-controller */
```

#### `@memberof` (필수)  
해당 용어가 속한 용어집 카테고리를 명시합니다.
```typescript
/** @memberof core-concepts */
```

### 📚 용어집 카테고리

| 카테고리 | 설명 |
|---|---|
| `core-concepts` | 프레임워크의 핵심 개념 및 시스템 |
| `architecture-terms` | 아키텍처 패턴 및 설계 원칙 |
| `api-terms` | API 및 구체적인 구현과 관련된 용어 |
| `naming-conventions` | 코딩 및 네이밍 규칙 |

---

## 🎨 적용 예시

### React 훅
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
export function useActionThrottle() { ... }
```

### 클래스
```typescript
/**
 * 액션 등록 및 디스패치를 관리하는 중앙 클래스
 * @implements actionregister
 * @memberof api-terms
 */
export class ActionRegister { ... }
```

### 타입/인터페이스
```typescript
/**
 * 액션과 페이로드 타입을 정의하는 매핑 인터페이스
 * @implements action-payload-map
 * @memberof api-terms
 */
export interface ActionPayloadMap { ... }
```

---

## 📊 결과 파일들

시스템 실행 후 생성되는 주요 파일들은 다음과 같습니다.

```
docs/implementations/
├── dashboard.md              # (Markdown) 구현 현황 대시보드

docs/implementations/_data/
├── mappings.json              # (JSON) 스캔된 모든 태그와 코드 위치 정보
├── validation-report.json     # (JSON) 검증 결과 리포트 (오류, 경고 등)
├── missing-analysis-report.json  # (JSON) 미구현/미정의 용어 분석 결과
└── dashboard.json            # (JSON) 대시보드 생성에 사용되는 데이터
```
