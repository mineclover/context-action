---
document_id: troubleshooting--store-issues
category: troubleshooting
source_path: ko/troubleshooting/store-issues.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.436Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스토어 및 상태 문제

스토어 및 상태 문제 개요 스토어 상태 관리, 구독, 업데이트 관련 문제 해결 방법을 설명합니다. 일반적인 스토어 문제 1. 상태 업데이트가 반영되지 않음 문제: setValue 호출 후 컴포넌트가 업데이트되지 않음 해결책: 2. 참조 동일성 문제 문제: 객체 상태 업데이트 시 참조가 동일해서 리렌더링 안됨 해결책: 3. 메모리 누수 문제: 컴포넌트 언마운트 후에도 구독이 남아있음 해결책: useStoreValue와 useStoreSelector는 자동으로 정리됨 4. 초기값 설정 문제 문제: 스토어 초기값이 올바르게 설정되지 않음 해결책: 고급 패턴 계산된 스토어 사용 조건부 구독 디버깅 도구 1. 스토어 상태 확인: getValue()로 현재 상태 출력 2. 구독자 수 확인: 메모리 누수 방지 3.

Key points:
• **스토어 상태 확인**: getValue()로 현재 상태 출력
• **구독자 수 확인**: 메모리 누수 방지
• **React DevTools**: 컴포넌트 상태 변화 추적