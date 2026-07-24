---
document_id: context-layered--change-management-convention
category: context-layered
source_path: ko/context-layered/change-management-convention.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.455Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스펙·이슈·문서 관리 컨벤션

스펙·이슈·문서 관리 컨벤션 상태: Active 최종 검토: 2026-07-17 범위: 기능 개발, 아키텍처 변경, 버그 수정, 공개 문서 이 문서는 요청을 검증된 변경으로 연결하는 운영 계층을 정의합니다. 구현 컨벤션, 패키지 경계 및 코드베이스 관리 컨벤션, 문서 및 개발 관리 컨벤션, 아키텍처 거버넌스와 증거를 보완합니다. 리뷰 판정 현재 저장소는 구현과 검증 컨벤션이 잘 정리되어 있습니다. - contexts, business, handlers, actions, hooks, views 간 Context-Layered 소유권이 명시되어 있습니다. - tool-calling 작업은 tools/list → model tool call → tools/call → structured result 순서를 기준으로 합니다. - 실행 가능한 예제에 집중 컨벤션 검사와 browser gate가 있습니다. - 공개 문서와 생성 문서의 소유권이 분리되어 있습니다. - 아키텍처 거버넌스가 capability와 구현 anchor, 테스트 증거, 공개 문서를 연결할 수 있습니다. 남은 관리 리스크는 traceability입니다. 이슈는 의도를 기록하고 스펙은 계약을 기록하지만, 둘 중 어느 것도 commit message나 완료된 diff에서 역추론해서는 안 됩니다. 아래 규칙으로 이 연결을 명시합니다. 1. 원본 기준 계층 각 산출물은 서로 다른 질문에 답합니다. 한 산출물이 다른 산출물을 암묵적으로 대체하게 두지 않습니다. | 산출물 | 답하는 질문 | 반드시 포함 | 되어서는 안 되는 것 | | --- | --- | --- | --- | | 이슈 | 왜 필요한가, 누가 담당하는가, 결과는 무엇인가? | owner, 범위, 제외 범위, acceptance criteria, 의존성 | 완성된 기술 설계 전체 | | 스펙 | 어떤 계약이 계속 참이어야 하는가? | type, 전이, invariant, 호환성, migration, 실패 동작

Key points:
• `contexts`, `business`, `handlers`, `actions`, `hooks`, `views` 간
• tool-calling 작업은 `tools/list` → model tool call → `tools/call` →
• 실행 가능한 예제에 집중 컨벤션 검사와 browser gate가 있습니다.
• 공개 문서와 생성 문서의 소유권이 분리되어 있습니다.
• 아키텍처 거버넌스가 capability와 구현 anchor, 테스트 증거, 공개 문서를
• 소유 state와 경계;
• input, output, transition, failure behavior;
• invariant와 범위;
• persistence, privacy, security 가정;
• 호환성과 migration 동작;
• 주관적 표현 없이 검증할 수 있는 acceptance criteria;
• 구현·테스트·문서 anchor.
• 공개 package API 또는 workspace package 소유권;
• Context-Action provider/handler/store 경계;
• MCP/function-calling protocol 또는 tool result 계약;
• persistence...