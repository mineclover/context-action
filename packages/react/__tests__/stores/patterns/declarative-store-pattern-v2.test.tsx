import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { createDeclarativeStorePattern } from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

describe('Declarative Store Pattern V2', () => {
  describe('Basic functionality', () => {
    it('should create pattern with direct values', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        counter: 0,
        name: 'test',
        active: false
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        const counter = TestStores.useStore('counter');
        const name = TestStores.useStore('name');
        const active = TestStores.useStore('active');
        
        return {
          counter: useStoreValue(counter),
          name: useStoreValue(name),
          active: useStoreValue(active),
          stores: { counter, name, active }
        };
      }, { wrapper });

      expect(result.current.counter).toBe(0);
      expect(result.current.name).toBe('test');
      expect(result.current.active).toBe(false);
    });

    it('should create pattern with config objects', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        user: {
          initialValue: { id: '1', name: 'John', email: 'john@example.com' },
          strategy: 'shallow',
          description: 'User data'
        },
        settings: {
          initialValue: { theme: 'light' as 'light' | 'dark', lang: 'en' },
          strategy: 'shallow'
        }
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        const user = TestStores.useStore('user');
        const settings = TestStores.useStore('settings');
        
        return {
          user: useStoreValue(user),
          settings: useStoreValue(settings),
          stores: { user, settings }
        };
      }, { wrapper });

      expect(result.current.user).toEqual({ id: '1', name: 'John', email: 'john@example.com' });
      expect(result.current.settings).toEqual({ theme: 'light', lang: 'en' });
    });

    it('should handle mixed direct values and config objects', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        // Direct values
        counter: 0,
        name: 'test',
        
        // Config objects
        user: {
          initialValue: { id: '', name: '' },
          strategy: 'shallow'
        },
        flags: {
          initialValue: { feature1: true, feature2: false }
        }
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        const counter = TestStores.useStore('counter');
        const name = TestStores.useStore('name');
        const user = TestStores.useStore('user');
        const flags = TestStores.useStore('flags');
        
        return {
          counter: useStoreValue(counter),
          name: useStoreValue(name),
          user: useStoreValue(user),
          flags: useStoreValue(flags)
        };
      }, { wrapper });

      expect(result.current.counter).toBe(0);
      expect(result.current.name).toBe('test');
      expect(result.current.user).toEqual({ id: '', name: '' });
      expect(result.current.flags).toEqual({ feature1: true, feature2: false });
    });
  });

  describe('Store updates', () => {
    it('should update stores correctly', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        counter: 0,
        user: {
          initialValue: { name: 'Alice', age: 25 },
          strategy: 'shallow'
        }
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        const counter = TestStores.useStore('counter');
        const user = TestStores.useStore('user');
        
        return {
          counter: useStoreValue(counter),
          user: useStoreValue(user),
          stores: { counter, user }
        };
      }, { wrapper });

      // Update counter
      act(() => {
        result.current.stores.counter.setValue(10);
      });
      expect(result.current.counter).toBe(10);

      // Update user
      act(() => {
        result.current.stores.user.setValue({ name: 'Bob', age: 30 });
      });
      expect(result.current.user).toEqual({ name: 'Bob', age: 30 });

      // Update with update function
      act(() => {
        result.current.stores.counter.update(v => v + 5);
      });
      expect(result.current.counter).toBe(15);
    });
  });

  describe('Type inference', () => {
    it('should provide correct type inference', () => {
      // This test primarily validates TypeScript compilation
      const TestStores = createDeclarativeStorePattern('Test', {
        // Primitives
        count: 0,
        name: 'test',
        active: false,
        
        // Objects
        user: {
          initialValue: { id: '', name: '', roles: [] as string[] }
        },
        
        // Complex types with unions
        settings: {
          initialValue: {
            theme: 'light' as 'light' | 'dark',
            layout: 'grid' as 'grid' | 'list',
            density: 'normal' as 'compact' | 'normal' | 'comfortable'
          },
          strategy: 'shallow'
        }
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        // These should all have correct types inferred
        const count = TestStores.useStore('count');        // Store<number>
        const name = TestStores.useStore('name');          // Store<string>
        const active = TestStores.useStore('active');      // Store<boolean>
        const user = TestStores.useStore('user');          // Store<{id: string, name: string, roles: string[]}>
        const settings = TestStores.useStore('settings');  // Store<{theme: 'light' | 'dark', ...}>
        
        return {
          count: useStoreValue(count),
          name: useStoreValue(name),
          active: useStoreValue(active),
          user: useStoreValue(user),
          settings: useStoreValue(settings)
        };
      }, { wrapper });

      // Type checks (these would fail at compile time if types were wrong)
      const count: number = result.current.count;
      const name: string = result.current.name;
      const active: boolean = result.current.active;
      const userId: string = result.current.user.id;
      const theme: 'light' | 'dark' = result.current.settings.theme;
      
      expect(typeof count).toBe('number');
      expect(typeof name).toBe('string');
      expect(typeof active).toBe('boolean');
      expect(typeof userId).toBe('string');
      expect(['light', 'dark']).toContain(theme);
    });
  });

  describe('HOC patterns', () => {
    it('should work with basic withProvider HOC', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        counter: 0
      });

      const TestComponent = () => {
        const counter = TestStores.useStore('counter');
        const count = useStoreValue(counter);
        return <div>Count: {count}</div>;
      };

      const WrappedComponent = TestStores.withProvider(TestComponent);

      const { result } = renderHook(
        () => {
          const counter = TestStores.useStore('counter');
          return useStoreValue(counter);
        },
        {
          wrapper: WrappedComponent
        }
      );

      expect(result.current).toBe(0);
    });

    it('should work with withProvider HOC with config', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        message: 'hello'
      });

      const TestComponent = () => {
        const message = TestStores.useStore('message');
        const msg = useStoreValue(message);
        return <div>Message: {msg}</div>;
      };

      const WrappedComponent = TestStores.withProvider(TestComponent, {
        displayName: 'CustomTestComponent',
        registryId: 'custom-test-registry'
      });

      // Check display name
      expect(WrappedComponent.displayName).toBe('CustomTestComponent');

      const { result } = renderHook(
        () => {
          const message = TestStores.useStore('message');
          return useStoreValue(message);
        },
        {
          wrapper: WrappedComponent
        }
      );

      expect(result.current).toBe('hello');
    });

    it('should use default displayName when config not provided', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        value: 'test'
      });

      const NamedComponent = () => <div>Test</div>;
      NamedComponent.displayName = 'NamedComponent';

      const WrappedComponent = TestStores.withProvider(NamedComponent);

      expect(WrappedComponent.displayName).toBe('withTestProvider(NamedComponent)');
    });
  });

  describe('Utility hooks', () => {
    it('should provide store info', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        store1: 'value1',
        store2: 'value2',
        store3: 'value3'
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        // Access some stores first
        TestStores.useStore('store1');
        TestStores.useStore('store2');
        
        return TestStores.useStoreInfo();
      }, { wrapper });

      expect(result.current.name).toBe('Test');
      expect(result.current.storeCount).toBe(2); // Only accessed stores
      expect(result.current.availableStores).toEqual(['store1', 'store2', 'store3']);
    });

    it('should clear all stores', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        counter: 10,
        name: 'test'
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestStores.Provider>{children}</TestStores.Provider>
      );

      const { result } = renderHook(() => {
        const counter = TestStores.useStore('counter');
        const name = TestStores.useStore('name');
        const clear = TestStores.useStoreClear();
        
        return {
          counter: useStoreValue(counter),
          name: useStoreValue(name),
          clear,
          stores: { counter, name }
        };
      }, { wrapper });

      expect(result.current.counter).toBe(10);
      expect(result.current.name).toBe('test');

      // Clear all stores
      act(() => {
        result.current.clear();
      });

      // After clear, accessing stores should create new ones with initial values
      const { result: newResult } = renderHook(() => {
        const counter = TestStores.useStore('counter');
        const name = TestStores.useStore('name');
        
        return {
          counter: useStoreValue(counter),
          name: useStoreValue(name)
        };
      }, { wrapper });

      expect(newResult.current.counter).toBe(10); // Back to initial value
      expect(newResult.current.name).toBe('test'); // Back to initial value
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside Provider', () => {
      const TestStores = createDeclarativeStorePattern('Test', {
        counter: 0
      });

      const { result } = renderHook(() => {
        try {
          return TestStores.useStore('counter');
        } catch (error) {
          return error;
        }
      });

      expect(result.current).toBeInstanceOf(Error);
      expect((result.current as Error).message).toContain('useStore must be used within Test.Provider');
    });
  });
});