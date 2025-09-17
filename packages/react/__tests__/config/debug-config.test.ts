import {
  debugConfig,
  setDebugConfig,
  resetDebugConfig,
  isDebugEnabled,
  debugLog,
  createDebugLogger
} from '../../src/config/debug-config';

describe('debug-config', () => {
  // Save original console methods
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    log: console.log
  };

  beforeEach(() => {
    // Mock console methods
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
    console.log = jest.fn();

    // Reset debug config before each test
    resetDebugConfig();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    console.log = originalConsole.log;
  });

  describe('debugConfig', () => {
    it('should have default configuration', () => {
      const config = debugConfig();
      expect(config.enabled).toBe(false);
      expect(config.logLevel).toBe('warn');
      expect(config.features.actions).toBe(false);
      expect(config.features.stores).toBe(false);
    });
  });

  describe('setDebugConfig', () => {
    it('should update configuration', () => {
      setDebugConfig({
        enabled: true,
        logLevel: 'debug'
      });

      const config = debugConfig();
      expect(config.enabled).toBe(true);
      expect(config.logLevel).toBe('debug');
    });

    it('should merge partial configuration', () => {
      setDebugConfig({
        features: {
          actions: true
        }
      });

      const config = debugConfig();
      expect(config.features.actions).toBe(true);
      expect(config.features.stores).toBe(false);
    });

    it('should accept custom logger', () => {
      const customLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn()
      };

      setDebugConfig({
        logger: customLogger
      });

      const config = debugConfig();
      expect(config.logger).toBe(customLogger);
    });
  });

  describe('resetDebugConfig', () => {
    it('should reset to default configuration', () => {
      setDebugConfig({
        enabled: true,
        logLevel: 'debug',
        features: {
          actions: true,
          stores: true
        }
      });

      resetDebugConfig();

      const config = debugConfig();
      expect(config.enabled).toBe(false);
      expect(config.logLevel).toBe('warn');
      expect(config.features.actions).toBe(false);
    });
  });

  describe('isDebugEnabled', () => {
    it('should return false when disabled', () => {
      expect(isDebugEnabled('actions')).toBe(false);
      expect(isDebugEnabled('stores')).toBe(false);
    });

    it('should return true when globally enabled', () => {
      setDebugConfig({ enabled: true });
      expect(isDebugEnabled('actions')).toBe(true);
      expect(isDebugEnabled('stores')).toBe(true);
    });

    it('should return true for specific enabled features', () => {
      setDebugConfig({
        enabled: false,
        features: {
          actions: true
        }
      });
      expect(isDebugEnabled('actions')).toBe(true);
      expect(isDebugEnabled('stores')).toBe(false);
    });
  });

  describe('debugLog', () => {
    it('should not log when disabled', () => {
      debugLog('actions', 'info', 'test message');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should log when feature is enabled', () => {
      setDebugConfig({
        features: { actions: true },
        logLevel: 'info'
      });

      debugLog('actions', 'info', 'test message');
      expect(console.info).toHaveBeenCalledWith('[CA:actions]', 'test message');
    });

    it('should respect log level', () => {
      setDebugConfig({
        enabled: true,
        logLevel: 'error'
      });

      debugLog('actions', 'info', 'info message');
      debugLog('actions', 'error', 'error message');

      expect(console.info).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('[CA:actions]', 'error message');
    });

    it('should use custom logger when provided', () => {
      const customLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn()
      };

      setDebugConfig({
        enabled: true,
        logger: customLogger,
        logLevel: 'debug'
      });

      debugLog('stores', 'info', 'custom log');
      expect(customLogger.info).toHaveBeenCalledWith('[CA:stores]', 'custom log');
    });

    it('should handle multiple arguments', () => {
      setDebugConfig({
        enabled: true,
        logLevel: 'info'
      });

      debugLog('actions', 'info', 'message', { data: 'value' }, 123);
      expect(console.info).toHaveBeenCalledWith('[CA:actions]', 'message', { data: 'value' }, 123);
    });
  });

  describe('createDebugLogger', () => {
    it('should create a logger for specific feature', () => {
      setDebugConfig({
        features: { stores: true },
        logLevel: 'info'
      });

      const logger = createDebugLogger('stores');

      logger.info('store info');
      logger.error('store error');

      expect(console.info).toHaveBeenCalledWith('[CA:stores]', 'store info');
      expect(console.error).toHaveBeenCalledWith('[CA:stores]', 'store error');
    });

    it('should not log when feature is disabled', () => {
      const logger = createDebugLogger('actions');

      logger.info('should not appear');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should respect log level in created logger', () => {
      setDebugConfig({
        enabled: true,
        logLevel: 'warn'
      });

      const logger = createDebugLogger('refs');

      logger.debug('debug message');
      logger.warn('warn message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[CA:refs]', 'warn message');
    });
  });

  describe('Development vs Production', () => {
    it('should have different defaults based on NODE_ENV', () => {
      const config = debugConfig();
      // In test environment, it should be disabled by default
      expect(config.enabled).toBe(false);
    });
  });
});