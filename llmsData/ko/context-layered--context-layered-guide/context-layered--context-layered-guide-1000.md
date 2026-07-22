---
document_id: context-layered--context-layered-guide
category: context-layered
source_path: ko/context-layered/context-layered-guide.md
character_limit: 1000
last_update: '2026-07-20T10:49:26.412Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered 아키텍처 가이드

Context-Layered 아키텍처 가이드 Context-Layered Architecture는 Context-Action 프레임워크를 사용하는 React 애플리케이션을 위해 설계된 계층형 구조입니다. 핵심 목표는 상태, 흐름 제어, UI, 의존성 주입을 한곳에 섞지 않고, 책임별 경계를 명확하게 나누는 데 있습니다. 이 구조는 단순히 파일을 나누는 규칙이 아니라 다음 세 가지를 동시에 달성하기 위한 설계입니다. - 비즈니스 로직을 UI와 분리한다 - 최신 상태 접근과 side effect를 handler 레이어에서 통제한다 - 테스트를 컴포넌트 중심이 아니라 레이어 중심으로 조직한다 핵심 원칙 1. contexts는 경계를 정의하고 타입과 provider를 만든다 2. handl

Key points:
• 비즈니스 로직을 UI와 분리한다
• 최신 상태 접근과 side effect를 handler 레이어에서 통제한다
• 테스트를 컴포넌트 중심이 아니라 레이어 중심으로 조직한다
• **Usecase Boundary**는 하나의 기능에 대한 상태와 실행 계약을 소유합니다.
• **Facade**는 안정적인 command와 view model을 제공하고 raw dispatch와...