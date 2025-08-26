---
document_id: guide--context-splitting
category: guide
source_path: ko/guide/patterns/architecture/context-splitting.md
character_limit: 500
last_update: '2025-08-26T00:34:27.351Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
컨텍스트 분할 패턴

애플리케이션이 복잡해지고 컨텍스트 프로바이더가 관리하기 어려워질 때 대규모 컨텍스트를 분할하고 관리하는 전략. 컨텍스트를 분할해야 하는 시점

컨텍스트 분할이 필요한 신호

1. 프로바이더 계층 깊이 - 5-7개 이상의 중첩된 프로바이더
2. 스토어 복잡성 - 단일 컨텍스트에서 10개 이상의 다른 스토어 타입 관리
3. 액션 과부하 - 하나의 컨텍스트에 15개 이상의 다른 액션 타입
4. 팀 경계 - 다른 팀들이 같은 컨텍스트에서 작업
5. 성능 이슈 - 큰 컨텍스트 범위로 인한 불필요한 리렌더링
6. 유지보수 오버헤드 - 관련 코드를 찾고 관리하기 어려움

컨텍스트 성장 예시

분할 전략

전략 1: 도메인 기반 분할

비즈니스 도메인이나 논리적 경계를 기반으로 컨텍스트를 분할합니다. 필수 조건: 이 패턴은 다중 컨텍스트 설정 가이드의 타입 정의와 설정 패턴을 사용합니다.
