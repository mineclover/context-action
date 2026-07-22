---
document_id: guide--dispatch-access
category: guide
source_path: ko/guide/patterns/action/dispatch-access.md
character_limit: 1000
last_update: '2025-08-26T00:34:27.354Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
디스패치 접근 패턴

Context-Action 프레임워크에서 액션 디스패치 기능에 접근하는 두 가지 주요 방법: 등록 기반 접근과 훅 기반 접근입니다. Import

필수 조건

타입 정의, 컨텍스트 생성, 프로바이더 구성을 포함한 완전한 설정 지침은 기본 액션 설정을 참조하세요. 이 문서는 설정 가이드의 AppActions 패턴을 사용합니다:
- 타입 정의 → 확장 액션 인터페이스
- 컨텍스트 생성 → 단일 도메인 컨텍스트
- 프로바이더 설정 → 단일 프로바이더 설정

예제들은 다음과 같이 구성된 컨텍스트가 있다고 가정합니다:

훅 기반 디스패치 (권장)

React 애플리케이션에서 컴포넌트 내 디스패치 기능에 액세스하기 위해 createActionContext의 React 훅을 사용하세요. 이것이 React 애플리케이션에서 권장되는 방법입니다. 기본 훅 사용법

결과 수집이 있는 훅

완전한 컴포넌트 구현

등록 기반 디스패치

React 애플리케이션 내에서 고급 사용 사례를 위해 React 컨텍스트를 통해 ActionRegister 인스턴스에 액세스합니다. 등록 접근을 사용한 고급 디스패치

등록 접근을 사용한 React 통합

필요할 때 React 컴포넌트 내에서 기본 등록 인스턴스에 액세스합니다.
