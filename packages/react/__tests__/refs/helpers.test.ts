import { customRef } from '../../src/refs/helpers';

describe('refs/helpers', () => {
  describe('customRef', () => {
    it('should create RefInitConfig with default autoCleanup', () => {
      const config = customRef({
        name: 'myRef'
      });

      expect(config.name).toBe('myRef');
      expect(config.autoCleanup).toBe(true);
    });

    it('should override autoCleanup when specified', () => {
      const config = customRef({
        name: 'myRef',
        autoCleanup: false
      });

      expect(config.name).toBe('myRef');
      expect(config.autoCleanup).toBe(false);
    });

    it('should include cleanup function when provided', () => {
      const cleanup = jest.fn();

      const config = customRef({
        name: 'myRef',
        cleanup
      });

      expect(config.name).toBe('myRef');
      expect(config.cleanup).toBe(cleanup);
      expect(config.autoCleanup).toBe(true);
    });

    it('should preserve all custom properties', () => {
      const config = customRef({
        name: 'myRef',
        mountTimeout: 5000,
        autoCleanup: false,
        cleanup: (target) => {
          console.log('cleanup', target);
        }
      });

      expect(config.name).toBe('myRef');
      expect(config.mountTimeout).toBe(5000);
      expect(config.autoCleanup).toBe(false);
      expect(config.cleanup).toBeDefined();
    });

    it('should work with type parameters', () => {
      interface CustomElement extends HTMLElement {
        customMethod: () => void;
      }

      const config = customRef<CustomElement>({
        name: 'customElement',
        cleanup: (target) => {
          // TypeScript should recognize target as CustomElement
          target.customMethod?.();
        }
      });

      expect(config.name).toBe('customElement');
      expect(config.cleanup).toBeDefined();
    });
  });
});