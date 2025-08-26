---
document_id: guide--type-system
category: guide
source_path: ko/guide/patterns/action/type-system.md
character_limit: 500
last_update: '2025-08-26T00:34:27.380Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 타입 시스템

ActionPayloadMap, 타입 안전성, TypeScript 통합을 포함한 Context-Action 프레임워크의 액션 타입 시스템에 대한 완전한 가이드입니다. 필수 조건

액션 타입 정의와 컨텍스트 설정에 대해서는 기본 액션 설정을 참조하세요. 이 문서는 액션 설정을 사용한 타입 시스템 패턴을 보여줍니다:
- 타입 정의 → 확장 액션 인터페이스
- 공통 패턴 → 공통 액션 패턴

ActionPayloadMap 인터페이스

Context-Action 프레임워크에서 타입 안전 액션 처리의 기반입니다. 기본 액션 매핑

ActionRegister와 함께 사용

파이프라인 컨트롤러 타입

액션 핸들러를 위한 타입 안전 파이프라인 제어입니다. 기본 파이프라인 제어

결과와 함께 조기 반환

우선순위 점프

액션 핸들러 타입

완전한 TypeScript 지원을 갖춘 타입 안전 액션 핸들러 정의입니다.
