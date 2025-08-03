# 용어집 구현 현황 대시보드

> 🕒 최종 업데이트: 2025. 8. 3. 오후 8:52:46
> 
> 📊 자동 생성된 구현 현황 리포트입니다.

## 📈 전체 현황

### 구현 통계
- **전체 용어집 용어**: 91개
- **구현된 용어**: 61개
- **구현률**: **67%**
- **스캔된 파일**: 99개
- **태그가 있는 파일**: 30개

### 품질 현황
- **검증 상태**: ✅ 통과
- **에러**: 0개
- **경고**: 57개

## 📊 카테고리별 현황


### 🎯 핵심 개념

🟠 **개선필요** (47%)

- 구현 완료: 36/76개
- 미구현: 7개


**우선순위 구현 대상:**
- Action Payload Map
- ActionProvider
- Cross-Store Coordination



**최근 구현:**
- store-integration-pattern
- action-pipeline-system



### 🏗️ 아키텍처

🔴 **시작단계** (5%)

- 구현 완료: 3/64개
- 미구현: 5개


**우선순위 구현 대상:**
- MVVM Pattern
- View Layer
- ViewModel Layer



**최근 구현:**
- lazy-evaluation
- store-immutability



### 🔌 API 용어

🟠 **개선필요** (40%)

- 구현 완료: 25/62개
- 미구현: 0개

**✅ 모든 핵심 용어 구현 완료**


**최근 구현:**
- storeprovider
- pipeline-context



### 📝 네이밍 규칙

🔴 **시작단계** (0%)

- 구현 완료: 0/72개
- 미구현: 12개


**우선순위 구현 대상:**
- Class Naming
- Interface Naming
- Function Naming





## 🎯 우선순위 TODO


### 1. "ActionProvider" 구현

- **우선순위**: 🔴 높음
- **카테고리**: core-concepts
- **예상 작업량**: High
- **영향 파일 수**: 1개

actionprovider을 구현하는 함수/클래스/인터페이스에 @implements actionprovider 태그 추가


## 📊 최근 구현 현황



- **performance-optimization** `useStoreActions` (function)
  - 📁 `packages/react/src/store/hooks/useStoreActions.ts`
  - 📅 2025. 8. 3.


- **selective-subscription** `useStoreValues` (function)
  - 📁 `packages/react/src/store/hooks/useStoreValue.ts`
  - 📅 2025. 8. 3.


- **fresh-state-access** `useStoreValue` (function)
  - 📁 `packages/react/src/store/hooks/useStoreValue.ts`
  - 📅 2025. 8. 3.


- **business-logic** `createValidatedHandler` (function)
  - 📁 `packages/react/src/store/ActionHandlerUtils.ts`
  - 📅 2025. 8. 3.


- **domain-rules** `createValidatedHandler` (function)
  - 📁 `packages/react/src/store/ActionHandlerUtils.ts`
  - 📅 2025. 8. 3.



## 📈 진행 트렌드

- **구현 속도**: + 3 용어/주
- **가장 활발한 카테고리**: core-concepts
- **완료 예상 시기**: 2-3개월

## 🔄 다음 단계

### 즉시 실행 가능
1. **우선순위 HIGH 항목들부터 처리**
2. **코드에서 참조하는 미정의 용어들을 용어집에 추가**
3. **핵심 구현체들에 JSDoc 태그 추가**

### 중장기 계획
1. **각 카테고리별 80% 이상 구현률 달성**
2. **CI/CD 파이프라인에 검증 단계 추가**
3. **구현 가이드라인 문서 작성**

## 📋 상세 리포트

- 📊 [매핑 데이터](/_data/mappings.json)
- 🔍 [검증 리포트](/_data/validation-report.json)
- 📈 [미구현 분석](/_data/missing-analysis-report.json)

---

*이 대시보드는 `node implementation-dashboard.js` 명령어로 자동 생성됩니다.*
*문제가 있거나 개선사항이 있다면 이슈를 생성해주세요.*

<!-- Dashboard generated at 2025-08-03T11:52:46.907Z -->