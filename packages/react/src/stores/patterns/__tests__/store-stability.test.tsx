import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { createDeclarativeStorePattern } from '../declarative-store-pattern-v2';

interface TestStores {
  counter: number;
  user: { name: string; email: string };
  settings: { theme: 'light' | 'dark' };
}

describe('store reference stability', () => {
  it('should maintain stable reference for store instances across re-renders', () => {
    const { Provider, useStore } = createDeclarativeStorePattern<TestStores>('TestStability', {
      counter: 0,
      user: { name: '', email: '' },
      settings: { theme: 'light' }
    });
    
    const storeReferences: any[] = [];
    let renderCount = 0;
    
    function TestComponent({ triggerRerender: _triggerRerender }: { triggerRerender: number }) {
      renderCount++;
      const counterStore = useStore('counter');
      const userStore = useStore('user');
      const settingsStore = useStore('settings');
      
      storeReferences.push({
        render: renderCount,
        counter: counterStore,
        user: userStore,
        settings: settingsStore
      });
      
      return <div data-testid="test-component" data-render-count={renderCount} />;
    }
    
    const { rerender } = render(
      <Provider>
        <TestComponent triggerRerender={0} />
      </Provider>
    );
    
    // Initial render
    expect(storeReferences).toHaveLength(1);
    
    // Force re-renders
    rerender(
      <Provider>
        <TestComponent triggerRerender={1} />
      </Provider>
    );
    
    rerender(
      <Provider>
        <TestComponent triggerRerender={2} />
      </Provider>
    );
    
    // Check that store references are stable
    expect(storeReferences).toHaveLength(3);
    
    // All counter store references should be the same
    expect(storeReferences[0].counter).toBe(storeReferences[1].counter);
    expect(storeReferences[1].counter).toBe(storeReferences[2].counter);
    
    // All user store references should be the same
    expect(storeReferences[0].user).toBe(storeReferences[1].user);
    expect(storeReferences[1].user).toBe(storeReferences[2].user);
    
    // All settings store references should be the same
    expect(storeReferences[0].settings).toBe(storeReferences[1].settings);
    expect(storeReferences[1].settings).toBe(storeReferences[2].settings);
  });

  it('should maintain stable reference in useEffect dependency array', () => {
    const { Provider, useStore } = createDeclarativeStorePattern<TestStores>('TestUseEffect', {
      counter: 0,
      user: { name: '', email: '' },
      settings: { theme: 'light' }
    });
    
    const effectExecutions: number[] = [];
    let effectCleanupCount = 0;
    
    function TestComponent({ triggerRerender: _triggerRerender }: { triggerRerender: number }) {
      const counterStore = useStore('counter');
      const userStore = useStore('user');
      
      useEffect(() => {
        effectExecutions.push(Date.now());
        
        return () => {
          effectCleanupCount++;
        };
      }, [counterStore, userStore]); // stores in dependency array
      
      return <div data-testid="test" data-trigger={_triggerRerender} />;
    }
    
    const { rerender } = render(
      <Provider>
        <TestComponent triggerRerender={0} />
      </Provider>
    );
    
    // Initial render - effect should execute once
    expect(effectExecutions).toHaveLength(1);
    expect(effectCleanupCount).toBe(0);
    
    // Force re-render
    act(() => {
      rerender(
        <Provider>
          <TestComponent triggerRerender={1} />
        </Provider>
      );
    });
    
    // If stores are stable, effect should not re-execute
    expect(effectExecutions).toHaveLength(1);
    expect(effectCleanupCount).toBe(0);
    
    // One more re-render to be sure
    act(() => {
      rerender(
        <Provider>
          <TestComponent triggerRerender={2} />
        </Provider>
      );
    });
    
    expect(effectExecutions).toHaveLength(1);
    expect(effectCleanupCount).toBe(0);
  });

  it('should cache stores properly and return same instance', () => {
    const { Provider, useStore } = createDeclarativeStorePattern<TestStores>('TestCaching', {
      counter: 0,
      user: { name: '', email: '' },
      settings: { theme: 'light' }
    });
    
    const storeAccesses: any[] = [];
    
    function TestComponent() {
      // Access the same store multiple times
      const counterStore1 = useStore('counter');
      const counterStore2 = useStore('counter');
      const counterStore3 = useStore('counter');
      
      const userStore1 = useStore('user');
      const userStore2 = useStore('user');
      
      storeAccesses.push({
        counter1: counterStore1,
        counter2: counterStore2,
        counter3: counterStore3,
        user1: userStore1,
        user2: userStore2,
        // Check identity
        counterIdentical: counterStore1 === counterStore2 && counterStore2 === counterStore3,
        userIdentical: userStore1 === userStore2
      });
      
      return <div data-testid="caching-test" />;
    }
    
    render(
      <Provider>
        <TestComponent />
      </Provider>
    );
    
    expect(storeAccesses).toHaveLength(1);
    const access = storeAccesses[0];
    
    // All counter store accesses should return the same instance
    expect(access.counterIdentical).toBe(true);
    expect(access.counter1).toBe(access.counter2);
    expect(access.counter2).toBe(access.counter3);
    
    // All user store accesses should return the same instance
    expect(access.userIdentical).toBe(true);
    expect(access.user1).toBe(access.user2);
  });

  it('should detect unstable store references (stress test)', () => {
    const { Provider, useStore } = createDeclarativeStorePattern<TestStores>('TestUnstable', {
      counter: 0,
      user: { name: '', email: '' },
      settings: { theme: 'light' }
    });
    
    const counterStoreRefs = new Set();
    const userStoreRefs = new Set();
    let isStable = true;
    
    function TestComponent({ rerenderTrigger: _rerenderTrigger }: { rerenderTrigger: number }) {
      const counterStore = useStore('counter');
      const userStore = useStore('user');
      
      // Track counter store references
      if (counterStoreRefs.has(counterStore)) {
        // Same reference - good
      } else if (counterStoreRefs.size === 0) {
        // First render - expected
        counterStoreRefs.add(counterStore);
      } else {
        // Different reference on re-render - problem!
        console.error('Counter store reference changed on re-render!');
        isStable = false;
      }
      
      // Track user store references
      if (userStoreRefs.has(userStore)) {
        // Same reference - good
      } else if (userStoreRefs.size === 0) {
        // First render - expected
        userStoreRefs.add(userStore);
      } else {
        // Different reference on re-render - problem!
        console.error('User store reference changed on re-render!');
        isStable = false;
      }
      
      return <div data-testid="stability-test" data-trigger={_rerenderTrigger} />;
    }
    
    const { rerender } = render(
      <Provider>
        <TestComponent rerenderTrigger={0} />
      </Provider>
    );
    
    // Multiple re-renders to stress test
    for (let i = 1; i <= 10; i++) {
      rerender(
        <Provider>
          <TestComponent rerenderTrigger={i} />
        </Provider>
      );
    }
    
    expect(isStable).toBe(true);
    expect(counterStoreRefs.size).toBe(1);
    expect(userStoreRefs.size).toBe(1);
  });

  it('should handle Provider re-creation correctly', () => {
    const { Provider, useStore } = createDeclarativeStorePattern<TestStores>('TestProviderRecreation', {
      counter: 0,
      user: { name: '', email: '' },
      settings: { theme: 'light' }
    });
    
    const storeReferences: any[] = [];
    
    function TestComponent() {
      const counterStore = useStore('counter');
      const userStore = useStore('user');
      
      storeReferences.push({
        counter: counterStore,
        user: userStore
      });
      
      return <div data-testid="test" />;
    }
    
    function App({ version }: { version: number }) {
      return (
        <Provider key={version}> {/* Force Provider re-creation */}
          <div data-version={version}>
            <TestComponent />
          </div>
        </Provider>
      );
    }
    
    const { rerender } = render(<App version={1} />);
    
    // Re-create Provider multiple times
    rerender(<App version={2} />);
    rerender(<App version={3} />);
    
    expect(storeReferences).toHaveLength(3);
    
    // When Provider is re-created, new store instances are expected
    // This is actually correct behavior - each Provider should have its own store instances
    console.log('Store references across Provider re-creations:');
    storeReferences.forEach((refs, i) => {
      console.log(`${i}: counter=${typeof refs.counter}, user=${typeof refs.user}`);
    });
    
    // Each Provider instance should have different store instances
    const uniqueCounterRefs = new Set(storeReferences.map(r => r.counter));
    const uniqueUserRefs = new Set(storeReferences.map(r => r.user));
    
    // This is expected behavior - each Provider creates its own stores
    expect(uniqueCounterRefs.size).toBe(3);
    expect(uniqueUserRefs.size).toBe(3);
    
    // But all stores should be functional
    storeReferences.forEach(refs => {
      expect(typeof refs.counter.getValue).toBe('function');
      expect(typeof refs.counter.setValue).toBe('function');
      expect(typeof refs.user.getValue).toBe('function');
      expect(typeof refs.user.setValue).toBe('function');
    });
  });

  it('should maintain stability across store value changes', () => {
    const { Provider, useStore } = createDeclarativeStorePattern<TestStores>('TestValueChanges', {
      counter: 0,
      user: { name: '', email: '' },
      settings: { theme: 'light' }
    });
    
    const storeReferences: any[] = [];
    
    function TestComponent({ step }: { step: number }) {
      const counterStore = useStore('counter');
      const userStore = useStore('user');
      
      // Modify store values on each step
      if (step > 0) {
        counterStore.setValue(step);
        userStore.setValue({ name: `User ${step}`, email: `user${step}@example.com` });
      }
      
      storeReferences.push({
        step,
        counter: counterStore,
        user: userStore,
        counterValue: counterStore.getValue(),
        userValue: userStore.getValue()
      });
      
      return <div data-testid="value-changes" data-step={step} />;
    }
    
    const { rerender } = render(
      <Provider>
        <TestComponent step={0} />
      </Provider>
    );
    
    // Change values and re-render
    rerender(
      <Provider>
        <TestComponent step={1} />
      </Provider>
    );
    
    rerender(
      <Provider>
        <TestComponent step={2} />
      </Provider>
    );
    
    expect(storeReferences).toHaveLength(3);
    
    // Store references should remain the same even when values change
    expect(storeReferences[0].counter).toBe(storeReferences[1].counter);
    expect(storeReferences[1].counter).toBe(storeReferences[2].counter);
    
    expect(storeReferences[0].user).toBe(storeReferences[1].user);
    expect(storeReferences[1].user).toBe(storeReferences[2].user);
    
    // But values should change
    expect(storeReferences[0].counterValue).toBe(0);
    expect(storeReferences[1].counterValue).toBe(1);
    expect(storeReferences[2].counterValue).toBe(2);
    
    expect(storeReferences[0].userValue.name).toBe('');
    expect(storeReferences[1].userValue.name).toBe('User 1');
    expect(storeReferences[2].userValue.name).toBe('User 2');
  });
});