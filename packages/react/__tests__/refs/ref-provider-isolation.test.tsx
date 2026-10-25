import React from 'react';
import { act, render } from '@testing-library/react';
import { createRefContext } from '@context-action/react';

describe('Ref Provider instance isolation', () => {
  it('keeps the callback ref stable when its reactive mount state changes', () => {
    const Refs = createRefContext<{ element: HTMLDivElement }>('StableCallbackRefs');
    const callbacks: Array<ReturnType<typeof Refs.useRefHandler<'element'>>['setRef']> = [];
    function Consumer() {
      const handle = Refs.useRefHandler('element');
      callbacks.push(handle.setRef);
      return <div ref={handle.setRef} data-testid="stable-ref">{String(handle.isMounted)}</div>;
    }
    const view = render(<Refs.Provider><Consumer /></Refs.Provider>);
    try {
      expect(view.getByTestId('stable-ref')).toHaveTextContent('true');
      expect(callbacks.length).toBeGreaterThan(1);
      expect(new Set(callbacks).size).toBe(1);
    } finally {
      view.unmount();
    }
  });

  it.each([false, true])('keeps same-name sibling refs separate (StrictMode: %s)', strict => {
    const Refs = createRefContext<{ element: HTMLDivElement }>('SameNameRefs');
    const handles = new Map<string, ReturnType<typeof Refs.useRefHandler<'element'>>>();
    const readers = new Map<string, ReturnType<typeof Refs.useGetAllRefs>>();
    function Consumer({ id }: { id: string }) {
      const handle = Refs.useRefHandler('element');
      handles.set(id, handle);
      readers.set(id, Refs.useGetAllRefs());
      return <div ref={handle.setRef} data-testid={id} />;
    }
    const tree = (showFirst: boolean) => {
      const children = (
        <>
          {showFirst && <Refs.Provider key="first"><Consumer id="first" /></Refs.Provider>}
          <Refs.Provider key="second"><Consumer id="second" /></Refs.Provider>
        </>
      );
      return strict ? <React.StrictMode>{children}</React.StrictMode> : children;
    };
    const view = render(tree(true));
    try {
      const first = view.getByTestId('first');
      const second = view.getByTestId('second');
      expect(handles.get('first')?.target).toBe(first);
      expect(handles.get('second')?.target).toBe(second);
      expect(readers.get('first')?.()).toEqual({ element: first });
      expect(readers.get('second')?.()).toEqual({ element: second });
      expect(handles.get('first')?.isMounted).toBe(true);
      expect(handles.get('second')?.isMounted).toBe(true);

      view.rerender(tree(false));
      expect(handles.get('first')?.target).toBeNull();
      expect(handles.get('second')?.target).toBe(second);
      expect(readers.get('second')?.()).toEqual({ element: second });
    } finally {
      view.unmount();
    }
  });

  it('uses the nearest nested Provider without replacing the outer ref state', () => {
    const Refs = createRefContext<{ element: HTMLDivElement }>('NestedRefs');
    const handles = new Map<string, ReturnType<typeof Refs.useRefHandler<'element'>>>();
    function Consumer({ id, attach = true }: { id: string; attach?: boolean }) {
      const handle = Refs.useRefHandler('element');
      handles.set(id, handle);
      return attach ? <div ref={handle.setRef} data-testid={id} /> : null;
    }
    const tree = (showInner: boolean) => (
      <Refs.Provider>
        <Consumer id="outer" />
        {showInner && <Refs.Provider><Consumer id="inner" /></Refs.Provider>}
        <Consumer id="outer-reader" attach={false} />
      </Refs.Provider>
    );
    const view = render(tree(true));
    try {
      const outer = view.getByTestId('outer');
      expect(handles.get('outer')?.target).toBe(outer);
      expect(handles.get('outer-reader')?.target).toBe(outer);
      expect(handles.get('inner')?.target).toBe(view.getByTestId('inner'));
      view.rerender(tree(false));
      expect(handles.get('inner')?.target).toBeNull();
      expect(handles.get('outer-reader')?.target).toBe(outer);
      expect(handles.get('outer-reader')?.isMounted).toBe(true);
    } finally {
      view.unmount();
    }
  });

  it('rejects mount waits only for the Provider that unmounts', async () => {
    const Refs = createRefContext<{ element: HTMLDivElement }>('PendingSiblingRefs');
    const handles = new Map<string, ReturnType<typeof Refs.useRefHandler<'element'>>>();
    function Consumer({ id }: { id: string }) {
      handles.set(id, Refs.useRefHandler('element'));
      return null;
    }
    const tree = (showFirst: boolean) => (
      <>
        {showFirst && <Refs.Provider key="first"><Consumer id="first" /></Refs.Provider>}
        <Refs.Provider key="second"><Consumer id="second" /></Refs.Provider>
      </>
    );
    const view = render(tree(true));
    const firstWait = handles.get('first')!.waitForMount();
    const secondSettled = jest.fn();
    const secondWait = handles.get('second')!.waitForMount();
    void secondWait.then(secondSettled, secondSettled);
    const firstRejected = expect(firstWait).rejects.toThrow('Context provider unmounted');
    try {
      view.rerender(tree(false));
      await firstRejected;
      expect(secondSettled).not.toHaveBeenCalled();
      const target = document.createElement('div');
      await act(async () => {
        handles.get('second')!.setRef(target);
        await expect(secondWait).resolves.toBe(target);
      });
      expect(handles.get('second')?.target).toBe(target);
    } finally {
      view.unmount();
    }
  });

  it('keeps mount waiters attached to the same ref state through StrictMode replay', async () => {
    jest.useFakeTimers();
    const Refs = createRefContext<{ element: HTMLDivElement }>('StrictPendingRefs', {
      defaultMountTimeout: 100,
    });
    let handle!: ReturnType<typeof Refs.useRefHandler<'element'>>;
    function Consumer() {
      handle = Refs.useRefHandler('element');
      return null;
    }
    const view = render(<React.StrictMode><Refs.Provider><Consumer /></Refs.Provider></React.StrictMode>);
    const resolved = jest.fn();
    const rejected = jest.fn();
    const wait = handle.waitForMount().then(resolved, rejected);
    try {
      const target = document.createElement('div');
      await act(async () => {
        handle.setRef(target);
        await Promise.resolve();
      });
      expect(resolved).toHaveBeenCalledWith(target);
      expect(rejected).not.toHaveBeenCalled();
    } finally {
      view.unmount();
      await act(async () => { await jest.runOnlyPendingTimersAsync(); });
      await wait;
      jest.useRealTimers();
    }
  });

  it('retains pending refs while Activity hides and reveals the Provider', async () => {
    const Refs = createRefContext<{ element: HTMLDivElement }>('ActivityPendingRefs');
    let handle!: ReturnType<typeof Refs.useRefHandler<'element'>>;
    function Consumer() {
      handle = Refs.useRefHandler('element');
      return null;
    }
    const tree = (mode: 'visible' | 'hidden') => (
      <React.Activity mode={mode}><Refs.Provider><Consumer /></Refs.Provider></React.Activity>
    );
    const view = render(tree('visible'));
    const resolved = jest.fn();
    const rejected = jest.fn();
    const wait = handle.waitForMount().then(resolved, rejected);
    try {
      await act(async () => { view.rerender(tree('hidden')); });
      expect(rejected).not.toHaveBeenCalled();
      expect(resolved).not.toHaveBeenCalled();
      await act(async () => { view.rerender(tree('visible')); });
      const target = document.createElement('div');
      await act(async () => {
        handle.setRef(target);
        await Promise.resolve();
      });
      expect(resolved).toHaveBeenCalledWith(target);
      expect(rejected).not.toHaveBeenCalled();
    } finally {
      view.unmount();
      await wait;
    }
  });
});
