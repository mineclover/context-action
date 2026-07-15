import type { ToolCallContext } from '../../src/tool-protocol';

describe('tool protocol context', () => {
  it('accepts numeric browser workspace revisions', () => {
    const context: ToolCallContext = {
      source: 'iframe',
      revision: 12,
    };

    expect(context.revision).toBe(12);
  });
});
