---
document_id: context-layered--v1-release-roadmap
category: context-layered
source_path: ko/context-layered/v1-release-roadmap.md
character_limit: 2000
last_update: '2026-08-09T02:32:10.353Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action v1.0 릴리스 로드맵

Context-Action v1.0 릴리스 로드맵 --- status: draft canonical: false translationOf: docs/en/context-layered/v1-release-roadmap.md syncedAtCommit: 0d6047b99961a33ef0d09704ae39c577d3b89cd8 roadmapRevision: v1-r2 --- 릴리스 원칙: v1.0.0은 버전 번호 변경이 아니라 공개 계약의 동결이다. 1. 목표와 계획 원칙 v1.0.0은 Context-Action이 1.x 전체에서 아래 약속을 지킬 수 있을 때만 준비된 것으로 판단한다. > 공개 API, 런타임 의미론, 수명주기 동작, 패키지 호환성이 문서화되어 있고 서로 > 일치하며, 소비자 관점에서 재현 가능한 증거로 검증되어 있다. 이 문서는 그 상태에 도달하기 위해 필요한 단일 개발 계획이다. 레거시 제거, 계약 결정, 구현 안정화, 패키지 검증, 문서화, 릴리스 운영을 하나의 로드맵으로 관리한다. 코드가 merge되었다는 사실만으로 작업이 끝나지 않는다. 계약, 테스트, 소비자 영향, 문서가 함께 정렬될 때 완료된다. 변경 불가 순서 호환성을 깨는 정리는 반드시 v1.0 공개 API 동결 전에 끝낸다. Deprecated 또는 legacy 표면은 0.9.x 안정화 라인에서 아래 셋 중 하나만 선택할 수 있다. 1. 동결 전에 제거하고 migration 경로를 제공한다. 2. 1.x에서 지원할 공개 계약으로 유지한다. 3. 명시적인 experimental package 또는 subpath로 격리한다. 일시적인 compatibility shim을 v1.0에 남긴다면 1.x 유지보수 의무로 취급한다. 릴리스 게이트를 통과하는 데 필요하지 않은 신규 기능, 신규 adapter, 대규모 리팩터링, 검증되지 않은 성능 작업은 이 계획의 범위가 아니다. 2. 현재 릴리스 기준선 - 기준 커밋: 0d6047b99961a33ef0d09704ae39c577

Key points:
• **기준 커밋:** `0d6047b99961a33ef0d09704ae39c577d3b89cd8`
• **로드맵 리비전:** `v1-r2`
• **버전 전략:** Lerna `independent`
• **증거 상태:** source와 focused test는 검토했지만 전체 release gate를 하나의
• **현재 판정:** `NOT READY`
• Severity: P0 | P1 | P2
• Milestone:
• Affected public contract:
• Current behavior and reproduction:
• Expected 1.0 contract:
• Chosen resolution:
• Compatibility and migration impact:
• Test / package / documentation evidence:
• Owner and status:
• M1부터 및 public export/declaration 변경마다 API-surface diff
• M0부터 및 관련 package/build/dependency 변경마다 packed-consumer smoke와 dependency check