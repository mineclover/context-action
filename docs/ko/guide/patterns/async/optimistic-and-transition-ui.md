# 확정 Store 기반 낙관적 UI & 전환 (React 19)

Context-Action의 **확정(committed) Store 상태**와 **`dispatchWithResult`** 위에 React 19의 `useOptimistic`, 비동기 `useTransition`, `useActionState`를 겹쳐 쓰는 패턴입니다.

> [!NOTE]
> **React 19+ 전용 사용 패턴:** `useOptimistic`, `useActionState`, 비동기 `startTransition`은 **React 19 이상**에서 동작합니다. `@context-action/react`는 `react: ^18.0.0 || ^19.0.0` peer 호환성을 유지하므로, 이러한 훅을 코어 래퍼 API로 감싸지 않고 사용 패턴으로 제공합니다. React 18 환경에서는 `useState`로 pending/error를 로컬 관리하고 `dispatchWithResult`와 조합하세요.

- **경계 역할**: `Store`는 **확정된 도메인 진실(committed truth)** 만 보유하고, 임시 낙관적 상태와 폼 제출 피드백은 React의 일시적 전환/폼 레이어에서 관리해 액션이 Guard로 중단되거나 실패하면 자동 롤백되게 합니다.

## 사전 요구사항

- [비동기 패턴 개요](./index.md)
- [실시간 상태 접근](./real-time-state-access.md)
- [React 19.2 Activity](../../react-19-activity.md)

---

## Pattern A: 확정 Store + `useOptimistic` + 비동기 `useTransition`

`Store`에 롤백용 임시 상태를 섞지 않고 UI 경계에서만 낙관적 오버레이를 유지합니다:

1. `useStoreValue(store)`로 확정된 값을 구독합니다.
2. 그 위에 `useOptimistic(committed, reducer)`를 얹습니다.
3. `startTransition(async () => { ... })` 안에서 `addOptimistic(...)`를 호출하고 `await dispatchWithResult(...)`를 실행합니다.
4. 핸들러가 성공했을 때만 `store.setValue(...)`로 커밋합니다. `useActionGuard`가 중단하거나 오류가 나면 React가 전환 종료 시점에 자동으로 낙관적 상태를 버리고 `committed`로 복원합니다.

> [!TIP]
> **`notificationMode: 'immediate'`로 1프레임 RAF 플리커 제거:** Context-Action의 기본 `Store`는 구독자 알림을 다음 `requestAnimationFrame`(약 16ms)에 배칭 전달합니다. 낙관적/전환 UI와 결합하는 Store는 `{ initialValue, notificationMode: 'immediate' }`로 설정해 `articleStore.setValue(committed)`가 `startTransition` 종료 전에 React로 즉시 전달되도록 하세요. 기본 `'batched'` 모드를 유지해야 하는 Store라면 아래 Pattern B처럼 `startTransition` / `useActionState`가 끝나기 전에 `await waitForNextFrame()`으로 1프레임을 맞춰 주면 됩니다.

<!-- @context-action-compile -->
```tsx
import React, { useCallback, useOptimistic, useTransition } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

export interface ArticleState {
  readonly liked: boolean;
  readonly count: number;
}

interface LikeActions extends ActionPayloadMap {
  toggleLike: { nextLiked: boolean; simulateReject?: boolean };
}

interface LikeResultMap {
  toggleLike: ArticleState;
}

const {
  Provider: LikeActionProvider,
  useActionGuard: useLikeGuard,
  useActionResultHandler: useLikeResultHandler,
  useActionDispatchWithResult: useLikeDispatchWithResult,
} = createActionContext<LikeActions, LikeResultMap>('OptimisticLikeActions');

const {
  Provider: LikeStoreProvider,
  useStore: useLikeStore,
} = createStoreContext('OptimisticLikeStore', {
  article: {
    initialValue: { liked: false, count: 10 } as ArticleState,
    notificationMode: 'immediate' as const,
  },
});

function LikeHandlers({ children }: { children: React.ReactNode }) {
  const articleStore = useLikeStore('article');

  useLikeGuard(
    'toggleLike',
    useCallback(({ simulateReject }, controller) => {
      if (simulateReject) {
        controller.abort('Permission denied');
      }
    }, []),
  );

  useLikeResultHandler(
    'toggleLike',
    useCallback(
      async ({ nextLiked }) => {
        await Promise.resolve();
        const current = articleStore.getValue();
        const committed: ArticleState = {
          liked: nextLiked,
          count: current.liked === nextLiked
            ? current.count
            : current.count + (nextLiked ? 1 : -1),
        };
        articleStore.setValue(committed);
        return committed;
      },
      [articleStore],
    ),
  );

  return <>{children}</>;
}

function LikeButtonPanel() {
  const articleStore = useLikeStore('article');
  const committed = useStoreValue(articleStore);
  const { dispatchWithResult } = useLikeDispatchWithResult();
  const [isPending, startTransition] = useTransition();

  const [optimisticArticle, applyOptimisticLike] = useOptimistic<
    ArticleState,
    boolean
  >(committed, (state, nextLiked) => ({
    liked: nextLiked,
    count: state.liked === nextLiked ? state.count : state.count + (nextLiked ? 1 : -1),
  }));

  const handleToggle = (simulateReject = false) => {
    const nextLiked = !committed.liked;
    startTransition(async () => {
      applyOptimisticLike(nextLiked);
      await dispatchWithResult('toggleLike', {
        nextLiked,
        simulateReject,
      });
    });
  };

  return (
    <div>
      <span>Likes: {optimisticArticle.count}</span>
      <button type="button" disabled={isPending} onClick={() => handleToggle(false)}>
        {optimisticArticle.liked ? 'Unlike' : 'Like'}
      </button>
    </div>
  );
}

export function OptimisticLikeFeature() {
  return (
    <LikeActionProvider>
      <LikeStoreProvider>
        <LikeHandlers>
          <LikeButtonPanel />
        </LikeHandlers>
      </LikeStoreProvider>
    </LikeActionProvider>
  );
}
```

