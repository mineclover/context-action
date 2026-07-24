---
document_id: guide--vanilla-js-guide
category: guide
source_path: ko/guide/vanilla-js-guide.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.431Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
바닐라 자바스크립트 가이드

바닐라 자바스크립트 가이드 @context-action/core 패키지는 프레임워크에 구애받지 않는 액션 파이프라인 관리 라이브러리로, 바닐라 자바스크립트에서 완벽하게 작동합니다. 이 가이드는 React 없이 순수 JavaScript 애플리케이션에서 Context-Action을 사용하는 방법을 보여줍니다. 📦 설치 🎯 핵심 개념 Context-Action은 바닐라 자바스크립트를 위한 강력한 액션 파이프라인 시스템을 제공합니다: 1. ActionRegister: 중앙 액션 관리 시스템 2. 타입 안전 액션: 페이로드 타입으로 액션 정의 (TypeScript 선택사항) 3. 우선순위 기반 핸들러: 우선순위 순서로 핸들러 실행 4. 다중 실행 모드: Sequential, parallel, race 실행 5. 고급 제어: 디바운싱, 쓰로틀링, 필터링, 결과 수집 🚀 빠른 시작 기본 예제 TypeScript 사용 (선택사항) 🎨 실제 예제 예제 1: 다중 핸들러를 사용한 폼 검증 예제 2: 디바운싱을 사용한 이벤트 시스템 예제 3: 상태 관리 패턴 예제 4: 독립적 작업을 위한 병렬 실행 예제 5: 고급 결과 수집 🎯 고급 패턴 패턴 1: 핸들러 필터링 패턴 2: 조건부 실행 패턴 3: 오류 시 재시도 패턴 4: AbortController 통합 🛠️ 유틸리티 헬퍼 간단한 바닐라 JS Store 간단한 액션 헬퍼 📚 API 참조 ActionRegister 메서드 - register(action, handler, config?) - 액션 핸들러 등록 - dispatch(action, payload?, options?) - 액션 디스패치 - dispatchWithResult(action, payload?, options?) - 디스패치 후 상세 결과 반환 - unregister(action, handlerId?) - 핸들러 제거 - cleanup() - 모든 핸들러 제거 - getRegistryInfo() - 레지스트리 통계 조회 - getActionStats(action) -

Key points:
• `register(action, handler, config?)` - 액션 핸들러 등록
• `dispatch(action, payload?, options?)` - 액션 디스패치
• `dispatchWithResult(action, payload?, options?)` - 디스패치 후 상세 결과 반환
• `unregister(action, handlerId?)` - 핸들러 제거
• `cleanup()` - 모든 핸들러 제거
• `getRegistryInfo()` - 레지스트리 통계 조회
• `getActionStats(action)` - 액션별 통계 조회
• [Action 패턴 가이드](./patterns/action/index.md)
• [Store 통합 패턴](../concept/store-conventions.md)
• [TypeScript API 참조](../../api/core/README.md)
• [React 통합 가이드](./patterns/action/react-integration.md)
• **ActionRegister**: 중앙 액션 관리 시스템
• **타입 안전 액션**: 페이로드 타입으로 액션 정의 (TypeScript 선택사항)
• **우선순위 기반 핸들러**: 우선순위 순서로 핸들러 실행
•...