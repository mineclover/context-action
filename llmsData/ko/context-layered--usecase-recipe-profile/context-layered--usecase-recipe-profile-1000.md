---
document_id: context-layered--usecase-recipe-profile
category: context-layered
source_path: ko/context-layered/usecase-recipe-profile.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.443Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Usecase 및 Recipe Profile

Context-Layered Usecase 및 Recipe Profile 기존 6-layer 구조는 내부 runtime 아키텍처로 유지합니다. 이 profile은 runtime을 디자인 시스템 기반 product UI에 연결하기 위한 공개 경계를 추가합니다. 위치 Context-Layered Architecture는 상위 개념으로 유지합니다. Usecase Boundary, Facade, Recipe는 새로운 경쟁 아키텍처가 아니라 기존 구조 안의 공개 경계입니다. 왜 필요한가 기존 6-layer는 실행 흐름은 설명하지만 product UI와 연결되는 경계를 충분히 설명하지 못했습니다. - actions와 hooks가 의도치 않게 공개 API가 될 수 있습니다. - views가 순

Key points:
• `actions`와 `hooks`가 의도치 않게 공개 API가 될 수 있습니다.
• `views`가 순수 표현과 제품 조합을 함께 포함할 수 있습니다.
• Astryx primitive가 domain state나 `context-action`에 직접 결합될 수 있습니다.
• 상태는 명사, command는 동사로 이름을 짓습니다.
• handler...