---

## Pattern B: `<form action={...}>` + `useActionState` + `dispatchWithResult`

React 19의 `useActionState`와 `dispatchWithResult`를 결합하면, 검증(`useActionGuard`)과 저장(`useActionResultHandler`)은 Context-Action 파이프라인에 유지한 채 표준 `<form>` 제출과 `isPending` 상태를 자연스럽게 연동할 수 있습니다.

> [!NOTE]
> **React 19 자동 폼 리셋 대응:** `<form action={...}>` 완료 후 React 19는 비제어 입력을 `defaultValue`로 자동 초기화합니다. Guard 검증 실패 시 입력값이 날아가지 않게 `draftName`을 반환하고, 성공 시에도 RAF 배칭된 Store 커밋이 반영되도록 `waitForNextFrame()` 후 `${submitState.revision}:${committedName}` 키로 `<input>`을 동기화합니다.

<!-- @context-action-compile -->
```tsx
import React, { useActionState, useCallback } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

interface ProfileFormActions extends ActionPayloadMap {
  saveDisplayName: { displayName: string };
}

interface ProfileFormResultMap {
  saveDisplayName: { displayName: string };
}

interface FormSubmitState {
  readonly status: 'idle' | 'saved' | 'error';
  readonly message: string;
  readonly draftName: string;
  readonly revision: number;
}

const {
  Provider: ProfileActionProvider,
  useActionGuard: useProfileGuard,
  useActionResultHandler: useProfileResult,
  useActionDispatchWithResult: useProfileDispatchWithResult,
} = createActionContext<ProfileFormActions, ProfileFormResultMap>('ProfileFormActions');

const {
  Provider: ProfileStoreProvider,
  useStore: useProfileStore,
} = createStoreContext('ProfileFormStore', {
  displayName: 'Anonymous',
});

function ProfileFormHandlers({ children }: { children: React.ReactNode }) {
  const displayNameStore = useProfileStore('displayName');

  useProfileGuard(
    'saveDisplayName',
    useCallback(({ displayName }, controller) => {
      if (displayName.trim().length < 2) {
        controller.abort('Display name must be at least 2 characters.');
      }
    }, []),
  );

  useProfileResult(
    'saveDisplayName',
    useCallback(
      async ({ displayName }) => {
        const trimmed = displayName.trim();
        displayNameStore.setValue(trimmed);
        return { displayName: trimmed };
      },
      [displayNameStore],
    ),
  );

  return <>{children}</>;
}

function ProfileNameForm() {
  const committedName = useStoreValue(useProfileStore('displayName'));
  const { dispatchWithResult } = useProfileDispatchWithResult();

  const [submitState, formAction, isPending] = useActionState<
    FormSubmitState,
    FormData
  >(
    async (prevState, formData) => {
      const rawName = String(formData.get('displayName') ?? '');
      const execution = await dispatchWithResult('saveDisplayName', {
        displayName: rawName,
      });

      if (execution.aborted || !execution.success) {
        return {
          status: 'error',
          message: execution.abortReason ?? 'Save failed.',
          draftName: rawName,
          revision: prevState.revision + 1,
        };
      }

      const saved = Array.isArray(execution.result)
        ? execution.result[0]
        : execution.result;

      await waitForNextFrame();

      const nextName = saved?.displayName ?? rawName.trim();
      return {
        status: 'saved',
        message: `Saved ${nextName}`,
        draftName: nextName,
        revision: prevState.revision + 1,
      };
    },
    { status: 'idle', message: '', draftName: '', revision: 0 },
  );

  const displayedDefault =
    submitState.status === 'error' ? submitState.draftName : committedName;

  return (
    <form action={formAction}>
      <p>Committed: {committedName}</p>
      <input
        key={`${submitState.revision}:${committedName}`}
        name="displayName"
        defaultValue={displayedDefault}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
      {submitState.status !== 'idle' && (
        <p role="status">{submitState.message}</p>
      )}
    </form>
  );
}

export function ProfileFormWithActionState() {
  return (
    <ProfileActionProvider>
      <ProfileStoreProvider>
        <ProfileFormHandlers>
          <ProfileNameForm />
        </ProfileFormHandlers>
      </ProfileStoreProvider>
    </ProfileActionProvider>
  );
}
```

---

## 핵심 불변식

- **`Store`는 확정된 진실만 보관**: `useOptimistic`이 일시 UI 오버레이와 자동 롤백을 처리해 주므로, 영속 도메인 `Store`에 임시 롤백 플래그를 넣지 않습니다.
- **`execution.aborted`와 `execution.success` 확인**: `useActionState` 내부에서는 반드시 `dispatch`가 아닌 `dispatchWithResult`를 사용해 `useActionGuard`의 중단 사유(`abortReason`)를 결정론적인 폼 피드백으로 변환합니다.
- **`Store` 커밋과 React 전환 타이밍 맞추기**: `StoreConfig` 또는 `createStore` 옵션에서 `notificationMode: 'immediate'`를 설정해 `startTransition` 종료 전 확정 스냅샷이 즉시 반영되게 하거나, 기본 `'batched'` Store에서는 커밋 후 `waitForNextFrame()`으로 1프레임을 맞춰 주세요.
- **`<form action>` 중단 시 사용자 입력 보존**: 검증 실패 시 `draftName`을 반환하고 `defaultValue` 키를 갱신해 React 19의 자동 폼 리셋으로 사용자 초안이 지워지지 않게 합니다.
