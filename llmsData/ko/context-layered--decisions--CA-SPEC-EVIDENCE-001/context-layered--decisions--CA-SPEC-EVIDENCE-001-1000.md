---
document_id: context-layered--decisions--CA-SPEC-EVIDENCE-001
category: context-layered
source_path: ko/context-layered/decisions/CA-SPEC-EVIDENCE-001.md
character_limit: 1000
last_update: '2026-09-29T08:48:29.715Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SPEC-EVIDENCE-001: TypeSpec Evidence 결합 및 프론트엔드 상태 계층화(State Tiering) 거버넌스

CA-SPEC-EVIDENCE-001: TypeSpec Evidence 결합 및 프론트엔드 상태 계층화(State Tiering) 거버넌스 상태: accepted 소유자: Framework Core & Architecture Governance 관련 이슈/스펙: CA-ARCH-001, CA-SPEC-001, change-management-convention 최종 검토: 2026-09-19 맥락 Context-Action 프레임워크는 contexts / business / handlers / actions / hooks / views의 6개 레이어 분리를 통해 프론트엔드 상태 관리와 비즈니스 로직의 격리를 성공적으로 달성했습니다. 특히 business/ 레이어에

Key points:
• **Inception / Experimental**: `"severity": "off"` (기능 프로토타이핑 중 CI 차단 없음)
• **Beta / Hardening**: `"severity": "warning"` (누락된 앵커 및 미충족 요건 가시화)
• **GA /...