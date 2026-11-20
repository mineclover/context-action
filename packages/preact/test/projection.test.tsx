// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from 'preact';
import { signal, type ReadonlySignal } from '@preact/signals';
import { useProjection } from '../src/index.js';

describe('useProjection', () => {
  it('re-binds computed projection when sourceSignal identity changes', () => {
    const first = signal({ count: 1 });
    const second = signal({ count: 20 });
    let projected!: ReadonlySignal<number>;

    function Probe({ source }: { source: ReadonlySignal<{ count: number }> }) {
      projected = useProjection(source, (value) => value.count * 2);
      return <span>{projected.value}</span>;
    }

    const host = document.createElement('div');
    render(<Probe source={first} />, host);
    expect(projected.value).toBe(2);

    render(<Probe source={second} />, host);
    expect(projected.value).toBe(40);

    second.value = { count: 30 };
    expect(projected.value).toBe(60);

    render(null, host);
  });
});
