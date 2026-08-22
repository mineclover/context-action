# React 19.2 Activity

`<Activity>` is a React 19.2 component for keeping a part of the UI mounted
while it is not visible. It preserves component, DOM, Store, and Action
Provider state across a hide/reveal cycle without keeping that UI's effects and
external subscriptions active.

`@context-action/react` 3.0 requires React 19.2 or later. Activity is imported
from React; Context-Action does not wrap or re-export it.

```tsx
import { Activity } from 'react';
```

## Use it for resumable UI

Activity is a good fit when a user is likely to return soon and losing local
state would be disruptive: tabs, sidebars, search/filter panels, a draft form,
or a detail pane. Use ordinary conditional rendering when leaving the UI should
discard its state.

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
      Message
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
        Toggle composer
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

The draft value and textarea DOM state are restored when the composer becomes
visible again. Context-Action keeps the Store manager alive through the same
cycle, so a Provider may be inside an Activity boundary.

## Provider and `withProvider()` placement

Both direct Providers and `withProvider()` wrappers preserve their Store
manager while an Activity is hidden. Choose the composition that is clearest
for the screen; neither needs a separate Activity-specific API.

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

The same rule applies to `createTimeTravelStoreContext`: current state and
undo/redo history survive hide/reveal. A true unmount still disposes the
manager unless `withProvider({ autoCleanup: false })` was deliberately chosen.

## What changes while hidden

React hides the boundary using `display: none`, retains its DOM and state, and
cleans up layout/passive effects. External-store subscriptions, including
`useStoreValue()`, disconnect while hidden and reconnect with the current
snapshot on reveal. Updates made by visible UI or application services still
change the Store; the hidden UI simply does not perform active subscription
work.

Do not rely on an effect inside a hidden boundary to keep polling, maintain a
socket, or fetch data. Put work that must continue outside the boundary or make
its lifecycle explicit.

```tsx
useEffect(() => {
  const controller = new AbortController();
  void loadDraft({ signal: controller.signal });
  return () => controller.abort();
}, [draftId]);
```

This cleanup runs both when the pane is hidden and when it is truly unmounted.

Some DOM elements have their own side effects even while `display: none`, most
notably `video`, `audio`, and `iframe`. Stop them in cleanup; for visual media,
use a layout-effect cleanup so hiding is handled promptly.

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

## Pre-rendering and SSR

An initially hidden Activity can prepare likely-next UI at low priority. This
helps only for Suspense-compatible work such as `lazy`, `use` with cached data,
or framework-managed Suspense data fetching. Effect-based fetching does not run
while hidden.

During SSR, content inside an initially hidden Activity is not included in the
server response. Do not place SEO-critical or immediately required content in
an initially hidden boundary. Use Activity around independently resumable
client UI instead.

## Test the lifecycle

Test a visible → hidden → visible sequence in `StrictMode` for each boundary
that owns side effects. Verify the intended state is retained, effects clean up
correctly, and returning to the pane reads the latest Store value. The Context-
Action test suite covers direct Store Providers, Time Travel history, and both
`withProvider()` variants.

The example app's **Unified Provider** page (`/react/provider`) includes a
runnable Activity panel. Type into its component-local and Store-backed inputs,
then hide and reveal the panel to observe both values being restored.
