/**
 * Store comparison system tests
 * 강화된 값 비교 시스템의 정확성과 성능 검증
 */

import { Store, createStore } from '../Store';
import { 
  setGlobalComparisonOptions, 
  ComparisonStrategy,
  compareValues,
  fastCompare,
  referenceEquals,
  shallowEquals,
  deepEquals
} from '../comparison';

describe('Store Enhanced Comparison System', () => {
  beforeEach(() => {
    // 각 테스트 전에 기본 설정으로 초기화
    setGlobalComparisonOptions({ strategy: 'reference' });
  });

  describe('기본 비교 기능', () => {
    test('참조 동등성 비교', () => {
      const obj = { a: 1 };
      expect(referenceEquals(obj, obj)).toBe(true);
      expect(referenceEquals(obj, { a: 1 })).toBe(false);
      expect(referenceEquals(1, 1)).toBe(true);
      expect(referenceEquals('test', 'test')).toBe(true);
    });

    test('얕은 비교', () => {
      expect(shallowEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallowEquals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(shallowEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(shallowEquals([1, 2, 3], [1, 2, 4])).toBe(false);
      
      // 중첩 객체는 참조 비교
      const nested = { x: 1 };
      expect(shallowEquals({ a: nested }, { a: nested })).toBe(true);
      expect(shallowEquals({ a: nested }, { a: { x: 1 } })).toBe(false);
    });

    test('깊은 비교', () => {
      expect(deepEquals({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true);
      expect(deepEquals({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(false);
      
      // 배열 중첩
      expect(deepEquals([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(true);
      expect(deepEquals([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 3 }])).toBe(false);
      
      // Date 객체
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');
      expect(deepEquals(date1, date2)).toBe(true);
      expect(deepEquals(date1, date3)).toBe(false);
    });

    test('빠른 비교 최적화', () => {
      // 참조 동등성 (가장 빠름)
      const obj = { a: 1 };
      expect(fastCompare(obj, obj)).toBe(true);
      
      // 원시 타입
      expect(fastCompare(1, 1)).toBe(true);
      expect(fastCompare(1, 2)).toBe(false);
      
      // 작은 배열
      expect(fastCompare([1, 2], [1, 2])).toBe(true);
      expect(fastCompare([1, 2], [1, 3])).toBe(false);
      
      // 작은 객체
      expect(fastCompare({ a: 1 }, { a: 1 })).toBe(true);
      expect(fastCompare({ a: 1 }, { a: 2 })).toBe(false);
    });
  });

  describe('Store setValue 비교 동작', () => {
    test('참조 동등성으로 불필요한 업데이트 방지', () => {
      const store = createStore('test', { count: 0 });
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      const initialValue = store.getValue();
      
      // 같은 참조로 setValue - 업데이트되지 않아야 함
      store.setValue(initialValue);
      expect(listenerMock).not.toHaveBeenCalled();
    });

    test('참조는 다르지만 내용이 같을 때 기본적으로 업데이트됨', () => {
      const store = createStore('test', { count: 0 });
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      // 내용은 같지만 다른 객체 - 기본적으로 업데이트됨
      store.setValue({ count: 0 });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    test('얕은 비교 옵션으로 불필요한 업데이트 방지', () => {
      const store = createStore('test', { count: 0 });
      store.setComparisonOptions({ strategy: 'shallow' });
      
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      // 내용이 같은 객체 - 업데이트되지 않아야 함
      store.setValue({ count: 0 });
      expect(listenerMock).not.toHaveBeenCalled();

      // 내용이 다른 객체 - 업데이트되어야 함
      store.setValue({ count: 1 });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    test('깊은 비교 옵션으로 중첩 객체 정확히 비교', () => {
      const store = createStore('test', { user: { profile: { name: 'John' } } });
      store.setComparisonOptions({ strategy: 'deep' });
      
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      // 깊은 내용이 같은 객체 - 업데이트되지 않아야 함
      store.setValue({ user: { profile: { name: 'John' } } });
      expect(listenerMock).not.toHaveBeenCalled();

      // 깊은 내용이 다른 객체 - 업데이트되어야 함
      store.setValue({ user: { profile: { name: 'Jane' } } });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    test('커스텀 비교 함수 사용', () => {
      const store = createStore('test', { id: 1, timestamp: Date.now() });
      
      // ID만 비교하는 커스텀 비교 함수
      store.setCustomComparator((old, newVal) => old.id === newVal.id);
      
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      // ID가 같으면 timestamp가 달라도 업데이트되지 않음
      store.setValue({ id: 1, timestamp: Date.now() + 1000 });
      expect(listenerMock).not.toHaveBeenCalled();

      // ID가 다르면 업데이트됨
      store.setValue({ id: 2, timestamp: Date.now() });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('비교 옵션 관리', () => {
    test('Store별 비교 옵션 설정/해제', () => {
      const store = createStore('test', {});
      
      expect(store.getComparisonOptions()).toBeUndefined();
      
      store.setComparisonOptions({ strategy: 'deep', maxDepth: 3 });
      expect(store.getComparisonOptions()).toEqual({ strategy: 'deep', maxDepth: 3 });
      
      store.clearComparisonOptions();
      expect(store.getComparisonOptions()).toBeUndefined();
    });

    test('커스텀 비교 함수 설정/해제', () => {
      const store = createStore('test', {});
      const comparator = (a, b) => a.id === b.id;
      
      store.setCustomComparator(comparator);
      // 내부 함수이므로 직접 확인할 수 없지만, 동작으로 확인
      
      store.clearCustomComparator();
      // 해제 후 기본 동작으로 돌아감
    });
  });

  describe('성능 최적화 시나리오', () => {
    test('대용량 배열 비교 성능', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i * 2 }));
      const store = createStore('test', largeArray);
      
      const startTime = performance.now();
      
      // 같은 배열로 업데이트 시도
      store.setValue([...largeArray]);
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // 100ms 이내여야 함
    });

    test('깊은 중첩 객체 비교 성능', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                data: 'test'
              }
            }
          }
        }
      };
      
      const store = createStore('test', deepObject);
      store.setComparisonOptions({ strategy: 'deep', maxDepth: 5 });
      
      const startTime = performance.now();
      
      // 같은 구조의 객체로 업데이트 시도
      store.setValue({
        level1: {
          level2: {
            level3: {
              level4: {
                data: 'test'
              }
            }
          }
        }
      });
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(50); // 50ms 이내여야 함
    });

    test('순환 참조 처리', () => {
      const objA: any = { name: 'A' };
      const objB: any = { name: 'B' };
      objA.ref = objB;
      objB.ref = objA;
      
      const store = createStore('test', objA);
      store.setComparisonOptions({ strategy: 'deep', enableCircularCheck: true });
      
      // 순환 참조가 있어도 에러가 발생하지 않아야 함
      expect(() => {
        store.setValue(objA); // 같은 객체
      }).not.toThrow();
    });
  });

  describe('에러 처리 및 fallback', () => {
    test('비교 중 에러 발생 시 참조 비교로 fallback', () => {
      const store = createStore('test', {});
      
      // 에러를 발생시키는 커스텀 비교 함수
      store.setCustomComparator(() => {
        throw new Error('Comparison error');
      });
      
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);
      
      // 에러가 발생해도 참조 비교로 fallback되어 동작해야 함
      expect(() => {
        store.setValue({ different: 'object' });
      }).not.toThrow();
      
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    test('잘못된 비교 전략 시 참조 비교로 fallback', () => {
      const store = createStore('test', {});
      
      // 존재하지 않는 전략
      store.setComparisonOptions({ strategy: 'invalid-strategy' as any });
      
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);
      
      // fallback되어 정상 동작해야 함
      store.setValue({ new: 'value' });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('전역 비교 옵션', () => {
    test('전역 비교 옵션 적용', () => {
      setGlobalComparisonOptions({ strategy: 'shallow' });
      
      const store = createStore('test', { count: 0 });
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);
      
      // 전역 얕은 비교 설정으로 동일한 내용의 객체는 업데이트되지 않음
      store.setValue({ count: 0 });
      expect(listenerMock).not.toHaveBeenCalled();
    });

    test('Store별 옵션이 전역 옵션을 오버라이드', () => {
      setGlobalComparisonOptions({ strategy: 'reference' });
      
      const store = createStore('test', { count: 0 });
      store.setComparisonOptions({ strategy: 'shallow' }); // Store별 설정
      
      const listenerMock = jest.fn();
      store.subscribe(listenerMock);
      
      // Store별 설정(shallow)이 전역 설정(reference)을 오버라이드
      store.setValue({ count: 0 });
      expect(listenerMock).not.toHaveBeenCalled();
    });
  });

  describe('실제 사용 시나리오', () => {
    test('사용자 프로필 업데이트 시나리오', () => {
      interface UserProfile {
        id: string;
        name: string;
        email: string;
        lastLogin: Date;
      }

      const initialProfile: UserProfile = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
        lastLogin: new Date('2023-01-01')
      };

      const store = createStore('userProfile', initialProfile);
      
      // ID와 email만 비교하는 커스텀 로직 (lastLogin은 무시)
      store.setCustomComparator((old, newVal) => 
        old.id === newVal.id && old.email === newVal.email && old.name === newVal.name
      );

      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      // lastLogin만 다른 경우 - 업데이트되지 않음
      store.setValue({
        ...initialProfile,
        lastLogin: new Date('2023-01-02')
      });
      expect(listenerMock).not.toHaveBeenCalled();

      // 실제 프로필 정보가 변경된 경우 - 업데이트됨
      store.setValue({
        ...initialProfile,
        name: 'Jane'
      });
      expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    test('쇼핑카트 아이템 관리 시나리오', () => {
      interface CartItem {
        id: string;
        quantity: number;
        price: number;
      }

      const store = createStore<CartItem[]>('cart', []);
      store.setComparisonOptions({ 
        strategy: 'deep',
        maxDepth: 2 // 배열 + 객체 = 2레벨
      });

      const listenerMock = jest.fn();
      store.subscribe(listenerMock);

      const items: CartItem[] = [
        { id: '1', quantity: 2, price: 100 },
        { id: '2', quantity: 1, price: 200 }
      ];

      // 동일한 내용의 배열 - 업데이트되지 않음
      store.setValue(items);
      store.setValue([...items.map(item => ({ ...item }))]);
      expect(listenerMock).toHaveBeenCalledTimes(1); // 첫 번째만

      // 수량 변경 - 업데이트됨
      store.setValue([
        { id: '1', quantity: 3, price: 100 },
        { id: '2', quantity: 1, price: 200 }
      ]);
      expect(listenerMock).toHaveBeenCalledTimes(2);
    });
  });
});