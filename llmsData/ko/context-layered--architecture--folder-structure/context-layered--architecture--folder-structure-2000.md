---
document_id: context-layered--architecture--folder-structure
category: context-layered
source_path: ko/context-layered/architecture/folder-structure.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.481Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered 폴더 구조

Context-Layered 폴더 구조 이 문서는 Context-Layered Architecture를 프로젝트 폴더 구조로 어떻게 풀어내는지 설명합니다. 핵심은 “기술별 분리”가 아니라 “책임별 분리”입니다. 권장 구조 레이어별 상세 역할 1. contexts/ 여기에는 타입 정의와 context 생성만 둡니다. 이 레이어는 구조의 경계를 정하는 곳입니다. handler 등록이나 business logic 구현은 넣지 않는 것이 좋습니다. 2. business/ 순수 비즈니스 로직을 둡니다. - validation 규칙 - 가격 계산 - 상태 전이 규칙 - 파생 데이터 계산 여기 함수는 가능하면 입력만으로 결과가 결정되도록 유지하세요. 3. handlers/ 실행 흐름과 side effect를 담당합니다. - 최신 store 값 읽기 - business 함수 호출 - store 업데이트 - API 호출 - ref focus나 scroll 같은 imperative 작업 즉, “실제로 일이 일어나는 곳”이지만, UI 표현은 하지 않습니다. 모든 handler 등록은 도메인 Handler Registry에서 묶습니다. handler가 하나뿐인 작은 기능도 Page, View, Context에서 useActionHandler를 직접 호출하지 않습니다. 4. actions/ view가 직접 dispatch('someAction', payload)를 남발하지 않도록, 의미 있는 함수로 감싸는 레이어입니다. 5. hooks/ store를 view 친화적인 형태로 구독하는 레이어입니다. 6. views/ 렌더링과 입력 전달만 담당합니다. - 폼 렌더링 - 버튼 클릭 - 입력 값 전달 - 상태 표시 가격 계산, 검증 규칙, API 호출은 view 안에 넣지 않는 편이 좋습니다. 7. Page 최상위 페이지는 provider 구성과 Handler Registry 마운트를 담당합니다. 표준 중첩은 Action Provider → Sto

Key points:
• validation 규칙
• 가격 계산
• 상태 전이 규칙
• 파생 데이터 계산
• 최신 store 값 읽기
• business 함수 호출
• store 업데이트
• API 호출
• ref focus나 scroll 같은 imperative 작업
• 폼 렌더링
• 버튼 클릭
• 입력 값 전달
• 상태 표시
• 새 기능 추가 시 어느 폴더에 들어가야 할지 명확합니다.
• 리뷰할 때 “이 로직이 왜 view에 있지?” 같은 혼선을 줄일 수 있습니다.
• 테스트 범위를 레이어 기준으로 나누기 쉽습니다.