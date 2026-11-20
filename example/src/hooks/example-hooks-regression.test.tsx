import { useStoreValue } from '@context-action/react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { sanitizeLogPayload } from '@/components/LogMonitor/hooks';
import {
  SourceLinkRegistryProvider,
  useSourceLinkRegistry,
} from '@/stores/SourceLinkRegistry';
import { useRegisterSourceFile } from './useRegisterSourceFile';
import { sanitizeInternalRedirectPath } from './useVitePressRedirect';

function SourceRegistrationProbe({
  filePath,
  name,
  category,
}: {
  filePath: string;
  name: string;
  category?: string;
}) {
  useRegisterSourceFile(filePath, {
    name,
    category,
    description: 'Regression test entry',
    tags: ['test', 'source-link'],
    priority: 10,
  });

  return null;
}

function SourceRegistryObserver({ filePath }: { filePath: string }) {
  const entries = useStoreValue(useSourceLinkRegistry('entries'));
  const entry = entries[filePath];

  return (
    <div data-testid="entry-state">
      {entry
        ? `${entry.name}|${entry.category}|${entry.instances.length}`
        : 'missing'}
    </div>
  );
}

describe('example hooks regression checks', () => {
  afterEach(() => {
    cleanup();
  });

  it('registers SourceLink entries by filePath, updates metadata without instance churn, and cleans up on unmount', async () => {
    const filePath = 'demo/VirtualDemo.tsx';
    const { rerender } = render(
      <SourceLinkRegistryProvider>
        <SourceRegistrationProbe
          filePath={filePath}
          name="VirtualDemo (0)"
          category="custom"
        />
        <SourceRegistryObserver filePath={filePath} />
      </SourceLinkRegistryProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('entry-state').textContent).toBe(
        'VirtualDemo (0)|custom|1'
      );
    });

    rerender(
      <SourceLinkRegistryProvider>
        <SourceRegistrationProbe
          filePath={filePath}
          name="VirtualDemo (1)"
          category="custom"
        />
        <SourceRegistryObserver filePath={filePath} />
      </SourceLinkRegistryProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('entry-state').textContent).toBe(
        'VirtualDemo (1)|custom|1'
      );
    });

    rerender(
      <SourceLinkRegistryProvider>
        <SourceRegistryObserver filePath={filePath} />
      </SourceLinkRegistryProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('entry-state').textContent).toBe('missing');
    });
  });

  it('accepts safe internal redirect paths and rejects external/malformed redirects', () => {
    expect(sanitizeInternalRedirectPath('/foundations/core/basics')).toBe(
      '/foundations/core/basics'
    );
    expect(
      sanitizeInternalRedirectPath('  /patterns/refs?tab=1#section  ')
    ).toBe('/patterns/refs?tab=1#section');

    expect(sanitizeInternalRedirectPath(null)).toBeNull();
    expect(sanitizeInternalRedirectPath('')).toBeNull();
    expect(sanitizeInternalRedirectPath('   ')).toBeNull();
    expect(sanitizeInternalRedirectPath('https://evil.com/phish')).toBeNull();
    expect(sanitizeInternalRedirectPath('//evil.com/phish')).toBeNull();
    expect(sanitizeInternalRedirectPath('/\\evil.com')).toBeNull();
    expect(sanitizeInternalRedirectPath('javascript:alert(1)')).toBeNull();
    expect(
      sanitizeInternalRedirectPath(`/${String.fromCharCode(0)}bad`)
    ).toBeNull();
  });

  it('sanitizes circular references, functions, and Promises safely', () => {
    const cyclic: Record<string, unknown> = {
      name: 'root',
      nested: { count: 1 },
      fn: () => 'ignored',
      pending: Promise.resolve('ok'),
    };
    cyclic.self = cyclic;

    const cyclicList: unknown[] = ['item'];
    cyclicList.push(cyclicList);
    cyclic.list = cyclicList;

    const result = sanitizeLogPayload(cyclic) as Record<string, unknown>;
    expect(result.name).toBe('root');
    expect(result.nested).toEqual({ count: 1 });
    expect(result.self).toBe('[Circular Reference]');
    expect(result.fn).toBe('[Function - Removed for Cloning Safety]');
    expect(result.pending).toBe(
      '[Promise Object - Removed for Cloning Safety]'
    );
    expect(result.list).toEqual(['item', '[Circular Reference]']);
  });
});
