---
document_id: guide--withProvider-pattern
category: guide
source_path: ko/guide/patterns/store/withProvider-pattern.md
character_limit: 300
last_update: '2025-08-26T00:34:27.386Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
withProvider 패턴

스토어 전용 패턴에서 자동 프로바이더 래핑을 위한 withProvider를 사용한 고차 컴포넌트 패턴. 사전 요구사항

이 패턴을 사용하기 전에 스토어 컨텍스트를 설정해야 합니다. 완전한 설정을 위해 다음 가이드를 참조하세요:

- 기본 스토어 설정 - 스토어 컨텍스트 생성 패턴
- 프로바이더 구성 설정 - 고급 프로바이더 구성 유틸리티

개요

HOC (고차 컴포넌트) 패턴은 자동 프로바이더 래핑을 제공하여 컴포넌트 트리에서 수동 프로바이더 구성의 필요성을 제거합니다.
