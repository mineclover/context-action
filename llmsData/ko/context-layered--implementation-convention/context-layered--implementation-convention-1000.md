---
document_id: context-layered--implementation-convention
category: context-layered
source_path: ko/context-layered/implementation-convention.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.488Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 표준 컨벤션

Implementation Playbook 표준 컨벤션 이 문서는 implementation-playbook에서 정리한 구조를 저장소 전반에서 재사용할 수 있도록 고정한 표준 컨벤션입니다. 목표는 “예제가 잘 보이는 것”이 아니라, 복잡한 로직이 늘어나도 같은 방식으로 설계, 구현, 테스트, 문서화할 수 있게 만드는 데 있습니다. 언제 이 컨벤션을 쓰는가 다음 조건 중 둘 이상이 보이면 이 컨벤션을 권장합니다. - 입력 검증과 후속 처리 흐름이 분리되어야 한다 - 비동기 단계가 2개 이상 존재한다 - 성공/실패/리셋/재시도 상태가 모두 필요하다 - activity log, analytics, ref focus 같은 side effect가 함께 움직인다 - 문서, 예제, 테스

Key points:
• 입력 검증과 후속 처리 흐름이 분리되어야 한다
• 비동기 단계가 2개 이상 존재한다
• 성공/실패/리셋/재시도 상태가 모두 필요하다
• activity log, analytics, ref focus 같은 side effect가 함께 움직인다
• 문서, 예제, 테스트를 같은 계약으로 묶어야 한다
• Action, Store, Ref 경계를 정의한다