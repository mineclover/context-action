---
document_id: context-layered--decisions--CA-SPEC-EVIDENCE-001
category: context-layered
source_path: ko/context-layered/decisions/CA-SPEC-EVIDENCE-001.md
character_limit: 2000
last_update: '2026-09-29T08:48:29.715Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-SPEC-EVIDENCE-001: TypeSpec Evidence 결합 및 프론트엔드 상태 계층화(State Tiering) 거버넌스

CA-SPEC-EVIDENCE-001: TypeSpec Evidence 결합 및 프론트엔드 상태 계층화(State Tiering) 거버넌스 상태: accepted 소유자: Framework Core & Architecture Governance 관련 이슈/스펙: CA-ARCH-001, CA-SPEC-001, change-management-convention 최종 검토: 2026-09-19 맥락 Context-Action 프레임워크는 contexts / business / handlers / actions / hooks / views의 6개 레이어 분리를 통해 프론트엔드 상태 관리와 비즈니스 로직의 격리를 성공적으로 달성했습니다. 특히 business/ 레이어에 순수 함수(Draft, Validation, Result, StateMachine)만을 배치하도록 강제함으로써 높은 테스트 용이성을 제공합니다. 그러나 대규모 엔터프라이즈 환경 및 AI 에이전트 협업 환경에서는 다음과 같은 새로운 도전 과제가 대두되었습니다: 1. 기획-코드 간 추적성(Traceability)의 컴파일 타임 강제 부재: 이슈와 스펙 식별자(CA-)가 텍스트/PR 레벨에서 검증될 뿐, 기획 요구사항 변경이나 API 스키마 변경 시 프론트엔드 비즈니스 로직 함수와의 불일치를 컴파일 타임에 즉시 차단(Fail-Closed)하지 못함. 2. 빈번한 UI 변경에 따른 거버넌스 피로도(Governance Friction): 모든 UI 상태를 엄격한 스펙 계약(SSOT)으로 관리하려 할 경우, 잦은 화면 수정(모달 열림/닫힘, 포커스, 탭 전환 등) 시 불필요한 스펙 수정과 해시 갱신 비용이 발생하여 개발 생산성을 저해함. 이에 컴파일러 기반 SSOT 계약 거버넌스인 tsp-evidence를 도입하고, 프론트엔드 특성에 맞춘 3단계 상태 계층화(State Tiering) 규칙을 제정합니다. --- 검토한 선택지 1. 대안 A: 전면적 TypeSpec SS

Key points:
• **Inception / Experimental**: `"severity": "off"` (기능 프로토타이핑 중 CI 차단 없음)
• **Beta / Hardening**: `"severity": "warning"` (누락된 앵커 및 미충족 요건 가시화)
• **GA / Release**: `"severity": "error"` (Fail-Closed 강제, 100% 충족 필수)
• `pnpm convention:check`: Context-Layered 레이어 분리 및 React import 격리 검증.
• `node scripts/verify-context-action-conventions.mjs`: 컨벤션 무결성 검증.
• `tsp-evidence check specs/**/*.tsp`: TypeSpec과 프론트엔드 비즈니스 로직 간 바인딩 정적 검증.
• 프론트엔드 전용 컴파일러 린터 플러그인이 네이티브 TS 데코레이터로 발전하여 TypeSpec 없이 완결 가능한 규격이 확립될 경우, 상위 SSOT 레이어를 재검토할 수 있습니다.
• **기획-코드 간...