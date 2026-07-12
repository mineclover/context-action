import { isTimeTravelStore } from '../../../src/stores/core/TimeTravelStore';
import type { Store } from '../../../src/stores/core/Store';
import { asStoreValue } from '../../../src';
import {
  StoreManager,
  createStoreContext,
  type ExplicitStoreValue,
  type InferInitialStores,
  type InferStoreTypes,
} from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { TimeTravelStoreManager } from '../../../src/stores/patterns/time-travel-store-pattern';

const inferredDomainValue = { initialValue: 'seed', status: 'ready' } as const;
const inferredAmbiguousValue = { initialValue: 'domain-value' } as const;
const InferredStores = createStoreContext('DiscriminatorTypeInference', {
  domain: inferredDomainValue,
  config: { initialValue: 1, strategy: 'deep' as const },
  explicit: asStoreValue(inferredAmbiguousValue),
});

function assertFactoryInference(): void {
  const domainStore: Store<typeof inferredDomainValue> = InferredStores.useStore('domain');
  const configStore: Store<number> = InferredStores.useStore('config');
  const explicitStore: Store<typeof inferredAmbiguousValue> = InferredStores.useStore('explicit');

  void domainStore;
  void configStore;
  void explicitStore;
}

void assertFactoryInference;

describe('store definition discrimination', () => {
  describe('declarative stores', () => {
    it('keeps legacy minimal configuration objects compatible', () => {
      const manager = new StoreManager<{ count: number }>('legacy-config', {
        count: { initialValue: 1 },
      });

      expect(manager.getStore('count').getValue()).toBe(1);
    });

    it('treats an object with domain fields as a direct value even when it owns initialValue', () => {
      const domainValue = {
        initialValue: 'seed',
        status: 'ready',
        payload: { id: 1 },
      } as const;
      const manager = new StoreManager<{ state: typeof domainValue }>('domain-value', {
        state: domainValue,
      });

      expect(manager.getStore('state').getValue()).toStrictEqual(domainValue);
    });

    it('does not classify a domain object as config just because it also has a config-named field', () => {
      const domainValue = {
        initialValue: 'seed',
        description: 'domain description',
        currentValue: 'active',
      } as const;
      const manager = new StoreManager<{ state: typeof domainValue }>('mixed-shape-value', {
        state: domainValue,
      });

      expect(manager.getStore('state').getValue()).toStrictEqual(domainValue);
    });

    it('does not silently accept unsupported options as store configuration', () => {
      const unsupportedDefinition = {
        initialValue: { count: 0 },
        enableTimeTravel: true,
        timeTravelOptions: { mutable: true, maxHistory: 50 },
      } as const;
      const manager = new StoreManager<{ state: typeof unsupportedDefinition }>(
        'unsupported-config-options',
        { state: unsupportedDefinition }
      );

      expect(manager.getStore('state').getValue()).toStrictEqual(unsupportedDefinition);
    });

    it('supports an explicit direct value for a shape identical to minimal config', () => {
      const ambiguousValue = { initialValue: 'domain-value' } as const;
      const manager = new StoreManager<{ state: typeof ambiguousValue }>('explicit-value', {
        state: asStoreValue(ambiguousValue),
      });

      expect(manager.getStore('state').getValue()).toStrictEqual(ambiguousValue);
    });

    it('keeps the runtime and inferred-value contracts aligned', () => {
      const domainValue = { initialValue: 'seed', status: 'ready' } as const;
      const ambiguousValue = { initialValue: 'domain-value' } as const;
      const explicitValue: ExplicitStoreValue<typeof ambiguousValue> = asStoreValue(ambiguousValue);

      type Inferred = InferStoreTypes<{
        domain: typeof domainValue;
        config: { initialValue: number; strategy: 'deep' };
        explicit: typeof explicitValue;
      }>;
      type InitialStoresInferred = InferInitialStores<{
        domain: typeof domainValue;
        config: { initialValue: number; strategy: 'deep' };
        explicit: typeof explicitValue;
      }>;

      const inferredContract: Inferred = {
        domain: domainValue,
        config: 1,
        explicit: ambiguousValue,
      };
      const initialStoresContract: InitialStoresInferred = inferredContract;

      expect(initialStoresContract).toEqual({
        domain: domainValue,
        config: 1,
        explicit: ambiguousValue,
      });
    });

    it('continues to recognize the legacy compareStrategy alias as configuration', () => {
      const manager = new StoreManager<{ count: number }>('legacy-strategy', {
        count: { initialValue: 1, compareStrategy: 'deep' },
      });

      expect(manager.getStore('count').getValue()).toBe(1);
    });
  });

  describe('time-travel stores', () => {
    it('treats domain objects with initialValue as direct time-travel values', () => {
      const domainValue = { initialValue: 0, currentValue: 1 } as const;
      const manager = new TimeTravelStoreManager<{ state: typeof domainValue }>(
        'time-travel-domain-value',
        { state: domainValue }
      );

      const store = manager.getStore('state');
      expect(isTimeTravelStore(store)).toBe(true);
      expect(store.getValue()).toBe(domainValue);
    });

    it('supports explicit ambiguous values without changing the stored value', () => {
      const ambiguousValue = { initialValue: 0 } as const;
      const manager = new TimeTravelStoreManager<{ state: typeof ambiguousValue }>(
        'time-travel-explicit-value',
        { state: asStoreValue(ambiguousValue) }
      );

      expect(manager.getStore('state').getValue()).toBe(ambiguousValue);
    });

    it('keeps existing time-travel configuration behavior', () => {
      const manager = new TimeTravelStoreManager<{ state: { count: number } }>(
        'time-travel-config',
        {
          state: {
            initialValue: { count: 0 },
            timeTravel: false,
          },
        }
      );

      const store = manager.getStore('state');
      expect(isTimeTravelStore(store)).toBe(false);
      expect(store.getValue()).toEqual({ count: 0 });
    });
  });
});
