---
document_id: context-layered--change-management-convention
category: context-layered
source_path: ko/context-layered/change-management-convention.md
character_limit: 2000
last_update: '2026-11-02T04:46:11.768Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스펙·이슈·문서 관리 컨벤션

스펙·이슈·문서 관리 컨벤션 상태: Active 최종 검토: 2026-07-17 범위: 기능 개발, 아키텍처 변경, 버그 수정, 공개 문서 이 문서는 요청을 검증된 변경으로 연결하는 운영 계층을 정의합니다. 구현 컨벤션, 패키지 경계 및 코드베이스 관리 컨벤션, 문서 및 개발 관리 컨벤션, 구현·테스트·문서의 소유권을 한 흐름으로 관리합니다. 리뷰 판정 현재 저장소는 구현과 검증 컨벤션이 잘 정리되어 있습니다. - contexts, business, handlers, actions, hooks, views 간 Context-Layered 소유권이 명시되어 있습니다. - tool-calling 작업은 tools/list → model tool call → tools/call → structured result 순서를 기준으로 합니다. - 실행 가능한 예제에 집중 컨벤션 검사와 browser gate가 있습니다. - 공개 문서와 생성 문서의 소유권이 분리되어 있습니다. - 지속되는 아키텍처 선택은 추적 가능한 결정 기록 위치를 가집니다. 상호작용 변경에서는 상호작용 의도 계약(IIC)을 기능 스펙 또는 decision record의 하위 설계 계약으로 둡니다. 작업 진행은 이슈 lifecycle이 기준이며, IIC lifecycle은 상호작용 합의가 제안·승인·구현·대체·폐기되었는지를 기록합니다. 두 lifecycle은 독립적이지만 리뷰 경계에서 연결합니다. | 이슈/스펙 상태 | IIC 상태 기대값 | 리뷰 규칙 | | --- | --- | --- | | proposed / specified | draft | 의도를 만드는 단계이며 코드를 계약으로 취급하지 않습니다. | | ready / in-progress | accepted | 단축, trigger, source of truth, 복구 경로를 합의합니다. | | review / verified | implemented | 구현이 IIC와 일치한다는 증거를 확인합니다.

Key points:
• `contexts`, `business`, `handlers`, `actions`, `hooks`, `views` 간
• tool-calling 작업은 `tools/list` → model tool call → `tools/call` →
• 실행 가능한 예제에 집중 컨벤션 검사와 browser gate가 있습니다.
• 공개 문서와 생성 문서의 소유권이 분리되어 있습니다.
• 지속되는 아키텍처 선택은 추적 가능한 결정 기록 위치를 가집니다.
• 소유 state와 경계;
• input, output, transition, failure behavior;
• invariant와 범위;
• persistence, privacy, security 가정;
• 호환성과 migration 동작;
• 주관적 표현 없이 검증할 수 있는 acceptance criteria;
• 구현·테스트·문서 anchor.
• **Inception / Experimental**: `"severity": "off"` (프로토타이핑 중 CI 중단 차단)
• **Beta / Hardening**: `"severity": "warning"` (누락 앵커 가시화)
• **GA / Release**: `"severity":...