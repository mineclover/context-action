---
document_id: concept--action-pipeline-guide
category: concept
source_path: ko/concept/action-pipeline-guide.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.379Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
Context-Action 액션 파이프라인 시스템 가이드

Context-Action 프레임워크의 핵심인 액션 파이프라인 시스템에 대한 포괄적인 가이드입니다. 개요

액션 파이프라인 시스템은 Context-Action의 ViewModel 레이어의 핵심으로, 우선순위 기반 핸들러 실행과 정교한 파이프라인 제어를 통한 중앙집중식 액션 처리를 제공합니다. 핵심 구성 요소

ActionRegister

ActionRegister 클래스는 액션 파이프라인 시스템의 핵심입니다:

핸들러 등록

우선순위 기반 실행으로 핸들러를 등록합니다:

파이프라인 컨트롤러

각 핸들러는 고급 파이프라인 관리를 위한 PipelineController를 받습니다:

우선순위 기반 실행

실행 순서

핸들러는 내림차순 우선순위 순서로 실행됩니다 (가장 높은 것부터):

핸들러 설정

파이프라인 제어 메서드

controller.abort()

선택적 이유와 함께 파이프라인 실행 중단:

controller.modifyPayload()

후속 핸들러를 위한 페이로드 변환:

controller.setResult() 및 getResults()

핸들러 간 중간 결과 관리:

실행 모드

순차 모드 (기본값)

핸들러가 차례대로 실행:

병렬 모드

모든 핸들러가 동시에 실행:

경쟁 모드

첫 번째 완료 핸들러가 승리:

결과 수집

기본 디스패치

결과 수집을 통한 디스패치

에러 처리

개별 핸들러가 실패해도 파이프라인은 계속 실행됩니다:

실제 예제: 인증 플로우

React와의 통합

액션 파이프라인은 액션 컨텍스트 패턴을 통해 React와 원활하게 통합됩니다:

모범 사례

1. 우선순위 설계: 논리적 실행 순서에 따라 우선순위 할당
2. 에러 처리: 적절한 에러 처리와 복구 메커니즘 구현
3. 결과 수집: 복잡한 워크플로에 대해 결과 수집 사용
4. 성능 최적화: 적절한 실행 모드 선택
5. 타입 안전성: TypeScript와 함께 사용하여 타입 안전성 확보.
