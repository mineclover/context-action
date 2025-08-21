---
document_id: concept--hooks-reference
category: concept
source_path: ko/concept/hooks-reference.md
character_limit: 1000
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
고성능 DOM 조작을 위한 모든 ref 관련 훅을 생성하는 팩토리 함수. - 목적: 제로 React 리렌더링으로 타입 안전한 직접 DOM 조작 시스템 생성
- 반환: { Provider, useRefHandler, useWaitForRefs, useGetAllRefs }
- 필수 용도: 성능 중요 UI, 애니메이션, 실시간 상호작용

useRefHandler()
타입 안전한 직접 DOM 조작이 가능한 ref 핸들러에 액세스하는 주요 훅. - 목적: 타입 안전성을 갖춘 특정 DOM 요소의 ref 핸들러 가져오기
- 필수 용도: React 리렌더링 없는 직접 DOM 업데이트
- 패턴: React 재조정을 우회하는 성능 레이어

useWaitForRefs()
작업을 실행하기 전에 여러 ref가 마운트될 때까지 대기하는 유틸리티 훅. - 목적: 여러 DOM 요소가 필요한 작업 조정
- 필수 용도: 복잡한 DOM 초기화 시퀀스
- 패턴: 비동기 ref 조정

🎯 Action 훅 (핵심)

createActionContext<T>()
특정 액션 컨텍스트를 위한 모든 액션 관련 훅을 생성하는 팩토리 함수.
