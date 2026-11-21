---
document_id: guide--type-inference
category: guide
source_path: ko/guide/type-inference.md
character_limit: 1000
last_update: '2026-11-21T03:32:50.155Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
TypeScript 타입 추론 가이드

TypeScript 타입 추론 가이드 Context-Action은 별도의 장황한 보일러플레이트 없이도 컴파일 타임 타입 안전성과 IDE 자동 완성을 제공하도록 설계되어 있습니다. 🎯 빠른 설정 Strict TypeScript 설정 권장 프로젝트의 tsconfig.json에서 strict 모드를 활성화하는 것을 권장합니다: 초기값 기반 자동 타입 추론 createStoreContext는 초기값이나 StoreConfig 객체로부터 각 스토어의 정확한 타입을 자동으로 추론합니다: 📋 목차 - Store 타입 추론 - Action 타입 시스템 - 타입 안전성 모범 사례 - 실전 예제 🔑 핵심 특징 🎯 자동 타입 추론 - 단순한 스토어는 수동 제네릭 선언 없이 추론 가능 - 중첩 객체, 배열, 리터럴(as const)까지 정확한 추론 유지 - initialValue 키를 데이터 필드로 쓰는 경우 asStoreValue(...)로 의도 구분 가능 🛡️ 컴파일 타임 안전성 - 액션 이름 및 페이로드 불일치를 빌드/에디터 단계에서 즉시 차단 - ActionResultMap을 통한 dispatchWithResult / useActionResultHandler 반환

Key points:
• [Store 타입 추론](./patterns/store/basic-usage.md)
• [Action 타입 시스템](./patterns/action/type-system.md)
• [타입 안전성 모범 사례](./best-practices.md)
• [실전 예제](../examples/basic-setup.md)
• 단순한 스토어는 수동 제네릭 선언 없이 추론 가능
• 중첩 객체, 배열, 리터럴(`as const`)까지 정확한 추론 유지
• `initialValue` 키를 데이터 필드로 쓰는 경우 `asStoreValue(...)`로 의도 구분 가능
• 액션 이름 및 페이로드 불일치를 빌드/에디터 단계에서 즉시 차단
•...