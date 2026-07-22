---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: ko/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 1000
last_update: '2026-07-22T03:52:01.924Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문서 도구 모노레포 경계

문서 도구 모노레포 경계 재사용 가능한 문서 관리 구현은 현재 로컬 /Users/junwoobang/workflow/context-action-documentation-tooling 스캐폴드로 분리하는 중입니다. 이는 아직 공개되거나 원격 저장소로 연결되지 않은 마이그레이션 경계입니다. 소유권 | 경계 | context-action에 유지 | 추출된 도구 저장소 | | --- | --- | --- | | 제품 런타임 | core, react, tool-protocol, durable operations, 예제 | — | | 심볼 컨텍스트 | consumer 설정과 생성 artifact | Foundation contracts/repos