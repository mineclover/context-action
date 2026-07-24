---
document_id: guide--patterns--action--dispatch-patterns
category: guide
source_path: ko/guide/patterns/action/dispatch-patterns.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.405Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
디스패치 패턴

디스패치 패턴 실행 모드, 필터링, 성능 최적화를 포함한 Context-Action 프레임워크의 핵심 액션 디스패칭 패턴입니다. Import 필수 조건 타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 기본 액션 설정을 참조하세요. 이 문서는 설정 가이드의 AppActions 패턴을 사용합니다: - 타입 정의 → 확장 액션 인터페이스 - 컨텍스트 생성 → 단일 도메인 컨텍스트 - 프로바이더 설정 → 단일 프로바이더 설정 예제들은 다음과 같이 구성된 컨텍스트가 있다고 가정합니다: 기본 디스패치 결과 수집 없이 간단한 액션 디스패칭. 실행 모드 같은 액션에 대한 여러 핸들러가 실행되는 방식을 제어합니다. 순차 실행 (기본값) 핸들러들이 순서대로 실행되어 초기 핸들러가 후속 핸들러를 위해 페이로드를 수정할 수 있습니다. 병렬 실행 분석, 로깅, 알림 같은 독립적인 작업에 최적입니다. 경쟁 실행 폴백 메커니즘과 성능 중요 작업에 유용합니다. 핸들러 필터링 어떤 핸들러를 실행할지 세밀하게 제어합니다. 태그 기반 필터링 카테고리 필터링 커스텀 핸들러 필터링 성능 최적화 타임아웃 제어 우선순위 기반 실행 에러 처리 기본 에러 처리 조용한 실패 실제 예제 - 검색 페이지 - 필터링을 사용한 디바운스 검색 - 스크롤 페이지 - 성능 최적화된 스크롤 처리 - 우선순위 데모 - 우선순위 기반 실행 패턴 관련 패턴 - 액션 기본 사용법 - 기본 액션 패턴 - 결과와 함께 디스패치 - 결과 수집 패턴 - 등록 패턴 - 핸들러 등록 패턴 - 타입 시스템 - TypeScript 통합 - 기본 액션 설정 - 설정 패턴 및 타입 정의

Key points:
• 타입 정의 → [확장 액션 인터페이스](../setup/basic-action-setup.md#extended-action-interface)
• 컨텍스트 생성 → [단일 도메인 컨텍스트](../setup/basic-action-setup.md#single-domain-context)
• 프로바이더 설정 → [단일 프로바이더 설정](../setup/basic-action-setup.md#single-provider-setup)
• [검색 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/SearchPage.tsx) - 필터링을 사용한 디바운스 검색
• [스크롤 페이지](https://github.com/mineclover/context-action/blob/main/example/src/pages/actionguard/ScrollPage.tsx) - 성능 최적화된 스크롤 처리
• [우선순위 데모](https://github.com/mineclover/context-action/tree/main/example/src/pages/actionguard/priority-performance) - 우선순위 기반 실행 패턴
• **[액션 기본 사용법](./basic-usage.md)** - 기본 액션 패턴
• **[결과와 함께 디스패치](./dispatch-with-result.md)** - 결과 수집 패턴
• **[등록 패턴](./register-patterns.md)** - 핸들러 등록 패턴
• **[타입...