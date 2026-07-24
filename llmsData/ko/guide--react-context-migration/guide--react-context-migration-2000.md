---
document_id: guide--react-context-migration
category: guide
source_path: ko/guide/react-context-migration.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.433Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
React Context에서 Context-Action으로 마이그레이션 가이드

React Context에서 Context-Action으로 마이그레이션 가이드 이 가이드는 기존 React Context 패턴에서 Context-Action으로 마이그레이션하는 방법을 설명합니다. 일반적인 패턴들과 Context-Action에서의 대응 방법, 그리고 다른 접근이 필요한 패턴들을 다룹니다. 개요 Context-Action은 기본 React Context에 비해 더 구조화된 상태 관리 접근 방식을 제공합니다. 대부분의 패턴은 직접 변환이 가능하지만, 일부는 프레임워크의 관심사 분리 철학으로 인해 아키텍처 조정이 필요합니다. 주요 차이점 | 관점 | React Context | Context-Action | |------|---------------|----------------| | 상태 + 로직 | Provider에 통합 | 분리됨 (Store + Handler) | | 상태 업데이트 | setState / dispatch | setValue / update | | 크로스 컨텍스트 | Provider 내 훅 호출 | Handler에서 여러 store 접근 | | 사이드 이펙트 | Provider의 useEffect 내부 | 별도 컴포넌트/훅으로 분리 | | 불변성 | 수동 관리 | 자동 (Mutative) | --- 패턴 마이그레이션 가이드 1. 기본 상태 관리 React Context: Context-Action: --- 2. 스마트 Setter (함수 또는 값) React의 useState와 많은 Context 패턴은 단일 setter에서 직접 값과 업데이터 함수를 모두 지원합니다. React Context: Context-Action: 핵심 포인트: - setValue(value) - 직접 교체 (이전 값 접근 불가) - update(prev => newValue) - 이전 값 접근이 가능한 함수형 업데이트 - 하나의 API에서 두 패턴이 모두 필요하면 래퍼 함수 생성 --- 3. localStorage 영속성 React Context: Con

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