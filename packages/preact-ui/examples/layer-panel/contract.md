# ca-layer-panel 계약 예시

상태: reference implementation 계약. Custom Element·template adapter와 단위/통합·Chromium 검증이 연결되어 있다. 보조기술 조합 검증은 별도다.

## 목적과 소유권

Host가 제공한 레이어 목록과 확정된 선택을 보여주고 사용자 선택 요청을 전달한다. selectedId의 정본과 선택 승인 권한은 Host/Domain에 있다. 내부 View가 정본을 먼저 바꾸지 않는다.

Web Component shell은 host property/event와 내부 View를 연결한다. 렌더러는 지정 Root.children만 관리한다. 외부 slot 콘텐츠를 지원한다면 별도 계약을 추가하며 이 예시에는 slot을 선언하지 않는다.

## 입력과 읽기

| property | 의미 |
|---|---|
| items | readonly LayerItem[], 기본 [], 전체 교체. 중복/빈 id와 잘못된 name 타입 거부 |
| selectedId | string 또는 null, 기본 null. 목록에 아직 없는 ID도 허용 |
| disabled | boolean, 기본 false. boolean disabled attribute와 동기화 |

items 입력은 배열과 각 {id,name} 레코드를 복사해 내부 mutable 참조와 분리한다. getter는 freeze된 snapshot을 반환하도록 구현한다. 값 변경은 property 재대입으로 요청한다. selectedId가 items에 없으면 선택 표시만 없으며 정본 selectedId를 자동 보정하지 않는다.

잘못된 property 입력은 TypeError/RangeError로 거부하고 이전 유효 입력을 보존한다. disabled는 typed boolean만 받고 attribute는 존재 여부를 따른다. 초기 우선순위는 default → 초기 attribute → definition 이전 property이며 이후 유효 입력 순서를 따른다.

## 명령

focusItem(id): boolean은 현재 커밋된 DOM에 해당 활성 버튼이 있고 focus를 성공적으로 적용하면 true다. 미연결, 비활성, 목록/DOM에 없는 ID는 false다. 입력 직후 최신 View까지 기다리는 명령이 아니며 선택을 변경하지 않는다. 비문자열 id는 TypeError다.

## 이벤트

`selection-request`: 사용자가 활성 항목을 실행했을 때 목표 id를 전달한다. detail은 새 불변 객체 `{ id: string }`. host에서 bubbles=true, composed=true, cancelable=false로 발행한다. 이 UI에는 취소할 로컬 선택 commit이 없으므로 cancelable 요청으로 만들지 않는다.

현재 selectedId와 동일하거나 disabled인 경우 요청을 생략한다. property 반영·초기 mount·재연결에서는 이벤트를 내보내지 않는다. 이 이벤트가 발생했다는 사실은 Host의 승인 또는 Domain 변경 완료를 의미하지 않는다.

이 예시는 selection-change를 발행하지 않는다. Host는 승인 후 selectedId를 다시 입력하고, 다른 구독자는 Domain의 확정 상태를 관측한다. Host가 요청을 처리하지 않으면 선택은 그대로다.

## 수명·스타일·접근성

미연결 중에도 유효 입력을 보존한다. 재연결 시 복원하되 View-local focus는 자동 보존하지 않는다. disconnect는 UI 자원만 종료한다.

스타일은 `part="list"`, `part="item"`을 후보 계약으로 공개한다. 내부 class/DOM 깊이는 비공개다. 항목은 native button이고 선택 상태를 aria-pressed로 표현한다. 이 예시에 ARIA tree/listbox role을 붙이지 않는다.

## 검증할 조건

요청 이전/이후 selectedId 불변, Host 확정 입력 후 표시, 이벤트 1회, 동일 선택 억제, programmatic echo 없음, items 복사/불변, input 오류 보존, 연결 반복·focus 실패, keyboard button activation을 검증한다. 단위/통합 검증은 `packages/preact-ui/test/layer-panel.test.tsx`, 실제 Chromium 검증은 `packages/preact-ui/test/browser-contract.test.mjs`에서 수행한다.
