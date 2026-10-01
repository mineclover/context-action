# 3. Web Component 작성 가이드

## 3.1 작성자의 기본 경험

작성자는 함수 컴포넌트·JSX·Hooks를 기본으로 사용한다. Web Component를 제공한다는 이유로 모든 UI 코드를 HTMLElement 클래스 안에 넣지 않는다. 클래스 shell은 브라우저 API와 내부 UI를 연결하는 얇은 어댑터로 둔다. Preact의 함수 View를 Custom Element로 감싸는 조합은 공식 사용 방식이다. [R1](references.md#r1)

```text
layer-panel/
├─ component.contract.md   # 소비 계약의 의미·수명·실패
├─ public.ts               # 소비자용 타입
├─ define.ts               # 명시적인 Custom Element 등록
├─ mount.ts                # DOM/template 배포가 필요할 때
├─ internal/
│  ├─ controller.ts        # 권한·입력·명령·출력 조정
│  ├─ view-input.ts        # 작성자용 props/callback/Signal
│  ├─ View.tsx             # 함수 컴포넌트
│  └─ styles.ts            # 내부 스타일과 공개 part/변수
└─ tests/
   ├─ contract.test.ts
   └─ browser.spec.ts
```

이 트리는 책임 위치의 예시다. 간단한 컴포넌트는 controller/view-input을 합칠 수 있다. Web Component 배포가 필요 없으면 define.ts를 만들지 않는다. 특정 신규 패키지 경로를 강제하지 않는다.

## 3.2 계약을 먼저 작성한다

[계약 템플릿](templates/component.contract.md)에 상태별 결정권, 입력·반영 규칙, 이벤트 의미, 연결 해제 중 동작을 적는다. View의 props를 그대로 공개 API로 복제하지 않는다.

여러 값이 함께 바뀌어야만 유효하다면 원자적인 snapshot 교체 method를 설계한다. 독립적인 입력은 개별 property로 유지한다. 외부 호출 순서에 따라 잠깐 생길 수 있는 불일치가 허용되는지 명시한다.

## 3.3 내부 표현을 정한다

작고 단순한 UI에는 일반 props/callback만으로 충분하다. 자주 갱신되는 값이나 공유 상태에는 읽기용 Signal binding을 선택적으로 추가한다. 모든 prop을 Signal로 바꾸지 않는다.

- 단순 표시: Signal을 JSX에 직접 전달할 수 있다.
- 구조 분기·목록 계산: 적절한 작은 컴포넌트에서 .value를 읽는다.
- 파생 값: computed를 사용한다.
- 외부 부수 효과: effect/구독을 명시적인 수명에 연결하고 해제한다.

.value 읽기는 해당 컴포넌트의 의존성을 만들 수 있다. 직접 Signal binding 최적화를 모든 UI 갱신에 대한 무렌더 보장으로 확대하지 않는다. [R2](references.md#r2)

`connectSourceSignal(source)`는 렌더 함수 안에서 반복 생성하지 않는다. 세션이 source를 연결하고, 연결을 소비하는 View를 mount하고, 종료할 때 반대로 정리한다. 외부 source snapshot은 불변이며 변경 전까지 안정적인 참조라는 기존 계약을 지킨다.

## 3.4 Controller의 역할을 좁힌다

Controller는 입력 검증·정규화, 내부 상태 전이, 허용된 command 호출, event detail 생성, 필요한 view projection만 담당한다. Domain이 소유한 업무 규칙을 다시 구현하지 않는다.

View는 사용자 의도를 callback으로 전달한다. 작은 View-local 상태나 내부 ref/focus 처리는 View에서 해도 된다. 외부 요소를 찾아 상태를 수정하거나 Domain 정본을 우회 변경하는 코드는 넣지 않는다.

소비자에게 넘기는 객체는 내부 Controller 전체가 아니라 필요한 기능만 묶은 facade다. private라는 파일명만으로 경계가 생기지 않으므로 barrel export와 emitted declaration도 확인한다.

## 3.5 shell을 작성한다

constructor는 super 호출, 인스턴스 초기 상태, ShadowRoot 등 초기 내부 구조 준비에 제한한다. host attributes/children의 존재에 의존하거나 host에 attribute·light children을 추가하지 않는다. 연결·render·외부 자원 시작은 연결 단계에서 수행한다. 이는 플랫폼의 Custom Element 작성 요구와 연결된다. [R0](references.md#r0)

connectedCallback에서는 현재 연결 여부와 중복 mount를 검사한다. 공개 attribute와 definition 이전에 할당된 property를 복원·정규화하고, 완성된 초기 입력으로 한 번 mount한다. pre-upgrade own property가 나중에 생긴 setter를 가리지 않도록 처리한다. 공개 accessor와 같은 이름의 인스턴스 field initializer로 입력을 덮어쓰지 않는다. [R4](references.md#r4)

초기 입력 우선순위는 컴포넌트별로 정한다. 권장 예시는 기본값 → 초기 attribute → definition 이전에 명시한 property이며, 초기화 이후에는 유효한 외부 입력 순서를 따른다. 이 우선순위는 브라우저가 자동으로 보장하는 업무 정책이 아니므로 구현·테스트가 필요하다.

attributeChangedCallback은 값 변환과 내부 입력 반영만 처리한다. 프로그램 입력을 사용자 이벤트로 바꾸지 않으며, 연결 전에도 호출될 수 있다고 보고 DOM 존재에 의존하지 않는다.

공통 shell helper를 사용할 때 connection subscription·observer·timer·AbortController는 `onConnect`에서 만들고 `onDisconnect`에서 해제한다. `setup`은 Element 인스턴스 수명에 필요한 정본과 View 계약만 구성하며 연결 전 외부 자원이나 사용자 이벤트를 시작하지 않는다. renderer mount와 connection session은 재연결마다 새로 만들어지고, `dispose()`는 terminal 정리를 한 번만 수행한다.

`updateInput()` 또는 관찰 attribute 변경 중 동기 View 렌더가 실패하면 현재 renderer mount와 connection session이 함께 종료된다. helper는 `onDisconnect`를 한 번 호출하고 실패한 렌더의 잔여 DOM을 제거하므로, 복구하려면 요소를 다시 연결해 새 session을 시작한다. `dispose()`는 연결 해제에서 오류가 발생해도 `onDestroy`를 시도하며 여러 오류를 `AggregateError`로 보고한다.

## 3.6 등록과 import를 분리한다

루트 import만으로 document/customElements를 사용하거나 전역 tag를 등록하지 않는다. HTMLElement를 참조하는 클래스 생성도 DOM 없는 import를 요구하는 entry에서는 browser factory 안으로 제한한다.

등록은 `defineLayerPanel()` 같은 명시적인 컴포넌트별 진입점으로 수행한다. 이름이 이미 등록되면 기본은 오류다. 단순 `if (get(name)) return`으로 다른 구현의 충돌까지 성공 취급하지 않는다. 동일 constructor 재사용이나 HMR이 필요하면 별도 개발 정책을 정한다.

DOM 없는 환경에서 import가 성공하는 것과 SSR 렌더·hydration 지원은 다르다. 하나를 확인했다고 나머지를 보장하지 않는다.

## 3.7 완료 시 제출할 최소 구성

소비자 계약, 공개 타입, 실제 구현, 공개 계약 테스트, 관련 브라우저 테스트 결과를 연결한다. 예제에만 존재하는 동작을 공식 API로 승격하지 않는다. 신규 공통 helper가 필요하면 먼저 어떤 반복과 실패를 줄이는지 밝히고, 기존 mount API를 대체하지 않는 방향으로 제안한다.
