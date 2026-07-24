---
document_id: concept--store-conventions
category: concept
source_path: ko/concept/store-conventions.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.515Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store 컨벤션

Store 컨벤션 Context-Action 프레임워크의 Store, TimeTravelStore, MutableStore 패턴에 대한 완전한 컨벤션입니다. 📋 목차 1. Store 타입 개요 2. Store (기본) 3. TimeTravelStore 4. MutableStore 패턴 5. notifyPath/notifyPaths API 6. 이벤트 루프 제어 7. 성능 가이드라인 8. 베스트 프랙티스 9. 비즈니스 로직 분리 --- Store 타입 개요 Context-Action 프레임워크는 세 가지 전문화된 Store 구현을 제공합니다: | Store 타입 | 구현 | 주요 기능 | 사용 사례 | |------------|------|-----------|----------| | Store | createStore() | 불변성 + Deep Freeze | 일반 상태, 폼, 설정 | | TimeTravelStore | createTimeTravelStore() | Undo/Redo + Structural Sharing | 텍스트 에디터, 드로잉 앱 | | MutableStore | undo/redo 없는 TimeTravelStore | Structural Sharing + 성능 | 고빈도 업데이트, 큰 트리 | 빠른 선택 가이드 --- Store (기본) 개요 완전한 불변성 보장과 안전성 기능을 가진 표준 store입니다. 기능 - Deep Freeze: 값이 동결되어 실수로 인한 변경 방지 - Copy-on-Write: 버전 기반 캐싱을 통한 효율적 복제 - RAF Batching: 여러 업데이트를 단일 프레임으로 배치 - 에러 복구: 문제가 있는 리스너 자동 제거 - 동시성 보호: 업데이트 큐로 경쟁 조건 방지 - notifyPath/notifyPaths: 수동 이벤트 제어 API 핵심 API React 통합 사용 시기 - 일반 상태 관리 - 폼과 설정 - 캐시된 데이터 - 불변성 보장이 중요한 경우 - useStoreValue() 구독 사용 시 --- Tim

Key points:
• **Deep Freeze**: 값이 동결되어 실수로 인한 변경 방지
• **Copy-on-Write**: 버전 기반 캐싱을 통한 효율적 복제
• **RAF Batching**: 여러 업데이트를 단일 프레임으로 배치
• **에러 복구**: 문제가 있는 리스너 자동 제거
• **동시성 보호**: 업데이트 큐로 경쟁 조건 방지
• **notifyPath/notifyPaths**: 수동 이벤트 제어 API
• 일반 상태 관리
• 폼과 설정
• 캐시된 데이터
• 불변성 보장이 중요한 경우
• `useStoreValue()` 구독 사용 시
• **Undo/Redo**: 완전한 히스토리 탐색
• **Structural Sharing**: 변경되지 않은 부분은 같은 참조 유지
• **설정 가능한 히스토리**: `maxHistory` 옵션
• **패치 기반 업데이트**: JSON 패치를 통한 효율적 변경 추적
• **notifyPath/notifyPaths**: 수동 이벤트 제어 API