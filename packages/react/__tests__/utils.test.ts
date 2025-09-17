import * as utils from '../src/utils';

describe('utils module exports', () => {
  describe('Immutability utilities', () => {
    it('should export immutable utility functions', () => {
      expect(utils.deepClone).toBeDefined();
      expect(utils.deepCloneWithImmer).toBeDefined();
      expect(utils.safeGet).toBeDefined();
      expect(utils.safeSet).toBeDefined();
      expect(utils.ImmerUtils).toBeDefined();
      expect(utils.preloadImmer).toBeDefined();
      expect(utils.produce).toBeDefined();
    });

    it('should correctly use deepClone', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = utils.deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });
  });

  describe('Comparison utilities', () => {
    it('should export comparison utility functions', () => {
      expect(utils.compareValues).toBeDefined();
      expect(utils.setGlobalComparisonOptions).toBeDefined();
      expect(utils.getGlobalComparisonOptions).toBeDefined();
    });

    it('should correctly compare values', () => {
      expect(utils.compareValues(1, 1)).toBe(true);
      expect(utils.compareValues(1, 2)).toBe(false);
      expect(utils.compareValues({ a: 1 }, { a: 1 })).toBe(true);
    });
  });

  describe('Type utilities', () => {
    it('should export type utility functions', () => {
      expect(utils.isStore).toBeDefined();
      expect(utils.isValidStoreValue).toBeDefined();
      expect(utils.extractStoreValue).toBeDefined();
      expect(utils.extractStoreValues).toBeDefined();
      expect(utils.createSafeEqualityFn).toBeDefined();
      expect(utils.createStoreConfig).toBeDefined();
      expect(utils.TypeUtils).toBeDefined();
    });
  });

  describe('Provider composition', () => {
    it('should export composeProviders function', () => {
      expect(utils.composeProviders).toBeDefined();
      expect(typeof utils.composeProviders).toBe('function');
    });
  });

  describe('Subscription management', () => {
    it('should export subscription management utilities', () => {
      expect(utils.SubscriptionManager).toBeDefined();
      expect(utils.useSubscriptionManager).toBeDefined();
    });

    it('should create SubscriptionManager instance', () => {
      const manager = new utils.SubscriptionManager();
      expect(manager).toBeInstanceOf(utils.SubscriptionManager);
      expect(manager.add).toBeDefined();
      expect(manager.remove).toBeDefined();
      expect(manager.cleanup).toBeDefined();
    });
  });
});