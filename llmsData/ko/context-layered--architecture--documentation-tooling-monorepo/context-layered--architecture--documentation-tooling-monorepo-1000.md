---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: ko/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 1000
last_update: '2026-07-22T19:56:24.960Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문서 도구 모노레포 경계

문서 도구 모노레포 경계 재사용 가능한 문서 관리 구현은 context-action-documentation-tooling이 소유하는 정본 저장소에서 관리합니다. 원격 저장소와 release workflow가 설정되어 있고, consumer는 published package를 사용합니다. 기계적으로 검증할 수 있는 소유권 선언은 저장소 루트의 source-of-truth.json에 있습니다. 소유권 | 경계 | context-action에 유지 | 추출된 도구 저장소 | | --- | --- | --- | | 제품 런타임 | core, react, tool-protocol, durable operations, 예제 | — | | 심볼

Key points:
• `sem`은 저장소 revision의 외부 entity evidence를 제공합니다.
• Foundation contracts는 심볼·파일·revision·완전한 snapshot·diff identity를 결정적으로 정의합니다.
• Foundation repository는 Git commit/worktree와 제한된 `analysisProjects` 입력을...