---
document_id: guide--useStoreManager-api
category: guide
source_path: ko/guide/patterns/store/useStoreManager-api.md
character_limit: 500
last_update: '2025-08-26T00:34:27.382Z'
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

이름으로 타입이 지정된 스토어 인스턴스를 가져옵니다. 이것은 스토어에 접근하는 주요 메소드입니다.
