---
document_id: context-layered--implementation-convention
category: context-layered
source_path: ko/context-layered/implementation-convention.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.488Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Implementation Playbook 표준 컨벤션

Implementation Playbook 표준 컨벤션 이 문서는 implementation-playbook에서 정리한 구조를 저장소 전반에서 재사용할 수 있도록 고정한 표준 컨벤션입니다. 목표는 “예제가 잘 보이는 것”이 아니라, 복잡한 로직이 늘어나도 같은 방식으로 설계, 구현, 테스트, 문서화할 수 있게 만드는 데 있습니다. 언제 이 컨벤션을 쓰는가 다음 조건 중 둘 이상이 보이면 이 컨벤션을 권장합니다. - 입력 검증과 후속 처리 흐름이 분리되어야 한다 - 비동기 단계가 2개 이상 존재한다 - 성공/실패/리셋/재시도 상태가 모두 필요하다 - activity log, analytics, ref focus 같은 side effect가 함께 움직인다 - 문서, 예제, 테스트를 같은 계약으로 묶어야 한다 작은 기능은 business 또는 view 파일 수를 줄일 수 있지만, action handler 등록은 아래 Handler Registry 규칙을 항상 따릅니다. 표준 폴더 구조 레이어별 책임 contexts/ - Action, Store, Ref 경계를 정의한다 - 초기 상태를 둔다 - 상태 타입은 여기서 import해서 조립한다 business/ - 순수 함수만 둔다 - draft 기본값 - validation issue 계산 - 결과 계산 - activity event 정의 - 명시적 상태 전이 함수 문자열 문구, DOM focus, analytics 호출은 넣지 않습니다. handlers/ - 최신 store 값을 읽는다 - business 순수 함수를 호출한다 - state machine 전이를 적용한다 - ref focus, scroll, logging 같은 side effect를 조율한다 핸들러는 관심사별로 쪼갭니다. - useScenarioDraftHandlers - useScenarioSubmissionHandlers - 필요하면 useScenarioApprovalHandlers, useScenarioSync

Key points:
• 입력 검증과 후속 처리 흐름이 분리되어야 한다
• 비동기 단계가 2개 이상 존재한다
• 성공/실패/리셋/재시도 상태가 모두 필요하다
• activity log, analytics, ref focus 같은 side effect가 함께 움직인다
• 문서, 예제, 테스트를 같은 계약으로 묶어야 한다
• Action, Store, Ref 경계를 정의한다
• 초기 상태를 둔다
• 상태 타입은 여기서 import해서 조립한다
• 순수 함수만 둔다
• draft 기본값
• validation issue 계산
• 결과 계산
• activity event 정의
• 명시적 상태 전이 함수
• 최신 store 값을 읽는다
• `business` 순수 함수를 호출한다