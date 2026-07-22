---
document_id: context-layered--architecture--architecture-governance
category: context-layered
source_path: ko/context-layered/architecture/architecture-governance.md
character_limit: 1000
last_update: '2026-07-20T04:39:11.525Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 거버넌스와 증거

아키텍처 거버넌스와 증거 이 repository에서 Architecture Governance는 Context-Action convention 기반의 실험적 규칙형 architecture·문서 evidence 관리 패키지입니다. authored registry와 policy 선언을 SEM/Git 증거와 결합해 검사·snapshot·review artifact로 만들며, 범용 architecture 추론 엔진이나 Markdown/API 문서 편집기, TypeDoc 또는 sem-doc의 대체재가 아닙니다. Architecture Governance는 명시적으로 이름을 붙인 심볼, 역할 설명, 정의 위치를 관리합니다. Context-Action은 이 관계

Key points:
• `capabilityId`(`CA-*`)는 `registry.json`의 아키텍처 책임을 식별합니다.
• `SymbolRef`(`projectId`, repository-relative `filePath`, `entityId`)는 snapshot 안의 실제 코드 심볼을 식별합니다.
• `contextId`는 화면, API, transaction, workflow,...