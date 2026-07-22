---
document_id: context-layered--architecture--sem-doc-usage
category: context-layered
source_path: ko/context-layered/architecture/sem-doc-usage.md
character_limit: 2000
last_update: '2026-07-22T19:56:24.966Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc 사용 방법

sem-doc 사용 방법 @context-action/sem-doc은 운영용 Symbol Context plane입니다. 구현자나 리뷰어가 변경 전에 어떤 심볼·의존 파일·문서·테스트·Git 변경을 확인해야 하는지 파악할 때 사용합니다. 결과는 버전이 있는 advisory artifact이며 Architecture Governance registry, CI 정책 gate, 완전한 architecture snapshot, TypeDoc 대체재가 아닙니다. 1. 공개 패키지 설치 sem-doc은 Node.js 24가 필요합니다. 공개 패키지는 @ataraxy-labs/sem@0.21.0 runtime wrapper와 두 Foundation 패키지를 함께 설치하므로, 깨끗한 환경에서도 기본 sem 실행 파일을 제공합니다. 새 release는 canonical context-action-documentation-tooling 저장소가 소유합니다. 이 consumer는 published package를 사용하며 sem-doc과 Foundation source copy를 workspace에 보관하지 않습니다. 다른 sem 실행 파일을 명시할 때만 SEMBIN을 설정합니다. 2. 구현자 컨텍스트 만들기 먼저 대상 심볼과 정의 파일을 지정합니다. 결과인 sem-doc-work-context.v5가 이후 ContextScope projection의 SSOT입니다. 변경이 한 단계 더 이어지는 경우에만 --depth 2를 사용합니다. 결과에는 심볼 identity, 정의 파일, 사용 파일, affected test, 문서 binding, Git revision, sem provenance가 포함됩니다. execution에는 phase, owner, 최종 상태, timeout, 출력 한도, 실제 출력 사용량, 경과 시간이 기록됩니다. usageFiles는 파일 단위 의존 신호이며 정확한 참조 위치나 runtime call graph가 아닙니다