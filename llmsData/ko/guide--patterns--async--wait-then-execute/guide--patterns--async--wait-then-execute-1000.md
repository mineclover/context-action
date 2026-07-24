---
document_id: guide--patterns--async--wait-then-execute
category: guide
source_path: ko/guide/patterns/async/wait-then-execute.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.383Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
대기-후-실행 패턴

대기-후-실행 패턴 엘리먼트 가용성을 확보한 후 안전하게 DOM 조작을 실행하는 패턴입니다. 전제 조건 필수 설정: 타입 정의, DOM 엘리먼트 ref, 그리고 프로바이더 구성을 포함한 완전한 RefContext 설정 지침은 RefContext 설정을 참조하세요. 이 패턴은 다음 설정 패턴을 사용하여 DOM 대기 전략을 보여줍니다: - 타입 정의 → DOM 엘리먼트 Ref - 컨텍스트 생성 → 기본 RefContext 설정 - 프로바이더 설정 → 프로바이더 설정 패턴 - 고급 사용법 → 여러 Ref 대기 Store와 Action 통합에 대해서는 다음을 참조하세요: - 기본 Store 설정 - 상태 관리를 위한 Store 컨텍스트 - 기본 Action 설정 - 비즈니스 로직을 위한 Actio

Key points:
• **타입 정의** → [DOM 엘리먼트 Ref](../setup/ref-context-setup.md#dom-element-refs)
• **컨텍스트 생성** → [기본 RefContext 설정](../setup/ref-context-setup.md#basic-refcontext-setup)
• **프로바이더 설정** → [프로바이더 설정...