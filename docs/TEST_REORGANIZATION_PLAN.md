# Test Structure Reorganization Plan

> 🔄 **자동 생성**: 2025-09-19

## 🎯 목표

테스트 코드 → 기능 설명 문서 → 추가 테스트 코드의 삼각관계를 명확하게 관리하고, 중복 없이 체계적으로 구성

## 📊 현재 상황 분석

### 중복 테스트 현황
- 🔍 **총 7개 중복 패턴 발견**

#### should export createactioncontext:createActionContext,function
- **유사도**: 100%
- **파일들**: advanced.test.ts, index.test.ts
- **권장사항**: merge → single comprehensive test
- **이유**: 동일한 기능의 단위 테스트들

#### should handle listener errors gracefully:error,store
- **유사도**: 100%
- **파일들**: Store.test.ts, StoreRegistry.test.ts
- **권장사항**: review → manual inspection needed
- **이유**: 복합적인 중복 패턴, 수동 검토 필요

#### should return true for identical values:
- **유사도**: NaN%
- **파일들**: comparison.test.tsx, comparison.test.tsx
- **권장사항**: merge → single comprehensive test
- **이유**: 동일한 기능의 단위 테스트들

#### should handle primitives:a,b
- **유사도**: 100%
- **파일들**: comparison.test.tsx, comparison.test.tsx
- **권장사항**: merge → single comprehensive test
- **이유**: 동일한 기능의 단위 테스트들

#### should use immer optimization by default:
- **유사도**: NaN%
- **파일들**: immutable.test.tsx, immutable.test.tsx
- **권장사항**: merge → single comprehensive test
- **이유**: 동일한 기능의 단위 테스트들

#### should return original reference when cloning disabled:
- **유사도**: NaN%
- **파일들**: immutable.test.tsx, immutable.test.tsx
- **권장사항**: merge → single comprehensive test
- **이유**: 동일한 기능의 단위 테스트들

#### should reject nonobjects:preventDefault
- **유사도**: 100%
- **파일들**: type-guards.test.ts, type-guards.test.ts
- **권장사항**: merge → single comprehensive test
- **이유**: 동일한 기능의 단위 테스트들



### 현재 디렉토리 구조
- **actions**: 5개 파일
- **.**: 4개 파일
- **concurrency**: 1개 파일
- **patterns**: 1개 파일
- **refs**: 5개 파일
- **stores/core**: 2개 파일
- **stores**: 1개 파일
- **stores/hooks**: 4개 파일
- **stores/patterns**: 3개 파일
- **stores/performance**: 1개 파일
- **stores/utils**: 7개 파일


## 🏗️ 제안하는 최적 구조

### 새로운 디렉토리 구조
```
packages/react/__tests__/
├── api/            # API 정확성 테스트 (진실 공급원)
├── usage/          # 사용법 예제 테스트 (문서 생성용)
├── integration/    # 통합 시나리오 테스트
├── validation/     # 문서 검증 테스트 (자동 생성)
├── performance/    # 성능 테스트
├── unit/           # 기타 단위 테스트
```

### 구조별 책임

#### 1. **api/** - API 정확성 테스트 (진실 공급원)
- **목적**: API의 정확한 동작 정의
- **특징**: 실제 구현을 검증하는 핵심 테스트
- **명명**: `{API명}.api.test.tsx`

#### 2. **usage/** - 사용법 예제 테스트 (문서 생성용)
- **목적**: 사용법 문서 자동 생성
- **특징**: `@doc-extract` 어노테이션 포함
- **명명**: `{API명}.usage.test.tsx`

#### 3. **integration/** - 통합 시나리오 테스트
- **목적**: 여러 API 조합 시나리오 검증
- **특징**: 실제 사용 패턴 테스트
- **명명**: `{패턴명}.integration.test.tsx`

#### 4. **validation/** - 문서 검증 테스트 (자동 생성)
- **목적**: 문서 예제의 실행 가능성 검증
- **특징**: 시스템이 자동 생성
- **명명**: `{API명}.docs.test.tsx`

#### 5. **performance/** - 성능 테스트
- **목적**: 성능 기준점 검증
- **특징**: 메모리 누수, 렌더링 최적화 검증

#### 6. **unit/** - 기타 단위 테스트
- **목적**: 세부 기능 단위 테스트
- **특징**: 내부 로직 검증

## 🔄 마이그레이션 계획

### Phase 1: 디렉토리 구조 생성

**Create Directory Structure**
- create-directory: API 정확성 테스트 (진실 공급원)
- create-directory: 사용법 예제 테스트 (문서 생성용)
- create-directory: 통합 시나리오 테스트
- create-directory: 문서 검증 테스트 (자동 생성)
- create-directory: 성능 테스트
- ... 총 6개 액션


### Phase 2: 파일 이동

**Move Test Files**
- move-file: unit-test → unit mapping
- move-file: unit-test → unit mapping
- move-file: unit-test → unit mapping
- move-file: unit-test → unit mapping
- move-file: unit-test → unit mapping
- ... 총 34개 액션


### Phase 3: 중복 테스트 통합

**Consolidate Duplicates**


## 🎯 기대 효과

### 개발자 경험
- **명확한 책임**: 각 테스트의 목적이 디렉토리로 명확히 구분
- **효율적 작업**: 필요한 테스트만 수정하여 문서 자동 생성
- **중복 방지**: 구조적으로 중복 테스트 방지

### 시스템 효율성
- **자동화**: 테스트 → 문서 → 검증 파이프라인 자동화
- **일관성**: 단일 진실 공급원 기반 일관성 보장
- **확장성**: 새로운 API 추가 시 명확한 가이드라인

### 품질 관리
- **실시간 검증**: 문서 예제의 실행 가능성 실시간 검증
- **버전 동기화**: 코드 변경 시 문서 자동 업데이트
- **신뢰성**: 테스트로 검증된 문서만 공개

## 🚀 실행 명령어

### 자동 마이그레이션
```bash
# 전체 재구성 실행
pnpm test:reorganize

# 단계별 실행
pnpm test:reorganize --phase=1  # 디렉토리 구조 생성
pnpm test:reorganize --phase=2  # 파일 이동
pnpm test:reorganize --phase=3  # 중복 통합
```

### 검증 및 확인
```bash
# 재구성 결과 확인
pnpm test:structure-check

# 중복 테스트 재분석
pnpm test:analyze-duplicates

# 문서 생성 테스트
pnpm docs:enhanced --packages react
```

## 📈 성공 지표

- **중복률 감소**: 7개 중복 → 0개 목표
- **문서 동기화**: 100% 자동 문서 생성
- **검증 커버리지**: 모든 문서 예제 자동 검증
- **유지보수성**: 테스트 수정 시 문서 자동 업데이트

---

*📝 이 계획은 [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)에 의해 자동 생성됩니다.*
