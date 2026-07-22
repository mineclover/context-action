---
document_id: context-layered--migration-guide
category: context-layered
source_path: ko/context-layered/migration-guide.md
character_limit: 1000
last_update: '2026-07-20T23:30:19.160Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
마이그레이션 가이드: MVVM에서 Context-Layered로

마이그레이션 가이드: MVVM에서 Context-Layered로 이 문서는 기존 MVVM 또는 단순 React Context 구조에서 Context-Layered Architecture로 이동할 때의 기준점을 설명합니다. 핵심은 “한 번에 전부 바꾸는 것”이 아니라, 책임 분리 기준에 맞춰 점진적으로 재배치하는 것입니다. 가장 큰 차이 | 관점 | 기존 MVVM/단순 구조 | Context-Layered | |------|----------------------|-----------------| | 초점 | 개념적 계층 | 구현 가능한 책임 계층 | | 비즈니스 로직 | ViewModel이나 컴포넌트에 섞임 | business와 handlers로 분리 | | 의존성 주입 | context 또는

Key points:
• validation
• 계산 규칙
• 상태 전이 규칙
• 도메인별 파생 값 계산
• context 생성 코드가 `contexts/`에 모였는가
• 검증과 계산 로직이 `business/`로 분리되었는가