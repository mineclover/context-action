---
document_id: concept--pattern-guide
category: concept
source_path: ko/concept/pattern-guide.md
character_limit: 5000
last_update: '2025-08-21T02:13:42.386Z'
update_status: auto_generated
priority_score: 85
priority_tier: medium
completion_status: completed
workflow_stage: content_generated
---
@context-action/react 패턴 가이드

@context-action/react 프레임워크에서 사용 가능한 세 가지 주요 패턴의 완전한 가이드입니다. 📋 빠른 시작 가이드

사용 사례에 맞는 적합한 패턴을 선택하세요:

| 패턴 | 사용 사례 | 임포트 | 최적용도 |
|---------|----------|--------|----------|
| 🎯 Action Only | 스토어 없이 액션 디스패칭 | createActionContext | 이벤트 시스템, 커맨드 패턴 |
| 🏪 Store Only | 액션 없이 상태 관리 | createDeclarativeStorePattern | 순수 상태 관리, 데이터 레이어 |
| 🔧 Ref Context | 제로 리렌더링 직접 DOM 조작 | createRefContext | 고성능 UI, 애니메이션, 실시간 인터랙션 |

참고: 복잡한 애플리케이션의 경우, 최대한의 유연성과 관심사 분리를 위해 패턴들을 조합하여 사용하세요. ---

🎯 Action Only 패턴

언제 사용: 상태 관리 없이 순수 액션 디스패칭 (이벤트 시스템, 커맨드 패턴). 임포트

기능
- ✅ 타입 안전한 액션 디스패칭
- ✅ 액션 핸들러 등록
- ✅ 중단 지원
- ✅ 결과 처리
- ✅ 경량 (스토어 오버헤드 없음)

기본 사용법

🏪 Store Only 패턴

언제 사용: 액션 디스패칭 없이 순수 상태 관리 (데이터 레이어, 단순 상태). 임포트

기능
- ✅ 뛰어난 타입 추론 (수동 타입 어노테이션 불필요)
- ✅ 스토어 관리에 집중된 단순화된 API
- ✅ 직접 값 또는 설정 객체 지원
- ✅ HOC 패턴 지원

기본 사용법

사용 가능한 훅
- useStore(name) - 이름으로 타입화된 스토어 가져오기 (주 API)
- useStoreManager() - 스토어 관리자 액세스 (고급 사용)
- useStoreInfo() - 레지스트리 정보 가져오기
- useStoreClear() - 모든 스토어 지우기

---

🔧 Ref Context 패턴

언제 사용하나요: 제로 React 리렌더링으로 직접 DOM 조작 (고성능 UI, 애니메이션, 실시간 인터랙션). 임포트

특징
- ✅ DOM 조작을 위한 제로 React 리렌더링
- ✅ 하드웨어 가속 변환
- ✅ 타입 안전한 ref 관리
- ✅ 자동 생명주기 관리
- ✅ 완벽한 관심사 분리
- ✅ 자동 정리를 통한 메모리 효율성

기본 사용법

커스텀 훅을 사용한 고급 RefContext

사용 가능한 훅
- useRefHandler(name) - 이름으로 타입화된 ref 핸들러 가져오기
- useWaitForRefs() - 여러 ref가 마운트될 때까지 대기
- useGetAllRefs() - 마운트된 모든 ref 액세스
- refHandler.setRef - ref 콜백 설정
- refHandler.target - 현재 ref 값 액세스
- refHandler.isMounted - 마운트 상태 확인
- refHandler.waitForMount() - 비동기 ref 대기
- refHandler.withTarget() - 안전한 작업

---

🔧 패턴 조합

복잡한 애플리케이션의 경우, 최대한의 유연성을 위해 세 패턴을 모두 조합하세요:

마이그레이션 가이드

기존 패턴에서 새로운 패턴으로

기존의 복잡한 패턴들을 새로운 단순한 두 패턴으로 마이그레이션하는 방법:

1. Action Only로 마이그레이션: 상태가 없는 이벤트/커맨드 처리
2. Store Only로 마이그레이션: 순수 상태 관리
3. 패턴 조합: 복잡한 비즈니스 로직

---

📚 모범 사례

1. 패턴 선택
- 간단한 상태 관리는 Store Only로 시작
- 부수 효과나 복잡한 워크플로가 필요하면 Action Only 추가
- 고성능 DOM 조작이 필요하면 RefContext 추가
- 완전한 기능의 애플리케이션은 세 패턴 모두 조합

2. 명명 규칙
- 설명적인 컨텍스트 이름 사용: UserActions, AppStores, MouseRefs
- 명확성을 위해 내보낸 훅 이름 변경: useUserAction, useAppStore, useMouseRef
- 스토어 이름은 간단하게 유지: user, counter, settings
- 도메인별 ref 이름 사용: cursor, modal, canvas

3. 성능
- Store 패턴: 대용량 데이터셋에는 strategy: 'reference', 객체에는 'shallow', 필요할 때만 'deep' 사용
- RefContext 패턴: 하드웨어 가속을 위해 translate3d() 사용, DOM 업데이트 배치, React 리렌더링 방지
- Action 패턴: 핸들러를 가볍게 유지, 무거운 작업에는 async 사용

4. 타입 안전성
- 액션: 액션에 명시적 인터페이스 사용 (ActionPayloadMap 선택사항)
- 스토어: TypeScript가 스토어 타입을 추론하게 하거나 명시적 제네릭 사용
- Refs: 적절한 HTML 요소 타입으로 명확한 ref 타입 인터페이스 정의
- 모든 패턴에서 리터럴 타입에 as const 사용

5. 관심사 분리
- 액션: 부수 효과, 비즈니스 로직, 조정 처리
- 스토어: 애플리케이션 상태와 데이터 관리
- RefContext: DOM 조작과 성능 중요 UI 처리
- 각 패턴을 특정 책임에 집중시키기

---

🔍 예시

각 패턴의 완전한 작업 예시는 examples/ 디렉토리를 참조하세요.
