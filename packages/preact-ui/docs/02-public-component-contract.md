# 02. 공개 컴포넌트 계약 (Public Component Contract)

## 2.1 계약의 최소 범위와 작성자/소비자 경계

개별 컴포넌트의 공개 계약은 **사용 목적, 입력·기본값·검증, 상태 변경 권한, 명령·결과, 이벤트, 연결/해제 중 동작, 스타일·슬롯·접근성, 실패·검증 위치**를 정의합니다. 모든 컴포넌트에 동일한 메서드 목록을 강제하지 않습니다.

- **타입과 문서의 역할 분담**: TypeScript 타입(`public.ts`)은 구조와 시그니처의 기준이며, [`component.contract.md`](templates/component.contract.md)는 타입으로 표현하지 못하는 의미·순서·권한·실패·시점의 기준입니다.
- **작성자 어댑터 vs 소비자 API 분리**: 컴포넌트 소비자에게는 업무 값과 의미 중심 명령만 노출합니다. 내부 writable Signal, VNode, CSS selector, `MountInstance`, 또는 `definePreactElement`의 작성자 전용 `context`(`setFormValue`, `setValidity`, `requestUpdate`, `root`)를 외부 소비자 계약으로 노출하지 않습니다.

---

## 2.2 입력 경로 (Attribute · Property · Method)

