# Documentation Validation Report

> 🔄 **자동 생성**: 2025-09-19

## 📊 검증 요약

### 전체 상태
- **테스트-문서 매핑**: 3개 검증
- **문서 예제**: 1개 파일 검증
- **API 영향 분석**: 완료

## 🔗 테스트-문서 매핑 상태

### createActionContext

- **상태**: 🔶 PARTIAL
- **메시지**: Some annotations not reflected in documentation
- **액션**: Re-extract documentation from tests
- **어노테이션**: 2개
- **테스트 파일**: `createActionContext.usage.test.tsx`
- **문서 파일**: ✅ `createActionContext.enhanced.md`

### useStoreValue

- **상태**: ❌ MISSING
- **메시지**: Documentation file does not exist
- **액션**: Run pnpm docs:extract-from-tests
- **어노테이션**: 0개
- **테스트 파일**: `useStoreValue.usage.test.tsx`
- **문서 파일**: ❌ `useStoreValue.enhanced.md`

### createStoreContext

- **상태**: ❌ MISSING
- **메시지**: Documentation file does not exist
- **액션**: Run pnpm docs:extract-from-tests
- **어노테이션**: 0개
- **테스트 파일**: `createStoreContext.usage.test.tsx`
- **문서 파일**: ❌ `createStoreContext.enhanced.md`


## 🧪 문서 예제 검증 결과

### createActionContext

- **전체 점수**: 43/100
- **예제 수**: 2개
- **문제 예제**: 2개


#### 예제 1
- **구문 검증**: ❌
- **Import 해결**: 100%
- **실행 점수**: 25/100
- **문제점**: Unbalanced ( brackets

#### 예제 2
- **구문 검증**: ❌
- **Import 해결**: 100%
- **실행 점수**: 35/100
- **문제점**: Unbalanced ( brackets



## 🔄 API 변경 영향 분석

### 누락된 문서
- ✅ 없음

### 오래된 예제
- ✅ 없음


## 🎯 개선 권장사항

### 즉시 실행 가능한 작업
1. **동기화되지 않은 문서들**:
   ```bash
   pnpm docs:enhanced --packages react
   ```

2. **누락된 문서들**:
   - 해당 API의 usage 테스트에 `@doc-extract` 어노테이션 추가

3. **예제 품질 개선**:
   - 테스트 코드 패턴 제거
   - 필수 import 문 추가
   - any 타입 사용 최소화

### 자동화 개선
- CI/CD 파이프라인에 검증 단계 추가
- pre-commit hook으로 문서 동기화 강제
- 주기적 문서 품질 모니터링

## 📈 메트릭

### 문서 동기화율
0%

### 예제 품질 점수
43/100

---

*📝 이 보고서는 [@context-action/test-driven-docs](https://www.npmjs.com/package/@context-action/test-driven-docs)에 의해 자동 생성됩니다.*

**다음 검증 실행**: `pnpm docs:validate-docs`
