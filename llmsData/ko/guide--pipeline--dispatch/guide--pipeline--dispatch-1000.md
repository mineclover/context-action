---
document_id: guide--pipeline--dispatch
category: guide
source_path: ko/guide/pipeline/dispatch.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.377Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
디스패치 메서드

디스패치 메서드 다양한 수준의 제어와 결과 수집으로 액션 파이프라인을 트리거하는 다양한 방법. 핵심 디스패치 메서드 기본 디스패치 결과 수집 없이 간단한 액션 실행: 결과 수집과 함께 디스패치 상세한 결과와 함께 포괄적인 실행: React 통합 디스패치 useActionDispatch 훅 React 컴포넌트에서의 기본 디스패치: useActionDispatchWithResult 훅 React 컴포넌트에서의 결과 수집: 디스패치 옵션 타임아웃 구성 타임아웃으로 무한 대기를 방지합니다: 결과 수집 옵션 어떤 결과를 수집할지 제어합니다: 고급 디스패치 패턴 조건부 디스패치 배치 디스패치 디스패치에서의 오류 처리 디스패치 결과 구조 성공 결과 중단된 결과 타임아웃 결과 성능 최적화 효율적인 디스패치 배치 결과 수집 사용 사례별

Key points:
• **[우선순위 시스템](./priority.md)** - 우선순위로 실행 순서 제어
• **[차단 작업](./blocking.md)** - 실행 플로우 제어
• **[중단 메커니즘](./abort.md)** - 필요시 파이프라인 실행 중지
• **[결과 처리](./result-handling.md)** - 디스패치 결과 처리와 사용