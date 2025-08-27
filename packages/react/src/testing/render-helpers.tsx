/**
 * React Testing Library와 호환되는 렌더링 헬퍼들
 * Context-Action 프레임워크 컴포넌트 테스트를 위한 유틸리티
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Store } from '../stores/core/Store';
import { MockStore } from './mock-store';
import { TestProvider } from './test-provider';

export interface RenderWithStoreOptions<T> extends Omit<RenderOptions, 'wrapper'> {
  /** Store 인스턴스 (MockStore 권장) */
  store: Store<T> | MockStore<T>;
  /** Store 이름 */
  storeName?: string;
  /** 추가 래퍼 컴포넌트 */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** 초기 렌더링 후 실행할 콜백 */
  onAfterRender?: (result: RenderResult) => void;
}

export interface RenderWithStoresOptions extends Omit<RenderOptions, 'wrapper'> {
  /** 여러 Store들의 맵 */
  stores: Record<string, Store<any> | MockStore<any>>;
  /** 추가 래퍼 컴포넌트 */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** 초기 렌더링 후 실행할 콜백 */
  onAfterRender?: (result: RenderResult) => void;
}

/**
 * 단일 Store와 함께 컴포넌트를 렌더링하는 헬퍼
 * 
 * @param ui 렌더링할 React 컴포넌트
 * @param options 렌더링 옵션
 * @returns React Testing Library RenderResult
 * 
 * @example
 * ```tsx
 * const mockStore = createMockStore({ initialValue: { count: 0 }, name: 'counter' });
 * 
 * const { getByText, rerender } = renderWithStore(
 *   <CounterComponent />,
 *   {
 *     store: mockStore,
 *     storeName: 'counter'
 *   }
 * );
 * 
 * expect(getByText('Count: 0')).toBeInTheDocument();
 * ```
 */
export function renderWithStore<T>(
  ui: React.ReactElement,
  options: RenderWithStoreOptions<T>
): RenderResult & {
  /** Store 참조 (테스트에서 직접 조작 가능) */
  store: Store<T> | MockStore<T>;
  /** Store 재렌더링 헬퍼 */
  rerenderWithStore: (element: React.ReactElement) => void;
} {
  const { store, storeName = 'testStore', wrapper: UserWrapper, onAfterRender, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <TestProvider stores={{ [storeName]: store }}>
        {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
      </TestProvider>
    );
  };

  const result = render(ui, {
    wrapper: Wrapper,
    ...renderOptions
  });

  // 초기 렌더링 후 콜백 실행
  if (onAfterRender) {
    onAfterRender(result);
  }

  const rerenderWithStore = (element: React.ReactElement) => {
    result.rerender(element);
  };

  return {
    ...result,
    store,
    rerenderWithStore
  };
}

/**
 * 여러 Store들과 함께 컴포넌트를 렌더링하는 헬퍼
 * 
 * @param ui 렌더링할 React 컴포넌트
 * @param options 렌더링 옵션
 * @returns React Testing Library RenderResult
 * 
 * @example
 * ```tsx
 * const stores = {
 *   user: createMockStore({ initialValue: { name: 'John' }, name: 'user' }),
 *   cart: createMockStore({ initialValue: { items: [] }, name: 'cart' })
 * };
 * 
 * const { getByText } = renderWithStores(
 *   <ShoppingApp />,
 *   { stores }
 * );
 * ```
 */
export function renderWithStores(
  ui: React.ReactElement,
  options: RenderWithStoresOptions
): RenderResult & {
  /** Store들의 참조 */
  stores: Record<string, Store<any> | MockStore<any>>;
  /** Store들과 함께 재렌더링 헬퍼 */
  rerenderWithStores: (element: React.ReactElement) => void;
} {
  const { stores, wrapper: UserWrapper, onAfterRender, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <TestProvider stores={stores}>
        {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
      </TestProvider>
    );
  };

  const result = render(ui, {
    wrapper: Wrapper,
    ...renderOptions
  });

  // 초기 렌더링 후 콜백 실행
  if (onAfterRender) {
    onAfterRender(result);
  }

  const rerenderWithStores = (element: React.ReactElement) => {
    result.rerender(element);
  };

  return {
    ...result,
    stores,
    rerenderWithStores
  };
}

/**
 * 테스트 전용 Store Context Provider
 * 기존 Provider들을 감싸서 테스트 환경을 구성
 */
