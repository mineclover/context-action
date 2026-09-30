# Preact Runtime 적용 가이드

## 패키지의 역할

`packages/preact`는 Core Action 타입의 dispatcher 주입과 Source→Signal 구독을 담당합니다. `packages/preact-ui`는 DOM ownership과 mount/teardown을 담당합니다. `core` 및 `react` 내부 구현은 수정하지 않고 공개 계약만 소비합니다.

```text
ActionRegister (Host 소유)
       ↓ dispatcher
Preact Dispatch Provider → UI action
                            ↓
                         Core handler
                            ↓
Domain Source → readonly Signal connection → Preact View
                                          → 다른 독립 Island
```

Store가 `getValue()`를 공개하는 경우 작성자가 `getSnapshot: () => store.getValue()`와 구독 해제 함수를 연결합니다. 이때 원본 Store의 실제 구독/불변성/알림 시점을 먼저 확인해야 합니다. Core에 존재하지 않는 Store를 가정하거나 React Store 내부 경로를 import하지 않습니다.

## `<template>`에 넣기

정적 shell과 빈 `[data-preact-root]` 한 개를 둡니다. shell은 template controller가, Root children은 Preact가 관리합니다. 모델, 구독, mount를 순서대로 만들고 disposal scope에는 같은 순서로 등록합니다.

[template-island 예제](../examples/template-island/mount-counter.tsx)는 외부에 `setLabel`, `setValue`, `destroy`만 제공합니다. 공유 모델을 받으므로 UI가 모델을 파괴하지 않습니다. [composition 예제](../examples/main.tsx)는 모델을 만든 주체로서 두 Island를 먼저 해제한 다음 모델을 파괴합니다.

동적 Root가 여러 개라면 각 Root에 `mountPreact`를 호출하고 Host scope에서 함께 정리합니다. `mountTemplate`의 한 Root 제한을 우회해 임의의 첫 번째 노드를 선택하지 않습니다.

## Web Component에 넣기

[Web Component 예제](../examples/web-component/counter-element.tsx)는 explicit registration, property-before-upgrade, boolean attribute, 사용자 이벤트, disconnect/reconnect를 보여줍니다. 생성자는 ShadowRoot와 내부 빈 컨테이너만 만듭니다. connected에서 mount, disconnected에서 unmount합니다.

외부 property는 primitive value이며 Signal은 private field입니다. `disabled="false"`도 attribute가 존재하므로 disabled입니다. `.disabled = false` 또는 attribute 제거로 해제합니다. `value`는 property 전용이고 attribute reflection은 하지 않습니다.

Custom Element를 다시 정의하려 하면 이름 충돌 오류를 냅니다. 등록은 import의 부수 효과로 수행하지 않습니다. 일반 element 이동도 disconnect/reconnect를 유발할 수 있으므로 상태를 `connectedCallback`에서 초기화하지 않습니다.

## Signals의 적용 단위

`{signal}` 직접 출력은 단순 텍스트 갱신에 활용할 수 있습니다. render 중 `.value`를 읽어 조건부 구조나 목록을 만들면 그 컴포넌트의 렌더링 의존성이 됩니다. 모든 Signal 변경이 VDOM을 우회한다는 보장은 하지 않습니다.

외부 store 연결은 eager subscription입니다. render 함수에서 생성하지 않고 mount/session bootstrap에서 만든 뒤, 모든 소비자가 해제된 다음 dispose합니다. 연결 후에는 immutable/cached snapshot을 교체해야 하며 큰 객체 내부의 직접 mutation을 감지하지 않습니다.

고빈도 포인터/카메라 값은 프레임마다 갱신할 필요가 있는 소비자에만 전달합니다. Signals 자체가 requestAnimationFrame 스케줄러나 프레임 속도 보장은 아니므로 실제 renderer 비용을 측정합니다.

## 확장 지점

SSR은 `@context-action/preact-ui/ssr`의 `createSSR`, hydration은 `hydratePreact`의 별도 계약을 사용합니다. arbitrary light-DOM delegation, portal target ownership, form-associated custom elements, ShadowRoot 간 복잡한 slot projection은 각 컴포넌트의 입출력·수명 계약과 테스트를 추가한 경우에만 적용합니다. 일반 빈 Root mount는 기존 DOM을 지우거나 hydration으로 추정하지 않습니다.

## 참조

- [Preact Signals 공식 가이드](https://preactjs.com/guide/v10/signals/)
- [Preact API 공식 가이드](https://preactjs.com/guide/v10/api-reference/)
- [Preact Web Components 공식 가이드](https://preactjs.com/guide/v10/web-components/)
- [Custom Elements lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Custom Element property upgrade](https://web.dev/articles/custom-elements-best-practices)

원본 저장소 검토 기준은 `a1644815b5434279e34fbfcaecb7951fdd01fb2f`입니다. 패키지 선언/실제 설치/런타임 검증 상태는 [검증 기록](04-validation.md)을 따릅니다.
