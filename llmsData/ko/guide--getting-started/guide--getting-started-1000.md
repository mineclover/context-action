---
document_id: guide--getting-started
category: guide
source_path: ko/guide/getting-started.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.403Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
시작하기

Context-Action은 완벽한 관심사 분리를 통한 확장 가능한 React 애플리케이션 구축을 위한 세 가지 주요 패턴을 제공합니다. 빠른 시작

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| 🎯 Action Only | 스토어 없이 액션 디스패칭 | createActionContext | 이벤트 시스템, 커맨드 패턴 |
| 🏪 Store Only | 액션 없이 상태 관리 | createDeclarativeStorePattern | 순수 상태 관리, 데이터 레이어 |
| 🔧 Ref Context | 제로 리렌더링 직접 DOM 조작 | createRefContext | 고성능 UI, 애니메이션, 실시간 인터랙션 |

🎯 Action Only 패턴

상태 관리 없이 순수 액션 디스패칭. 기본 사용법

🏪 Store Only 패턴

액션 디스패칭 없이 타입 안전한 상태 관리. 기본 사용법

🔧 Ref Context 패턴

제로 React 리렌더링으로 고성능 직접 DOM 조작. 기본 사용법

비즈니스 로직을 포함한 고급 RefContext

패턴 조합

복잡한 애플리케이션의 경우, 세 패턴을 모두 조합하여 사용:

다음 단계

- React Refs 가이드 - RefContext 패턴 심화 학습
- 패턴 가이드 - 세 패턴의 예시와 함께 비교 분석
- 액션 파이프라인 - 액션 처리에 대해 알아보기
- 아키텍처 - 전체 아키텍처 이해하기
- 훅 - 사용 가능한 React 훅 살펴보기
- 모범 사례 - 권장 패턴 따르기

실제 예시

- RefContext를 사용한 마우스 이벤트: 예시 앱에서 RefContext 마우스 이벤트 데모 확인하기
- 스토어 통합: 액션 핸들러와 스토어를 결합하는 방법 학습하기
- 성능 최적화: 직접 DOM 조작으로 제로 리렌더링 패턴 확인하기.
