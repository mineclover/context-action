---
document_id: guide--action-handlers
category: guide
source_path: ko/guide/action-handlers.md
character_limit: 2000
last_update: '2025-08-21T02:13:42.395Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 핸들러

액션 핸들러는 애플리케이션의 비즈니스 로직을 포함합니다. 확장 가능하고 유지보수가 가능한 애플리케이션을 위해 핸들러를 효과적으로 구현, 등록, 관리하는 방법을 알아보세요. 핸들러 구현 패턴

모범 사례: useActionHandler 패턴

핸들러 등록에 권장되는 패턴은 최적의 성능과 적절한 정리를 위해 useActionHandler + useEffect를 사용하는 것입니다:

핸들러 설정 옵션

핸들러 실행 흐름

1. 순차 모드 (기본값): 핸들러가 우선순위 순서로 실행
2. 병렬 모드: 모든 핸들러가 동시에 실행
3. 경쟁 모드: 첫 번째로 완료되는 핸들러가 승리

컨트롤러 메서드

컨트롤러는 핸들러 실행 흐름을 관리하는 메서드를 제공합니다:

고급 핸들러 패턴

에러 핸들링

검증 핸들러

부작용 핸들러

결과 수집

여러 핸들러로부터 결과 수집:

핸들러 조직 패턴

도메인별 핸들러 파일

핸들러 조합

성능 고려사항

핸들러 최적화

지연 로딩

일반적인 핸들러 안티패턴

❌ 정리 누락

❌ 오래된 클로저

❌ 에러 핸들링 누락

요약

효과적인 액션 핸들러 구현에는 다음이 필요합니다:

- 적절한 등록: useActionHandler + useEffect 패턴 사용
- 메모리 관리: 항상 정리 함수 반환
- 에러 핸들링: 의미 있는 메시지와 함께 견고한 에러 핸들링
- 성능: useCallback을 사용한 안정적인 핸들러
- 테스트: 비즈니스 로직에 대한 격리된 단위 테스트
- 조직: 도메인별 핸들러 파일

액션 핸들러는 비즈니스 로직의 핵심입니다 - 유지보수 가능하고 확장 가능한 애플리케이션을 위해 올바르게 구현하세요. ---

::: tip 다음 단계
- 효과적인 상태 처리를 위한 스토어 관리 학습
- 다중 도메인 핸들러를 위한 교차 도메인 통합 탐색
- 종합적인 핸들러 테스트 전략을 위한 테스트 가이드 참조
:::.
