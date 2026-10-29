---
document_id: context-layered--decisions--CA-ELEMENT-INTEROP-001
category: context-layered
source_path: ko/context-layered/decisions/CA-ELEMENT-INTEROP-001.md
character_limit: 1000
last_update: '2026-10-25T07:23:14.356Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-ELEMENT-INTEROP-001: Core subpath와 호스트 중립 Element binding

CA-ELEMENT-INTEROP-001: Core subpath와 호스트 중립 Element binding 상태: 구현 채택, 릴리스 버전 조합 미승인 소유자: Framework Core & UI Integration 관련 이슈/스펙: CA-ELEMENT-INTEROP-001 (사용자 승인 로컬 경계 설계) 맥락 Preact/Lit의 공개 Handle·React bridge가 property/event 처리를 중복했습니다. private 공통 패키지 후보로 렌더러 교체를 입증했지만 독립적인 릴리스 필요 없이 배포 단위가 늘었습니다. React에만 맞춘 추출로는 Vue·Svelte·Angular 호스트에 대응할 수 없습니다. 검토한 선택지 - 별도 공통 패키

Key points:
• 별도 공통 패키지 유지: 독립 배포 요구가 생기면 재검토합니다.
• `@context-action/react` 편입: React 19·Store/Mutative 의존성이 React 18/19
• 기본 Core에서 전부 export: DOM/React 선언이 유입되므로 제외합니다.
• 같은 npm...