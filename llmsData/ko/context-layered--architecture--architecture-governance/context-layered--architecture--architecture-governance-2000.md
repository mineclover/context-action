---
document_id: context-layered--architecture--architecture-governance
category: context-layered
source_path: ko/context-layered/architecture/architecture-governance.md
character_limit: 2000
last_update: '2026-07-20T04:39:11.525Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 거버넌스와 증거

아키텍처 거버넌스와 증거 이 repository에서 Architecture Governance는 Context-Action convention 기반의 실험적 규칙형 architecture·문서 evidence 관리 패키지입니다. authored registry와 policy 선언을 SEM/Git 증거와 결합해 검사·snapshot·review artifact로 만들며, 범용 architecture 추론 엔진이나 Markdown/API 문서 편집기, TypeDoc 또는 sem-doc의 대체재가 아닙니다. Architecture Governance는 명시적으로 이름을 붙인 심볼, 역할 설명, 정의 위치를 관리합니다. Context-Action은 이 관계를 작은 repository-local registry로 유지하고, SEM 구조 증거로 한 번에 수집·검증합니다. 별도 패키지인 @context-action/sem-doc은 작업 컨텍스트와 TSDoc/Git evidence를 준비하며 이 registry gate가 아닙니다. 기준 산출물 | 산출물 | 책임 | | --- | --- | | architecture/registry.json | capability identity(CA-), owner, authored role, 정의 anchor, evidence, policy 연결 | | architecture/rules/.json | package 선언과 SEM impact 경계 | | architecture/contexts.json (optional) | revision에 묶인 context 의도, 완전한 anchor identity, 명시적으로 선언한 의미론 edge | | packages/architecture-governance | registry loader, SEM adapter, verifier, report 계약, CLI | | Verification report | working tree, st

Key points:
• `capabilityId`(`CA-*`)는 `registry.json`의 아키텍처 책임을 식별합니다.
• `SymbolRef`(`projectId`, repository-relative `filePath`, `entityId`)는 snapshot 안의 실제 코드 심볼을 식별합니다.
• `contextId`는 화면, API, transaction, workflow, document 범위의 파생 컨텍스트를 식별합니다.
• capability의 spec, owner, 구현 anchor, 대표 테스트, 공개 문서 경로;
• `package.json` 선언 기반 package dependency 경계;
• SEM top-level entity identity와 source file 정의 범위;
• 각 명시적 anchor를 구조적으로 사용하는 파일을 담은 `symbolUsages[].usageFiles`;
• symbol catalog를 보호하기 위해 선택적으로 사용하는 package/impact boundary;
• working-tree, staged, commit-range 변경 범위와 binary/untracked 경로;
• console, JSON, Markdown으로 출력되는...