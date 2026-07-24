---
document_id: guide--patterns--setup--basic-store-setup
category: guide
source_path: ko/guide/patterns/setup/basic-store-setup.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.388Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
기본 스토어 설정

기본 스토어 설정 Context-Action 프레임워크를 위한 공유 스토어 컨텍스트 설정 패턴입니다. 임포트 타입 정의 일반적인 스토어 패턴 타입 추론 구성 컨텍스트 생성 패턴 단일 도메인 스토어 컨텍스트 다중 도메인 스토어 설정 명시적 제네릭 타입 패턴 프로바이더 설정 패턴 단일 프로바이더 설정 다중 프로바이더 설정 HOC 패턴 설정 조건부 스토어 설정 내보내기 패턴 명명된 내보내기 (권장) 배럴 내보내기 스토어 번들 내보내기 모범 사례 타입 조직 1. 도메인 주도 타입: 비즈니스 도메인별로 스토어 그룹화 2. 일관된 구조: 일관된 속성 네이밍 및 구조 사용 3. 타입 안전성: 리터럴 타입에는 as const 사용하고 적절한 배열 타이핑 4. 초기값: 모든 스토어에 합리적인 기본값 제공

Key points:
• **[스토어 기본 사용법](../store/basic-usage.md)** - UserStores 패턴 사용
• **[스토어 성능 패턴](../store/performance-patterns.md)** - 최적화된 구성 사용
• **[useStoreValue 패턴](../store/useStoreValue-patterns.md)** - 액세스 패턴 사용
• **[MVVM...