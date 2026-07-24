---
document_id: guide--patterns--setup--basic-store-setup
category: guide
source_path: ko/guide/patterns/setup/basic-store-setup.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.389Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
기본 스토어 설정

기본 스토어 설정 Context-Action 프레임워크를 위한 공유 스토어 컨텍스트 설정 패턴입니다. 임포트 타입 정의 일반적인 스토어 패턴 타입 추론 구성 컨텍스트 생성 패턴 단일 도메인 스토어 컨텍스트 다중 도메인 스토어 설정 명시적 제네릭 타입 패턴 프로바이더 설정 패턴 단일 프로바이더 설정 다중 프로바이더 설정 HOC 패턴 설정 조건부 스토어 설정 내보내기 패턴 명명된 내보내기 (권장) 배럴 내보내기 스토어 번들 내보내기 모범 사례 타입 조직 1. 도메인 주도 타입: 비즈니스 도메인별로 스토어 그룹화 2. 일관된 구조: 일관된 속성 네이밍 및 구조 사용 3. 타입 안전성: 리터럴 타입에는 as const 사용하고 적절한 배열 타이핑 4. 초기값: 모든 스토어에 합리적인 기본값 제공 컨텍스트 구성 1. 전략 선택: 객체에는 'shallow', 중첩 구조에는 'deep' 사용 2. 성능: 리렌더링에 대한 비교 전략의 영향 고려 3. 초기값: 초기값을 예상 데이터 타입과 일치시키기 4. 설명: 복잡한 스토어 구성에 설명 추가 프로바이더 조직 1. 논리적 그룹화: 관련된 스토어 프로바이더들을 함께 그룹화 2. 프로바이더 순서: 종속성에 따른 프로바이더 순서 (독립적 → 종속적) 3. 구성: 수동 중첩보다 composeProviders 선호 4. HOC 사용: 컴포넌트 수준 프로바이더 래핑을 위해 HOC 패턴 사용 스토어 액세스 패턴 기본 스토어 액세스 매니저 기반 액세스 일반적인 패턴 참조 이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다: - 스토어 기본 사용법 - UserStores 패턴 사용 - 스토어 성능 패턴 - 최적화된 구성 사용 - useStoreValue 패턴 - 액세스 패턴 사용 - MVVM 아키텍처 - 도메인 스토어 분리 사용 - 도메인 컨텍스트 아키텍처 - 다중 도메인 스토어 사용 관련 설정 가이드 - 기본 액션 설정 - 액션 컨텍스트 설정 패턴 - 다중 컨텍스트 설정 - 복잡한 아키텍처 설정 - 프로바이더 구성

Key points:
• **[스토어 기본 사용법](../store/basic-usage.md)** - UserStores 패턴 사용
• **[스토어 성능 패턴](../store/performance-patterns.md)** - 최적화된 구성 사용
• **[useStoreValue 패턴](../store/useStoreValue-patterns.md)** - 액세스 패턴 사용
• **[MVVM 아키텍처](../architecture/mvvm.md)** - 도메인 스토어 분리 사용
• **[도메인 컨텍스트 아키텍처](../architecture/domain-context.md)** - 다중 도메인 스토어 사용
• **[기본 액션 설정](./basic-action-setup.md)** - 액션 컨텍스트 설정 패턴
• **[다중 컨텍스트 설정](./multi-context-setup.md)** - 복잡한 아키텍처 설정
• **[프로바이더 구성](../store/withProvider-pattern.md)** - 고급 프로바이더 패턴
• **도메인 주도 타입**: 비즈니스 도메인별로 스토어 그룹화
• **일관된 구조**: 일관된 속성 네이밍 및 구조 사용
• **타입 안전성**: 리터럴 타입에는 `as const` 사용하고 적절한 배열...