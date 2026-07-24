---
document_id: guide--patterns--async--index
category: guide
source_path: ko/guide/patterns/async/index.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.387Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
비동기 패턴 설정 및 구성

비동기 패턴 설정 및 구성 Context-Action 프레임워크에서 비동기 작업, 엘리먼트 대기, DOM 안전성 패턴을 처리하기 위한 완전한 설정 가이드입니다. 필수 조건 필수 설정 가이드 - 기본 액션 설정 - 비동기 핸들러를 위한 액션 컨텍스트 설정 - 기본 스토어 설정 - 비동기 상태 관리를 위한 스토어 컨텍스트 - RefContext 설정 - DOM 엘리먼트 추적을 위한 Ref 컨텍스트 - 멀티 컨텍스트 설정 - 여러 컨텍스트를 사용하는 복잡한 비동기 아키텍처 핵심 의존성 설정 개요 비동기 패턴은 최적의 안전성과 성능을 위해 세 가지 주요 컨텍스트 간의 조정된 설정이 필요합니다: 1. 액션 컨텍스트 설정 비동기 작업 및 비즈니스 로직 처리를 위해: 2. 스토어 컨텍스트 설정 비동기 작업 상태 관리를 위해:

Key points:
• **[기본 액션 설정](../setup/basic-action-setup.md)** - 비동기 핸들러를 위한 액션 컨텍스트 설정
• **[기본 스토어 설정](../setup/basic-store-setup.md)** - 비동기 상태 관리를 위한 스토어 컨텍스트
• **[RefContext 설정](../setup/ref-context-setup.md)** - DOM 엘리먼트 추적을 위한 Ref 컨텍스트
• **[멀티...