---
document_id: guide--patterns--async--wait-then-execute
category: guide
source_path: ko/guide/patterns/async/wait-then-execute.md
character_limit: 300
last_update: '2026-11-20T08:50:10.790Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
대기-후-실행 패턴

대기-후-실행 패턴 엘리먼트 가용성을 확보한 후 안전하게 DOM 조작을 실행하는 패턴입니다. 전제 조건 필수 설정: 타입 정의, DOM 엘리먼트 ref, 그리고 프로바이더 구성을 포함한 완전한 RefContext 설정 지침은 RefContext 설정을 참조하세요. 이

Key points:
• **타입 정의** → [DOM 엘리먼트 Ref](../setup/ref-context-setup.md#dom-element-refs)
• **컨텍스트 생성** → [기본 RefContext...