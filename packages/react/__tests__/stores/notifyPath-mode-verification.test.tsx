/**
 * Direct verification test for notificationMode behavior
 *
 * IMPORTANT: This test deliberately runs outside of React Testing Library's act()
 * wrapper to observe the real timing differences between notification modes.
 *
 * The act() wrapper automatically batches all state updates, which masks the
 * actual behavior difference between 'immediate' and 'batched' modes.
 *
 * By testing direct store subscriptions without act(), we can verify:
 * - Immediate mode: Synchronous listener triggering
 * - Batched mode: RAF-deferred batched notifications
 *
 * This proves the notificationMode implementation works correctly even though
 * React component tests (wrapped in act()) may not show the difference.
 */

import { createTimeTravelStore } from '../../src/stores/core/TimeTravelStore';

describe('NotificationMode Direct Verification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('verifies immediate mode triggers listeners synchronously', () => {
    // Create store with immediate notification mode
    const store = createTimeTravelStore('test', { count: 0 }, {
      mutable: true,
      notificationMode: 'immediate'
    });

    let notificationCount = 0;
    store.subscribe(() => {
      notificationCount++;
    });

    // Direct notifyPath calls without act() wrapper
    // In immediate mode, each notifyPath should trigger listeners synchronously
    const current = store.getValue();
    current.count = 1;
    store.notifyPath(['count']);

    // Immediate mode should have triggered listener synchronously (no RAF delay)
    expect(notificationCount).toBe(1);

    current.count = 2;
    store.notifyPath(['count']);

    // Second call should trigger immediately as well
    expect(notificationCount).toBe(2);

    console.log('✅ Immediate mode: Listeners triggered synchronously');
  });

  it('verifies batched mode defers listeners to RAF', () => {
    // Create store with batched notification mode (RAF-based)
    const store = createTimeTravelStore('test', { count: 0 }, {
      mutable: true,
      notificationMode: 'batched'
    });

    let notificationCount = 0;
    store.subscribe(() => {
      notificationCount++;
    });

    // Direct notifyPath calls without act() wrapper
    // In batched mode, notifications are deferred to requestAnimationFrame
    const current = store.getValue();
    current.count = 1;
    store.notifyPath(['count']);

    // Batched mode should NOT have triggered yet (waiting for RAF)
    expect(notificationCount).toBe(0);

    current.count = 2;
    store.notifyPath(['count']);

    // Still 0 - multiple calls are batched together
    expect(notificationCount).toBe(0);

    // Now advance RAF timer to trigger the batched notification
    jest.advanceTimersByTime(20);

    // Should trigger ONCE for all batched notifications
    // This is the key benefit: multiple notifyPath calls = one render
    expect(notificationCount).toBe(1);

    console.log('✅ Batched mode: Listeners deferred to RAF and batched');
  });

  it('demonstrates clear difference between modes', () => {
    /**
     * This test shows the performance impact difference:
     * - Immediate mode: 5 notifyPath calls = 5 listener notifications
     * - Batched mode: 5 notifyPath calls = 1 listener notification
     *
     * Use cases:
     * - Immediate: Testing, critical updates, predictable timing
     * - Batched: High-frequency updates, animations, performance optimization
     */

    // Test immediate mode with 5 rapid updates
    const immediateStore = createTimeTravelStore('immediate', { value: 0 }, {
      notificationMode: 'immediate'
    });

    let immediateNotifications = 0;
    immediateStore.subscribe(() => immediateNotifications++);

    // 5 rapid notifyPath calls - each should trigger immediately
    for (let i = 0; i < 5; i++) {
      immediateStore.getValue().value = i;
      immediateStore.notifyPath(['value']);
    }

    const immediateResult = immediateNotifications;

    // Test batched mode with same 5 rapid updates
    const batchedStore = createTimeTravelStore('batched', { value: 0 }, {
      notificationMode: 'batched'
    });

    let batchedNotifications = 0;
    batchedStore.subscribe(() => batchedNotifications++);

    // 5 rapid notifyPath calls - should be batched
    for (let i = 0; i < 5; i++) {
      batchedStore.getValue().value = i;
      batchedStore.notifyPath(['value']);
    }

    const batchedBeforeRAF = batchedNotifications;
    jest.advanceTimersByTime(20); // Trigger RAF
    const batchedAfterRAF = batchedNotifications;

    console.log(`
📊 Mode Comparison Results:
- Immediate mode: ${immediateResult} notifications (5 notifyPath calls = 5 notifications)
- Batched mode before RAF: ${batchedBeforeRAF} notifications
- Batched mode after RAF: ${batchedAfterRAF} notifications (5 notifyPath calls = 1 batched notification)
- Difference: ${immediateResult - batchedAfterRAF}x more notifications in immediate mode
    `);

    // Verify the expected behavior
    expect(immediateResult).toBe(5); // Each call triggers immediately
    expect(batchedBeforeRAF).toBe(0); // Not triggered yet (waiting for RAF)
    expect(batchedAfterRAF).toBe(1); // All 5 calls batched into one notification
  });
});
