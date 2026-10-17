# 01. DOM 소유권 경계와 생명주기 규약 (DOM Ownership & Lifecycle)

## 1.1 하나의 영역에는 하나의 렌더링 책임자

Host는 Mount Root 자체의 배치와 외부 레이아웃을 관리하고, Renderer는 `root.children`만을 배타적으로 관리합니다. 외부 소비자는 내부 노드를 직접 검색·수정하지 않고 값 입력, 명령, 관측, 이벤트로만 제어합니다.

Web Component shell과 내부 Preact도 경쟁하는 두 Owner가 아니라 **shell이 `children` 영역을 Preact에 위임하는 관계**입니다.

### DOM 경계 규칙

- **배타적 자식 제어**: Root의 `children`에 대한 구조·텍스트·속성 갱신은 위임된 Owner만 수행합니다. 외부의 `innerHTML`, `replaceChildren`, 내부 `classList` 직접 수정은 허용하지 않습니다.
- **내부 Escape Hatch 제한**: 직접 DOM 처리가 필요하면 Owner 내부의 ref, 측정, focus, renderer adapter로만 제한합니다. 같은 노드/속성을 VDOM과 imperative effect가 동시에 쓰지 않습니다.
- **Host 태그 자기 위임 금지**: Custom Element 자신(`mountPreact(this, View)`)을 Renderer 루트로 넘기지 않습니다. 호스트 속성·light children은 외부 소비자의 영역이므로, Renderer에는 ShadowRoot 내부의 격리된 빈 루트(예: `[data-preact-root]`)만 위임합니다.
- **중첩 격리**: 상위 Owner는 하위 boundary를 배치할 수 있지만 그 내부를 렌더링하지 않습니다. `mountPreact`는 같은 패키지 인스턴스의 중복 Root와 기존 Light-DOM Owner 아래의 마운트를 거부합니다. `ShadowRoot`는 별도 경계로 격리됩니다.

공통 구현(`mountPreact`, `hydratePreact`, `mountTemplate`, `createDisposalScope`)은 의미를 자동 추론하지 않는 저수준 런타임으로 제한하며, 프로퍼티·명령·이벤트·상태 변경 권한은 [공개 컴포넌트 계약](02-public-component-contract.md)과 Host 어댑터가 정합니다.

---

## 1.2 두 수명을 구분한다: Element Instance vs Connection Session

```text
Element instance (영구 수명)
├─ 공개 입력의 마지막 유효 값
├─ 보존하기로 한 내부 도메인 상태 / 모델
└─ Connection session (0 또는 1개, 연결 수명)
   ├─ Preact mount / hydrate
   ├─ ReadableSource → Signal 연결·effect
   ├─ DOM listener·observer·timer
   └─ 해당 세션의 비동기 작업 (AbortController / 세대 식별자)
```

