import { describe, expect, it, vi } from 'vitest';
import { createLayerPanelController } from '../examples/layer-panel/internal/controller.js';

describe('Layer Panel controller notification isolation', () => {
  it('notifies remaining subscribers when one renderer fails', () => {
    const controller = createLayerPanelController();
    const failed = vi.fn(() => { throw new Error('renderer failed'); });
    const sibling = vi.fn();
    controller.subscribe(failed);
    controller.subscribe(sibling);

    expect(() => controller.setItems([{ id: 'one', name: 'One' }])).toThrow('renderer failed');
    expect(sibling).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().items[0]?.id).toBe('one');
  });
});
