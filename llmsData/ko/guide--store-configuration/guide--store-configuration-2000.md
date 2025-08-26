---
document_id: guide--store-configuration
category: guide
source_path: ko/guide/patterns/store/store-configuration.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.378Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
스토어 설정

복잡한 스토어 시나리오를 위한 성능 최적화와 커스텀 비교 전략. 사전 요구사항

기본 스토어 설정과 설정 패턴은 기본 스토어 설정 을 참조하세요. 이 문서는 설정 패턴을 사용한 고급 설정을 보여줍니다:
- 타입 정의 → 일반적인 스토어 패턴
- 설정 → 타입 추론 설정
- 컨텍스트 생성 → 단일 도메인 스토어 컨텍스트

개요

고급 설정은 확립된 설정 패턴을 기반으로 구축된 복잡한 애플리케이션을 위한 스토어 동작, 비교 전략 및 성능 최적화에 대한 세밀한 제어를 제공합니다. 성능 최적화 설정

비교 전략

참조 전략

얕은 전략

깊은 전략

커스텀 비교 옵션

키 무시 패턴

커스텀 비교자 패턴

디버그 설정

성능 모니터링

메모리 최적화

모범 사례

1. 설정 패턴 따르기: 기본 스토어 설정의 확립된 스토어 인터페이스 사용
   - UserStores: 사용자 프로필, 기본 설정 및 세션 관리
   - ProductStores: 제품 카탈로그, 카테고리, 필터 및 쇼핑 카트
   - UIStores: 모달, 로딩, 알림 및 네비게이션 상태
   - FormStores: 폼 데이터, 검증 및 오류 처리

2. 전략 선택: 가장 효율적인 비교 전략 선택
   - reference: 불변 데이터와 큰 객체에 대해 (ProductStores.catalog)
   - shallow: 최상위 변경이 있는 간단한 객체에 대해 (UserStores.profile)
   - deep: 중첩 객체에 대해서만 필요한 경우 (FormStores validation)

3. 타입 안전성: 적절한 TypeScript 인터페이스로 설정 패턴 확장
   - 확장을 위해 interface ExtendedStores extends BaseStores 사용
   - 설정 패턴 정의와 타입 일관성 유지

4. 관련 없는 키 무시: 타임스탬프와 메타데이터 필드에 ignoreKeys 사용
   - 일반적인 패턴: ignoreKeys: ['timestamp', 'lastUpdated', 'sessionId']

5. 커스텀 비교자: 도메인별 비교 로직 구현
   - 큰 데이터셋에 대한 성능 최적화
   - 도메인별 요구에 대한 비즈니스 로직 기반 비교

6. 성능 모니터링: 개발에서 디버그 모드와 타이밍 사용
   - 개발 중 중요한 스토어에 대해 디버그 활성화
   - 커스텀 비교자로 비교 성능 모니터링

7. 메모리 관리: 중첩 객체에 적절한 maxDepth 설정
   - 순환 참조로 무한 재귀 방지
   - 데이터 구조에 기반한 비교 깊이 최적화

8. 프로덕션 최적화: 프로덕션 빌드에서 디버그 모드 비활성화
   - 환경 기반 디버그 설정 사용
   - 개발 전용 로깅과 성능 추적 제거

일반적인 설정 패턴

설정 패턴과의 통합

이 설정 가이드는 기본 스토어 설정에서 확립된 기반 위에 구축됩니다. 주요 통합 지점:

타입 재사용
- 기본 인터페이스: UserStores, ProductStores, UIStores, FormStores를 기반으로 사용
- 확장 패턴: 고급 설정 요구에 대해 기본 인터페이스를 확장
- 타입 안전성: 설정 패턴 타입 정의와 일관성 유지

설정 정렬
- 전략 일관성: 설정 패턴 스토어에 설정 전략 적용
- 프로바이더 명명: 설정 패턴의 표준 명명 규칙 따르기
- 컨텍스트 통합: 설정 컨텍스트 생성 및 프로바이더 패턴과 정렬

모범 사례 준수
- 90%+ 설정 준수: 모든 예제는 확립된 설정 패턴을 따름
- 재사용 가능한 설정: 설정 옵션은 모든 설정 패턴 스토어와 작동
- 성능 최적화: 고급 기능은 설정 패턴 성능을 향상

관련 패턴

- 기본 스토어 설정 - 스토어 설정을 위한 기본 패턴
- 스토어 성능 패턴 - 성능 최적화 기법
- useStoreValue 패턴 - 효율적인 스토어 값 사용
- MVVM 아키텍처 - 스토어 설정을 위한 아키텍처 컨텍스트.
