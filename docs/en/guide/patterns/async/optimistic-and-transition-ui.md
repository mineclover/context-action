# Optimistic & Transition UI with Committed Stores (React 19)

Layer React 19's `useOptimistic`, async `useTransition`, and `useActionState` on top of Context-Action's **committed Store state** and **`dispatchWithResult`**.

> [!NOTE]
> **React 19+ Usage Pattern:** `useOptimistic`, `useActionState`, and async `startTransition` require **React 19+**. Because `@context-action/react` supports `react: ^18.0.0 || ^19.0.0`, these integrations intentionally live as usage patterns rather than package wrapper APIs. On React 18, track pending/optimistic UI locally via `useState` paired with `dispatchWithResult`.

- **Boundary Role**: `Store` holds **committed domain truth** only; temporary optimistic values and form submission status stay in React's transient transition/form layer and roll back automatically when a guarded/failed action settles.

## Prerequisites

- [Async Patterns Overview](./index.md)
- [Real-time State Access](./real-time-state-access.md)
- [React 19.2 Activity](../../react-19-activity.md)

---

## Pattern A: Committed Store + `useOptimistic` + Async `useTransition`

Keep optimistic rollback logic out of your `Store`:

1. Read the committed value via `useStoreValue(store)`.
2. Wrap it with `useOptimistic(committed, reducer)`.
3. Inside `startTransition(async () => { ... })`, call `addOptimistic(...)` and `await dispatchWithResult(...)`.
4. Only commit to `store.setValue(...)` when the server/business operation succeeds; if `useActionGuard` aborts or an error occurs, React automatically discards the optimistic overlay and reverts to `committed`.

> [!TIP]
> **Avoiding 1-Frame RAF Flicker with `notificationMode: 'immediate'`:** Context-Action's default `Store` batches `useSyncExternalStore` notifications on the next `requestAnimationFrame` (~16ms). Configure `{ initialValue, notificationMode: 'immediate' }` on optimistic/transition stores so `articleStore.setValue(committed)` notifies React synchronously before `startTransition` finishes—preventing `useOptimistic` from dropping its overlay 1 frame early. If a Store must stay in default `'batched'` mode, `await waitForNextFrame()` right before exiting `startTransition` (as shown in Pattern B below).

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
  useActionResultDispatch: useLikeResultDispatch,
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
  const dispatchWithResult = useLikeResultDispatch();
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

Pair React 19's `useActionState` with `dispatchWithResult` so validation (`useActionGuard`) and submission (`useActionResultHandler`) stay inside the Context-Action pipeline while `<form>` ergonomics and `isPending` are handled natively by React.

> [!NOTE]
> **Preserving Form Input Across React 19 Automatic Reset:** React 19 resets uncontrolled form fields back to `defaultValue` when `<form action={...}>` completes. Preserve `draftName` on guard aborts (so invalid input isn't wiped), flush `waitForNextFrame()` after a successful RAF-batched Store commit, and key the `<input>` on `${submitState.revision}:${committedName}` so React syncs the displayed `defaultValue` cleanly on both validation errors and committed saves.

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
  useActionResultDispatch: useProfileResultDispatch,
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
  const dispatchWithResult = useProfileResultDispatch();

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

## Key Invariants

- **Keep `Store` as committed truth**: Never write unverified optimistic flags into the persistent domain `Store` when `useOptimistic` handles transient UI display cleanly and rolls back automatically.
- **Inspect `execution.aborted` and `execution.success`**: Always use `dispatchWithResult` (never fire-and-forget `dispatch`) inside `useActionState` so `useActionGuard` rejections translate into deterministic form feedback.
- **Align Store commits with React transitions**: Configure `notificationMode: 'immediate'` on the `Store` (via `StoreConfig` or `createStore` options) so committed updates reach `useSyncExternalStore` before `startTransition` ends, or await one animation frame (`waitForNextFrame()`) after committing to a default `'batched'` Store.
- **Preserve user draft input on `<form action>` aborts**: Return `draftName` and key uncontrolled `defaultValue` (or use controlled state) so React 19's automatic form reset does not erase invalid input.
