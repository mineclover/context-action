---
document_id: context-layered--implementation-convention
category: context-layered
source_path: ko/context-layered/implementation-convention.md
character_limit: 1000
last_update: '2026-11-01T14:50:39.006Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 표준 컨벤션

Implementation Playbook 표준 컨벤션 이 문서는 implementation-playbook에서 정리한 구조를 canonical example과 usecase 표면에서 재사용할 수 있도록 고정한 표준 컨벤션입니다. 목표는 “예제가 잘 보이는 것”이 아니라, 복잡한 로직이 늘어나도 같은 방식으로 설계, 구현, 테스트, 문서화할 수 있게 만드는 데 있습니다. 모든 workspace package나 demo에 이 폴더 구조를 강제하지는 않습니다. 버튼·설명·확인 단계를 제거하거나 trigger를 바꾸는 상호작용은 이 컨벤션으로 들어가기 전에 상호작용 의도 계약(IIC)을 기록합니다. IIC에서 구현까지의 흐름으로 의도를 6개 레이어와 증거에 매핑합니다. 언제 이

Key points:
• 입력 검증과 후속 처리 흐름이 분리되어야 한다
• 비동기 단계가 2개 이상 존재한다
• 성공/실패/리셋/재시도 상태가 모두 필요하다
• activity log, analytics, ref focus 같은 side effect가 함께 움직인다
• 문서, 예제, 테스트를 같은 계약으로 묶어야 한다
• Action, Store, Ref 경계를 정의한다