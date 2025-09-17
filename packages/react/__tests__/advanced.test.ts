import * as advanced from '../src/advanced';

describe('advanced module exports', () => {
  it('should export StoreRegistry', () => {
    expect(advanced.StoreRegistry).toBeDefined();
    expect(typeof advanced.StoreRegistry).toBe('function');
  });

  it('should export advanced store hooks', () => {
    expect(advanced.useComputedStore).toBeDefined();
    expect(advanced.usePersistedStore).toBeDefined();
    expect(advanced.useLocalStore).toBeDefined();
  });

  it('should export error handling utilities', () => {
    expect(advanced.ContextActionError).toBeDefined();
    expect(advanced.ContextActionErrorType).toBeDefined();
    expect(advanced.handleContextActionError).toBeDefined();
  });

  it('should export error boundary components', () => {
    expect(advanced.StoreErrorBoundary).toBeDefined();
    expect(advanced.withStoreErrorBoundary).toBeDefined();
    expect(advanced.createStoreErrorBoundary).toBeDefined();
  });

  it('should export createActionContext', () => {
    expect(advanced.createActionContext).toBeDefined();
    expect(typeof advanced.createActionContext).toBe('function');
  });

  it('should re-export utility modules', () => {
    // Check if utility exports are available
    expect(advanced.deepClone).toBeDefined();
    expect(advanced.safeGet).toBeDefined();
    expect(advanced.safeSet).toBeDefined();
    expect(advanced.compareValues).toBeDefined();
  });
});