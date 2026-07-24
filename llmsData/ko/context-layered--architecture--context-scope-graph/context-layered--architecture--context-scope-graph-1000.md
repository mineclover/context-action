---
document_id: context-layered--architecture--context-scope-graph
category: context-layered
source_path: ko/context-layered/architecture/context-scope-graph.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.466Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
ContextScope 심볼 그래프

ContextScope 심볼 그래프 상태와 목적 이 문서는 의미 있는 컨텍스트 단위로 심볼을 묶는 계약이다. 현재 PoC에는 revision-bound manifest parser, context-scope CLI projection, JSON Schema, library 수준 bounded SEM dependency projection이 구현되어 있다. renderer와 API/transaction 전용 adapter는 후속 작업이다. 첫 번째 제공 범위는 화면이다. 화면을 진입 심볼로 보고 정적으로 사용되는 하위 심볼을 하나의 큰 시각적 경계 안에 표시한다. 영속적인 모델은 API 경계, 트랜잭션, workflow, 문서도 지원하도록 설계하지만, 첫 re

Key points:
• context profile을 검증하고 완전한 snapshot에서 모든 manifest anchor를 해석한다.
• manifest가 snapshot과 같은 선택 revision에 속하는지 검증한다.
• profile이 허용하는 SEM dependency 증거와 manifest 선언 edge를 읽는다.
• breadth-first 확장 전에 후보 edge를 `from`,...