Custom Element는 `disconnectedCallback` 후 다시 `connectedCallback`될 수 있습니다. **연결 세션을 끝내는 것과 인스턴스 의미를 영구 종료하는 것은 다릅니다.** 브라우저의 연결 콜백은 탭 이동, 가상 리스트 스크롤, DOM 재배치 등으로 반복될 수 있으므로 이를 전제로 작성합니다. ([R0](references.md#r0))

### 상태별 동작 매트릭스

| 상태 | 입력·읽기 | 렌더링·자원 | 명령 |
|---|---|---|---|
| **생성됐지만 미연결** | 유효 입력 보존, getter 사용 | 외부 구독/DOM 의존 작업 시작 안 함 | 데이터 명령은 개별 계약, DOM 명령은 실패/미실행 결과 |
| **연결 중** | 최신 유효 입력 복원 | 세션 하나 생성·mount | mount 완료 전 호출 정책 명시 |
| **연결됨** | 정상 반영 | 구독과 렌더링 활성 | 공개 계약대로 실행 |
| **연결 해제** | 입력·보존 상태 유지 | UI 자원 및 세션 종료 | DOM 명령은 실패/미실행 결과 |
| **재연결** | 유지 값 + 최신 외부 snapshot | 새로운 세션 생성·재마운트 | 성공적인 mount 이후 실행 |
| **영구 파괴 (`dispose`)** | 최종 정리 완료 | 세션 종료 + `onDestroy` 1회 실행 | 이후 재연결·갱신 차단 |

수동 마운트가 반환하는 `MountInstance` / `HydrationInstance`는 단일 세션 수명입니다. `destroy()`는 멱등(idempotent)이며, 호출 후 `update()`는 실패합니다.

---

## 1.3 상태 보존 범위와 빌린 자원(Borrowed Resources)

- **원본 도메인 보존**: 도메인의 원본 상태는 하나이며 Signal은 읽기 전용 projection입니다. UI가 도메인을 소유한다고 가정하지 않으므로, 빌려온(borrowed) `ReadableSource`나 `ActionRegister`는 `disconnectedCallback`이나 UI 해제 시 파괴하지 않습니다.
- **재연결 보존 범위**: 재연결 시 공개 입력과 인스턴스에 저장한 도메인 상태만 기본 보존합니다. View 내부의 로컬 `useState`/`useSignal`, DOM selection, focus, scroll이 언마운트 후 자동으로 유지된다고 약속하지 않습니다.
- **노드 이동과 문서 채택**: 동일 노드를 재배치해도 일반 disconnect/connect 경로를 탈 수 있으므로 이 경로가 항상 안전해야 합니다. 문서가 달라지는 adoption(`adoptedCallback`)에서는 `ownerDocument`/`window`에 결합된 자원을 다시 연결합니다. ([R0](references.md#r0))

---

## 1.4 LIFO 생성과 정리 순서 (`createDisposalScope`)

```text
연결 (Provider → Consumer): 자원 scope → source 연결 → view input 구성 → mount → observer 시작
해제 (Consumer → Provider): 새 작업 차단 → observer 종료 → unmount → source 연결 해제 → scope 종료
```

- `createDisposalScope`에는 **제공자(Provider/Model)를 먼저, 소비자(Consumer/View)를 나중에 등록**합니다.
- `dispose()`는 **LIFO(역순)**로 실행되어 View가 먼저 언마운트된 뒤 시그널 구독과 하위 자원이 정리됩니다.
- 하나의 정리 콜백이 예외를 던져도 나머지 cleanup을 끝까지 시도한 후 `AggregateError(errors, 'UI cleanup failed')`로 보고합니다.

---

## 1.5 비동기 작업과 늦은 결과 (Stale Result Protection)

- Connection session마다 `AbortController` 또는 세대 식별자(generation token)를 두어, 이미 종료된 세션의 응답이 새 View를 갱신하거나 완료 이벤트를 재발행하지 못하게 차단합니다.
- 취소할 수 있는 것은 세션이 소유한 UI 작업입니다. 이미 도메인에 위임된 업무 명령을 컴포넌트가 연결 해제되었다는 이유만으로 임의 취소하지 않습니다. 업무 결과가 도메인에서 확정되면 재연결 시 최신 스냅샷으로 관측합니다.

---

## 1.6 실패와 보존

- **빈 루트 / 명시적 하이드레이션**: `mountPreact`는 빈 루트만 받으며 기존 DOM을 자동 채택하거나 지우지 않습니다. 서버 렌더링 마크업 채택은 반드시 `hydratePreact`를 사용합니다.
- **렌더 실패 시 자동 정리**: 초기 마운트나 동기 `update` 실패 시 즉시 렌더러 해제를 시도하고 부분 렌더링된 잔여 자식 노드(및 복제된 template shell)를 제거합니다.
- **신뢰 경계**: `<template>`은 신뢰된 소스만 사용합니다(HTML sanitizer 아님). Shadow DOM 역시 스타일·DOM 캡슐화 경계이지 보안 경계가 아닙니다.
- **공개 오류 표면**: 외부로 노출하는 오류는 안정적인 범주와 허용된 설명만 포함하며, 내부 스택이나 민감 페이로드를 모든 `CustomEvent`에 실어 보내지 않습니다.
