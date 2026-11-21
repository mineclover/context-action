import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRefContext } from '@context-action/react';

interface WidgetHandle {
  focus(): void;
  getLabel(): string;
}

describe('useRefController and useOnMountStateChange', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps useRefController callers free of mount-state re-renders while updating sibling useRefMountState', async () => {
    const Refs = createRefContext<{ widget: WidgetHandle }>('ControllerRefs');

    let producerRenders = 0;
    let coordinatorRenders = 0;
    let badgeRenders = 0;
    const capturedControllers: Array<ReturnType<typeof Refs.useRefController<'widget'>>> = [];

    function Producer({ tick }: { tick: number }) {
      producerRenders += 1;
      const controller = Refs.useRefController('widget');
      capturedControllers.push(controller);

      return (
        <div>
          <span data-testid="producer-tick">{tick}</span>
          <button
            type="button"
            data-testid="mount-btn"
            onClick={() =>
              controller.setRef({
                focus: jest.fn(),
                getLabel: () => `label-${tick}`,
              })
            }
          >
            Mount
          </button>
          <button
            type="button"
            data-testid="unmount-btn"
            onClick={() => controller.setRef(null)}
          >
            Unmount
          </button>
        </div>
      );
    }

    function Coordinator() {
      coordinatorRenders += 1;
      const controller = Refs.useRefController('widget');

      return (
        <div>
          <button
            type="button"
            data-testid="exec-btn"
            onClick={() => {
              void controller.withTarget((target) => target.focus());
            }}
          >
            Execute
          </button>
          <span data-testid="live-check">
            {String(controller.checkMountState().isMounted)}
          </span>
        </div>
      );
    }

    function MountBadge() {
      badgeRenders += 1;
      const { isMounted, mountedTarget } = Refs.useRefMountState('widget');
      return (
        <span data-testid="mount-badge">
          {isMounted ? `mounted:${mountedTarget?.getLabel()}` : 'unmounted'}
        </span>
      );
    }

    const view = render(
      <Refs.Provider>
        <Producer tick={1} />
        <Coordinator />
        <MountBadge />
      </Refs.Provider>
    );

    expect(producerRenders).toBe(1);
    expect(coordinatorRenders).toBe(1);
    expect(badgeRenders).toBe(1);
    expect(screen.getByTestId('mount-badge')).toHaveTextContent('unmounted');

    // Mount ref -> ONLY MountBadge re-renders; useRefController consumers stay at 1 render
    act(() => {
      screen.getByTestId('mount-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('mount-badge')).toHaveTextContent('mounted:label-1');
    });
    expect(producerRenders).toBe(1);
    expect(coordinatorRenders).toBe(1);
    expect(badgeRenders).toBe(2);
    expect(capturedControllers[0]?.target?.getLabel()).toBe('label-1');
    expect(capturedControllers[0]?.checkMountState().isMounted).toBe(true);
    expect(
      capturedControllers[0]?.executeIfMounted((target) => target.getLabel())
    ).toBe('label-1');

    // Unmount ref -> ONLY MountBadge re-renders
    act(() => {
      screen.getByTestId('unmount-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('mount-badge')).toHaveTextContent('unmounted');
    });
    expect(producerRenders).toBe(1);
    expect(coordinatorRenders).toBe(1);
    expect(badgeRenders).toBe(3);

    // Rerender Producer with new props -> controller handle & all methods remain referentially identical
    view.rerender(
      <Refs.Provider>
        <Producer tick={2} />
        <Coordinator />
        <MountBadge />
      </Refs.Provider>
    );

    expect(capturedControllers).toHaveLength(2);
    expect(capturedControllers[1]).toBe(capturedControllers[0]);
    expect(capturedControllers[1]?.setRef).toBe(capturedControllers[0]?.setRef);
    expect(capturedControllers[1]?.withTarget).toBe(capturedControllers[0]?.withTarget);
    expect(capturedControllers[1]?.waitForMount).toBe(capturedControllers[0]?.waitForMount);
    expect(capturedControllers[1]?.onMount).toBe(capturedControllers[0]?.onMount);
    expect(capturedControllers[1]?.executeIfMounted).toBe(
      capturedControllers[0]?.executeIfMounted
    );
    expect(capturedControllers[1]?.checkMountState).toBe(
      capturedControllers[0]?.checkMountState
    );
  });

  it('throws a clear hook-specific error when useRefController is used outside Provider', () => {
    const Refs = createRefContext<{ widget: WidgetHandle }>('OutsideControllerRefs');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    function Broken() {
      Refs.useRefController('widget');
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      'useRefController must be used within OutsideControllerRefs.Provider'
    );

    spy.mockRestore();
  });

  it('does not re-run inline useOnMountStateChange callbacks on unrelated re-renders, while still reading the latest closure when mount state changes', () => {
    const Refs = createRefContext<{ element: { id: string } }>('OnMountChangeRefs');
    const observedEvents: Array<{ label: string; mounted: boolean; id: string | null }> = [];

    function Watcher({ label }: { label: string }) {
      const controller = Refs.useRefController('element');

      // Inline callback capturing `label` intentionally
      Refs.useOnMountStateChange('element', (mounted, target) => {
        observedEvents.push({
          label,
          mounted,
          id: target ? target.id : null,
        });
      });

      return (
        <button
          type="button"
          data-testid="toggle-mount"
          onClick={() => {
            if (controller.checkMountState().isMounted) {
              controller.setRef(null);
            } else {
              controller.setRef({ id: `el-${label}` });
            }
          }}
        >
          Toggle
        </button>
      );
    }

    const view = render(
      <Refs.Provider>
        <Watcher label="v1" />
      </Refs.Provider>
    );

    expect(observedEvents).toEqual([{ label: 'v1', mounted: false, id: null }]);

    // Re-rendering with a new inline callback and new `label` prop must NOT re-fire when mount state is unchanged.
    view.rerender(
      <Refs.Provider>
        <Watcher label="v2" />
      </Refs.Provider>
    );
    expect(observedEvents).toHaveLength(1);

    // When mount state actually transitions, the latest inline callback (`label: 'v2'`) runs.
    act(() => {
      screen.getByTestId('toggle-mount').click();
    });

    expect(observedEvents).toEqual([
      { label: 'v1', mounted: false, id: null },
      { label: 'v2', mounted: true, id: 'el-v2' },
    ]);

    view.rerender(
      <Refs.Provider>
        <Watcher label="v3" />
      </Refs.Provider>
    );
    expect(observedEvents).toHaveLength(2);

    act(() => {
      screen.getByTestId('toggle-mount').click();
    });
    expect(observedEvents).toEqual([
      { label: 'v1', mounted: false, id: null },
      { label: 'v2', mounted: true, id: 'el-v2' },
      { label: 'v3', mounted: false, id: null },
    ]);
  });
});
