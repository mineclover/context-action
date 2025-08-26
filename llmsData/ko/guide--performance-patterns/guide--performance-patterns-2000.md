---
document_id: guide--performance-patterns
category: guide
source_path: ko/guide/patterns/store/performance-patterns.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.369Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
성능 패턴

메모이제이션, 배칭, 디버깅, 모범 사례를 포함한 스토어 훅을 위한 성능 최적화 패턴. 메모이제이션 전략

useCallback을 사용한 안정적인 셀렉터

복잡한 셀렉터 메모이제이션

메모이제이션된 계산 스토어 의존성

배치 업데이트

스토어 업데이트 배칭

스토어 배치 API

지연 평가 패턴

지연 상태 접근

조건부 스토어 접근

구독 최적화

선택적 구독

조건부 구독

디바운싱된 구독

비교 전략 최적화

참조 비교 (가장 빠름)

얕은 비교 (균형)

깊은 비교 (가장 정확)

커스텀 비교

메모리 관리

구독 정리

큰 데이터에 대한 WeakReferences

디버깅 및 개발

스토어 디버그 모드

성능 모니터링

스토어 상태 검사

실제 최적화 예제

최적화된 사용자 대시보드

고성능 데이터 테이블

모범 사례 요약

✅ 해야 할 것

- 안정적인 셀렉터에 useCallback 사용
- 여러 스토어 업데이트 배칭
- 적절한 비교 전략 선택
- 개발 환경에서 디버그 모드 활성화
- 복잡한 애플리케이션에서 성능 모니터링
- 비용이 많이 드는 작업에 지연 평가 사용

❌ 피해야 할 것

- 매 렌더링마다 셀렉터에서 새로운 함수 생성
- 절대 필요하지 않은 경우 깊은 비교
- 부분만 필요할 때 큰 객체 전체를 구독
- 구독 정리 무시
- 계산된 값에서 부작용
- 프로덕션에서 과도한 디버깅

관련 패턴

- useStoreValue 패턴 - 기본 구독 패턴
- useStoreSelector 패턴 - 다중 스토어 선택
- useComputedStore 패턴 - 계산된 값 패턴.
