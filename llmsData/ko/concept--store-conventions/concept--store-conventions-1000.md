---
document_id: concept--store-conventions
category: concept
source_path: ko/concept/store-conventions.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.515Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store 컨벤션

Store 컨벤션 Context-Action 프레임워크의 Store, TimeTravelStore, MutableStore 패턴에 대한 완전한 컨벤션입니다. 📋 목차 1. Store 타입 개요 2. Store (기본) 3. TimeTravelStore 4. MutableStore 패턴 5. notifyPath/notifyPaths API 6. 이벤트 루프 제어 7. 성능 가이드라인 8. 베스트 프랙티스 9. 비즈니스 로직 분리 --- Store 타입 개요 Context-Action 프레임워크는 세 가지 전문화된 Store 구현을 제공합니다: | Store 타입 | 구현 | 주요 기능 | 사용 사례 | |------------|------|-----------|----------| | Store | createSto

Key points:
• **Deep Freeze**: 값이 동결되어 실수로 인한 변경 방지
• **Copy-on-Write**: 버전 기반 캐싱을 통한 효율적 복제
• **RAF Batching**: 여러 업데이트를 단일 프레임으로 배치
• **에러 복구**: 문제가 있는 리스너 자동 제거
• **동시성 보호**: 업데이트 큐로 경쟁 조건 방지
• **notifyPath/notifyPaths**: 수동 이벤트 제어 API