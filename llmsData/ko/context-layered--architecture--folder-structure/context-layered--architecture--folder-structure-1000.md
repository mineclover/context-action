---
document_id: context-layered--architecture--folder-structure
category: context-layered
source_path: ko/context-layered/architecture/folder-structure.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.481Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered 폴더 구조

Context-Layered 폴더 구조 이 문서는 Context-Layered Architecture를 프로젝트 폴더 구조로 어떻게 풀어내는지 설명합니다. 핵심은 “기술별 분리”가 아니라 “책임별 분리”입니다. 권장 구조 레이어별 상세 역할 1. contexts/ 여기에는 타입 정의와 context 생성만 둡니다. 이 레이어는 구조의 경계를 정하는 곳입니다. handler 등록이나 business logic 구현은 넣지 않는 것이 좋습니다. 2. business/ 순수 비즈니스 로직을 둡니다. - validation 규칙 - 가격 계산 - 상태 전이 규칙 - 파생 데이터 계산 여기 함수는 가능하면 입력만으로 결과가 결정되도록 유지하세요. 3. handlers/ 실행

Key points:
• validation 규칙
• 가격 계산
• 상태 전이 규칙
• 파생 데이터 계산
• 최신 store 값 읽기
• business 함수 호출