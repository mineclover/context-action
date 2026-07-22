---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: ko/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.961Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문서 도구 모노레포 경계

문서 도구 모노레포 경계 재사용 가능한 문서 관리 구현은 context-action-documentation-tooling이 소유하는 정본 저장소에서 관리합니다. 원격 저장소와 release workflow가 설정되어 있고, consumer는 published package를 사용합니다. 기계적으로 검증할 수 있는 소유권 선언은 저장소 루트의 source-of-truth.json에 있습니다. 소유권 | 경계 | context-action에 유지 | 추출된 도구 저장소 | | --- | --- | --- | | 제품 런타임 | core, react, tool-protocol, durable operations, 예제 | — | | 심볼 컨텍스트 | consumer 설정과 생성 artifact | Foundation contracts/repository, sem-doc | | 아키텍처 규칙 | architecture-governance 구현, architecture/registry.json, 프로젝트 정책, 제품별 evidence | — (아직 추출하지 않음) | | API 문서 | TypeDoc/VitePress 설정과 생성 사이트 출력, typedoc-vitepress-sync 구현 | — (아직 추출하지 않음) | | LLM 문서 | 원본 문서와 생성된 llmsData artifact, llms-generator 구현 | — (아직 추출하지 않음) | sem-doc은 운영용 Symbol Context SSOT입니다. architecture-governance는 실험적인 규칙 기반 control-plane 패키지로 유지합니다. 구현을 별도 저장소로 추출한다고 해서 report나 gate 계약을 sem-doc에 합치지 않습니다. SEM이 소유하는 핵심 기능 SEM의 안정적인 경계는 runtime 호출 그래프나 LSP가 아니라, revision을 기준으로 한 심볼 evidence 수집·직렬화

Key points:
• `sem`은 저장소 revision의 외부 entity evidence를 제공합니다.
• Foundation contracts는 심볼·파일·revision·완전한 snapshot·diff identity를 결정적으로 정의합니다.
• Foundation repository는 Git commit/worktree와 제한된 `analysisProjects` 입력을 구체화합니다.
• `sem-doc`은 bounded work context, 문서 binding, 운영용 ContextScope,
• consumer 소유 Architecture Governance는 같은 Foundation primitive으로 저장소 전체 snapshot/history와