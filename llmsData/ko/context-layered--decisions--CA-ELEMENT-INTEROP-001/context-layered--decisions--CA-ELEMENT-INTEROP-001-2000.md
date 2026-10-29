---
document_id: context-layered--decisions--CA-ELEMENT-INTEROP-001
category: context-layered
source_path: ko/context-layered/decisions/CA-ELEMENT-INTEROP-001.md
character_limit: 2000
last_update: '2026-10-25T07:23:14.356Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-ELEMENT-INTEROP-001: Core subpath와 호스트 중립 Element binding

CA-ELEMENT-INTEROP-001: Core subpath와 호스트 중립 Element binding 상태: 구현 채택, 릴리스 버전 조합 미승인 소유자: Framework Core & UI Integration 관련 이슈/스펙: CA-ELEMENT-INTEROP-001 (사용자 승인 로컬 경계 설계) 맥락 Preact/Lit의 공개 Handle·React bridge가 property/event 처리를 중복했습니다. private 공통 패키지 후보로 렌더러 교체를 입증했지만 독립적인 릴리스 필요 없이 배포 단위가 늘었습니다. React에만 맞춘 추출로는 Vue·Svelte·Angular 호스트에 대응할 수 없습니다. 검토한 선택지 - 별도 공통 패키지 유지: 독립 배포 요구가 생기면 재검토합니다. - @context-action/react 편입: React 19·Store/Mutative 의존성이 React 18/19 Element 연동에 불필요하므로 제외합니다. - 기본 Core에서 전부 export: DOM/React 선언이 유입되므로 제외합니다. 결정 기본 Action entry는 격리하고 /element에 프레임워크 중립 DOM 전달 계층, /element/react에 선택적 React lifecycle 통합을 둡니다. 내부 Facade는 일반 객체로 일반화하되 미사용 공개 facade 경로는 만들지 않습니다. 기존 UI wrapper와 서로 다른 property 대입 오류 정책은 유지합니다. Vue·Svelte·Angular에는 가상의 공통 hook 대신 실제 호스트 lifecycle을 사용합니다. 고정 버전 개발 fixture로 수명 매핑을 검증하되 production 어댑터·포괄적인 프레임워크/SSR 지원을 채택한 것으로 취급하지 않습니다. 결과와 불변 조건 - 같은 npm 배포 단위여도 runtime/declaration 도달 그래프는 분리합니다. - Core에는 framework run

Key points:
• 별도 공통 패키지 유지: 독립 배포 요구가 생기면 재검토합니다.
• `@context-action/react` 편입: React 19·Store/Mutative 의존성이 React 18/19
• 기본 Core에서 전부 export: DOM/React 선언이 유입되므로 제외합니다.
• 같은 npm 배포 단위여도 runtime/declaration 도달 그래프는 분리합니다.
• Core에는 framework runtime·peer 제약을 추가하지 않습니다. 주입형 React factory의
• DOM binding은 listener와 시도한 property 대입만 관리하며 renderer teardown을 소유하지 않습니다.
• terminal dispose와 재연결 가능한 listener disconnect를 구분합니다.
• 일반 update는 이벤트부터 연결하고 React는 기존 layout-property/passive-event 순서를 보존합니다.
• Facade의 저장된 메서드는 revoke되지 않으며 요청 이벤트는 commit이 아닙니다.
• FACE·context...