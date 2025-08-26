---
document_id: guide--useStoreManager-api
category: guide
source_path: ko/guide/patterns/store/useStoreManager-api.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.383Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
useStoreManager API

useStoreManager 훅은 선언적 스토어 패턴에서 고급 스토어 관리 시나리오를 위한 내부 StoreManager 인스턴스에 대한 저레벨 접근을 제공합니다. 사전 요구사항

기본 스토어 설정과 컨텍스트 생성은 기본 스토어 설정 을 참조하세요. 이 문서는 스토어 설정을 사용한 API 사용법을 보여줍니다:
- 스토어 설정 → 타입 추론 설정
- 컨텍스트 생성 → 단일 도메인 스토어 컨텍스트

기본 사용법

스토어 매니저 가져오기

스토어 작업

API 참조

manager.getStore(storeName)

이름으로 타입이 지정된 스토어 인스턴스를 가져옵니다. 이것은 스토어에 접근하는 주요 메소드입니다. 스토어 인스턴스 메소드

스토어 인스턴스를 가져온 후에는 다음 메소드를 사용할 수 있습니다:

매니저 유틸리티 메소드

고급 패턴

벌크 스토어 작업

조건부 스토어 업데이트

검증이 있는 스토어 매니저

액션과의 통합

스토어 매니저는 복잡한 비즈니스 로직을 위해 액션 컨텍스트와 완벽하게 작동합니다:

성능 고려사항

배치 업데이트

메모이제이션된 업데이트

오류 처리

안전한 스토어 작업

TypeScript 지원

스토어 매니저는 완전한 타입 안전성을 제공합니다:

모범 사례

1. 복잡한 상태에 함수형 업데이트 사용

2. 성능을 위해 useCallback과 결합

3. 관련 업데이트에 스토어 매니저 사용

4. useStore 훅보다 직접 스토어 접근을 선호

실제 예제

- 사용자 프로필 관리
- 쇼핑 카트 작업
- 설정 패널

스토어 매니저 사용 시기

스토어 매니저를 사용해야 하는 경우:
- 여러 스토어 작업: 하나의 함수에서 여러 스토어를 업데이트해야 할 때
- 고급 스토어 로직: 직접 스토어 접근이 필요한 복잡한 상태 조작
- 성능 최적화: 배치 작업이나 여러 훅 호출 피하기
- 액션 핸들러: 여러 스토어에 걸친 비즈니스 로직
- 커스텀 스토어 유틸리티: 재사용 가능한 스토어 조작 함수 구축

일반 훅을 사용해야 하는 경우:
- 간단한 상태 접근: 단일 스토어 읽기나 업데이트만
- 컴포넌트 렌더링: 반응형 UI 업데이트를 위한 useStoreValue 사용
- 기본 작업: 간단한 setValue/getValue 작업

관련 문서

- 기본 스토어 사용법 - 기본 스토어 패턴
- useStoreValue 패턴 - 고급 훅 패턴
- withProvider 패턴 - 고차 컴포넌트 패턴
- 액션 통합 - 액션과의 통합.
