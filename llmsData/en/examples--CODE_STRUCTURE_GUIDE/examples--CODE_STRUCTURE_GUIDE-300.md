---
document_id: examples--CODE_STRUCTURE_GUIDE
category: examples
source_path: en/examples/architecture/CODE_STRUCTURE_GUIDE.md
character_limit: 300
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
- 타입: [TypeName].ts (Pas...
