---
document_id: guide--react-context-migration
category: guide
source_path: ko/guide/react-context-migration.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.433Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Context에서 Context-Action으로 마이그레이션 가이드

React Context에서 Context-Action으로 마이그레이션 가이드 이 가이드는 기존 React Context 패턴에서 Context-Action으로 마이그레이션하는 방법을 설명합니다. 일반적인 패턴들과 Context-Action에서의 대응 방법, 그리고 다른 접근이 필요한 패턴들을 다룹니다. 개요 Context-Action은 기본 React Context에 비해 더 구조화된 상태 관리 접근 방식을 제공합니다. 대부분의 패턴은 직접 변환이 가능하지만, 일부는 프레임워크의 관심사 분리 철학으로 인해 아키텍처 조정이 필요합니다. 주요 차이점 | 관점 | React Context | Context-Action | |------|---------------|----------------| | 상태 + 로직 | Provider에 통합 | 분리됨 (Store + Handler) | | 상태 업데이트 | setState / dispatch | setValue / update | | 크로스 컨텍스트 | Provider 내 훅 호출 | Handler에서 여러 store 접근 | | 사이드 이펙트 | Provider의 useEffect 내부 | 별도 컴포넌트/훅으로 분리 | | 불변성 | 수동 관리 | 자동 (Mutative) | --- 패턴 마이그레이션 가이드 1. 기본 상태 관리 React Context: Context-Action: --- 2. 스마트 Setter (함수 또는 값) React의 useState와 많은 Context 패턴은 단일 setter에서 직접 값과 업데이터 함수를 모두 지원합니다. React Context: Context-Action: 핵심 포인트: - setValue(value) - 직접 교체 (이전 값 접근 불가) - update(prev => newValue) - 이전 값 접근이 가능한 함수형 업데이트 - 하나의 API에서 두 패턴이 모두 필요하면 래퍼 함수 생성 --- 3. localStorage 영속성 React Context: Context-Action: --- 4. 크로스 컨텍스트 통신 React Context: Context-Action: --- 5. DOM 사이드 이펙트 React Context: Context-Action: --- 6. 중첩 상태 업데이트 React Context: Context-Action (Mutative 사용): --- 7. Undo/Redo 패턴 React Context: Context-Action (내장 TimeTravelStore): --- 마이그레이션 체크리스트 마이그레이션 전 - [ ] 앱의 모든 Context provider 파악 - [ ] 크로스 컨텍스트 의존성 매핑 - [ ] provider의 모든 사이드 이펙트 목록화 (localStorage, DOM, API 호출) - [ ] 스마트 setter 패턴 파악 (함수/값 이중 지원) 마이그레이션 중 - [ ] 각 상태 도메인에 대한 store context 생성 - [ ] 비즈니스 로직을 handler 컴포넌트로 분리 - [ ] 사이드 이펙트를 전용 컴포넌트/훅으로 추출 - [ ] setState를 setValue/update로 교체 - [ ] 크로스 컨텍스트 통신을 handler 패턴으로 업데이트 마이그레이션 후 - [ ] 모든 상태 업데이트가 올바르게 동작하는지 확인 - [ ] TimeTravelStore 사용 시 undo/redo 테스트 - [ ] 영속성 (localStorage) 기능 확인 - [ ] 크로스 스토어 조정 검증 - [ ] 중첩 데이터에 대해 useStorePath로 성능 테스트 --- 직접 지원되지 않는 패턴 1. 동적 Context 생성 React는 런타임에 context를 생성할 수 있습니다. Context-Action은 미리 정의된 store가 필요합니다. 해결 방법: 진정한 동적 상태에는 useLocalStore를 사용하거나, 가능한 모든 store를 미리 정의하세요. 2. Provider 내장 비즈니스 로직 React Context는 Provider 내부에 모든 로직을 허용합니다. Context-Action은 이를 분리합니다. 해결 방법: children을 감싸고 action handler를 등록하는 Handler 컴포넌트를 사용하세요. 3. 자동 부분 병합 React의 객체를 사용한 setState는 자동으로 병합합니다. Context-Action은 명시적 병합이 필요합니다. 해결 방법: spread 연산자로 부분 업데이트를 처리하는 래퍼 함수를 만드세요. --- 마이그레이션 후 이점 1. 더 나은 관심사 분리 - UI, 비즈니스 로직, 상태가 명확하게 분리됨 2. 자동 불변성 - Mutative 통합으로 우발적 변이 방지 3. 내장 시간 여행 - 수동 구현 없이 Undo/Redo 지원 4. 경로 기반 구독 - 세밀한 리렌더링 제어 5. 타입 안전성 - 전체에 걸친 완전한 TypeScript 추론 6. 메모리 누수 방지 - 자동 정리 및 이벤트 객체 필터링

Key points:
• `setValue(value)` - 직접 교체 (이전 값 접근 불가)
• `update(prev => newValue)` - 이전 값 접근이 가능한 함수형 업데이트
• 하나의 API에서 두 패턴이 모두 필요하면 래퍼 함수 생성
• [ ] 앱의 모든 Context provider 파악
• [ ] 크로스 컨텍스트 의존성 매핑
• [ ] provider의 모든 사이드 이펙트 목록화 (localStorage, DOM, API 호출)
• [ ] 스마트 setter 패턴 파악 (함수/값 이중 지원)
• [ ] 각 상태 도메인에 대한 store context 생성
• [ ] 비즈니스 로직을 handler 컴포넌트로 분리
• [ ] 사이드 이펙트를 전용 컴포넌트/훅으로 추출
• [ ] setState를 setValue/update로 교체
• [ ] 크로스 컨텍스트 통신을 handler 패턴으로 업데이트
• [ ] 모든 상태 업데이트가 올바르게 동작하는지 확인
• [ ] TimeTravelStore 사용 시 undo/redo 테스트
• [ ] 영속성 (localStorage) 기능 확인
• [ ] 크로스 스토어 조정 검증
• [ ] 중첩 데이터에 대해 useStorePath로 성능 테스트
• **더 나은 관심사 분리** - UI, 비즈니스 로직, 상태가 명확하게 분리됨
• **자동 불변성** - Mutative 통합으로 우발적 변이 방지
• **내장 시간 여행** - 수동 구현 없이 Undo/Redo 지원
• **경로 기반 구독** - 세밀한 리렌더링 제어
• **타입 안전성** - 전체에 걸친 완전한 TypeScript 추론
• **메모리 누수 방지** - 자동 정리 및 이벤트 객체 필터링