import { act, render } from '@testing-library/react';
import React, { useState } from 'react';
import {
  createRefCollectionContext,
  useRefCollection,
} from '@context-action/react/refs';

describe('RefCollection & createRefCollectionContext contract', () => {
  it('maintains stable per-key ref callbacks, causes 0 re-renders on mount/unmount, and cleans up on unmount', () => {
    let collectionRef: ReturnType<typeof useRefCollection<HTMLButtonElement>> | undefined;
    let renderCount = 0;
    const refIdentityA: Array<(node: HTMLButtonElement | null) => void> = [];

    function ItemList() {
      renderCount += 1;
      const collection = useRefCollection<HTMLButtonElement>();
      collectionRef = collection;
      const [keys, setKeys] = useState(['a', 'b', 'c']);
      const [tick, setTick] = useState(0);

      refIdentityA.push(collection.setRef('a'));

      return (
        <div>
          <span data-testid="tick">{tick}</span>
          {keys.map(k => (
            <button key={k} type="button" ref={collection.setRef(k)} data-testid={`item-${k}`}>
              {k}
            </button>
          ))}
          <button
            type="button"
            data-testid="rerender"
            onClick={() => setTick(t => t + 1)}
          />
          <button
            type="button"
            data-testid="remove-b"
            onClick={() => setKeys(['a', 'c'])}
          />
        </div>
      );
    }

    const view = render(<ItemList />);
    expect(renderCount).toBe(1);
    expect(collectionRef?.size()).toBe(3);
    expect(collectionRef?.has('b')).toBe(true);
    expect(collectionRef?.keys()).toEqual(['a', 'b', 'c']);

    const executed = collectionRef?.executeIfMounted('b', el => {
      el.dataset.focused = 'yes';
      return el.textContent;
    });
    expect(executed).toBe('b');
    expect(view.getByTestId('item-b').dataset.focused).toBe('yes');
    expect(renderCount).toBe(1);

    // Re-render returns the exact same callback reference per key
    act(() => {
      view.getByTestId('rerender').click();
    });
    expect(renderCount).toBe(2);
    expect(refIdentityA[1]).toBe(refIdentityA[0]);

    // Removing item 'b' detaches 'b' cleanly without leaking stale nodes
    act(() => {
      view.getByTestId('remove-b').click();
    });
    expect(collectionRef?.has('b')).toBe(false);
    expect(collectionRef?.get('b')).toBeNull();
    expect(collectionRef?.executeIfMounted('b', () => 'found')).toBeNull();
    expect(collectionRef?.keys()).toEqual(['a', 'c']);

    // Unmount clears collection cleanly
    view.unmount();
    expect(collectionRef?.size()).toBe(0);
  });

  it('isolates multiple createRefCollectionContext providers and exposes useItemRef handles', () => {
    const GroupA = createRefCollectionContext<HTMLDivElement>('CollectionGroupA');
    const GroupB = createRefCollectionContext<HTMLDivElement>('CollectionGroupB');
    let colA: ReturnType<typeof GroupA.useRefCollection> | undefined;
    let colB: ReturnType<typeof GroupB.useRefCollection> | undefined;

    function ItemCell({
      id,
      useItem,
    }: {
      id: string;
      useItem: typeof GroupA.useItemRef;
    }) {
      const handle = useItem(id);
      return <div ref={handle.ref} data-testid={`cell-${id}`} />;
    }

    function ReaderA() {
      colA = GroupA.useRefCollection();
      return <ItemCell id="row-1" useItem={GroupA.useItemRef} />;
    }

    function ReaderB() {
      colB = GroupB.useRefCollection();
      return <ItemCell id="row-1" useItem={GroupB.useItemRef} />;
    }

    const view = render(
      <>
        <GroupA.Provider>
          <ReaderA />
        </GroupA.Provider>
        <GroupB.Provider>
          <ReaderB />
        </GroupB.Provider>
      </>,
    );

    const nodes = view.getAllByTestId('cell-row-1');
    expect(colA?.get('row-1')).toBe(nodes[0]);
    expect(colB?.get('row-1')).toBe(nodes[1]);
    expect(colA?.get('row-1')).not.toBe(colB?.get('row-1'));

    view.unmount();
    expect(colA?.size()).toBe(0);
    expect(colB?.size()).toBe(0);
  });

  it('throws contextual errors when used outside Provider and rejects empty context names', () => {
    expect(() => createRefCollectionContext('   ')).toThrow(TypeError);
    const Ctx = createRefCollectionContext('OrphanCollection');
    function Orphan() {
      Ctx.useRefCollection();
      return null;
    }
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/OrphanCollection\.Provider/);
    errSpy.mockRestore();
  });
});
