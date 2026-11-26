import { useStoreValue } from '@context-action/react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollActions } from './actions/useScrollActions';
import {
  ScrollActionProvider,
  ScrollRefProvider,
  ScrollStoreProvider,
  useScrollRef,
  useScrollStore,
} from './contexts/ScrollContexts';
import { ScrollHandlerRegistry } from './handlers/ScrollHandlerRegistry';

function ScrollHarness({
  containerElement,
}: {
  containerElement: HTMLDivElement;
}) {
  const containerRef = useScrollRef('container');
  const autoScrolling = useStoreValue(useScrollStore('autoScrolling'));
  const { setAutoScroll, resetScroll } = useScrollActions();

  useEffect(() => {
    containerRef.setRef(containerElement);
    return () => containerRef.setRef(null);
  }, [containerElement, containerRef]);

  return (
    <div>
      <span data-testid="auto-scrolling-state">
        {autoScrolling ? 'on' : 'off'}
      </span>
      <button
        type="button"
        data-testid="start-auto-scroll"
        onClick={() => void setAutoScroll(true, 120)}
      >
        Start
      </button>
      <button
        type="button"
        data-testid="reset-scroll"
        onClick={() => void resetScroll()}
      >
        Reset
      </button>
    </div>
  );
}

function createMockScrollContainer(): HTMLDivElement {
  const div = document.createElement('div');
  Object.defineProperty(div, 'scrollHeight', {
    value: 1000,
    configurable: true,
  });
  Object.defineProperty(div, 'clientHeight', {
    value: 400,
    configurable: true,
  });
  div.scrollTop = 0;
  return div;
}

describe('ScrollHandlerRegistry (ref-managed auto-scroll without store subscription)', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('increments scrollTop on interval and stops automatically at maxScroll', async () => {
    vi.useFakeTimers();
    const container = createMockScrollContainer();

    render(
      <ScrollActionProvider>
        <ScrollStoreProvider>
          <ScrollRefProvider>
            <ScrollHandlerRegistry>
              <ScrollHarness containerElement={container} />
            </ScrollHandlerRegistry>
          </ScrollRefProvider>
        </ScrollStoreProvider>
      </ScrollActionProvider>
    );

    await act(async () => {
      screen.getByTestId('start-auto-scroll').click();
      vi.advanceTimersByTime(16);
    });

    expect(container.scrollTop).toBe(120);
    expect(screen.getByTestId('auto-scrolling-state').textContent).toBe('on');

    await act(async () => {
      vi.advanceTimersByTime(16 * 3);
    });
    expect(container.scrollTop).toBe(480);
    expect(screen.getByTestId('auto-scrolling-state').textContent).toBe('on');

    // Next tick hits maxScroll (600) and dispatches setAutoScroll(false), then RAF flushes the Store update
    await act(async () => {
      vi.advanceTimersByTime(32);
    });
    expect(screen.getByTestId('auto-scrolling-state').textContent).toBe('off');

    await act(async () => {
      vi.advanceTimersByTime(160);
    });
    expect(container.scrollTop).toBe(480);
  });

  it('stops interval cleanly on resetScroll and unmount', async () => {
    vi.useFakeTimers();
    const container = createMockScrollContainer();

    const view = render(
      <ScrollActionProvider>
        <ScrollStoreProvider>
          <ScrollRefProvider>
            <ScrollHandlerRegistry>
              <ScrollHarness containerElement={container} />
            </ScrollHandlerRegistry>
          </ScrollRefProvider>
        </ScrollStoreProvider>
      </ScrollActionProvider>
    );

    await act(async () => {
      screen.getByTestId('start-auto-scroll').click();
      vi.advanceTimersByTime(32);
    });
    expect(container.scrollTop).toBe(240);

    await act(async () => {
      screen.getByTestId('reset-scroll').click();
      vi.advanceTimersByTime(16);
    });
    expect(container.scrollTop).toBe(0);
    expect(screen.getByTestId('auto-scrolling-state').textContent).toBe('off');

    await act(async () => {
      vi.advanceTimersByTime(160);
    });
    expect(container.scrollTop).toBe(0);

    await act(async () => {
      screen.getByTestId('start-auto-scroll').click();
      vi.advanceTimersByTime(16);
    });
    expect(container.scrollTop).toBe(120);

    view.unmount();
    await act(async () => {
      vi.advanceTimersByTime(160);
    });
    expect(container.scrollTop).toBe(120);
  });
});
