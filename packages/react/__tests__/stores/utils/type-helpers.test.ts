import {
  isStore,
  isValidStoreValue,
  extractStoreValue,
  extractStoreValues,
  createStoreConfig,
  createSafeEqualityFn,
  TypeUtils
} from '../../../src/stores/utils/type-helpers';
import { Store } from '../../../src/stores/core/Store';

describe('type-helpers', () => {
  describe('isStore', () => {
    it('should return true for valid Store instance', () => {
      const store = new Store('test', 'value');
      expect(isStore(store)).toBe(true);
    });

    it('should return false for non-Store objects', () => {
      expect(isStore(null)).toBe(false);
      expect(isStore(undefined)).toBe(false);
      expect(isStore({})).toBe(false);
      expect(isStore({ name: 'test' })).toBe(false);
      expect(isStore('string')).toBe(false);
      expect(isStore(123)).toBe(false);
    });

    it('should return false for partial Store-like objects', () => {
      const partialStore = {
        name: 'test',
        getValue: () => 'value',
        setValue: (v: any) => {},
        // Missing subscribe and getSnapshot
      };
      expect(isStore(partialStore)).toBe(false);
    });

    it('should check all required Store methods', () => {
      const mockStore = {
        name: 'test',
        getValue: () => 'value',
        setValue: (v: any) => {},
        subscribe: (fn: any) => () => {},
        getSnapshot: () => 'value',
        update: (fn: any) => {},
      };
      expect(isStore(mockStore)).toBe(true);
    });
  });

  describe('isValidStoreValue', () => {
    it('should return true for defined values', () => {
      expect(isValidStoreValue('string')).toBe(true);
      expect(isValidStoreValue(0)).toBe(true);
      expect(isValidStoreValue(false)).toBe(true);
      expect(isValidStoreValue(null)).toBe(true);
      expect(isValidStoreValue({})).toBe(true);
      expect(isValidStoreValue([])).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(isValidStoreValue(undefined)).toBe(false);
    });
  });

  describe('createStoreConfig', () => {
    it('should create store config with default validator', () => {
      const config = createStoreConfig({
        name: 'test',
        initialValue: 'value'
      });

      expect(config.name).toBe('test');
      expect(config.initialValue).toBe('value');
      expect(config.validateValue).toBeDefined();
      expect(config.validateValue?.('any')).toBe(true);
      expect(config.validateValue?.(undefined)).toBe(false);
    });

    it('should preserve custom validator', () => {
      const customValidator = (value: unknown): value is string =>
        typeof value === 'string';

      const config = createStoreConfig({
        name: 'test',
        initialValue: 'value',
        validateValue: customValidator
      });

      expect(config.validateValue).toBe(customValidator);
      expect(config.validateValue?.('string')).toBe(true);
      expect(config.validateValue?.(123)).toBe(false);
    });

    it('should preserve transform function', () => {
      const transform = (value: unknown) => String(value);

      const config = createStoreConfig({
        name: 'test',
        initialValue: 'value',
        transformValue: transform
      });

      expect(config.transformValue).toBe(transform);
    });
  });

  describe('extractStoreValue', () => {
    it('should extract value from valid store', () => {
      const store = new Store('test', { count: 42 });
      expect(extractStoreValue(store)).toEqual({ count: 42 });
    });

    it('should return undefined for null/undefined', () => {
      expect(extractStoreValue(null)).toBeUndefined();
      expect(extractStoreValue(undefined)).toBeUndefined();
    });

    it('should return undefined for non-store objects', () => {
      expect(extractStoreValue({} as any)).toBeUndefined();
      expect(extractStoreValue('string' as any)).toBeUndefined();
    });

    it('should handle getValue errors gracefully', () => {
      const faultyStore = {
        name: 'test',
        getValue: () => { throw new Error('getValue error'); },
        setValue: (v: any) => {},
        subscribe: (fn: any) => () => {},
        getSnapshot: () => 'value',
      };
      expect(extractStoreValue(faultyStore as any)).toBeUndefined();
    });
  });

  describe('extractStoreValues', () => {
    it('should extract values from multiple stores', () => {
      const stores = {
        user: new Store('user', { name: 'John' }),
        counter: new Store('counter', 42),
        settings: new Store('settings', { theme: 'dark' })
      };

      const values = extractStoreValues(stores);

      expect(values).toEqual({
        user: { name: 'John' },
        counter: 42,
        settings: { theme: 'dark' }
      });
    });

    it('should skip invalid stores', () => {
      const stores = {
        valid: new Store('valid', 'value'),
        invalid: null as any,
        another: undefined as any
      };

      const values = extractStoreValues(stores);

      expect(values).toEqual({
        valid: 'value'
      });
    });

    it('should handle empty object', () => {
      expect(extractStoreValues({})).toEqual({});
    });
  });

  describe('createSafeEqualityFn', () => {
    it('should use Object.is by default', () => {
      const equalityFn = createSafeEqualityFn();

      expect(equalityFn(1, 1)).toBe(true);
      expect(equalityFn(1, 2)).toBe(false);
      expect(equalityFn(NaN, NaN)).toBe(true);
      expect(equalityFn({}, {})).toBe(false);
    });

    it('should use custom equality function', () => {
      const customFn = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
      const equalityFn = createSafeEqualityFn(customFn);

      expect(equalityFn({ a: 1 }, { a: 1 })).toBe(true);
      expect(equalityFn({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should fallback to Object.is on error', () => {
      const faultyFn = () => { throw new Error('Equality error'); };
      const equalityFn = createSafeEqualityFn(faultyFn);

      expect(equalityFn(1, 1)).toBe(true);
      expect(equalityFn(1, 2)).toBe(false);
    });
  });

  describe('TypeUtils', () => {
    describe('validateStoreConfig', () => {
      it('should validate valid store config', () => {
        const config = {
          name: 'test',
          initialValue: 'value'
        };
        expect(TypeUtils.validateStoreConfig(config)).toBe(true);
      });

      it('should reject invalid configs', () => {
        expect(TypeUtils.validateStoreConfig(null)).toBe(false);
        expect(TypeUtils.validateStoreConfig(undefined)).toBe(false);
        expect(TypeUtils.validateStoreConfig({})).toBe(false);
        expect(TypeUtils.validateStoreConfig({ name: 'test' })).toBe(false);
        expect(TypeUtils.validateStoreConfig({ initialValue: 'value' })).toBe(false);
        expect(TypeUtils.validateStoreConfig({ name: '', initialValue: 'value' })).toBe(false);
      });
    });

    describe('validateStore', () => {
      it('should validate Store instance', () => {
        const store = new Store('test', 'value');
        expect(TypeUtils.validateStore(store)).toBe(true);
      });

      it('should reject non-Store instances', () => {
        expect(TypeUtils.validateStore(null)).toBe(false);
        expect(TypeUtils.validateStore({})).toBe(false);
      });
    });

    describe('getSafeValue', () => {
      it('should return value when defined', () => {
        expect(TypeUtils.getSafeValue('value', 'fallback')).toBe('value');
        expect(TypeUtils.getSafeValue(0, 10)).toBe(0);
        expect(TypeUtils.getSafeValue(false, true)).toBe(false);
      });

      it('should return fallback for null/undefined', () => {
        expect(TypeUtils.getSafeValue(null, 'fallback')).toBe('fallback');
        expect(TypeUtils.getSafeValue(undefined, 'fallback')).toBe('fallback');
      });
    });
  });
});