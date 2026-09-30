# 2. 외부 UI 계약

## 2.1 계약의 최소 범위

개별 컴포넌트의 계약은 사용 목적, 입력·기본값·검증, 상태 변경 권한, 명령·결과, 이벤트, 연결/해제 중 동작, 스타일·슬롯·접근성, 실패·검증 위치를 설명한다. 모든 컴포넌트에 동일한 메서드 목록을 강제하지 않는다.

타입 정의는 구조와 시그니처의 기준이다. component.contract.md는 타입으로 표현하지 못하는 의미·순서·권한·실패·시점의 기준이다. 문서가 구현 상태를 주장하려면 해당 검증 증거를 연결한다.

## 2.2 입력 경로

Primitive 설정은 attribute/property 중 필요한 경로를 제공한다. 복합 객체와 배열은 property 또는 method 인자로 받는다. 공개 attribute마다 대응 property와 변환 규칙을 명시한다. 객체의 attribute 직렬화와 고빈도 property 반영을 기본값으로 삼지 않는 것은 플랫폼의 작성 권고와도 맞는다. [R4](references.md#r4)

| 항목 | 규칙 |
|---|---|
| 문자열/enum | 허용 값, 공백 처리, 제거 시 값, 잘못된 값 처리 |
| 숫자 | 유한수·범위·단위, 문자열 파싱 정책, 빈 문자열 처리 |
| boolean | boolean attribute로 선언한 경우 존재=true, 제거=false |
| 객체/배열 | 교체 단위, 동일 참조 정책, 불변/복사 범위, 중복 식별자 처리 |
| attribute reflection | 양방향/단방향/미반영을 명시하고 재진입 방지 |

boolean 규칙을 쓰는 `disabled="false"`는 비활성 해제가 아니다. false로 만들려면 attribute를 제거하거나 property에 false를 넣는다. 이 규칙은 HTML boolean attribute 의미를 따르는 프로젝트 선택이다. [R3](references.md#r3)

외부 입력은 render 호출보다 먼저 검증·정규화한다. 단순 입력 실패에서는 이전 유효 값을 보존한다. JS setter/method 입력 오류는 동기 throw를 기본으로 하고, 비동기 명령 실패는 Promise rejection을 사용한다. attribute 변환 오류는 callback 예외가 호출자에게 동일하게 전파된다고 가정하지 말고 fallback 또는 구조화된 진단 정책을 명시한다.

## 2.3 상태 권한과 이벤트를 함께 정한다

### 외부 제어형

```text
사용자 입력 → 변경 요청 → Host/Domain 판단 → 확정 상태 입력 → View 반영
```

예: `selection-request`는 후보 ID를 알려줄 뿐, 선택 완료를 의미하지 않는다. UI는 권한 없이 정본 selectedId를 바꾸지 않는다. UI 내부 hover/pressed 같은 일시 상태는 별도로 관리할 수 있다.

### 내부 상태형

```text
사용자 입력 → 내부 검증·확정 → 상태 갱신 → 변경 통지
```

예: 내부에서 관리하는 counter의 `value-change`는 확정된 결과를 알린다. 기존 counter 예제의 의미를 외부 제어형으로 소급 변경하지 않는다.

한 값에 대해 두 모드를 암묵적으로 혼용하지 않는다. 양쪽 모드가 필요하면 별도 모드 계약과 전환 규칙을 작성한다.

## 2.4 명령

명령은 사용자의 목적을 표현한다. `focusItem(id)`, `resetDraft()` 같은 의미 있는 동작을 사용하고, `renderVNode()`, `setInternalState()` 또는 내부 필드명을 받는 범용 patch를 최종 소비자 API로 내보내지 않는다.

명령별로 호출 가능한 상태, 실패 결과, 동기/비동기, idempotency, 취소/중복 호출, 완료 범위를 정한다. Promise<void>라는 이유만으로 DOM commit·paint·네트워크 저장 완료까지 전부 의미하지 않는다.

상태 확정과 DOM 반영은 별도다. Signal 변경 후 Preact scheduling이 개입할 수 있으므로 getter가 새 값을 반환해도 DOM query 결과가 즉시 같다고 가정하지 않는다. 최신 렌더 완료를 기다리는 API는 실제 commit을 관측하고 실패·disconnect까지 처리하는 구현이 있을 때만 공개한다. 임의의 microtask 대기를 완료 계약으로 부르지 않는다. [R2](references.md#r2), [R10](references.md#r10)

## 2.5 이벤트

이벤트마다 이름, detail 스키마, 발생 주체·시점, bubbles/composed/cancelable, 발생하지 않는 조건을 기록한다. camelCase property와 kebab-case CustomEvent 이름을 기본 표기로 제안한다.

프로그램의 property 반영은 사용자 변경 이벤트를 재발행하지 않는다. 최초 입력·재연결·동일 값 반영도 사용자 동작으로 위장하지 않는다. 로딩/애니메이션 완료 등 컴포넌트 내부의 독립 활동에 대한 이벤트는 별도 의미로 선언한다. [R4](references.md#r4)

기본 공개 의미 이벤트는 host element에서 발행한다. 상위 위임을 허용하려는 이벤트는 bubbles=true, 외부 shadow 경계도 통과시켜야 하는 이벤트는 composed=true로 선언한다. 모든 내부 이벤트에 두 값을 무조건 켜지 않는다. host에서 시작한 이벤트가 자신의 shadow 경계를 나가기 위해 composed가 필요한 것은 아니며, 해당 host가 다른 shadow 안에 있는 경우까지 경로를 고려한다. [R5](references.md#r5)

`detail`에는 값·ID·공개 결과만 넣는다. mutable model, 내부 element, writable Signal, renderer event를 전달하지 않는다. 여러 listener가 같은 detail을 볼 수 있으므로 선언된 복사/불변 정책을 적용한다.

`cancelable`은 실제 취소할 기본 동작이 있을 때만 사용한다. dispatchEvent의 boolean은 업무 승인·처리 성공·비동기 완료 결과가 아니다. 비동기 승인은 명시적 command/Promise 또는 request ID 기반 응답 계약으로 처리한다. [R5](references.md#r5)

같은 사용자 행동을 adapter가 Domain command로 직접 실행하면서 Host도 이벤트를 보고 동일 command를 실행하는 중복 경로를 만들지 않는다. 행동을 실행하는 경로를 하나로 정한다.

## 2.6 스타일·슬롯·접근성

스타일 공개 계약은 CSS custom properties, part 이름, theme/variant와 허용 범위다. 내부 클래스나 DOM 깊이는 계약으로 삼지 않는다. 슬롯 이름과 fallback도 공개 계약이다. Shadow↔Light DOM 변경은 이 계약과 이벤트·focus 의미를 보존하는지 검토해야 한다. [R6](references.md#r6), [R7](references.md#r7)

Host의 class, style, tabindex, role 등을 전체 덮어쓰기 하지 않는다. 컴포넌트가 필요한 기본값은 기존 소비자 설정과 충돌하지 않게 적용한다. 기본 display를 설정한 경우 일반 hidden 속성도 존중한다. [R4](references.md#r4)

키보드 동작, 접근 가능한 이름, focus 이동·복귀, disabled 상태, slot 콘텐츠 접근성 책임을 기록한다. 가능하면 native button/input을 사용한다. ARIA role을 붙이는 것만으로 키보드 동작이 생기지 않으므로, tree/listbox 같은 role은 대응 상호작용까지 구현한 경우에만 선언한다. [R8](references.md#r8)

## 2.7 선택 기능은 조건부 계약으로 관리한다

form-associated 동작, SSR/hydration, declarative Shadow DOM, 가상화 목록의 비동기 focus, portal, cross-document 이동은 필요가 생길 때 적용 조건·소유권·완료·실패를 추가한다. 기본 템플릿에 없다는 이유만으로 영구 비대상으로 선언하지 않으며, 지원 계약 없이 되는 것처럼 문서화하지 않는다.
