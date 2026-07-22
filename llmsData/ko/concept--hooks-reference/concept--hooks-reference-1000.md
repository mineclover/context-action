---
document_id: concept--hooks-reference
category: concept
source_path: ko/concept/hooks-reference.md
character_limit: 1000
last_update: '2026-07-20T04:55:10.468Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action React 훅 참조

Context-Action React 훅 참조 이 문서는 Context-Action 프레임워크에서 사용 가능한 모든 React 훅을 필수 훅 (핵심 기능)과 유틸리티 훅 (편의 및 최적화)으로 분류합니다. 📋 목차 1. 필수 훅 2. 유틸리티 훅 3. 훅 분류 4. 사용 가이드라인 --- 필수 훅 이 훅들은 Context-Action 프레임워크를 사용하는 데 필수적입니다. 대부분의 애플리케이션에서 이러한 훅이 필요합니다. 🔧 RefContext 훅 (성능) createRefContext<T>() 고성능 DOM 조작을 위한 모든 ref 관련 훅을 생성하는 팩토리 함수. - 목적: 제로 React 리렌더링으로 타입 안전한 직접 DOM 조작 시스템 생성 - 반환: { Provider, useRefHandler, useWai

Key points:
• **목적**: 제로 React 리렌더링으로 타입 안전한 직접 DOM 조작 시스템 생성
• **반환**: `{ Provider, useRefHandler, useWaitForRefs, useGetAllRefs }`
• **필수 용도**: 성능 중요 UI, 애니메이션, 실시간 상호작용
• **목적**: 타입 안전성을 갖춘 특정 DOM 요소의 ref 핸들러 가져오기
• **필수 용도**: React...