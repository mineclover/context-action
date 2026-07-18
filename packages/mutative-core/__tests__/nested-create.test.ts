import { create } from '../src';

describe('nested create isolation', () => {
  it('does not expose original nested references', () => {
    const original = {
      nodes: [{ name: 'a', metadata: { value: '' } }],
    };

    const result = create(original, (draft) => {
      draft.nodes = draft.nodes.map((node) => {
        const updated = create(node, (inner) => {
          inner.name = 'modified';
        });
        updated.metadata.value = 'outside';
        return updated;
      });
    });

    expect(result.nodes[0]).toEqual({
      name: 'modified',
      metadata: { value: 'outside' },
    });
    expect(original.nodes[0]).toEqual({ name: 'a', metadata: { value: '' } });
  });
});
