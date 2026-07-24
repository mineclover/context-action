---
document_id: concept--store-conventions
category: concept
source_path: ko/concept/store-conventions.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.515Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store 컨벤션

Store 컨벤션 Context-Action 프레임워크의 Store, TimeTravelStore, MutableStore 패턴에 대한 완전한 컨벤션입니다. 📋 목차 1. Store 타입 개요 2. Store (기본) 3. TimeTravelStore 4. MutableStore 패턴 5. notifyPath/notifyPaths API 6. 이벤트 루프 제어 7. 성능 가이드라인 8. 베스트 프랙티스 9. 비즈니스 로직 분리 --- Store 타입 개요 Context-Action 프레임워크는 세 가지 전문화된 Store 구현을 제공합니다: | Store 타입 | 구현 | 주요 기능 | 사용 사례 | |------------|------|-----------|----------| | Store | createStore() | 불변성 + Deep Freeze | 일반 상태, 폼, 설정 | | TimeTravelStore | createTimeTravelStore() | Undo/Redo + Structural Sharing | 텍스트 에디터, 드로잉 앱 | | MutableStore | undo/redo 없는 TimeTravelStore | Structural Sharing + 성능 | 고빈도 업데이트, 큰 트리 | 빠른 선택 가이드 --- Store (기본) 개요 완전한 불변성 보장과 안전성 기능을 가진 표준 store입니다. 기능 - Deep Freeze: 값이 동결되어 실수로 인한 변경 방지 - Copy-on-Write: 버전 기반 캐싱을 통한 효율적 복제 - RAF Batching: 여러 업데이트를 단일 프레임으로 배치 - 에러 복구: 문제가 있는 리스너 자동 제거 - 동시성 보호: 업데이트 큐로 경쟁 조건 방지 - notifyPath/notifyPaths: 수동 이벤트 제어 API 핵심 API React 통합 사용 시기 - 일반 상태 관리 - 폼과 설정 - 캐시된 데이터 - 불변성 보장이 중요한 경우 - useStoreValue() 구독 사용 시 --- TimeTravelStore 개요 히스토리 관리를 통한 내장 undo/redo 기능을 가진 Store입니다. 기능 - Undo/Redo: 완전한 히스토리 탐색 - Structural Sharing: 변경되지 않은 부분은 같은 참조 유지 - 설정 가능한 히스토리: maxHistory 옵션 - 패치 기반 업데이트: JSON 패치를 통한 효율적 변경 추적 - notifyPath/notifyPaths: 수동 이벤트 제어 API 핵심 API React 통합 ⚠️ 중요: useStoreValue()가 아닌 useStorePath() 사용 구독 패턴 사용 시기 - 텍스트 에디터, 드로잉 애플리케이션 - 뒤로/앞으로 탐색이 있는 폼 마법사 - undo/redo가 필요한 모든 기능 - 상태 히스토리로 디버깅 - 히스토리 추적이 필수적인 경우 --- MutableStore 패턴 개요 정의: undo/redo 기능을 사용하지 않는 mutable: true TimeTravelStore 이 패턴은 히스토리 추적의 오버헤드 없이 structural sharing과 고성능을 제공하며, 여전히 기술적 기능은 유지합니다. 주요 특성 1. Structural Sharing: 변경되지 않은 부분은 같은 참조 유지 2. Undo/Redo 미사용: 히스토리 메서드는 사용 가능하지만 무시됨 3. 성능 집중: 고빈도 업데이트에 최적화 4. notifyPath/notifyPaths: 고급 이벤트 제어 별도 구현이 아닌 이유는? - TimeTravelStore가 이미 mutable: true를 통해 structural sharing 제공 - 단순히 undo(), redo(), goTo() 메서드를 호출하지 않으면 됨 - 코드 중복과 유지보수 오버헤드 방지 - 필요시 나중에 히스토리 활성화 가능 사용 패턴 고급: 수동 이벤트 제어 notifyPath는 강제 렌더링 API가 아니라 알림 API입니다. React 구독은 선택한 스냅샷을 여전히 Object.is로 비교합니다. primitive 값 변경은 바로 감지되지만, 선택 값이 객체나 배열이면 알림 전에 새 참조로 교체해야 합니다. push, splice, 객체 내부 필드의 제자리 변경처럼 기존 참조를 유지하면 해당 selector는 다시 렌더링되지 않습니다. MutableStore 패턴 사용 시기 - 고빈도 업데이트 (애니메이션, 실시간 데이터) - 선택적 재렌더링이 필요한 큰 상태 트리 - 성능에 민감한 애플리케이션 - 외부 시스템 통합 (WebSocket 등) - undo/redo가 필요하지 않은 경우 성능 이점 --- notifyPath/notifyPaths API 개요 상태 변경과 React 업데이트를 분리하는 수동 이벤트 제어 API입니다. 핵심 개념 전통적 상태 관리: 관찰 가능한 값 변경과 notifyPath 사용: 선택한 스냅샷을 변경하지 않고 notifyPath만 호출하면 patch-aware 비 React 리스너에는 알림을 보낼 수 있지만 React 렌더링을 강제하지는 않습니다. 사용 사례 1. 선택적 로딩 상태 업데이트 2. 외부 시스템 통합 3. 배치 알림 알림 스케줄링 일반 Store 알림은 requestAnimationFrame에서 배치됩니다. TimeTravelStore는 기본적으로 즉시 알리며, notificationMode: 'batched'로 생성한 경우에만 RAF로 배치합니다: --- 이벤트 루프 제어 패턴 1: Action Handler + notifyPath 문제: 로딩 + 데이터에 대한 여러 재렌더링 해결책: 수동 이벤트 제어 패턴 2: RefContext + notifyPath 직접 DOM 조작과 선택적 React 업데이트

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
• 텍스트 에디터, 드로잉 애플리케이션
• 뒤로/앞으로 탐색이 있는 폼 마법사
• undo/redo가 필요한 모든 기능
• 상태 히스토리로 디버깅
• 히스토리 추적이 필수적인 경우
• TimeTravelStore가 이미 `mutable: true`를 통해 structural sharing 제공
• 단순히 `undo()`, `redo()`, `goTo()` 메서드를 호출하지 않으면 됨
• 코드 중복과 유지보수 오버헤드 방지
• 필요시 나중에 히스토리 활성화 가능
• 고빈도 업데이트 (애니메이션, 실시간 데이터)
• 선택적 재렌더링이 필요한 큰 상태 트리
• 성능에 민감한 애플리케이션
• 외부 시스템 통합 (WebSocket 등)
• undo/redo가 필요하지 않은 경우
• 완전한 예시를 포함한 6가지 상세 패턴
• 독립적인 비즈니스 로직 테스트
• 성능 특성과 최적화
• Store 및 action과의 통합 전략
• 실제 구현 예시
• [Main Conventions](./conventions.md) - 전체 프레임워크 컨벤션
• [Hooks Reference](./hooks-reference.md) - 완전한 hooks 문서
• [Architecture Guide](./architecture-guide.md) - 프레임워크 아키텍처
• [Infinite Loop Issues](../../troubleshooting/infinite-loop-issues.md) - 문제 해결 가이드
• [Store 타입 개요](#store-타입-개요)
• [Store (기본)](#store-기본)
• [TimeTravelStore](#timetravelstore)
• [MutableStore 패턴](#mutablestore-패턴)
• [notifyPath/notifyPaths API](#notifypathnotifypaths-api)
• [이벤트 루프 제어](#이벤트-루프-제어)
• [성능 가이드라인](#성능-가이드라인)