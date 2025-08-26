---
document_id: guide--basic-action-setup
category: guide
source_path: ko/guide/patterns/setup/basic-action-setup.md
character_limit: 2000
last_update: '2025-08-26T00:34:27.343Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
기본 액션 설정

Context-Action 프레임워크를 위한 공유 액션 컨텍스트 설정 패턴입니다. 임포트

타입 정의

일반적인 액션 패턴

확장된 액션 인터페이스

컨텍스트 생성 패턴

단일 도메인 컨텍스트

다중 도메인 컨텍스트 설정

프로바이더 설정 패턴

단일 프로바이더 설정

다중 프로바이더 설정

조건부 프로바이더 설정

내보내기 패턴

명명된 내보내기 (권장)

배럴 내보내기

컨텍스트 번들 내보내기

모범 사례

타입 조직
1. 도메인 주도 타입: 비즈니스 도메인별로 액션 그룹화
2. 일관된 네이밍: 일관된 동사-명사 패턴 사용 (createUser, updateUser, deleteUser)
3. 페이로드 구조: 복잡한 데이터에는 객체, 간단한 값에는 원시 타입 사용
4. Void 액션: 페이로드 없는 액션에는 void 사용

컨텍스트 네이밍
1. 설명적 이름: 명확한 도메인 이름 사용 ('User', 'Events', 'API')
2. 훅 리네이밍: 명확성을 위해 도메인별 훅 이름 생성
3. 프로바이더 네이밍: Provider 접미사 컨벤션 따르기

프로바이더 조직
1. 논리적 그룹화: 관련된 액션 프로바이더들을 함께 그룹화
2. 기능 플래그: 선택적 기능을 위해 조건부 프로바이더 사용
3. 프로바이더 구성: 수동 중첩보다 composeProviders 선호
4. 성능: 컴포넌트 트리에서 프로바이더 배치 고려

일반적인 패턴 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- 액션 기본 사용법 - EventActions 패턴 사용
- 디스패치 액세스 패턴 - AppActions 패턴 사용  
- 고급 액션 패턴 - 다중 도메인 패턴 사용
- MVVM 아키텍처 - UserActions 패턴 사용
- 도메인 컨텍스트 아키텍처 - 다중 도메인 패턴 사용

관련 설정 가이드

- 기본 스토어 설정 - 스토어 컨텍스트 설정 패턴
- 다중 컨텍스트 설정 - 복잡한 아키텍처 설정
- 프로바이더 구성 - 고급 프로바이더 패턴.
