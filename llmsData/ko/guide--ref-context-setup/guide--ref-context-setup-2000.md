---
document_id: guide--ref-context-setup
category: guide
source_path: ko/guide/patterns/setup/ref-context-setup.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.374Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
RefContext 설정

Context-Action 프레임워크에서 직접 DOM 조작 및 싱글톤 객체 관리를 위한 공유 RefContext 설정 패턴입니다. 임포트

개요

RefContext는 다음을 위한 지연 평가 및 생명주기 관리를 제공합니다:
- 직접 DOM 작업: 직접 조작이 필요한 캔버스, 비디오, 오디오 요소
- 싱글톤 객체: 단일 인스턴스가 필요한 무거운 라이브러리, SDK, 서비스
- 성능 중요 작업: React의 가상 DOM을 우회하는 작업
- 외부 리소스 관리: 서드파티 라이브러리 및 네이티브 API

타입 정의

DOM 요소 Refs

서비스 및 라이브러리 Refs

무거운 연산 Refs

컨텍스트 생성 패턴

기본 RefContext 설정

정의가 포함된 RefContext

다중 도메인 RefContext 설정

프로바이더 설정 패턴

단일 RefContext 프로바이더

다중 RefContext 프로바이더

Store 및 Action 컨텍스트와 통합

조건부 RefContext 설정

초기화 패턴

지연 초기화

서비스 초기화

Worker 초기화

고급 사용 패턴

다중 Refs 대기

타임아웃이 포함된 Ref 작업

내보내기 패턴

명명된 내보내기 (권장)

배럴 내보내기

도메인 번들 내보내기

모범 사례

Ref 관리
1. 지연 초기화: 실제로 필요할 때만 refs 초기화
2. 정리: useEffect 정리 함수에서 항상 refs 정리
3. 오류 처리: ref 작업에 적절한 오류 처리 구현
4. 타임아웃 관리: ref 작업에 적절한 타임아웃 사용

성능 최적화
1. 조건부 로딩: 기능이 활성화된 경우에만 무거운 refs 로딩
2. 디바이스 적응: 디바이스 능력에 따른 ref 초기화 적응
3. 메모리 관리: 무거운 객체와 서비스를 적절히 해제
4. Worker 사용: CPU 집약적 작업에 Web Workers 사용

통합 패턴
1. MVVM 아키텍처: RefContext를 성능 레이어로 사용
2. 프로바이더 구성: Store 및 Action 컨텍스트와 결합
3. 기능 플래그: 조건부로 ref 프로바이더 로딩
4. 환경 구성: 환경에 따른 refs 적응

일반적인 패턴 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- Ref 기본 사용법 - CanvasRefs 패턴 사용
- 캔버스 최적화 - CanvasRefs 및 WorkerRefs 사용
- 메모리 최적화 - 서비스 정리 패턴 사용
- MVVM 아키텍처 - RefContext를 성능 레이어로 사용
- 성능 패턴 - 모든 ref 패턴 사용

관련 설정 가이드

- 기본 액션 설정 - 액션 컨텍스트 설정 패턴
- 기본 스토어 설정 - 스토어 컨텍스트 설정 패턴
- 다중 컨텍스트 설정 - 복잡한 아키텍처 통합
- 프로바이더 구성 설정 - 고급 구성 기법.
