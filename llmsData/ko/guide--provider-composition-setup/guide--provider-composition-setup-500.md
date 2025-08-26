---
document_id: guide--provider-composition-setup
category: guide
source_path: ko/guide/patterns/setup/provider-composition-setup.md
character_limit: 500
last_update: '2025-08-26T00:34:27.371Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
프로바이더 구성 설정

Context-Action 프레임워크에서 다중 컨텍스트 관리를 위한 고급 프로바이더 구성 유틸리티 및 패턴입니다. 임포트

개요

composeProviders 유틸리티는 다중 Provider 컴포넌트를 하나의 깔끔한 컴포넌트로 구성하여 "Provider 지옥"을 해결합니다. 이는 다중 컨텍스트(Store, Action, RefContext)를 사용하는 애플리케이션에 필수적입니다. Before vs After

기본 구성 패턴

간단한 프로바이더 구성

다중 도메인 구성

MVVM 레이어 구성

고급 구성 패턴

조건부 프로바이더 구성

환경별 구성

중첩 도메인 구성

마이크로 프론트엔드 구성

필터링을 통한 프로바이더 구성

배열 기반 구성

조건부 배열 필터링

성능 최적화

프로바이더 메모이제이션

지연 프로바이더 로딩

내보내기 패턴

구성된 프로바이더 내보내기

팩토리 패턴 내보내기

모범 사례

구성 조직
1.
