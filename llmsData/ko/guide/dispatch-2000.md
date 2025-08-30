---
document_id: ko_guide_dispatch
category: guide
source_path: ko/guide/pipeline/dispatch.md
character_limit: 2000
last_update: '2025-08-30T10:45:51.621Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
디스패치 메서드

디스패치 메서드 다양한 수준의 제어와 결과 수집으로 액션 파이프라인을 트리거하는 다양한 방법. 핵심 디스패치 메서드 기본 디스패치 결과 수집 없이 간단한 액션 실행: 결과 수집과 함께 디스패치 상세한 결과와 함께 포괄적인 실행: React 통합 디스패치 useActionDispatch 훅 React 컴포넌트에서의 기본 디스패치: useActionDispatchWithResult 훅 React 컴포넌트에서의 결과 수집: 디스패치 옵션 타임아웃 구성 타임아웃으로 무한 대기를 방지합니다: 결과 수집 옵션 어떤 결과를 수집할지 제어합니다: 고급 디스패치 패턴 조건부 디스패치 배치 디스패치 디스패치에서의 오류 처리 디스패치 결과 구조 성공 결과 중단된 결과 타임아웃 결과 성능 최적화 효율적인 디스패치 배치 결과 수집 사용 사례별 디스패치 패턴 1. 발사 후 망각 (분석) 2. 검증 파이프라인 (결과 수집) 3. 다단계 작업 (진행 상황 추적) 실제 예제: 디스패치를 사용한 결과 수집 UseActionWithResult 데모에서 포괄적인 디스패치 패턴을 확인하세요: 이 예제는 포괄적인 오류 처리와 UI 통합을 가진 dispatchWithResult의 실제 사용을 보여줍니다. 관련 문서 - 우선순위 시스템 - 우선순위로 실행 순서 제어 - 차단 작업 - 실행 플로우 제어 - 중단 메커니즘 - 필요시 파이프라인 실행 중지 - 결과 처리 - 디스패치 결과 처리와 사용

Key points:
• **[우선순위 시스템](./priority.md)** - 우선순위로 실행 순서 제어
• **[차단 작업](./blocking.md)** - 실행 플로우 제어
• **[중단 메커니즘](./abort.md)** - 필요시 파이프라인 실행 중지
• **[결과 처리](./result-handling.md)** - 디스패치 결과 처리와 사용