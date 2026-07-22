---
document_id: context-layered--architecture--documentation-tooling-monorepo
category: context-layered
source_path: ko/context-layered/architecture/documentation-tooling-monorepo.md
character_limit: 5000
last_update: '2026-07-22T03:52:01.925Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
문서 도구 모노레포 경계

문서 도구 모노레포 경계 재사용 가능한 문서 관리 구현은 현재 로컬 /Users/junwoobang/workflow/context-action-documentation-tooling 스캐폴드로 분리하는 중입니다. 이는 아직 공개되거나 원격 저장소로 연결되지 않은 마이그레이션 경계입니다. 소유권 | 경계 | context-action에 유지 | 추출된 도구 저장소 | | --- | --- | --- | | 제품 런타임 | core, react, tool-protocol, durable operations, 예제 | — | | 심볼 컨텍스트 | consumer 설정과 생성 artifact | Foundation contracts/repository, sem-doc | | 아키텍처 규칙 | architecture/registry.json, 프로젝트 정책, 제품별 evidence | architecture-governance 구현과 schema | | API 문서 | TypeDoc/VitePress 설정과 생성 사이트 출력 | typedoc-vitepress-sync 구현 | | LLM 문서 | 원본 문서와 생성된 llmsData artifact | llms-generator 구현 | sem-doc은 운영용 Symbol Context SSOT입니다. architecture-governance는 실험적인 규칙 기반 control-plane 패키지로 유지합니다. 구현을 별도 저장소로 추출한다고 해서 report나 gate 계약을 sem-doc에 합치지 않습니다. 제거 전 검증 게이트 복사된 workspace는 Foundation 테스트, sem-doc 테스트, type check, sem-doc boundary/binding/pack 검증, published-consumer smoke test를 통과해야 합니다. Architecture Governance의 현재 통합 테스트는 consumer가 소유한 architecture/registry.json, policy 파일, core analysis project를 읽으므로, 패키지 전용 fixture 저장소가 생기기 전까지는 consumer checkout에서 실행합니다. 이 게이트를 통과한 뒤에만 context-action을 released 또는 local-tarball dependency로 전환하고 중복된 패키지 디렉터리를 제거합니다. 생성 문서, API 페이지, LLMS 출력, 작성된 registry는 각 consumer 저장소에 남깁니다.