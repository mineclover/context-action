---
document_id: context-layered--architecture--architecture-governance
category: context-layered
source_path: ko/context-layered/architecture/architecture-governance.md
character_limit: 5000
last_update: '2026-07-20T04:39:11.525Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 거버넌스와 증거

아키텍처 거버넌스와 증거 이 repository에서 Architecture Governance는 Context-Action convention 기반의 실험적 규칙형 architecture·문서 evidence 관리 패키지입니다. authored registry와 policy 선언을 SEM/Git 증거와 결합해 검사·snapshot·review artifact로 만들며, 범용 architecture 추론 엔진이나 Markdown/API 문서 편집기, TypeDoc 또는 sem-doc의 대체재가 아닙니다. Architecture Governance는 명시적으로 이름을 붙인 심볼, 역할 설명, 정의 위치를 관리합니다. Context-Action은 이 관계를 작은 repository-local registry로 유지하고, SEM 구조 증거로 한 번에 수집·검증합니다. 별도 패키지인 @context-action/sem-doc은 작업 컨텍스트와 TSDoc/Git evidence를 준비하며 이 registry gate가 아닙니다. 기준 산출물 | 산출물 | 책임 | | --- | --- | | architecture/registry.json | capability identity(CA-), owner, authored role, 정의 anchor, evidence, policy 연결 | | architecture/rules/.json | package 선언과 SEM impact 경계 | | architecture/contexts.json (optional) | revision에 묶인 context 의도, 완전한 anchor identity, 명시적으로 선언한 의미론 edge | | packages/architecture-governance | registry loader, SEM adapter, verifier, report 계약, CLI | | Verification report | working tree, staged set, commit range별 evidence와 finding | Registry는 파일 목록이 아닙니다. capability는 사용자가 식별하는 동작, 독립적으로 변경되는 설계 책임, 또는 지속적으로 지켜야 하는 아키텍처 경계를 나타냅니다. verified capability에는 spec, SEM top-level 구현 anchor, 대표 동작 테스트, 공개 문서가 현재 구현을 증명하도록 연결되어야 합니다. Identity vocabulary catalog에서는 다음 세 가지 식별자를 의도적으로 분리합니다. - capabilityId(CA-)는 registry.json의 아키텍처 책임을 식별합니다. - SymbolRef(projectId, repository-relative filePath, entityId)는 snapshot 안의 실제 코드 심볼을 식별합니다. - contextId는 화면, API, transaction, workflow, document 범위의 파생 컨텍스트를 식별합니다. implementationAnchors는 capability와 하나 이상의 SymbolRef를 연결합니다. context manifest도 동일한 SymbolRef 조합을 재사용하며 별도의 심볼 ID를 만들지 않습니다. 따라서 하나의 capability가 여러 구현 심볼을 가질 수 있고, 하나의 심볼이 여러 context scope에 참여할 수 있습니다. 이 도구는 architecture를 자동 추론하는 엔진이 아니라 symbol catalog gate입니다. 작성자가 symbol과 registry의 authored role(및 심볼 옆 역할 주석)을 선언하고, SEM은 정의 위치를 제공하며, test runner는 동작을 검증하고, 문서 시스템은 공개 설명을 소유합니다. 명령을 순서대로 실행하는 방법은 아키텍처 거버넌스 사용 방법을 참고하세요. Capability lifecycle | 상태 | 의미 | 최소 evidence | | --- | --- | --- | | planned | 의도와 owner는 정해졌지만 구현 전 | spec, owner | | implemented | 대표 구현 anchor가 존재함 | spec, owner, implementation anchor | | verified | 구현·동작 테스트·공개 계약이 모두 현재 상태와 일치함 | spec, owner, anchor, test, public docs | | deprecated | 대체 또는 제거를 추적하는 중 | spec, owner, decision 또는 replacement | 증거보다 먼저 상태를 승격하지 않습니다. 이름만 바뀌면 capability ID를 유지하고, capability를 합치거나 나눌 때는 decision 문서에 이전·새 관계를 남깁니다. 검증 workflow 작업 중에는 필요한 범위만 확인하고, review 전에 전체 gate를 실행합니다. changed/staged report는 검토해야 할 문서와 테스트를 알려주는 자료이며 전체 아키텍처 gate를 대신하지 않습니다. Pull request에서는 local working tree와 무관하도록 base/head commit range report도 생성합니다. arch:test는 Foundation contract, repository history/worktree runtime, governance CLI test를 함께 검증합니다. 커밋별 심볼 이력은 arch-verify history --from <ref> --to <ref>로 생성합니다. Git first-parent 히스토리를 열거한 뒤 각 sem

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
• console, JSON, Markdown으로 출력되는 versioned report 계약.
• 이 문서에서 symbol catalog 개념, 검증 경계, 최소 명령을 확인합니다.
• capability ID, `SymbolRef` anchor 또는 역할 주석을 추가하기 전에 [`governance-guide.md`](https://github.com/mineclover/context-action/blob/main/architecture/governance-guide.md)를 읽습니다.
• package/impact rule을 추가하기 전에 [`architecture/rules/README.md`](https://github.com/mineclover/context-action/blob/main/architecture/rules/README.md)를 읽습니다.
• review 중에는 changed/staged/range report를 사용합니다.
• 심볼 한계, 의도적인 LSP 경계, roadmap 판단은 [구현 review](https://github.com/mineclover/context-action/blob/main/architecture/implementation-review.md)에서 확인합니다.