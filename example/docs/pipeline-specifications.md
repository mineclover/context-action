# Example documentation index

이 디렉터리에는 더 이상 별도의 파이프라인 스펙을 유지하지 않습니다. 과거의
`register(...)`, 설정 객체만 전달하는 `createActionContext(...)`, 비공개
lifecycle 이벤트 예제는 현재 공개 API와 일치하지 않아 제거했습니다.

파이프라인의 단일 기준 문서는 다음 위치를 사용합니다.

- [English Action Pipeline Guide](../../docs/en/concept/action-pipeline-guide.md)
- [한국어 Action Pipeline Guide](../../docs/ko/concept/action-pipeline-guide.md)
- [React Action Context examples](../../docs/en/examples/action-only.md)
- [Core package README](../../packages/core/README.md)

실행 가능한 예제 코드는 `example/src/`와 `demos/`에서 관리합니다. 문서에 코드를
추가할 때는 다음 계약을 지킵니다.

```tsx
import { createActionContext } from '@context-action/react';

interface CheckoutActions {
  submit: { cartId: string };
}

const Checkout = createActionContext<CheckoutActions>('Checkout');

function CheckoutLogic() {
  const dispatch = Checkout.useActionDispatch();

  Checkout.useActionHandler('submit', async ({ cartId }, controller) => {
    if (!cartId) {
      controller.abort('cartId is required');
    }
  });

  return <button onClick={() => void dispatch('submit', { cartId: 'cart-42' })}>Submit</button>;
}
```

`createActionContext`는 항상 명시적인 context name을 받고, dispatch 옵션은
`signal`을 사용합니다. 등록 현황이 필요한 경우 `ActionRegister`의
`getRegistryInfo()`와 `getAllActionStats()`를 사용합니다.
