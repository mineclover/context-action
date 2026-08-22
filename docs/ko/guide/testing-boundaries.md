# 경계별 Context-Action 테스트

Context-Action의 runtime primitive 수는 많지 않지만 action 등록, dispatch,
store notification, React Provider mount, 사용자에게 보이는 렌더링처럼 여러
라이프사이클을 지난다. 같은 사례를 모든 예제에서 반복하지 말고 책임을 가진
경계에서 검증한다.

## 세 가지 테스트 계층

| 계층 | 소유자 | 검증 대상 | 피할 것 |
| --- | --- | --- | --- |
| Core 계약 | `@context-action/core` | handler 순서, abort, cancellation, queueing, result collection, disposal, compile-time payload 제약 | React 렌더링, DOM event, 애플리케이션 페이지 |
| React adapter 계약 | `@context-action/react` | Provider mount/unmount, handler registration cleanup, subscription 전달, hook identity, React에 보이는 update | 예제의 업무 workflow 복사 |
| 예제 행위 | `example/` 및 standalone demo | 공개 route 로드, 사용자 상호작용의 UI 변화, 비동기 성공 또는 실패 상태 | 모든 core 실행 모드 재검증 |

이 구조에서는 실패 원인이 명확하다. Core 계약 실패는 primitive를, React 계약
실패는 adapter lifecycle을, 예제 실패는 공개 composition 또는 presentation
경계를 가리킨다.

## Core 계약: 결정적이고 직접적으로

Core 테스트는 Node에서 실행한다. `ActionRegister`와 controller를 직접
사용한다.

```ts
const registry = new ActionRegister();
registry.register('save', async (_, controller) => {
  controller.setResult('saved');
});

const result = await registry.dispatch('save', undefined);
expect(result.results).toContain('saved');
```

registration/unregistration, priority 순서, abort, timeout/cancellation,
disposal은 각각 기대하는 terminal condition을 독립적으로 표현한다. type-only
테스트는 public type contract 옆에 두고 package의 strict test TypeScript
project로 실행한다.

## React adapter 계약: async `act` 사용

React adapter는 Provider lifetime과 subscription을 소유한다. store, dispatch
function, timer, 외부 callback을 직접 호출하는 테스트는 렌더된 결과를
assert하기 전에 `await act(async () => { ... })`를 사용한다. 이를 위해 package
test setup은 `IS_REACT_ACT_ENVIRONMENT`를 설정한다.

```tsx
await act(async () => {
  store.setValue({ status: 'ready' });
});

expect(screen.getByRole('status')).toHaveTextContent('ready');
```

오류 경로 자체를 검증하는 경우에만 좁은 범위의 console spy를 사용한다. 현재
legacy setup은 해당 테스트를 위해 console mock을 유지하지만, 각 테스트 뒤에
captured된 “not wrapped in act” diagnostic은 실패로 처리한다.

## 예제: 행위와 영향 범위만

예제는 composition을 증명한다. 공개 route마다 browser smoke를 두고, route가
중요한 상호작용을 소유하면 co-located unit test를 추가한다. impact command는
선택된 route와 그 unit test 존재 여부를 함께 보여준다.

```bash
pnpm example:impact -- --changed-files \
  example/src/pages/integrations/react-aria/ReactAriaReferencePage.tsx
```

일반 변경에는 영향받은 route만 실행하고, 릴리스 전체 신뢰도 점검에는 canonical
공개 카탈로그를 실행한다.

```bash
pnpm --filter example verify:route-smoke -- \
  --base origin/main --head HEAD
pnpm example:smoke
```

route smoke는 page exception과 browser console error를 찾는다. domain 또는
adapter 계약을 대체하는 것이 아니라 공개 composition이 사용할 수 있는 기본
상태까지 도달하는지 확인한다.

## 코드를 쓰기 전 테스트 선택

1. React 없이 표현할 수 있으면 core 테스트를 추가하거나 수정한다.
2. Provider, hook, subscription lifetime에 의존하면 `act`를 사용하는 React
   adapter 테스트를 추가한다.
3. route 조합 뒤에만 보이는 경우 co-located 예제 테스트를 추가하고 impact
   smoke가 그 route를 검증하게 한다.
4. 공유 runtime module이 바뀌면 모든 공개 예제가 그 계약에 의존하므로 더 넓은
   smoke 선택을 받아들인다.
