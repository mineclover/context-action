# 용어집 구현 현황 대시보드

> 🕒 최종 업데이트: 2025. 8. 5. 오전 12:43:22
> 
> 📊 자동 생성된 구현 현황 리포트입니다.

## 📈 전체 현황

### 구현 통계
- **전체 용어집 용어**: 91개
- **구현된 용어**: 73개
- **구현률**: **80%**
- **스캔된 파일**: 162개
- **태그가 있는 파일**: 45개

### 품질 현황
- **검증 상태**: ❌ 실패
- **에러**: 19개
- **경고**: 76개

## 📊 카테고리별 현황


### 🎯 핵심 개념

🟠 **개선필요** (49%)

- 구현 완료: 44/89개
- 미구현: 7개


**우선순위 구현 대상:**
- Action Payload Map
- ActionProvider
- Cross-Store Coordination



**최근 구현:**
- store-integration-pattern
- action-pipeline-system



### 🏗️ 아키텍처

🔴 **시작단계** (4%)

- 구현 완료: 3/76개
- 미구현: 5개


**우선순위 구현 대상:**
- MVVM Pattern
- View Layer
- ViewModel Layer



**최근 구현:**
- lazy-evaluation
- store-immutability



### 🔌 API 용어

🟠 **개선필요** (41%)

- 구현 완료: 30/74개
- 미구현: 0개

**✅ 모든 핵심 용어 구현 완료**


**최근 구현:**
- universal-trace-collection
- dual-collection-distinction



### 📝 네이밍 규칙

🔴 **시작단계** (0%)

- 구현 완료: 0/84개
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



- **business-logic** `createValidatedHandler` (function)
  - 📁 `packages/react/src/actions/utils/ActionHandlerUtils.ts`
  - 📅 2025. 8. 5.


- **domain-rules** `createValidatedHandler` (function)
  - 📁 `packages/react/src/actions/utils/ActionHandlerUtils.ts`
  - 📅 2025. 8. 5.


- **store-integration-pattern** `Store` (class)
  - 📁 `packages/react/src/stores/core/Store.ts`
  - 📅 2025. 8. 5.


- **store-registry** `IStoreRegistry` (interface)
  - 📁 `packages/react/src/stores/core/types.ts`
  - 📅 2025. 8. 5.


- **store-registry** `StoreRegistry` (class)
  - 📁 `packages/react/src/stores/core/StoreRegistry.ts`
  - 📅 2025. 8. 5.



## 📈 진행 트렌드

- **구현 속도**: + 3 용어/주
- **가장 활발한 카테고리**: core-concepts
- **완료 예상 시기**: 1-2개월

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

<!-- Dashboard generated at 2025-08-04T15:43:22.526Z -->