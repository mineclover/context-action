---
document_id: guide--patterns--action--index
category: guide
source_path: ko/guide/patterns/action/index.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.408Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 패턴

액션 패턴 상태 관리 오버헤드 없이 순수한 액션 디스패칭 패턴입니다. 개요 액션 패턴은 이벤트 시스템, 커맨드 패턴, 부수 효과 처리에 완벽합니다. 모든 액션 패턴은 기본 액션 설정 가이드의 표준화된 설정 명세를 기반으로 구축됩니다. 필수 조건 액션 패턴을 구현하기 전에 설정 과정을 완료하세요: 1. 타입 정의 → 공통 액션 패턴 2. 컨텍스트 생성 → 컨텍스트 생성 패턴 3. 프로바이더 설정 → 프로바이더 설정 패턴 액션 패턴 문서의 모든 예제는 표준화된 설정 패턴을 사용합니다. 특히: - 기본 예제용 EventActions 타입 패턴 - 단일 도메인 컨텍스트 생성 패턴 - 컴포넌트 통합용 단일 프로바이더 설정 사용 가능한 액션 패턴 핵심 패턴 - 기본 사용법 - 타입 안전 디스패칭을 갖춘 기본 액션 온리 패턴

Key points:
• 기본 예제용 **EventActions** 타입 패턴
• **단일 도메인 컨텍스트** 생성 패턴
• 컴포넌트 통합용 **단일 프로바이더 설정**
• **[기본 사용법](./basic-usage.md)** - 타입 안전 디스패칭을 갖춘 기본 액션 온리 패턴
• **[타입 시스템](./type-system.md)** - TypeScript 통합 및 타입 안전성
• **[등록 위임](./register-delegation.md)** -...