---
document_id: guide--vanilla-js-guide
category: guide
source_path: ko/guide/vanilla-js-guide.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.431Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
바닐라 자바스크립트 가이드

바닐라 자바스크립트 가이드 @context-action/core 패키지는 프레임워크에 구애받지 않는 액션 파이프라인 관리 라이브러리로, 바닐라 자바스크립트에서 완벽하게 작동합니다. 이 가이드는 React 없이 순수 JavaScript 애플리케이션에서 Context-Action을 사용하는 방법을 보여줍니다. 📦 설치 🎯 핵심 개념 Context-Action은 바닐라 자바스크립트를 위한 강력한 액션 파이프라인 시스템을 제공합니다: 1. ActionRegister: 중앙 액션 관리 시스템 2. 타입 안전 액션: 페이로드 타입으로 액션 정의 (TypeScript 선택사항) 3. 우선순위 기반 핸들러: 우선순위 순서로 핸들러 실행 4. 다중 실행 모드: Sequential, parallel, race 실행 5. 고급 제어: 디바운싱, 쓰로틀링, 필터링, 결과 수집 🚀 빠른 시작 기본 예제 TypeScript 사용 (선택사항) 🎨 실제 예제 예제 1: 다중 핸들러를 사용한 폼 검증 예제 2: 디바운싱을 사용한 이벤트 시스템 예제 3: 상태 관리 패턴 예제 4: 독립적 작업을 위한 병렬 실행 예제 5: 고급 결과 수집 🎯 고급 패턴 패턴 1: 핸들러 필터링 패턴 2: 조건부 실행 패턴 3: 오류 시 재시도 패턴 4: AbortController 통합 🛠️ 유틸리티 헬퍼 간단한 바닐라 JS Store 간단한 액션 헬퍼 📚 API 참조 ActionRegister 메서드 - register(action, handler, config?) - 액션 핸들러 등록 - dispatch(action, payload?, options?) - 액션 디스패치 - dispatchWithResult(action, payload?, options?) - 디스패치 후 상세 결과 반환 - unregister(action, handlerId?) - 핸들러 제거 - cleanup() - 모든 핸들러 제거 - getRegistryInfo() - 레지스트리 통계 조회 - getActionStats(action) - 액션별 통계 조회 핸들러 설정 디스패치 옵션 🎓 모범 사례 1. 타입 안전성을 위해 TypeScript 사용 (선택사항이지만 권장) 2. Store 통합 패턴 따르기: 읽기 → 실행 → 업데이트 3. 적절한 우선순위 설정: 검증 (높음) → 비즈니스 로직 (중간) → 부수 효과 (낮음) 4. 사용자 입력에 디바운싱 사용: 검색, 폼 검증 등 5. 고빈도 이벤트에 쓰로틀링 사용: 스크롤, 마우스 이동, 리사이즈 6. 핸들러 정리: 더 이상 필요하지 않을 때 unregister 함수 호출 7. 에러를 우아하게 처리: 검증 오류에 controller.abort() 사용 8. 실행 모드 활용: 의존적 작업은 순차, 독립적 작업은 병렬 🔗 더 보기 - Action 패턴 가이드 - Store 통합 패턴 - TypeScript API 참조 - React 통합 가이드

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
• **다중 실행 모드**: Sequential, parallel, race 실행
• **고급 제어**: 디바운싱, 쓰로틀링, 필터링, 결과 수집
• **타입 안전성을 위해 TypeScript 사용** (선택사항이지만 권장)
• **Store 통합 패턴 따르기**: 읽기 → 실행 → 업데이트
• **적절한 우선순위 설정**: 검증 (높음) → 비즈니스 로직 (중간) → 부수 효과 (낮음)
• **사용자 입력에 디바운싱 사용**: 검색, 폼 검증 등
• **고빈도 이벤트에 쓰로틀링 사용**: 스크롤, 마우스 이동, 리사이즈
• **핸들러 정리**: 더 이상 필요하지 않을 때 unregister 함수 호출
• **에러를 우아하게 처리**: 검증 오류에 controller.abort() 사용
• **실행 모드 활용**: 의존적 작업은 순차, 독립적 작업은 병렬