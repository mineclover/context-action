---
document_id: examples--CODE_STRUCTURE_GUIDE
category: examples
source_path: en/examples/architecture/CODE_STRUCTURE_GUIDE.md
character_limit: 500
last_update: '2025-08-26T00:34:27.271Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Code Structure Guide

일관된 코드 구조 표준

페이지 구조 패턴

기본 페이지 구조

명명 규칙

파일 명명
- 페이지: [PageName]Page.tsx (PascalCase + Page 접미사)
- 컴포넌트: [ComponentName].tsx (PascalCase)
- 훅: use[HookName].ts (camelCase + use 접두사)
- 컨텍스트: [ContextName]Context.tsx (PascalCase + Context 접미사)
- 타입: [TypeName].ts (PascalCase)

디렉토리 명명
- 도메인 디렉토리: kebab-case (예: action-guard, store-patterns)
- 기능별 디렉토리: 복수형 사용 (components, hooks, contexts, types)

컴포넌트 구조 표준

페이지 컴포넌트 템플릿

Import 순서 표준

코드 스타일 가이드

컴포넌트 선언

Props 인...
