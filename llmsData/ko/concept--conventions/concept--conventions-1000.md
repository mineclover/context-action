---
document_id: concept--conventions
category: concept
source_path: ko/concept/conventions.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.382Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action Framework Conventions

이 문서는 Context-Action 프레임워크의 세 가지 핵심 패턴(Actions, Stores, RefContext)을 사용할 때 따라야 할 코딩 컨벤션과 베스트 프랙티스를 정의합니다. 📋 목차

1. 네이밍 컨벤션
2. 파일 구조
3. 패턴 사용법
4. 타입 정의
5. 코드 스타일
6. 성능 가이드라인
7. 에러 핸들링
8. RefContext 컨벤션

---

네이밍 컨벤션

🏷️ 리네이밍 패턴 (Renaming Pattern)

Context-Action 프레임워크의 핵심 컨벤션은 세 가지 패턴 모두에 대한 도메인별 리네이밍 패턴입니다.
