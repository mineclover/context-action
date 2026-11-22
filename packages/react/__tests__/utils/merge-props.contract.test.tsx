import { render } from '@testing-library/react';
import React from 'react';
import { mergeProps, mergeRefs } from '@context-action/react/utils';

describe('mergeProps & mergeRefs utility contract', () => {
  it('chains event handlers, concatenates className, shallow-merges style, and merges refs', () => {
    const order: string[] = [];
    const refA = React.createRef<HTMLButtonElement>();
    let nodeB: HTMLButtonElement | null = null;
    const refB = (el: HTMLButtonElement | null) => {
      nodeB = el;
    };

    const baseProps = {
      type: 'button' as const,
      className: 'aria-btn primary',
      style: { color: 'black', padding: 8 },
      disabled: false,
      ref: refA,
      onClick: () => order.push('base'),
      'aria-pressed': 'true' as const,
    };

    const consumerProps = {
      className: 'custom-cls',
      style: { padding: 16, fontWeight: 'bold' },
      disabled: true,
      ref: refB,
      onClick: () => order.push('consumer'),
      'data-extra': 'ok',
    };

    const merged = mergeProps(baseProps, consumerProps, undefined, null);
    const view = render(<button {...merged}>Tap</button>);
    const btn = view.getByRole('button') as HTMLButtonElement;

    expect(btn.className).toBe('aria-btn primary custom-cls');
    expect(btn.style.color).toBe('black');
    expect(btn.style.padding).toBe('16px');
    expect(btn.style.fontWeight).toBe('bold');
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('data-extra')).toBe('ok');
    expect(refA.current).toBe(btn);
    expect(nodeB).toBe(btn);

    // Chained event handlers invoke in declaration order even when invoked directly
    (merged.onClick as () => void)();
    expect(order).toEqual(['base', 'consumer']);

    view.unmount();
    expect(refA.current).toBeNull();
    expect(nodeB).toBeNull();
  });

  it('forwards cleanup callbacks returned by callback refs in mergeRefs', () => {
    const cleanupA = jest.fn();
    const cleanupB = jest.fn();
    const objRef = React.createRef<HTMLDivElement>();

    const merged = mergeRefs<HTMLDivElement>(
      _node => cleanupA,
      objRef,
      _node => cleanupB,
      null,
      undefined,
    );

    const fakeNode = document.createElement('div');
    const returnedCleanup = merged(fakeNode);

    expect(objRef.current).toBe(fakeNode);
    expect(typeof returnedCleanup).toBe('function');

    (returnedCleanup as () => void)();
    expect(cleanupA).toHaveBeenCalledTimes(1);
    expect(cleanupB).toHaveBeenCalledTimes(1);
  });
});