원시(Primitive) 설정은 attribute/property 중 필요한 경로를 제공하고, 복합 객체와 배열은 property 또는 method 인자로 받습니다. 객체의 attribute 직렬화와 고빈도 property 반영을 기본값으로 삼지 않습니다. ([R4](references.md#r4))

| 항목 | 계약 명시 규칙 |
|---|---|
| **문자열 / enum** | 허용 값, 공백 처리, 제거(`null`) 시 기본값, 잘못된 값 처리 |
| **숫자** | 유한수(`Number.isFinite`)·범위·단위, 문자열 파싱 정책, 빈 문자열 처리 |
| **boolean** | boolean attribute로 선언한 경우 **존재=`true`, 제거=`false`** ([R3](references.md#r3)) |
| **객체 / 배열** | 교체 단위, 동일 참조 정책, 불변/방어 복사 범위(`Object.freeze`), 중복 식별자 처리 |
| **attribute reflection** | 양방향/단방향/미반영 여부를 명시하고 재진입 루프 방지 |

- **Boolean Attribute 주의점**: `disabled="false"`는 어트리뷰트가 존재하므로 `true`(비활성)로 해석됩니다. 해제하려면 어트리뷰트를 제거하거나 `.disabled = false` 프로퍼티를 대입합니다.
- **사전 검증 및 오류 처리**: 외부 입력은 렌더 호출보다 먼저 검증·정규화하며, 단순 입력 실패에서는 이전 유효 값을 보존합니다. JS setter/method 입력 오류는 동기 `TypeError`/`RangeError` throw를 기본으로 하고, 비동기 명령 실패는 Promise rejection을 사용합니다.

---

## 2.3 상태 변경 권한 모드 (Controlled vs Stateful)

한 상태 값에 대해 외부 제어형과 내부 상태형을 암묵적으로 혼용하지 않습니다.

### 1) 외부 제어형 (Controlled / Request Mode)
```text
사용자 입력 → 변경 요청 이벤트 발행 → Host/Domain 판단 → 확정 상태 입력 → View 반영
```
- 예: `<ca-layer-panel>`의 `selection-request`는 후보 ID를 알릴 뿐 선택 완료를 의미하지 않습니다. Host가 승인하여 `selectedId`를 갱신하기 전까지 UI는 정본 선택 상태를 스스로 바꾸지 않습니다.

### 2) 내부 상태형 (Stateful / Commit Mode)
```text
사용자 입력 → 내부 검증·확정 → 상태 갱신 → 변경 통지 이벤트 발행
```
- 예: `<ca-counter>`의 `value-change`나 `<order-workspace>`의 `order-change`는 내부 모델에서 확정된 결과를 외부에 통지합니다.

---

## 2.4 명령 (Imperative Commands & Facade)

- **의미 중심 명명**: 명령은 사용자의 비즈니스 목적을 표현합니다 (`focusItem(id)`, `addItem(item)`, `submit()`, `reset()`). `renderVNode()`, `setInternalState()`처럼 내부 구현에 결합된 범용 패치 메서드를 공개하지 않습니다.
- **완료 범위 명시**: 명령별로 호출 가능 상태, 동기/비동기 여부, 멱등성, 중복 호출 정책을 정합니다. `Promise<void>` 반환이 곧 브라우저 paint나 외부 네트워크 저장 완료를 자동 의미하지 않으므로 완료의 범위를 계약에 명시합니다.
- **상태 확정과 DOM 커밋 분리**: Signal 변경 직후 getter는 즉시 새 값을 반환하더라도 Preact 스케줄링에 의해 DOM 반영 시점은 분리될 수 있습니다. ([R2](references.md#r2), [R10](references.md#r10))

---

## 2.5 이벤트 (CustomEvents)

- **표기 및 메타데이터**: 프로퍼티는 `camelCase`, `CustomEvent` 이름은 `kebab-case`를 기본으로 하며, 이벤트별 `detail` 스키마·발생 시점·`bubbles`/`composed`/`cancelable`·미발생 조건을 기록합니다.
- **프로그래밍 입력 에코(Echo) 금지**: 외부 코드의 프로퍼티 대입(`element.value = 10`), 최초 초기값 반영, 재연결, 동일 값 재입력은 사용자 변경 이벤트를 재발행하지 않습니다. 사용자 인터랙션 또는 명시된 도메인 활동 완료 시에만 이벤트를 발행합니다. ([R4](references.md#r4))
- **전파 경계**: 상위 위임을 허용하는 공개 이벤트는 `bubbles: true`, 외부 Shadow DOM 경계를 통과해야 하는 이벤트는 `composed: true`로 선언합니다. ([R5](references.md#r5))
- **불변 페이로드**: `detail`에는 값·식별자·동결된 방어 복사본(`Object.freeze`)만 넣으며, 내부 mutable 모델이나 DOM 노드를 노출하지 않습니다.
- **단일 실행 경로**: 같은 사용자 행동을 내부 어댑터가 도메인 명령으로 직접 실행하면서 동시에 Host도 이벤트를 받아 같은 명령을 중복 실행하는 이중 경로를 만들지 않습니다.

---

## 2.6 스타일 · 슬롯 · 접근성 및 조건부 확장

- **스타일·슬롯 계약**: 공개 스타일 인터페이스는 CSS custom properties, `::part(...)` 이름, theme/variant 및 슬롯 이름(`slot="..."`)과 fallback으로 한정합니다. 내부 클래스명이나 DOM 트리 깊이는 계약으로 삼지 않습니다. ([R6](references.md#r6), [R7](references.md#r7))
- **호스트 속성 존중**: Host 엘리먼트의 기존 `class`, `style`, `tabindex`, `role`, `hidden` 속성을 무단으로 덮어쓰지 않습니다. ([R4](references.md#r4))
- **접근성(A11y)**: 키보드 탐색(`ArrowUp`/`ArrowDown`/`Home`/`End`), 접근 가능한 이름(`aria-label`/`aria-labelledby`), 포커스 이동·복귀, `disabled` 의미를 함께 구현합니다. `tree`/`listbox`/`spinbutton` 같은 ARIA role은 대응 키보드 상호작용까지 구현한 경우에만 선언합니다. ([R8](references.md#r8))
- **조건부 확장 계약**: Form-Associated 동작(FACE), SSR/Hydration, Declarative Shadow DOM(`hydrateShadowRoot: true`), React Bridge 연동은 컴포넌트가 실제로 지원하는 경우에만 조건·소유권·실패 정책을 명시합니다. 임의 light-DOM 위임, portal target 소유, ShadowRoot 간 복잡한 slot projection도 같은 조건부 확장이며, 해당 입출력·수명 계약과 테스트를 추가한 경우에만 적용합니다. ([05. 임베드 및 호스트 상호운용성 가이드](05-embed-and-host-interop.md) 참조)
