---
document_id: guide--vanilla-js-guide
category: guide
source_path: ko/guide/vanilla-js-guide.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.431Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
바닐라 자바스크립트 가이드

바닐라 자바스크립트 가이드 @context-action/core 패키지는 프레임워크에 구애받지 않는 액션 파이프라인 관리 라이브러리로, 바닐라 자바스크립트에서 완벽하게 작동합니다. 이 가이드는 React 없이 순수 JavaScript 애플리케이션에서 Context-Action을 사용하는 방법을 보여줍니다. 📦 설치 🎯 핵심 개념 Context-Action은 바닐라 자바스크립트를 위한 강력한 액션 파이프라인 시스템을 제공합니다: 1. ActionRegister: 중앙 액션 관리 시스템 2. 타입 안전 액션: 페이로드 타입으로 액션 정의 (TypeScript 선택사항) 3. 우선순위 기반 핸들러: 우선순위 순서로 핸들러 실행 4. 다중 실행 모드: Sequential, parallel, race 실행 5. 고급 제어: 디바운

Key points:
• `register(action, handler, config?)` - 액션 핸들러 등록
• `dispatch(action, payload?, options?)` - 액션 디스패치
• `dispatchWithResult(action, payload?, options?)` - 디스패치 후 상세 결과 반환
• `unregister(action, handlerId?)` - 핸들러 제거
• `cleanup()` - 모든 핸들러...