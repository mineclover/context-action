---
document_id: guide--getting-started
category: guide
source_path: ko/guide/getting-started.md
character_limit: 500
last_update: '2025-08-21T02:13:42.403Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
시작하기

Context-Action은 완벽한 관심사 분리를 통한 확장 가능한 React 애플리케이션 구축을 위한 세 가지 주요 패턴을 제공합니다. 빠른 시작

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| 🎯 Action Only | 스토어 없이 액션 디스패칭 | createActionContext | 이벤트 시스템, 커맨드 패턴 |
| 🏪 Store Only | 액션 없이 상태 관리 | createDeclarativeStorePattern | 순수 상태 관리, 데이터 레이어 |
| 🔧 Ref Context | 제로 리렌더링 직접 DOM 조작 | createRefContext | 고성능 UI, 애니메이션, 실시간 인터랙션 |

🎯 Action Only 패턴

상태 관리 없이 순수 액션 디스패칭.