export interface TestStoreProviderProps {
  /** 자식 컴포넌트들 */
  children: React.ReactNode;
  /** Store들의 맵 */
  stores: Record<string, Store<any> | MockStore<any>>;
  /** 추가 설정 */
  config?: {
    /** 디버그 모드 활성화 */
    debug?: boolean;
    /** Store 업데이트 로깅 */
    logUpdates?: boolean;
  };
}

export const TestStoreProvider: React.FC<TestStoreProviderProps> = ({
  children,
  stores,
  config = {}
}) => {
  return (
    <TestProvider stores={stores} config={config}>
      {children}
    </TestProvider>
  );
};

/**
 * Custom hook 테스트를 위한 렌더링 헬퍼
 */
export function renderHookWithStore<T, R>(
  hook: () => R,
  options: RenderWithStoreOptions<T>
): {
  result: { current: R };
  rerender: (hook?: () => R) => void;
  unmount: () => void;
  store: Store<T> | MockStore<T>;
} {
  const { renderHook } = require('@testing-library/react');
  const { store, storeName = 'testStore', wrapper: UserWrapper } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <TestProvider stores={{ [storeName]: store }}>
        {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
      </TestProvider>
    );
  };

  const result = renderHook(hook, {
    wrapper: Wrapper
  });

  return {
    ...result,
    store
  };
}

/**
 * 여러 Store들과 함께 custom hook 테스트
 */
export function renderHookWithStores<R>(
  hook: () => R,
  options: RenderWithStoresOptions
): {
  result: { current: R };
  rerender: (hook?: () => R) => void;
  unmount: () => void;
  stores: Record<string, Store<any> | MockStore<any>>;
} {
  const { renderHook } = require('@testing-library/react');
  const { stores, wrapper: UserWrapper } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <TestProvider stores={stores}>
        {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
      </TestProvider>
    );
  };

  const result = renderHook(hook, {
    wrapper: Wrapper
  });

  return {
    ...result,
    stores
  };
}

/**
 * 테스트 시나리오를 위한 단계별 렌더링 헬퍼
 */
export class TestScenario<T extends Record<string, any>> {
  private stores: { [K in keyof T]: Store<T[K]> | MockStore<T[K]> };
  private currentResult: RenderResult | null = null;

  constructor(stores: { [K in keyof T]: Store<T[K]> | MockStore<T[K]> }) {
    this.stores = stores;
  }

  /**
   * 컴포넌트 렌더링
   */
  render(ui: React.ReactElement, options?: Omit<RenderWithStoresOptions, 'stores'>): this {
    const result = renderWithStores(ui, {
      stores: this.stores,
      ...options
    });
    this.currentResult = result;
    return this;
  }

  /**
   * Store 값 변경
   */
  updateStore<K extends keyof T>(storeName: K, value: T[K]): this {
    const store = this.stores[storeName];
    if ('setValue' in store) {
      store.setValue(value);
    }
    return this;
  }

  /**
   * Store 업데이트 함수 적용
   */
  updateStoreWith<K extends keyof T>(storeName: K, updater: (current: T[K]) => T[K]): this {
    const store = this.stores[storeName];
    if ('update' in store) {
      store.update(updater);
    }
    return this;
  }

  /**
   * 현재 렌더링 결과 가져오기
   */
  getResult(): RenderResult {
    if (!this.currentResult) {
      throw new Error('No component has been rendered yet. Call render() first.');
    }
    return this.currentResult;
  }

  /**
   * 특정 Store 가져오기
   */
  getStore<K extends keyof T>(storeName: K): Store<T[K]> | MockStore<T[K]> {
    return this.stores[storeName];
  }

  /**
   * Mock Store 통계 가져오기 (MockStore인 경우만)
   */
  getStoreStats<K extends keyof T>(storeName: K): any {
    const store = this.stores[storeName];
    if ('getStats' in store) {
      return store.getStats();
    }
    throw new Error(`Store ${String(storeName)} is not a MockStore`);
  }
}

/**
 * 테스트 시나리오 생성 헬퍼
 */
export function createTestScenario<T extends Record<string, any>>(
  stores: { [K in keyof T]: Store<T[K]> | MockStore<T[K]> }
): TestScenario<T> {
  return new TestScenario<T>(stores);
}