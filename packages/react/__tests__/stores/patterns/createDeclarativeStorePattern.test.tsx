/**
 * @fileoverview Tests for createDeclarativeStorePattern factory
 */

import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { createDeclarativeStorePattern } from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

describe('createDeclarativeStorePattern', () => {
  it('should create pattern with initial values', () => {
    const AppStores = createDeclarativeStorePattern('App', {
      user: { initialValue: { id: '', name: '' } },
      count: { initialValue: 0 },
      settings: { initialValue: { theme: 'light' } }
    });

    expect(AppStores.Provider).toBeDefined();
    expect(AppStores.useStore).toBeDefined();
    expect(AppStores.useStoreManager).toBeDefined();
    expect(AppStores.withProvider).toBeDefined();
  });

  it('should provide type-safe store access', () => {
    const TestStores = createDeclarativeStorePattern('Test', {
      message: { initialValue: 'hello' },
      counter: { initialValue: 42 }
    });

    function TestComponent() {
      const messageStore = TestStores.useStore('message');
      const counterStore = TestStores.useStore('counter');
      
      const message = useStoreValue(messageStore);
      const counter = useStoreValue(counterStore);
      
      return { message, counter, messageStore, counterStore };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestStores.Provider>{children}</TestStores.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    expect(result.current.message).toBe('hello');
    expect(result.current.counter).toBe(42);
    expect(result.current.messageStore).toBeDefined();
    expect(result.current.counterStore).toBeDefined();
  });

  it('should handle store updates correctly', async () => {
    const AppStores = createDeclarativeStorePattern('App', {
      user: { initialValue: { name: 'John', age: 30 } },
      counter: { initialValue: 0 }
    });

    function TestComponent() {
      const userStore = AppStores.useStore('user');
      const counterStore = AppStores.useStore('counter');
      
      const user = useStoreValue(userStore);
      const counter = useStoreValue(counterStore);
      
      return { 
        user, 
        counter, 
        stores: { userStore, counterStore },
        updateUser: (newUser: any) => userStore.setValue(newUser),
        updateCounter: (newCount: number) => counterStore.setValue(newCount)
      };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppStores.Provider>{children}</AppStores.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    // Initial values
    expect(result.current.user).toEqual({ name: 'John', age: 30 });
    expect(result.current.counter).toBe(0);

    // Update user
    act(() => {
      result.current.updateUser({ name: 'Jane', age: 25 });
    });

    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });

    expect(result.current.user).toEqual({ name: 'Jane', age: 25 });
    expect(result.current.counter).toBe(0); // Should not change

    // Update counter
    act(() => {
      result.current.updateCounter(10);
    });

    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });

    expect(result.current.user).toEqual({ name: 'Jane', age: 25 }); // Should not change
    expect(result.current.counter).toBe(10);
  });

  it('should provide store manager access', () => {
    const TestStores = createDeclarativeStorePattern('Test', {
      data: { initialValue: { value: 'test' } }
    });

    function TestComponent() {
      const manager = TestStores.useStoreManager();
      return { manager };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestStores.Provider>{children}</TestStores.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    expect(result.current.manager).toBeDefined();
    expect(typeof result.current.manager.getStore).toBe('function');
  });

  it('should work with withProvider HOC', async () => {
    const UserStores = createDeclarativeStorePattern('User', {
      profile: { initialValue: { name: 'Test User' } }
    });

    function BaseComponent() {
      const profileStore = UserStores.useStore('profile');
      const profile = useStoreValue(profileStore);
      return profile.name;
    }

    const ComponentWithProvider = UserStores.withProvider(BaseComponent);

    const { result } = renderHook(() => {
      return <ComponentWithProvider />;
    });

    // Should render without provider wrapper since HOC provides it
    expect(result.current.type).toBe(BaseComponent);
  });

  it('should support complex nested initial values', () => {
    const ComplexStores = createDeclarativeStorePattern('Complex', {
      app: { 
        initialValue: {
          ui: { theme: 'dark', sidebar: true },
          user: { id: '1', preferences: { lang: 'en' } },
          data: { items: [], loading: false }
        }
      }
    });

    function TestComponent() {
      const appStore = ComplexStores.useStore('app');
      const app = useStoreValue(appStore);
      return { app };
    }

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ComplexStores.Provider>{children}</ComplexStores.Provider>
    );

    const { result } = renderHook(() => TestComponent(), {
      wrapper: Wrapper
    });

    expect(result.current.app).toEqual({
      ui: { theme: 'dark', sidebar: true },
      user: { id: '1', preferences: { lang: 'en' } },
      data: { items: [], loading: false }
    });
  });

  it('should handle multiple pattern instances independently', async () => {
    const StoreA = createDeclarativeStorePattern('A', {
      value: { initialValue: 'A' }
    });

    const StoreB = createDeclarativeStorePattern('B', {
      value: { initialValue: 'B' }
    });

    function TestComponentA() {
      const store = StoreA.useStore('value');
      const value = useStoreValue(store);
      return { value, setValue: (v: string) => store.setValue(v) };
    }

    function TestComponentB() {
      const store = StoreB.useStore('value');
      const value = useStoreValue(store);
      return { value, setValue: (v: string) => store.setValue(v) };
    }

    const WrapperA = ({ children }: { children: React.ReactNode }) => (
      <StoreA.Provider>{children}</StoreA.Provider>
    );

    const WrapperB = ({ children }: { children: React.ReactNode }) => (
      <StoreB.Provider>{children}</StoreB.Provider>
    );

    const { result: resultA } = renderHook(() => TestComponentA(), {
      wrapper: WrapperA
    });

    const { result: resultB } = renderHook(() => TestComponentB(), {
      wrapper: WrapperB
    });

    expect(resultA.current.value).toBe('A');
    expect(resultB.current.value).toBe('B');

    // Update A
    act(() => {
      resultA.current.setValue('A-updated');
    });

    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });

    expect(resultA.current.value).toBe('A-updated');
    expect(resultB.current.value).toBe('B'); // Should not change
  });
});