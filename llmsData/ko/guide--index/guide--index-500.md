---
document_id: guide--index
category: guide
source_path: ko/guide/patterns/index.md
character_limit: 500
last_update: '2025-08-21T02:13:42.405Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
코드 패턴

Context-Action 프레임워크의 RefContext와 useWaitForRefs 기능에 중점을 둔 필수 패턴 모음입니다. 핵심 패턴

RefContext 설정
적절한 TypeScript 타입과 provider 통합을 위한 RefContext의 기본 설정 패턴입니다. 조건부 대기
요소 마운트 상태에 따라 조건부로 대기하거나 즉시 반환하는 useWaitForRefs의 핵심 동작입니다. 대기 후 실행
요소 가용성을 보장한 후 안전하게 DOM 조작을 실행하는 패턴입니다. 실시간 상태 접근
store.getValue()를 사용하여 현재 상태에 실시간으로 접근하여 클로저 함정을 방지하는 패턴입니다. 타임아웃 보호
타임아웃 메커니즘과 재시도 로직으로 무한 대기를 방지하는 패턴입니다.
