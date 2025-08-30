---
document_id: ko_concept_selective-subscription-patterns
category: concept
source_path: ko/concept/selective-subscription-patterns.md
character_limit: 2000
last_update: '2025-08-30T10:57:35.528Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
선택적 구독 패턴

선택적 구독 패턴 사전 메모화 최적화: 메모화가 필요하기 전에 불필요한 반응형 구독을 제거하는 전략적 구독 관리. 개요 선택적 구독 패턴은 반응형 구독이 발생하기 전에 불필요한 구독을 제거하여 성능을 최적화하는 사전 메모화 최적화 전략을 나타냅니다. 비싼 메모화 체인을 관리하는 대신, 이 접근법은 반응형과 비반응형 데이터 접근 패턴 사이에서 전략적으로 선택하여, 시각적 업데이트가 React 리렌더링을 필요로 하지 않을 때 스토어를 반응형 상태 관리자에서 순수한 데이터 저장소로 변환합니다. 철학: 구독 최적화 우선 사실 후 메모화 기술로 최적화하는 대신, 선택적 구독 패턴은 성능 병목 현상을 그 근원에서 방지합니다: 핵심 개념 1. 스토어를 데이터 저장소 패턴으로 스토어를 반응형 상태 관리자에서 순수 데이터 저장소로 변환: 2. RefContext 직접 조작 React를 완전히 우회하는 시각적 업데이트를 위해 RefContext 사용: 3. 조건부 구독 전략 사용 사례 요구사항에 따라 선택적 패턴 적용: 구현 패턴 패턴 1: 비반응형 캔버스 제어 고성능 그래픽과 애니메이션용: 패턴 2: 선택적 메트릭 구독 성능 대시보드와 디버깅용: 패턴 3: 하이브리드 아키텍처 토글 비교 성능 테스트용: 스토어 데이터 접근 패턴 비반응형 스토어 접근 훅 성능 비교 전통적 반응형 패턴 영향: 마우스 추적을 위해 초당 60회 React 리렌더링 비반응형 선택적 패턴 영향: 0회 React 리렌더링 + 60fps GPU 가속 시각화 아키텍처 가이드라인 비반응형 패턴을 사용해야 하는 경우 1. 고빈도 시각적 업데이트 (애니메이션, 실시간 그래픽) 2. 성능 중요 상호작용 (게임, 그리기 앱) 3. 대규모 데이터 시각화 (차트, 대시보드) 4. 메모리 제약 환경 (모바일, 임베디드) 반응형 패턴을 사용해야 하는 경우 1. 폼 상태 관리 (사용자 입력, 유효성 검사) 2. UI 컴포넌트 상태 (모달, 드롭다운, 토글) 3. 비즈니스 로직 상태 (사용자 프로필, 설정

Key points:
• [RefContext 가이드](./react-refs-guide.md) - 직접 DOM 조작 패턴
• [스토어 패턴](./pattern-guide.md#store-patterns) - 전통적 반응형 패턴
• [성능 최적화](../guide/best-practices.md#performance-optimization) - 일반 성능 가이드라인
• [MVVM 아키텍처](./mvvm-core-architecture.md) - 아키텍처 컨텍스트
• [향상된 컨텍스트 스토어 데모](../../example/src/pages/performance/mouse-events/enhanced-context-store/) - 프로덕션 예제
• [캔버스 성능 비교](../examples/selective-subscription.md) - 벤치마킹 예제
• [아키텍처 토글 구현](../examples/pattern-comparison.md) - 하이브리드 패턴
• **고빈도 시각적 업데이트** (애니메이션, 실시간 그래픽)
• **성능 중요 상호작용** (게임, 그리기 앱)
• **대규모 데이터 시각화** (차트, 대시보드)
• **메모리 제약 환경** (모바일, 임베디드)
• **폼 상태 관리** (사용자 입력, 유효성...