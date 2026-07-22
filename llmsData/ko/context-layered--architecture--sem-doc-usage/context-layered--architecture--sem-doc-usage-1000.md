---
document_id: context-layered--architecture--sem-doc-usage
category: context-layered
source_path: ko/context-layered/architecture/sem-doc-usage.md
character_limit: 1000
last_update: '2026-07-22T19:56:24.965Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
sem-doc 사용 방법

sem-doc 사용 방법 @context-action/sem-doc은 운영용 Symbol Context plane입니다. 구현자나 리뷰어가 변경 전에 어떤 심볼·의존 파일·문서·테스트·Git 변경을 확인해야 하는지 파악할 때 사용합니다. 결과는 버전이 있는 advisory artifact이며 Architecture Governance registry, CI 정책 gate, 완전한 architecture snapshot, TypeDoc 대체재가 아닙니다. 1. 공개 패키지 설치 sem-doc은 Node.js 24가 필요합니다. 공개 패키지는 @ataraxy-labs/sem@0.21.0 runtime wrapper와 두 Foundation 패키지를 함께 설치하므로, 깨끗한