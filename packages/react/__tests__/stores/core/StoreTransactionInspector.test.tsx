import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { createTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';
import { StoreTransactionCoordinator } from '../../../src/stores/core/StoreTransactionCoordinator';
import { useStoreTransactionInspector } from '../../../src/stores/hooks/useStoreTransactionInspector';

describe('useStoreTransactionInspector', () => {
  it('tracks serializable transaction metadata without Store references', async () => {
    const store = createTimeTravelStore('inspector', { value: 0 });
    const coordinator = new StoreTransactionCoordinator();

    function Inspector() {
      const snapshot = useStoreTransactionInspector(coordinator);
      return <output data-testid="inspector">{`${snapshot.position}/${snapshot.historyLength}/${snapshot.latest?.meta.label ?? ''}`}</output>;
    }

    render(<Inspector />);
    expect(screen.getByTestId('inspector')).toHaveTextContent('0/0/');

    await act(async () => {
      await coordinator.run([{ name: 'inspector', store }], () => {
        store.update(draft => { draft.value = 1; });
      }, { label: 'Inspector update' });
    });

    expect(screen.getByTestId('inspector')).toHaveTextContent('1/1/Inspector update');
    expect(JSON.parse(coordinator.serializeHistory())[0].participants[0].store).toBeUndefined();
    store.dispose();
  });

  it('keeps a stable store subscription across component re-renders', () => {
    const coordinator = new StoreTransactionCoordinator();
    const subscribeSpy = jest.spyOn(coordinator, 'subscribe');

    function Inspector({ tick }: { tick: number }) {
      const snapshot = useStoreTransactionInspector(coordinator);
      return <output data-testid="stable-inspector">{`${tick}:${snapshot.version}`}</output>;
    }

    const { rerender } = render(<Inspector tick={1} />);
    rerender(<Inspector tick={2} />);
    rerender(<Inspector tick={3} />);

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    subscribeSpy.mockRestore();
  });
});
