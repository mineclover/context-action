---
document_id: guide--patterns--async--index
category: guide
source_path: ko/guide/patterns/async/index.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.387Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
비동기 패턴 설정 및 구성

비동기 패턴 설정 및 구성 Context-Action 프레임워크에서 비동기 작업, 엘리먼트 대기, DOM 안전성 패턴을 처리하기 위한 완전한 설정 가이드입니다. 필수 조건 필수 설정 가이드 - 기본 액션 설정 - 비동기 핸들러를 위한 액션 컨텍스트 설정 - 기본 스토어 설정 - 비동기 상태 관리를 위한 스토어 컨텍스트 - RefContext 설정 - DOM 엘리먼트 추적을 위한 Ref 컨텍스트 - 멀티 컨텍스트 설정 - 여러 컨텍스트를 사용하는 복잡한 비동기 아키텍처 핵심 의존성 설정 개요 비동기 패턴은 최적의 안전성과 성능을 위해 세 가지 주요 컨텍스트 간의 조정된 설정이 필요합니다: 1. 액션 컨텍스트 설정 비동기 작업 및 비즈니스 로직 처리를 위해: 2. 스토어 컨텍스트 설정 비동기 작업 상태 관리를 위해: 3. RefContext 설정 DOM 엘리먼트 가용성 추적을 위해: 비동기 패턴 사양 핵심 비동기 패턴 1. 실시간 상태 접근 패턴 설정 사양: 액션 컨텍스트 + 스토어 컨텍스트 - 목적: store.getValue()를 사용한 클로저 트랩 방지 - 필수 설정: 기본 액션 설정 + 기본 스토어 설정 - 핵심 구현: 비동기 핸들러에서 실시간 상태 접근 - 문서: 실시간 상태 접근 2. 대기 후 실행 패턴 설정 사양: RefContext + 액션 컨텍스트 - 목적: 엘리먼트 가용성 확인 후 안전한 DOM 작업 - 필수 설정: RefContext 설정 + 기본 액션 설정 - 핵심 구현: DOM 조작 전 await waitForRefs() 사용 - 문서: 대기 후 실행 3. 조건부 대기 패턴 설정 사양: 스토어 컨텍스트 + RefContext + 액션 컨텍스트 - 목적: 런타임 조건에 따른 스마트 대기 - 필수 설정: 상태 기반 대기 결정을 위한 세 가지 컨텍스트 설정 모두 - 핵심 구현: 스토어 상태에 따른 조건부 waitForRefs() - 문서: 조건부 대기 4. 타임아웃 보호 패턴 설정 사양: 액션 컨텍스트 + 스토어 컨텍스트 (선택적 RefContext)

Key points:
• **[기본 액션 설정](../setup/basic-action-setup.md)** - 비동기 핸들러를 위한 액션 컨텍스트 설정
• **[기본 스토어 설정](../setup/basic-store-setup.md)** - 비동기 상태 관리를 위한 스토어 컨텍스트
• **[RefContext 설정](../setup/ref-context-setup.md)** - DOM 엘리먼트 추적을 위한 Ref 컨텍스트
• **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** - 여러 컨텍스트를 사용하는 복잡한 비동기 아키텍처
• **목적**: `store.getValue()`를 사용한 클로저 트랩 방지
• **필수 설정**: [기본 액션 설정](../setup/basic-action-setup.md) + [기본 스토어 설정](../setup/basic-store-setup.md)
• **핵심 구현**: 비동기 핸들러에서 실시간 상태 접근
• **문서**: [실시간 상태 접근](./real-time-state-access.md)
• **목적**: 엘리먼트 가용성 확인 후 안전한 DOM 작업
• **필수 설정**: [RefContext 설정](../setup/ref-context-setup.md) +...