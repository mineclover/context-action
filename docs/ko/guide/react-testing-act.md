# `act`를 활용한 React UI 테스트

이 컨벤션은 React 컴포넌트를 렌더링하는 Context-Action 예제와 애플리케이션
통합에 적용한다. assertion 전에 대기 중인 React 작업을 반영해, 겉으로만
통과하고 업데이트를 남기는 테스트를 막는다.

React는 렌더링과 비동기 경계를 넘을 수 있는 상호작용에
`await act(async () => { ... })` 형태를 권장한다. React Testing Library의
렌더링·상호작용 helper는 이미 `act`로 감싸지만, 직접 store를 변경하거나,
action을 dispatch하거나, timer·외부 promise를 처리할 때는 명시적인 경계가
필요하다. 자세한 규칙은 공식 [React `act` 문서](https://react.dev/reference/react/act)를 따른다.

## 필수 테스트 환경

예제 앱은 `example/src/test/setup.ts`에서 `IS_REACT_ACT_ENVIRONMENT`를
설정하고 실제 미완료 업데이트를 뜻하는 “not wrapped in act” diagnostic을
테스트 실패로 바꾼다. 새 React 예제의 테스트 설정에도 같은 보호 장치를 둔다.

```ts
(globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT = true;
```

전역 `console.error` mock으로 React `act` 경고를 숨기지 않는다. 테스트의
경계를 고쳐야 한다. 의도적으로 오류 경로를 검증할 때만 좁은 범위의 spy를
만들고 그 오류를 명시적으로 assertion한다.

## 작업별 경계 선택

| 테스트 대상 | 컨벤션 |
| --- | --- |
| 순수 business rule 또는 schema | `act` 없이 함수를 직접 테스트한다. |
| React Testing Library의 `render`, `userEvent`, `findBy*`, `waitFor` | helper를 그대로 사용하고 비동기 helper는 모두 `await`한다. |
| 렌더된 컴포넌트에 영향을 주는 직접 Context-Action store 변경 또는 action dispatch | 변경과 그 promise를 `await act(async () => { ... })`로 감싼다. |
| timer, subscription callback, 외부에서 resolve되는 promise, imperative ref update | `await act(async () => { ... })` 안에서 발생시키고 보이는 결과를 assertion한다. |
| 서버 렌더링 | 서버 렌더링에는 client `act`를 쓰지 않고, hydrate 또는 client update에만 사용한다. |

`waitFor`는 assertion을 재시도할 뿐 imperative update의 `act` 경계를 대신하지
않는다. `userEvent`도 Testing Library의 내부 `act` 작업이 끝나도록 반드시
`await`한다.

## Context-Action 예제

렌더된 consumer가 store를 읽는다면, 테스트에서는 직접 store를 쓰는 일을 UI
상호작용처럼 취급한다.

```tsx
import { act } from 'react';
import { render, screen } from '@testing-library/react';

it('renders the store update', async () => {
  const store = createCounterStore();
  render(<CounterView store={store} />);

  await act(async () => {
    store.setValue(3);
  });

  expect(screen.getByText('Count: 3')).toBeInTheDocument();
});
```

비동기 action은 같은 경계 안에서 dispatch를 `await`한다. assertion은 그
바깥에 두어 React가 상호작용을 모두 flush한 뒤 사용자가 볼 수 있는 결과를
검증한다.

```tsx
await act(async () => {
  await dispatch('saveProfile', { name: 'Ada' });
});

expect(screen.getByRole('status')).toHaveTextContent('Saved');
```

## Timer와 외부 callback

fake timer를 전진시키거나 외부에서 제어하는 promise를 resolve할 때도 async
`act` 안에서 실행한다. debounce action, subscription bridge, 지연 notification에
특히 중요하다.

```tsx
await act(async () => {
  await vi.advanceTimersByTimeAsync(300);
});

expect(screen.getByText('Search complete')).toBeInTheDocument();
```

## 예제 커버리지 기준선

공개 링크가 있는 예제에는 최소 한 개의 browser-facing 테스트가 있어야 하며,
다음을 모두 확인한다.

1. React `act` diagnostic이나 uncaught browser error 없이 렌더링된다.
2. 주요 키보드·포인터·dispatch 상호작용 하나가 보이는 UI를 변경한다.
3. 비동기 완료 또는 오류 상태 하나를 관찰할 수 있다.
4. cleanup 뒤 pending timer, subscription, request가 남지 않는다.

이는 도입 기준선이며 모든 legacy route가 이미 커버되었다는 뜻은 아니다. 기존
상호작용 테스트에 먼저 가드를 적용하고, 각 공개 예제에 route-level smoke
coverage를 추가한 뒤에야 예제 카탈로그 전체가 검증되었다고 판단한다.

새 가이드를 추가하거나 옮기기 전 현재 예제와 프레임워크 테스트를 실행한다.

```bash
pnpm --filter example test
pnpm --filter @context-action/react test
pnpm web-coding:verify
```

배포되는 `/web-coding/` 화면은 Standalone Web Coding Studio의 browser
verification으로 검증한다. 내부 example fixture는 contract 테스트에는 유용하지만,
공개 배포 route 테스트를 대신하지는 않는다.
