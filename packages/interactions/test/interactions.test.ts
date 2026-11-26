import { describe, expect, it, vi } from 'vitest';
import {
  createDismissLayer,
  createPointerGestureSession,
  createRovingFocusController,
  type DismissReason,
} from '../src/index.js';

describe('@context-action/interactions', () => {
  it('navigates items with createRovingFocusController while skipping disabled items', () => {
    let activeId = 'tab-1';
    const roving = createRovingFocusController({
      orientation: 'horizontal',
      loop: true,
      getItems: () => [
        { id: 'tab-1' },
        { id: 'tab-2', disabled: true },
        { id: 'tab-3' },
      ],
      getActiveId: () => activeId,
      onFocusChange: nextId => {
        activeId = nextId;
      },
    });

    expect([roving.getTabIndex('tab-1'), roving.getTabIndex('tab-2'), roving.getTabIndex('tab-3')]).toEqual([0, -1, -1]);
    const next = roving.handleKeyDown('tab-1', { key: 'ArrowRight' });
    expect(next).toBe('tab-3');
    expect(activeId).toBe('tab-3');

    const wrapped = roving.handleKeyDown('tab-3', { key: 'ArrowRight' });
    expect(wrapped).toBe('tab-1');
    expect(roving.handleKeyDown('tab-1', { key: 'End' })).toBe('tab-3');
    expect(roving.handleKeyDown('tab-3', { key: 'Home' })).toBe('tab-1');

    const noLoop = createRovingFocusController({
      orientation: 'vertical',
      loop: false,
      getItems: () => [{ id: 'a' }, { id: 'b' }],
      getActiveId: () => 'b',
    });
    expect(noLoop.handleKeyDown('b', { key: 'ArrowDown' })).toBe('b');
    expect(noLoop.handleKeyDown('b', { key: 'ArrowRight' })).toBeNull();
  });

  it('tracks capture, modifiers, commit, guard rejection, and Escape cancel in createPointerGestureSession', () => {
    const events: string[] = [];
    const target = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };

    let rejectStart = true;
    const session = createPointerGestureSession({
      onStart: snap => {
        events.push(`start:${snap.startX},${snap.startY}`);
        return !rejectStart;
      },
      onMove: snap => events.push(`move:${snap.deltaX},${snap.deltaY}:shift=${snap.modifiers.shiftKey}`),
      onCommit: snap => events.push(`commit:${snap.deltaX},${snap.deltaY}`),
      onCancel: (_snap, reason) => events.push(`cancel:${reason}`),
    });

    expect(session.start({ pointerId: 1, button: 0, clientX: 10, clientY: 20, currentTarget: target })).toBe(false);
    expect(session.isActive()).toBe(false);

    rejectStart = false;
    expect(session.start({ pointerId: 2, button: 0, clientX: 10, clientY: 20, currentTarget: target })).toBe(true);
    expect(target.setPointerCapture).toHaveBeenCalledWith(2);
    expect(session.move({ pointerId: 2, clientX: 35, clientY: 5, shiftKey: true })).toBe(true);
    expect(session.commit({ pointerId: 2, clientX: 40, clientY: 10 })).toBe(true);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(2);
    expect(session.isActive()).toBe(false);
    expect(events).toEqual([
      'start:10,20',
      'start:10,20',
      'move:25,-15:shift=true',
      'commit:30,-10',
    ]);

    events.length = 0;
    expect(session.start({ pointerId: 3, clientX: 0, clientY: 0, currentTarget: target })).toBe(true);
    expect(session.handleKeyDown({ key: 'Escape' })).toBe(true);
    expect(session.isActive()).toBe(false);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(3);
    expect(events).toEqual(['start:0,0', 'cancel:escape']);
  });

  it('supports virtual aria-activedescendant, null-start navigation, and label typeahead in createRovingFocusController', () => {
    let activeId: string | null = null;
    const roving = createRovingFocusController({
      orientation: 'vertical',
      loop: true,
      typeahead: true,
      typeaheadTimeoutMs: 500,
      getItems: () => [
        { id: 'new', label: 'New File' },
        { id: 'save', label: 'Save' },
        { id: 'share', label: 'Share' },
        { id: 'locked', label: 'Secret', disabled: true },
        { id: 'del', label: 'Delete' },
      ],
      getActiveId: () => activeId,
      onFocusChange: nextId => {
        activeId = nextId;
      },
    });

    expect(roving.getActiveDescendant('opt-')).toBeUndefined();
    expect(roving.handleKeyDown(null, { key: 'ArrowDown' })).toBe('new');
    expect(roving.getActiveDescendant('opt-')).toBe('opt-new');

    activeId = null;
    expect(roving.handleKeyDown(null, { key: 'ArrowUp' })).toBe('del');
    expect(roving.getActiveDescendant('opt-')).toBe('opt-del');

    // Fresh 's' jumps to 'save', repeated 's' cycles to 'share' (skipping disabled 'Secret')
    expect(roving.handleKeyDown(activeId, { key: 's' })).toBe('save');
    expect(roving.handleKeyDown(activeId, { key: 's' })).toBe('share');

    // Reset typeahead, then type multi-character prefix 'de' -> 'del'
    roving.resetTypeahead();
    expect(roving.handleKeyDown(activeId, { key: 'd' })).toBe('del');
    expect(roving.handleKeyDown(activeId, { key: 'e' })).toBe('del');

    // Control key combos and unmatched chars do not hijack navigation
    expect(roving.handleKeyDown(activeId, { key: 's', ctrlKey: true })).toBeNull();
    expect(roving.handleKeyDown(activeId, { key: 'z' })).toBeNull();
    expect(roving.move('first')).toBe('new');
  });

  it('coordinates LIFO escape and outside-pointer dismissal across stacked createDismissLayer instances', () => {
    const outerEl = document.createElement('div');
    const innerInput = document.createElement('input');
    const innerPopup = document.createElement('ul');
    const outsideEl = document.createElement('button');
    outerEl.append(innerInput, innerPopup);
    document.body.append(outerEl, outsideEl);

    const outerDismiss = vi.fn<(reason: DismissReason) => void>();
    const innerDismiss = vi.fn<(reason: DismissReason) => void>();

    const outer = createDismissLayer({
      enabled: true,
      getContainers: () => [outerEl],
      onDismiss: reason => outerDismiss(reason),
    });
    const inner = createDismissLayer({
      enabled: true,
      getContainers: () => [innerInput, innerPopup],
      onDismiss: reason => innerDismiss(reason),
    });

    expect(outer.active).toBe(true);
    expect(outer.isTopMost).toBe(false);
    expect(inner.active).toBe(true);
    expect(inner.isTopMost).toBe(true);

    // Click inside inner input -> neither layer dismisses
    innerInput.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(innerDismiss).not.toHaveBeenCalled();
    expect(outerDismiss).not.toHaveBeenCalled();

    // Click inside outer container (outside inner) -> only top-most inner dismisses
    outerEl.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(innerDismiss).toHaveBeenCalledTimes(1);
    expect(innerDismiss).toHaveBeenLastCalledWith('outside-pointer');
    expect(outerDismiss).not.toHaveBeenCalled();

    // Escape while both active -> only top-most inner dismisses
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(innerDismiss).toHaveBeenCalledTimes(2);
    expect(innerDismiss).toHaveBeenLastCalledWith('escape');
    expect(outerDismiss).not.toHaveBeenCalled();

    // Deactivate inner -> outer becomes top-most and receives next outside click + Escape
    inner.deactivate();
    expect(outer.isTopMost).toBe(true);

    outsideEl.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(outerDismiss).toHaveBeenCalledTimes(1);
    expect(outerDismiss).toHaveBeenLastCalledWith('outside-pointer');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(outerDismiss).toHaveBeenCalledTimes(2);
    expect(outerDismiss).toHaveBeenLastCalledWith('escape');

    inner.dispose();
    outer.dispose();
    outerEl.remove();
    outsideEl.remove();
    expect(outer.active).toBe(false);
    expect(outer.isTopMost).toBe(false);
  });
});
