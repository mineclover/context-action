import * as mainExports from '../src/index';

describe('Main index.ts exports', () => {
  describe('Action System exports', () => {
    it('should export createActionContext', () => {
      expect(mainExports.createActionContext).toBeDefined();
      expect(typeof mainExports.createActionContext).toBe('function');
    });
  });

  describe('Store System exports', () => {
    it('should export Store class and createStore', () => {
      expect(mainExports.Store).toBeDefined();
      expect(mainExports.createStore).toBeDefined();
      expect(typeof mainExports.Store).toBe('function');
      expect(typeof mainExports.createStore).toBe('function');
    });

    it('should export store hooks', () => {
      expect(mainExports.useStoreValue).toBeDefined();
      expect(mainExports.useStoreSelector).toBeDefined();
      expect(typeof mainExports.useStoreValue).toBe('function');
      expect(typeof mainExports.useStoreSelector).toBe('function');
    });

    it('should export StoreErrorBoundary', () => {
      expect(mainExports.StoreErrorBoundary).toBeDefined();
      expect(typeof mainExports.StoreErrorBoundary).toBe('function');
    });
  });

  describe('Declarative Store Pattern exports', () => {
    it('should export createStoreContext and StoreManager', () => {
      expect(mainExports.createStoreContext).toBeDefined();
      expect(mainExports.StoreManager).toBeDefined();
      expect(typeof mainExports.createStoreContext).toBe('function');
      expect(typeof mainExports.StoreManager).toBe('function');
    });
  });

  describe('Ref System exports', () => {
    it('should export createRefContext', () => {
      expect(mainExports.createRefContext).toBeDefined();
      expect(typeof mainExports.createRefContext).toBe('function');
    });
  });

  describe('Core exports from @context-action/core', () => {
    it('should export ActionRegister', () => {
      expect(mainExports.ActionRegister).toBeDefined();
      expect(typeof mainExports.ActionRegister).toBe('function');
    });
  });

  describe('Type exports', () => {
    // Type exports are compile-time only, so we just verify the module loads without errors
    it('should load without errors', () => {
      expect(mainExports).toBeDefined();
    });
  });

  describe('Export completeness', () => {
    it('should export all expected main APIs', () => {
      const expectedExports = [
        'createActionContext',
        'Store',
        'createStore',
        'useStoreValue',
        'useStoreSelector',
        'StoreErrorBoundary',
        'createStoreContext',
        'StoreManager',
        'createRefContext',
        'ActionRegister'
      ];

      expectedExports.forEach(exportName => {
        expect((mainExports as any)[exportName]).toBeDefined();
      });
    });
  });
});