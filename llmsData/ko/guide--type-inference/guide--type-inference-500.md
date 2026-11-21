---
document_id: guide--type-inference
category: guide
source_path: ko/guide/type-inference.md
character_limit: 500
last_update: '2026-11-21T03:32:50.155Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
TypeScript 타입 추론 가이드

TypeScript 타입 추론 가이드 Context-Action은 별도의 장황한 보일러플레이트 없이도 컴파일 타임 타입 안전성과 IDE 자동 완성을 제공하도록 설계되어 있습니다. 🎯 빠른 설정 Strict TypeScript 설정 권장 프로젝트의 tsconfig.json에서 strict 모드를 활성화하는 것을 권장합니다: 초기값 기반 자동 타입 추론 createStoreContext는 초기값이나 StoreConfig 객체로부터 각 스토어의 정확한 타입을 자동으로 추론합니다: 📋 목차 - Store 타입 추론 - Action 타입

Key points:
• [Store 타입 추론](./patterns/store/basic-usage.md)
• [Action 타입 시스템](./patterns/action/type-system.md)
• [타입 안전성 모범 사례](./best-practices.md)
• [실전...