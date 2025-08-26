---
document_id: guide--domain-context
category: guide
source_path: ko/guide/patterns/architecture/domain-context.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.357Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
도메인 컨텍스트 아키텍처 패턴

Context-Action 프레임워크를 사용한 멀티 도메인 애플리케이션을 위한 문서 중심 도메인 분리 아키텍처. 패턴 개요

도메인 컨텍스트 아키텍처는 비즈니스 도메인과 해당 문서를 중심으로 애플리케이션 아키텍처를 구성합니다:

- Business Context: 핵심 비즈니스 로직과 도메인 규칙
- UI Context: 화면 상태와 사용자 상호작용  
- Validation Context: 데이터 검증과 오류 처리
- Design Context: 테마 관리와 시각적 상태
- Architecture Context: 시스템 구성과 기술적 결정

컨텍스트 분리 전략

사전 요구사항

타입 정의, 멀티 도메인 컨텍스트, 프로바이더 구성을 포함한 완전한 도메인 컨텍스트 설정 지침은 멀티 컨텍스트 설정 - 도메인 컨텍스트 아키텍처를 참조하세요.
