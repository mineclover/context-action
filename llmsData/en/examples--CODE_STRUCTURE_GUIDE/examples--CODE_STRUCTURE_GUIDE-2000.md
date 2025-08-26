---
document_id: examples--CODE_STRUCTURE_GUIDE
category: examples
source_path: en/examples/architecture/CODE_STRUCTURE_GUIDE.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.272Z'
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

Props 인터페이스

State 타입 정의

디렉토리 정리 계획

현재 문제점
1. 일관성 없는 명명 규칙 (PascalCase, camelCase, kebab-case 혼재)
2. 깊은 중첩 구조 (예: priority-performance, mouse-events)
3. 중복된 기능과 컴포넌트들
4. 페이지별 구조 차이

정리 순서
1. 도메인별 그룹화: 관련 페이지들을 도메인별로 묶기
2. 구조 표준화: 모든 페이지에 동일한 디렉토리 구조 적용
3. 명명 규칙 통일: 파일 및 디렉토리 명명 규칙 일관성 확보
4. 중복 제거: 공통 기능을 shared 도메인으로 이동
5. Navigation 업데이트: 새로운 구조에 맞게 라우팅 정리

마이그레이션 체크리스트

- [ ] 페이지별 구조 표준화
- [ ] 명명 규칙 통일 
- [ ] Import 순서 정리
- [ ] 공통 컴포넌트 추출
- [ ] 타입 정의 개선
- [ ] 코드 스타일 통일
- [ ] Navigation 구조 정리
- [ ] 문서화 업데이트.
