---
document_id: concept--hooks-reference
category: concept
source_path: ko/concept/hooks-reference.md
character_limit: 500
last_update: '2025-08-21T02:13:42.383Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action React 훅 참조

이 문서는 Context-Action 프레임워크에서 사용 가능한 모든 React 훅을 필수 훅 (핵심 기능)과 유틸리티 훅 (편의 및 최적화)으로 분류합니다. 📋 목차

1. 필수 훅
2. 유틸리티 훅
3. 훅 분류
4. 사용 가이드라인

---

필수 훅

이 훅들은 Context-Action 프레임워크를 사용하는 데 필수적입니다. 대부분의 애플리케이션에서 이러한 훅이 필요합니다. 🔧 RefContext 훅 (성능)

createRefContext<T>()
고성능 DOM 조작을 위한 모든 ref 관련 훅을 생성하는 팩토리 함수.
