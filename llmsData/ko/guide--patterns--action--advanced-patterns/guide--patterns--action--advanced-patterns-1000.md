---
document_id: guide--patterns--action--advanced-patterns
category: guide
source_path: ko/guide/patterns/action/advanced-patterns.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.402Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
고급 액션 패턴

고급 액션 패턴 멀티 컨텍스트 설정 기반을 기반으로 구축된 Context-Action 프레임워크의 고급 액션 패턴 개요입니다. 필수 조건 이 가이드는 완전한 멀티 컨텍스트 설정 패턴을 기반으로 합니다. 기본적인 아키텍처와 타입 정의는 다음을 참조하세요: 📚 멀티 컨텍스트 설정 → - 완전한 MVVM 아키텍처, 도메인 분리, 프로바이더 조합 패턴 필수 설정 컴포넌트 이 가이드의 모든 고급 패턴은 다음을 포함한 멀티 컨텍스트 설정이 필요합니다: - MVVM 아키텍처 설정: Model, ViewModel, Performance 레이어 컨텍스트 - 도메인 컨텍스트 아키텍처: User, Product, UI, Business, Validation, Design 도메인 - 프로바이더 조합: 레이

Key points:
• **MVVM 아키텍처 설정**: Model, ViewModel, Performance 레이어 컨텍스트
• **도메인 컨텍스트 아키텍처**: User, Product, UI, Business, Validation, Design 도메인
• **프로바이더 조합**: 레이어 기반 및 도메인 기반 조합 패턴
• **크로스 컨텍스트 통신**: 이벤트 버스 및 컨텍스트 브리지 유틸리티
• **타입 시스템**: 스토어,...