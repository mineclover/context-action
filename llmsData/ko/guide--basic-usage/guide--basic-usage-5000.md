---
document_id: guide--basic-usage
category: guide
source_path: ko/guide/patterns/action/basic-usage.md
character_limit: 5000
last_update: '2025-08-26T00:34:27.345Z'
update_status: auto_generated
priority_score: 95
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
액션 기본 사용법

타입 안전 디스패칭과 핸들러 등록을 갖춘 기본 액션 온리 패턴입니다. Import

기능
- ✅ 타입 안전 액션 디스패칭
- ✅ 액션 핸들러 등록
- ✅ 중단 지원
- ✅ 결과 처리
- ✅ 경량 (스토어 오버헤드 없음)

필수 조건

필수 설정: 이 패턴을 사용하기 전에 다음 설정을 완료하세요:

1. 타입 정의 - 표준 패턴을 사용해 액션 인터페이스 정의
2. 컨텍스트 생성 - 적절한 훅 이름 변경으로 타입화된 액션 컨텍스트 생성
3. 프로바이더 구성 - 앱 구조에서 액션 프로바이더 설정

자세한 설정 지침은 기본 액션 설정을 참조하세요. 필수 액션 타입
이 문서는 설정 가이드의 EventActions 명세를 사용합니다:

필수 컨텍스트 설정
이 문서는 Event 액션 컨텍스트를 생성했다고 가정합니다:

필수 프로바이더 설정
이 문서는 앱이 Event 액션 프로바이더로 래핑되었다고 가정합니다:

> 설정 참조: 기본 액션 설정 가이드

기본 사용법

고급 기능

사용 가능한 훅

필수 조건 설정에서
- useEventAction() - 기본 액션 디스패처 (useActionDispatch에서 이름 변경)
- useEventActionHandler() - 액션 핸들러 등록 (useActionHandler에서 이름 변경)
- useEventActionWithResult() - 결과/중단이 있는 고급 디스패처 (useActionDispatchWithResult에서 이름 변경)

일반 패턴 (이름 변경 전)
- useActionDispatch() - 기본 액션 디스패처
- useActionHandler(action, handler, config?) - 액션 핸들러 등록
- useActionDispatchWithResult() - 결과/중단이 있는 고급 디스패처
- useActionRegister() - 위임용 원시 ActionRegister 액세스
- useActionContext() - 원시 컨텍스트 액세스

실제 예제

코드베이스의 라이브 예제
- Todo 리스트 데모 - 폼 상호작용용 UI 액션
- 채팅 데모 - 실시간 메시지 처리
- 사용자 프로필 데모 - 사용자 액션 관리
- 마우스 이벤트 페이지 - 고빈도 이벤트 처리
- 검색 페이지 - 중단 가능한 검색 액션
- API 차단 페이지 - 차단 액션 패턴

모범 사례

✅ 모범 사례
1. 항상 useCallback 사용: 무한 재등록을 방지하기 위해 모든 핸들러 함수를 useCallback으로 감싸기
2. 부수 효과 처리: 분석, 로깅, API 호출에 완벽
3. 경량 유지: 상태 관리 오버헤드 없음
4. 에러 처리: 에러 케이스에 controller.abort() 사용
5. 비동기 작업: 적절한 에러 경계로 비동기 작업 처리

> 중요: 자세한 핸들러 등록 패턴은 핸들러 등록 가이드를 참조하세요.
