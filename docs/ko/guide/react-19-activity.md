# React 19.2 Activity

`<Activity>`는 보이지 않는 UI 일부를 마운트된 상태로 유지하는 React 19.2
컴포넌트입니다. hide/reveal 사이에 컴포넌트·DOM·Store·Action Provider 상태는
보존하지만, 해당 UI의 effect와 외부 구독을 계속 활성화하지는 않습니다.

`@context-action/react` 3.0은 React 19.2 이상을 요구합니다. Activity는 React에서
import하며 Context-Action은 이를 감싸거나 다시 export하지 않습니다.

```tsx
import { Activity } from 'react';
```

## 다시 돌아올 UI에 사용하기

사용자가 곧 다시 돌아올 가능성이 크고 로컬 상태가 사라지면 불편한 탭, 사이드바,
검색·필터 패널, 작성 중인 폼, 상세 패널에 적합합니다. 떠날 때 상태를 버려야 한다면
일반 조건부 렌더링을 사용하세요.

```tsx
import { Activity, useState } from 'react';
import { createStoreContext, useStoreValue } from '@context-action/react';

const Draft = createStoreContext('Draft', {
  message: '',
});

function DraftPanel() {
  const messageStore = Draft.useStore('message');
  const message = useStoreValue(messageStore);

  return (
    <label>
      메시지
      <textarea
        value={message}
        onChange={(event) => messageStore.setValue(event.target.value)}
      />
    </label>
  );
}

export function Composer() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button onClick={() => setIsOpen((open) => !open)}>
        작성기 전환
      </button>

      <Activity mode={isOpen ? 'visible' : 'hidden'}>
        <Draft.Provider>
          <DraftPanel />
        </Draft.Provider>
      </Activity>
    </>
  );
}
```

작성기를 다시 보이게 하면 draft 값과 textarea DOM 상태가 복원됩니다.
Context-Action은 같은 주기 동안 Store manager도 유지하므로 Provider를 Activity
경계 안에 둘 수 있습니다.

## Provider와 `withProvider()` 배치

직접 Provider와 `withProvider()` wrapper 모두 Activity가 hidden인 동안 Store
manager를 보존합니다. 화면 구조가 더 명확한 쪽을 선택하면 되며, Activity 전용
Context-Action API는 필요하지 않습니다.

```tsx
const DraftPanelWithStore = Draft.withProvider(DraftPanel);

function ComposerPane({ isOpen }: { isOpen: boolean }) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <DraftPanelWithStore />
    </Activity>
  );
}
```

`createTimeTravelStoreContext`에도 같은 규칙이 적용됩니다. 현재 상태와 undo/redo
history가 hide/reveal 뒤에도 남습니다. 실제 unmount에서는 manager가 dispose되며,
`withProvider({ autoCleanup: false })`를 의도적으로 선택한 경우만 예외입니다.

## hidden 상태에서 바뀌는 점

React는 경계를 `display: none`으로 숨기고 DOM과 상태는 보존하지만 layout/passive
effect를 cleanup합니다. `useStoreValue()`를 포함한 외부 Store 구독은 hidden 동안
해제되고 reveal 시 현재 snapshot으로 다시 연결됩니다. 보이는 UI나 애플리케이션
service가 Store를 갱신하는 것은 계속 가능하지만, 숨겨진 UI는 활성 구독 작업을 하지
않습니다.

숨겨진 경계 안의 effect가 polling, socket 유지, 데이터 가져오기를 계속한다고
가정하지 마세요. 계속 필요한 작업은 경계 밖에 두거나 lifecycle을 명시하세요.

```tsx
useEffect(() => {
  const controller = new AbortController();
  void loadDraft({ signal: controller.signal });
  return () => controller.abort();
}, [draftId]);
```

이 cleanup은 패널이 hidden 될 때와 실제 unmount 될 때 모두 실행됩니다.

`video`, `audio`, `iframe`처럼 `display: none` 상태에서도 자체 부작용이 남는 DOM
요소도 있습니다. cleanup에서 중지하세요. 시각적 media는 숨김을 빠르게 처리하기
위해 layout-effect cleanup을 사용합니다.

```tsx
import { useLayoutEffect, useRef } from 'react';

function VideoPane() {
  const ref = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    const video = ref.current;
    return () => video?.pause();
  }, []);

  return <video ref={ref} controls src="/demo.mp4" />;
}
```

## 사전 렌더링과 SSR

처음부터 hidden인 Activity는 다음에 필요할 UI를 낮은 우선순위로 준비할 수 있습니다.
다만 `lazy`, 캐시된 데이터를 쓰는 `use`, 프레임워크가 관리하는 Suspense 데이터
가져오기처럼 Suspense 호환 작업에서만 도움이 됩니다. effect 기반 fetch는 hidden
상태에서 실행되지 않습니다.

SSR에서는 처음부터 hidden인 Activity 내부 콘텐츠가 서버 응답에 포함되지 않습니다.
SEO에 중요하거나 즉시 보여야 하는 콘텐츠를 initially hidden 경계에 넣지 마세요.
대신 독립적으로 다시 열 수 있는 클라이언트 UI에 사용하세요.

## lifecycle 테스트하기

side effect를 소유하는 경계마다 `StrictMode`에서 visible → hidden → visible
순서를 테스트하세요. 필요한 상태가 유지되는지, effect cleanup이 올바른지, 패널에
돌아왔을 때 최신 Store 값을 읽는지 확인합니다. Context-Action 테스트 suite는 직접
Store Provider, Time Travel history, 두 `withProvider()` variant를 검증합니다.

예제 앱의 **Unified Provider** 화면(`/react/provider`)에는 실행 가능한 Activity
패널이 있습니다. 컴포넌트 로컬 input과 Store-backed input에 값을 입력한 뒤 패널을
숨기고 다시 표시하면 두 값이 모두 복원되는 것을 확인할 수 있습니다.
