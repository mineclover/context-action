---
document_id: context-layered--change-management-convention
category: context-layered
source_path: ko/context-layered/change-management-convention.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.455Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스펙·이슈·문서 관리 컨벤션

스펙·이슈·문서 관리 컨벤션 상태: Active 최종 검토: 2026-07-17 범위: 기능 개발, 아키텍처 변경, 버그 수정, 공개 문서 이 문서는 요청을 검증된 변경으로 연결하는 운영 계층을 정의합니다. 구현 컨벤션, 패키지 경계 및 코드베이스 관리 컨벤션, 문서 및 개발 관리 컨벤션, 아키텍처 거버넌스와 증거를 보완합니다. 리뷰 판정 현재 저장소는 구현과 검증 컨벤션이 잘 정리되어 있습니다. - contexts, business, handlers, actions, hooks, views 간 Context-Layered 소유권이 명시되어 있습니다. - tool-calling 작업은 tools/list → model tool call → tools/call → str

Key points:
• `contexts`, `business`, `handlers`, `actions`, `hooks`, `views` 간
• tool-calling 작업은 `tools/list` → model tool call → `tools/call` →
• 실행 가능한 예제에 집중 컨벤션 검사와 browser gate가 있습니다.
• 공개 문서와 생성 문서의 소유권이 분리되어 있습니다.
• 아키텍처...