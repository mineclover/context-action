---
document_id: guide--composition
category: guide
source_path: ko/guide/patterns/architecture/composition.md
character_limit: 500
last_update: '2025-08-26T00:34:27.349Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
패턴 컴포지션 전략

Context-Action 프레임워크를 사용하여 복잡하고 확장 가능한 애플리케이션을 구축하기 위한 고급 패턴 컴포지션 기법입니다. 전제 조건

컴포지션 전략을 구현하기 전에 기본적인 설정을 완료했는지 확인하세요:

- 멀티 컨텍스트 설정 - 완전한 MVVM 및 도메인 컨텍스트 아키텍처 설정 패턴
- 프로바이더 컴포지션 설정 - 고급 프로바이더 컴포지션 유틸리티 및 패턴
- 기본 액션 설정 - 단일 액션 컨텍스트 패턴
- 기본 스토어 설정 - 단일 스토어 컨텍스트 패턴

이러한 설정 가이드는 이 문서 전체에서 사용되는 컨텍스트 정의, 프로바이더 구성 및 컴포지션 유틸리티를 제공합니다.
