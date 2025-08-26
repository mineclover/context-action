---
document_id: guide--singleton-handling
category: guide
source_path: ko/guide/patterns/ref/singleton-handling.md
character_limit: 500
last_update: '2025-08-26T00:34:27.376Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
컨텍스트 싱글톤 처리

Context-Action 프레임워크에서 지연 평가와 적절한 라이프사이클 제어를 위한 RefContext를 사용한 컨텍스트 싱글톤 관리 패턴입니다. 선행 요건

RefContext 설정 참조:
- 가져오기 문과 기본 설정
- 타입 정의 (ServiceRefs, ManagerRefs 등)
- 프로바이더 구성 패턴
- 초기화 패턴

가져오기

정의

컨텍스트 싱글톤: 특정 React 컨텍스트 경계 내에서 단일 인스턴스로 존재하는 객체로, 지연 평가와 적절한 라이프사이클 제어를 위해 RefContext를 통해 관리됩니다.
