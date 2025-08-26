---
document_id: guide--withProvider-pattern
category: guide
source_path: ko/guide/patterns/store/withProvider-pattern.md
character_limit: 1000
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

HOC (고차 컴포넌트) 패턴은 자동 프로바이더 래핑을 제공하여 컴포넌트 트리에서 수동 프로바이더 구성의 필요성을 제거합니다. 기본 HOC 사용법

고급 HOC 설정

다중 HOC 구성

조건부 HOC 패턴

지연 HOC 패턴

Props 전달이 있는 HOC

모범 사례

1. 단일 책임: 각 HOC는 하나의 관심사를 처리해야 함
2. Props 보존: props가 제대로 전달되는지 확인
3. 타입 안전성: HOC 구성을 통해 타입 안전성 유지
4. 성능: HOC를 사용하여 프로바이더 지옥을 피하고 성능 향상
5. 구성: 복잡한 시나리오를 위해 여러 HOC 구성
6. 지연 로딩: 큰 애플리케이션을 위해 코드 분할과 함께 사용
7.
