# DOM Tree Ownership Convention

## 하나의 영역에는 하나의 렌더링 책임자

Host는 Mount Root 자체의 배치와 외부 레이아웃을 관리하고, Renderer는 `root.children`을 관리합니다. 외부 소비자는 내부 노드를 검색·수정하지 않고 값 입력, 명령, 관측, 이벤트로 제어합니다.

이는 프레임워크 선택이 아니라 작성 책임의 구분입니다. Web Component shell과 내부 Preact도 경쟁하는 두 Owner가 아니라 **shell이 children 영역을 Preact에 위임하는 관계**입니다.

## DOM 경계

- Root의 children에 대한 구조·텍스트·속성 갱신은 위임된 Owner만 수행합니다. 외부의 `innerHTML`, `replaceChildren`, 내부 `classList` 수정은 허용하지 않습니다.
- 직접 DOM 처리가 필요하면 Owner 내부의 ref, 측정, focus, renderer adapter로 제한합니다. 같은 노드/속성을 VDOM과 imperative effect가 동시에 쓰지 않습니다.
- 상위 Owner는 하위 boundary를 배치할 수 있지만 그 내부를 렌더링하지 않습니다. 기본 예제의 중첩은 Custom Element의 ShadowRoot로 분리합니다.

`mountPreact`는 같은 패키지 인스턴스의 중복 Root와 기존 light-DOM Owner 아래의 마운트를 거부합니다. ShadowRoot는 별도 경계입니다. 임의의 외부 DOM 수정, 다른 런타임 또는 중복 번들까지 감지하는 보안 장치는 아닙니다.

## 공개 계약

Component 소비자에게는 업무 값과 명령을 노출합니다. 내부 Signal, VNode, CSS selector를 제어 계약으로 사용하지 않습니다. 라이브러리/Component **작성자용** adapter에는 Preact 타입과 `ReadonlySignal`이 등장할 수 있습니다. 이를 Component **소비자용** API와 혼동하지 않습니다.

property 입력과 사용자 이벤트의 관계를 정합니다. 이 템플릿의 Web Component는 프로그램의 `element.value = ...`에 변경 이벤트를 재발행하지 않습니다. 사용자 조작 후에만 `value-change`를 내보내므로 반영 루프가 생기지 않습니다.

공통 구현은 의미를 자동 추론하지 않는 저수준 runtime으로 제한합니다. `mountPreact`, `mountTemplate`, `createDisposalScope`는 root 소유권과 자원 해제만 담당하며, property 이름·명령·이벤트·상태 변경 권한은 컴포넌트 계약과 Host adapter가 정합니다. 같은 View를 여러 제공 경로에서 사용하더라도 소비자에게는 각 경로의 `MountInstance`나 Preact 타입을 그대로 노출하지 않습니다.

계약을 적용할 때는 [공개 컴포넌트 계약](09-public-component-contract.md), [작성 가이드](10-component-authoring-guide.md), [Layer Panel reference](../examples/layer-panel/README.md)를 함께 사용합니다. 이 자료들은 특정 Custom Element factory보다 재사용 가능한 작성 규칙을 정본으로 삼습니다.

## 상태와 수명

Domain의 원본 상태는 하나이며 Signal은 읽기용 projection입니다. UI가 Domain을 소유한다고 가정하지 않습니다. borrowed Source/Register는 UI 해제 시 파괴하지 않습니다.

Host가 Native Root를 제거하기 전에는 `destroy()`를 호출합니다. mount 자체는 Root를 제거하지 않습니다. `destroy()`는 반복 호출에 안전하고, 이후 `update()`는 실패합니다. Web Component의 disconnect는 렌더러/구독 해제이지 HTMLElement의 영구 파괴가 아닙니다. 재연결 시 인스턴스 상태는 유지하고 View를 다시 마운트합니다.

`createDisposalScope`에는 제공자를 먼저, 소비자를 나중에 등록합니다. 해제는 LIFO이며 실패가 있어도 나머지 cleanup을 시도하고 `AggregateError`를 보고합니다. cleanup 성공은 예외가 없을 때만 주장할 수 있습니다.

## 실패와 보존

기존 DOM은 자동으로 채택하거나 지우지 않습니다. 빈 Root만 받으며 hydration은 별도 계약이 필요합니다. 초기 마운트 실패 시 렌더러 해제를 시도하고, template shell도 제거합니다. 동기 render/update 실패는 해당 mount를 종료합니다. Preact의 비동기 렌더 오류는 View의 Error Boundary 등 별도 처리 계약이 필요합니다.

Template은 신뢰된 소스만 사용합니다. 이 라이브러리는 HTML sanitizer가 아닙니다. Shadow DOM 역시 접근 보안 경계가 아닙니다.

스타일 확장이 필요하면 CSS custom property, `part`, theme/variant 등을 명시합니다. Shadow/Light DOM, slot, part가 공개 계약에 포함되었다면 내부 렌더러 변경 시에도 이 계약을 지켜야 합니다. 기술 교체가 무조건 무영향이라는 보장은 하지 않습니다.
