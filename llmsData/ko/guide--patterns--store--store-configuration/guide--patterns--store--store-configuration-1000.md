---
document_id: guide--patterns--store--store-configuration
category: guide
source_path: ko/guide/patterns/store/store-configuration.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.418Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스토어 설정

스토어 설정 복잡한 스토어 시나리오를 위한 성능 최적화와 커스텀 비교 전략. 사전 요구사항 기본 스토어 설정과 설정 패턴은 기본 스토어 설정 을 참조하세요. 이 문서는 설정 패턴을 사용한 고급 설정을 보여줍니다: - 타입 정의 → 일반적인 스토어 패턴 - 설정 → 타입 추론 설정 - 컨텍스트 생성 → 단일 도메인 스토어 컨텍스트 개요 고급 설정은 확립된 설정 패턴을 기반으로 구축된 복잡한 애플리케이션을 위한 스토어 동작, 비교 전략 및 성능 최적화에 대한 세밀한 제어를 제공합니다. 성능 최적화 설정 비교 전략 참조 전략 얕은 전략 깊은 전략 커스텀 비교 옵션 키 무시 패턴 커스텀 비교자 패턴 디버그 설정 성능 모니터링 메모리 최적화 모범 사례 1. 설정 패턴 따르기: 기본 스토어 설정

Key points:
• 타입 정의 → [일반적인 스토어 패턴](../setup/basic-store-setup.md#common-store-patterns)
• 설정 → [타입 추론 설정](../setup/basic-store-setup.md#type-inference-configurations)
• 컨텍스트 생성 → [단일 도메인 스토어...