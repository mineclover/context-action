# <Component 이름> 계약

이 템플릿은 작성 양식이다. 빈 항목은 자동으로 비대상으로 간주하지 말고 실제 필요·제약·미정을 적는다. 작은 컴포넌트에서는 관련 항목을 같은 문단으로 합쳐도 된다.

## 목적과 사용 경계

무엇을 표현하거나 제어하는가? 식별 tag/export/계약 문서 경로는 무엇인가? DOM/template/Web Component 중 어떤 제공 경로를 지원하는가? 이 계약의 상태와 참조 revision은 무엇인가?

## 소유권과 의존성

DOM root/children/slot/host attribute의 책임은 누구인가? 각 상태의 최종 변경 권한은 누구에게 있는가? 외부 source/command는 어떤 계약으로 빌리며 누가 해제하는가?

## 입력과 관측

property/attribute별 타입, 기본값, validation, normalization, reflection, 제거·동일 값·미연결 입력, pre-upgrade 우선순위를 적는다. 객체 복사·불변·identity 정책과 getter의 의미를 적는다.

## 명령과 이벤트

명령별 입력/결과/실패/호출 가능 상태/동기·비동기/완료 범위를 적는다. 이벤트별 의미(요청 또는 확정), detail, 발생 시점과 비발생 조건, bubbles/composed/cancelable을 적는다. 동일 행동이 중복 실행되는 경로가 없는지 확인한다.

## 수명과 실패

connect/disconnect/reconnect에서 보존·정리할 상태를 적는다. 늦은 비동기 결과·입력 오류·렌더 오류·cleanup 오류의 처리와 관측 경로를 적는다. 영구 destroy가 있다면 terminal 상태를 정의한다.

## 스타일·콘텐츠·상호작용

CSS 변수/part/slot, fallback, slot 콘텐츠 책임, keyboard·focus·접근 가능한 이름·disabled 의미를 적는다. form/SSR/hydration 등 조건부 기능은 요구될 때 해당 전제를 기록한다.

## 구현과 검증 참조

public.ts, 실제 구현, contract test, browser test와 실행 결과 위치를 연결한다. 예정 테스트와 실제 통과를 구분한다. 공개 계약 변경 이력이 있으면 이전 revision과 호환 영향도 연결한다.
