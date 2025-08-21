---
document_id: examples--pattern-composition
category: examples
source_path: ko/examples/pattern-composition.md
character_limit: 1000
last_update: '2025-08-21T02:13:42.392Z'
update_status: auto_generated
priority_score: 80
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
패턴 조합 예제

복잡한 애플리케이션을 위해 Action Only와 Store Only 패턴을 결합하는 방법을 보여줍니다. MVVM 아키텍처에 따라 완전한 관심사 분리를 구현합니다. 아키텍처 개요

완전한 애플리케이션 예제

1. 액션 타입 정의

2. 스토어 설정

3. 컨텍스트 생성

4. 액션 핸들러 컴포넌트

5. 시스템 액션 핸들러

6. 메인 애플리케이션 컴포넌트

7. 대시보드 컴포넌트

8. 모달 시스템

9. 성능 모니터

10. 네비게이션 컴포넌트

주요 아키텍처 이점

완벽한 관심사 분리

1. View Layer: 컴포넌트는 순수하게 UI 렌더링과 사용자 상호작용에 집중
2. ViewModel Layer: 액션 핸들러는 모든 비즈니스 로직과 조정을 담당
3. Model Layer: 스토어는 반응형 업데이트와 계산된 상태로 데이터 관리

패턴 조합의 이점

- Action 패턴: 복잡한 비즈니스 로직, API 호출, 횡단 관심사 처리
- Store 패턴: 타입 안전성과 계산된 값으로 반응형 상태 관리  
- 깔끔한 통합: 두 패턴이 충돌이나 결합 없이 함께 작동

전체적인 타입 안전성

실증된 베스트 프랙티스

1. 핸들러 조직화: 다른 도메인에 대한 분리된 핸들러 컴포넌트
2. 에러 경계: 사용자 피드백을 포함한 포괄적인 에러 처리
3. 성능 모니터링: 내장된 성능 추적 및 최적화
4. 상태 지속성: 애플리케이션 상태의 자동 저장 및 로딩
5. 모달 관리: 타입 안전한 데이터 전달을 가진 중앙화된 모달 시스템
6. 로딩 상태: 다른 작업에 대한 세분화된 로딩 표시기

관련 자료

- Action Only 패턴 - 순수 액션 디스패치 예제
- Store Only 패턴 - 순수 상태 관리 예제
- 기본 설정 - 두 패턴을 모두 사용한 기본 설정
- 아키텍처 가이드 - MVVM 아키텍처 원칙.
